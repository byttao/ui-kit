/**
 * 页面配方 · 批处理页（拷到 src/pages/ 后把 "../index" 改成 "../ui-kit"）
 *
 * 何时用：一批文件、一个总进度、一次跑完（转换、裁切、压缩、重命名）。
 * 骨架：Page > Workspace（左：拖拽区 + 文件列表；右：设置卡片，asideFooter 进度 + 主按钮）+ 底部日志。
 * 数据层：backend（选文件 + 跑一批）。demo 用 recipes/mock.ts 的 mockBatchBackend；
 *        Tauri 写法见 AI_GUIDE「配方 · 批处理页」（dialog open + invoke + 进度事件）。
 */
import { useState } from "react";
import { App as AntApp, Button, Empty, Radio, Space, Typography } from "antd";
import {
  DropZone,
  FileRow,
  ListWell,
  LogViewer,
  Page,
  Panel,
  ProgressPanel,
  Workspace,
  fileName,
  useFileDrop,
  useLogger,
  type BatchProgress,
} from "../index";

export interface BatchOptions {
  preset: string;
}

export interface BatchBackend {
  /** 打开文件选择框，返回选中的路径（取消时返回空数组） */
  pick: () => Promise<string[]>;
  /** 处理一批文件：每张 / 每个阶段调用 report 更新进度；返回失败的路径 */
  run: (files: string[], options: BatchOptions, report: (progress: BatchProgress) => void) => Promise<{ failed: string[]; message?: string }>;
}

const PRESETS = [
  { value: "1440", label: "1440 方图" },
  { value: "1440c", label: "1440 长图" },
  { value: "800", label: "800 方图" },
  { value: "product", label: "商品长图" },
];

export interface BatchPageProps {
  backend: BatchBackend;
  /** 页面是否可见（常驻页面用 hidden 切换时传入，只在可见时接收拖拽） */
  active?: boolean;
}

export function BatchPage({ backend, active = true }: BatchPageProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [preset, setPreset] = useState("1440");
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const { logs, log, clear } = useLogger();
  const { message } = AntApp.useApp();
  const [running, setRunning] = useState(false);

  // 重新添加时清除失败标记
  const add = (paths: string[]) => {
    const fresh = paths.filter((p) => !files.includes(p));
    if (!fresh.length) return;
    setFiles((prev) => [...prev, ...fresh]);
    setFailed(new Set());
    log(`已添加 ${fresh.length} 个文件。`);
  };
  const { hovering } = useFileDrop(add, { enabled: active && !running });

  const browse = async () => add(await backend.pick());

  const run = async () => {
    setRunning(true);
    log(`开始处理 ${files.length} 张图片。`, "processing");
    setProgress({ current: 0, total: files.length, percent: 0, stage: "准备中", file_name: "" });
    try {
      const result = await backend.run(files, { preset }, (p) => {
        setProgress(p);
        log(`[*] 正在处理: ${fileName(p.file_name)}`);
      });
      result.failed.forEach((f) => log(`[!] 处理失败 - ${fileName(f)}`, "error"));
      // 部分失败：成功的移出列表，失败的留下并标红，方便调整后重试
      setFiles(result.failed);
      setFailed(new Set(result.failed));
      setProgress((p) => (p ? { ...p, current: p.total, percent: 100, stage: "完成" } : p));
      if (result.failed.length) {
        log(`${result.message ?? "处理完成"}，${result.failed.length} 张失败，已留在列表中。`, "warning");
        message.warning(`${result.failed.length} 张处理失败，已留在列表中`);
      } else {
        log(result.message ?? "全部完成。", "success");
        message.success(result.message ?? "全部完成");
      }
    } catch (err) {
      log(`处理失败：${String(err)}`, "error");
      message.error(String(err));
      setProgress((p) => (p ? { ...p, stage: "失败" } : p));
    } finally {
      setRunning(false);
      // 进度条保留一会儿，让用户看到最终状态
      window.setTimeout(() => setProgress(null), 2500);
    }
  };

  return (
    <Page>
      <Workspace
        aside={
          <Panel title="转换样式">
            <Radio.Group orientation="vertical" value={preset} onChange={(e) => setPreset(e.target.value)} options={PRESETS} />
          </Panel>
        }
        asideFooter={
          <>
            <ProgressPanel progress={progress} />
            <Button type="primary" block disabled={!files.length || running} onClick={run}>
              {running ? "处理中…" : `开始转换 · ${files.length} 张`}
            </Button>
          </>
        }
      >
        <Panel
          fill
          className="flex-1"
          title="待转换图片"
          extra={
            <Space size="small">
              <Typography.Text type="secondary">{files.length} 张</Typography.Text>
              <Button
                type="link"
                size="small"
                disabled={!files.length || running}
                onClick={() => {
                  setFiles([]);
                  setFailed(new Set());
                }}
              >
                清空列表
              </Button>
            </Space>
          }
        >
          <DropZone active={hovering} compact={files.length > 0} onBrowse={browse} disabled={running} hint="JPG、PNG、BMP、GIF · 可批量添加" />
          <ListWell>
            {files.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="添加图片后会显示在这里" className="py-9" />
            ) : (
              <ul className="m-0 list-none p-0">
                {files.map((f, i) => (
                  <FileRow key={f} index={i + 1} status={failed.has(f) ? "error" : undefined}>
                    {fileName(f)}
                  </FileRow>
                ))}
              </ul>
            )}
          </ListWell>
        </Panel>
      </Workspace>

      <Panel fill title="处理日志" size="small" className="h-[170px] shrink-0">
        <LogViewer logs={logs} onClear={clear} />
      </Panel>
    </Page>
  );
}
