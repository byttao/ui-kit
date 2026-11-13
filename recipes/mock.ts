/**
 * 页面配方的模拟数据层：浏览器 demo、组件测试里代替 Rust 端。
 * 真实项目里不用这个文件——把配方页面的 backend / api 换成 invoke + 事件（写法见 AI_GUIDE「页面配方」）。
 */
import { createMockTaskBackend } from "../tauri/useTaskEvents";
import type { BatchBackend } from "./batch-page";
import type { GalleryItem } from "./gallery-page";
import type { QueueApi, QueueTask, QueueTaskInput } from "./queue-page";
import { DEFAULT_SETTINGS, type AppSettings, type SettingsApi } from "./settings-page";

/** 演示样图（demo/public/samples）。真实项目里是本地文件路径 */
export const SAMPLE_IMAGES = ["lake", "dusk", "forest", "desert", "snow", "sea"].map((name) => `/samples/${name}.svg`);

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── 批处理 ──────────────────────────────────────────────────────────────

const SAMPLE_FILES = ["1299.PNG", "1300.PNG", "1303.PNG", "商品主图-正面.jpg", "详情页-尺码表.png"];

/** 模拟批处理：每张 400ms，名字含 1303 的失败（演示「部分失败保留失败项」）。 */
export const mockBatchBackend: BatchBackend = {
  pick: async () => SAMPLE_FILES,
  run: async (files, _options, report) => {
    const failed: string[] = [];
    for (let i = 0; i < files.length; i++) {
      report({ current: i + 1, total: files.length, percent: (i / files.length) * 100, stage: "缩放", file_name: files[i] });
      await wait(400);
      if (files[i].includes("1303")) failed.push(files[i]);
    }
    return { failed, message: `已输出 ${files.length - failed.length} 张` };
  },
};

// ── 任务队列 ────────────────────────────────────────────────────────────

let seq = 0;
const now = Date.now();
const task = (p: Partial<QueueTask> & Pick<QueueTask, "prompt" | "status">): QueueTask => {
  seq += 1;
  return {
    id: `t${seq}`,
    number: seq,
    progress: p.status === "succeeded" ? 100 : 0,
    files: [],
    model: "GPT",
    ratio: "1:1",
    count: 1,
    createdAt: now - (20 - seq) * 60_000,
    ...p,
  };
};

const INITIAL: QueueTask[] = [
  task({ prompt: "清晨的湖面，薄雾，远处的山，胶片质感", status: "succeeded", files: [SAMPLE_IMAGES[0]] }),
  task({
    prompt: "四张不同角度的沙漠日落，统一色调，适合做系列海报",
    status: "succeeded",
    files: [SAMPLE_IMAGES[3], SAMPLE_IMAGES[1], SAMPLE_IMAGES[5], SAMPLE_IMAGES[2]],
    model: "Nano",
    count: 4,
  }),
  task({ prompt: "把湖面改成黄昏，保留薄雾", status: "succeeded", files: [SAMPLE_IMAGES[1]], parentId: "t1" }),
  task({ prompt: "雪山与星空，长曝光", status: "running", progress: 35, ratio: "3:4" }),
  task({ prompt: "海边灯塔，暴风雨前", status: "queued", model: "Nano", ratio: "16:9" }),
  task({
    prompt: "森林里的小木屋，童话插画风格，暖色灯光从窗户透出来",
    status: "failed",
    error: "接口返回 429：请求过于频繁，稍后重试。",
    ratio: "4:3",
  }),
];

/**
 * 模拟队列后端：createMockTaskBackend + 一个定时器推进 running / queued 任务（同时最多 2 个 running）。
 * 返回的对象就是 QueuePage 的 api。
 */
export function createMockQueueApi(): QueueApi {
  const backend = createMockTaskBackend<QueueTask>(INITIAL.map((t) => ({ ...t })), { delay: 300 });
  const results = [...SAMPLE_IMAGES];
  window.setInterval(() => {
    const all = backend.snapshot();
    const running = all.filter((t) => t.status === "running");
    for (const t of running) {
      const progress = Math.min(100, t.progress + 9);
      backend.update(
        progress >= 100
          ? {
              ...t,
              status: "succeeded",
              progress: 100,
              files: Array.from({ length: t.count }, (_, i) => results[(t.number + i) % results.length]),
            }
          : { ...t, progress }
      );
    }
    if (running.length < 2) {
      const next = all.filter((t) => t.status === "queued").sort((a, b) => a.createdAt - b.createdAt)[0];
      if (next) backend.update({ ...next, status: "running", progress: 0 });
    }
  }, 700);

  const byId = (id: string) => backend.snapshot().find((t) => t.id === id);
  return {
    listen: backend.listen,
    load: backend.load,
    submit: async (input: QueueTaskInput) => {
      seq += 1;
      const created: QueueTask = { id: `t${seq}`, number: seq, status: "queued", progress: 0, files: [], createdAt: Date.now(), ...input };
      backend.update(created);
      return created;
    },
    retry: async (id) => {
      const t = byId(id);
      if (t) backend.update({ ...t, status: "queued", progress: 0, error: undefined });
    },
    cancel: async (id) => {
      const t = byId(id);
      if (t) backend.update({ ...t, status: "cancelled" });
    },
    remove: async (ids) => backend.remove(ids),
  };
}

/** 队列任务 → 图库项：每个成功任务的每张图一项，编号 #n 或 #n-i。 */
export function tasksToGallery(tasks: QueueTask[]): GalleryItem[] {
  return tasks
    .filter((t) => t.status === "succeeded")
    .sort((a, b) => b.createdAt - a.createdAt)
    .flatMap((t) =>
      t.files.map((path, i) => ({
        key: path + t.id + i,
        path,
        label: t.files.length > 1 ? `#${t.number}-${i + 1}` : `#${t.number}`,
        title: t.prompt,
        group: t.model,
        createdAt: t.createdAt,
        details: [
          { label: "模型", value: t.model },
          { label: "比例", value: t.ratio },
          ...(t.files.length > 1 ? [{ label: "多合一", value: `第 ${i + 1} / ${t.files.length} 张` }] : []),
        ],
        taskId: t.id,
      }))
    );
}

// ── 设置 ────────────────────────────────────────────────────────────────

/** 内存里的设置读写；真实项目是 invoke("get_settings") / invoke("save_settings")。 */
export function createMockSettingsApi(): SettingsApi {
  let stored: AppSettings = { ...DEFAULT_SETTINGS };
  return {
    load: async () => {
      await wait(200);
      return { ...stored };
    },
    save: async (next) => {
      await wait(300);
      stored = { ...next };
      return { ...stored };
    },
    test: async (settings) => {
      await wait(600);
      if (!settings.apiKey.startsWith("sk-")) throw new Error("API Key 格式不对：应以 sk- 开头");
      return `连接正常（${settings.node === "cn" ? "国内" : "全球"}节点，演示）`;
    },
    pickDir: async () => "/Users/demo/Pictures/输出",
    about: { version: "V1.0.0", dataDir: "/Users/demo/Library/Application Support/com.example.demo" },
  };
}
