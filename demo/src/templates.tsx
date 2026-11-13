// 1.3.0 新增的页面模板与组件示例：多任务队列页、设置页、组件一览里的新组件。
import { useEffect, useMemo, useState } from "react";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FolderOpenOutlined,
  KeyOutlined,
  MoreOutlined,
  PictureOutlined,
  RedoOutlined,
  RollbackOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  App as AntApp,
  Button,
  Checkbox,
  Descriptions,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Progress,
  Radio,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  EmptyState,
  FieldHint,
  ImageGrid,
  ListRow,
  ListWell,
  LogViewer,
  NavBadge,
  Page,
  Panel,
  RatioIcon,
  RatioPreview,
  SettingsScroll,
  SettingsSection,
  StatusTag,
  ThemePicker,
  Thumb,
  ThumbStrip,
  Workspace,
  fileName,
  parseRatio,
  useLogger,
  useTheme,
  type TaskStatusKind,
  type ThemeMode,
} from "@kit";

/** 演示样图（demo/public/samples）。浏览器里 Thumb 直接用地址；Tauri 里传本地路径即可 */
export const SAMPLE_IMAGES = ["lake", "dusk", "forest", "desert", "snow", "sea"].map((name) => `/samples/${name}.svg`);

const RATIOS = ["auto", "1:1", "3:4", "4:3", "9:16", "16:9"];
const RATIO_OPTIONS = RATIOS.map((r) => ({
  value: r,
  label: (
    <span className="flex items-center gap-2">
      <RatioIcon ratio={r} />
      <span>{r === "auto" ? "自动" : r}</span>
    </span>
  ),
}));
const COUNTS = [1, 2, 3, 4].map((n) => ({ value: n, label: n === 1 ? "1 张" : `${n} 合 1` }));
/** 多合一的宫格：2 → 2×1，3 → 3×1，4 → 2×2 */
const GRID: Record<number, [number, number]> = { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [2, 2] };

interface DemoTask {
  id: string;
  prompt: string;
  status: TaskStatusKind;
  progress: number;
  files: string[];
  error?: string;
  model: string;
  ratio: string;
}

const INITIAL_TASKS: DemoTask[] = [
  { id: "t1", prompt: "清晨的湖面，薄雾，远处的山，胶片质感", status: "success", progress: 100, files: [SAMPLE_IMAGES[0]], model: "GPT", ratio: "1:1" },
  {
    id: "t2",
    prompt: "四张不同角度的沙漠日落，统一色调，适合做系列海报",
    status: "success",
    progress: 100,
    files: [SAMPLE_IMAGES[3], SAMPLE_IMAGES[1], SAMPLE_IMAGES[5], SAMPLE_IMAGES[2]],
    model: "Nano",
    ratio: "1:1",
  },
  { id: "t3", prompt: "雪山与星空，长曝光", status: "processing", progress: 35, files: [], model: "GPT", ratio: "3:4" },
  { id: "t4", prompt: "海边灯塔，暴风雨前", status: "queued", progress: 0, files: [], model: "Nano", ratio: "16:9" },
  {
    id: "t5",
    prompt: "森林里的小木屋，童话插画风格，暖色灯光从窗户透出来",
    status: "error",
    progress: 0,
    files: [],
    error: "接口返回 429：请求过于频繁，稍后重试。",
    model: "GPT",
    ratio: "4:3",
  },
];

/**
 * 多任务队列页模板：任务各自独立、可并发、可排队 / 取消 / 重试。
 * 真实项目里 tasks 来自 useTaskEvents（订阅 Rust 的 task-updated / task-removed），这里用本地 state 模拟。
 */
export function QueuePage() {
  const { message, modal } = AntApp.useApp();
  const { logs, log, clear } = useLogger();
  const [tasks, setTasks] = useState<DemoTask[]>(INITIAL_TASKS);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [count, setCount] = useState(1);
  const [refs, setRefs] = useState<string[]>(SAMPLE_IMAGES.slice(0, 3));

  // 模拟进行中的任务推进
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.status !== "processing") return t;
          const next = Math.min(100, t.progress + 7);
          return next >= 100 ? { ...t, status: "success", progress: 100, files: [SAMPLE_IMAGES[4]] } : { ...t, progress: next };
        })
      );
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  // 定位高亮 2 秒后消失
  useEffect(() => {
    if (!highlight) return;
    const timer = window.setTimeout(() => setHighlight(null), 2000);
    return () => window.clearTimeout(timer);
  }, [highlight]);

  const multiBlocked = ratio === "auto" && count > 1 ? "比例为「自动」时不能多合一" : null;
  const [cols, rows] = GRID[count];
  const running = tasks.filter((t) => t.status === "processing" || t.status === "queued").length;

  const submit = () => {
    const id = `t${Date.now()}`;
    setTasks((prev) => [
      { id, prompt: prompt.trim() || "未命名提示词", status: "queued", progress: 0, files: [], model: "GPT", ratio },
      ...prev,
    ]);
    setHighlight(id);
    log(`已加入队列：「${prompt.trim() || "未命名提示词"}」`, "processing");
    message.success("已加入队列");
  };

  const retry = (task: DemoTask) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "processing", progress: 0, error: undefined } : t)));
    log(`重试：「${task.prompt}」`, "processing");
  };
  const cancel = (task: DemoTask) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: "cancelled" } : t)));
    log(`已取消：「${task.prompt}」`, "warning");
  };
  const remove = (task: DemoTask) =>
    modal.confirm({
      title: "删除这条任务记录？",
      content: "只删除记录，已下载的图片仍保留在输出目录。",
      okText: "删除",
      okButtonProps: { danger: true },
      onOk: () => {
        setTasks((prev) => prev.filter((t) => t.id !== task.id));
        log(`已删除记录：「${task.prompt}」`, "warning");
      },
    });

  return (
    <Page>
      <Workspace
        aside={
          // 参数多：参数卡片 fill + 内部滚动，主按钮放 asideFooter 常驻
          <Panel fill title="出图参数" className="min-h-0 flex-1">
            <SettingsScroll>
              <Form layout="vertical" component="div" className="flex flex-col gap-4">
                <Form.Item label="提示词">
                  <Input.TextArea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="描述想要的画面…"
                  />
                </Form.Item>
                <Form.Item label="参考图" extra="最多 8 张；悬停看文件名，点开可翻页预览">
                  <ThumbStrip items={refs} columns={4} showName onRemove={(key) => setRefs((prev) => prev.filter((p) => p !== key))} />
                  {refs.length < 8 && (
                    <Button size="small" className="mt-2" onClick={() => setRefs((prev) => [...prev, SAMPLE_IMAGES[prev.length % 6]])}>
                      添加参考图…
                    </Button>
                  )}
                </Form.Item>
                <Form.Item label="比例">
                  <Select value={ratio} onChange={setRatio} options={RATIO_OPTIONS} />
                </Form.Item>
                <Form.Item
                  label="张数"
                  extra={
                    multiBlocked ? (
                      <FieldHint type="warning">{multiBlocked}</FieldHint>
                    ) : count > 1 ? (
                      <FieldHint>一次请求画 {count} 个方案，下载后自动拆成 {count} 张</FieldHint>
                    ) : undefined
                  }
                >
                  <Segmented block options={COUNTS} value={count} onChange={(v) => setCount(Number(v))} />
                </Form.Item>
                <RatioPreview
                  ratio={count > 1 && parseRatio(ratio) ? `${parseRatio(ratio)![0] * cols}:${parseRatio(ratio)![1] * rows}` : ratio}
                  cols={cols}
                  rows={rows}
                  caption={count > 1 ? `${cols} 列 × ${rows} 行 · 每张 ${ratio}` : `单张 · ${ratio === "auto" ? "自动" : ratio}`}
                />
              </Form>
            </SettingsScroll>
          </Panel>
        }
        asideFooter={
          <Button type="primary" block disabled={!!multiBlocked} onClick={submit}>
            开始生成 · {count} 张
          </Button>
        }
      >
        <Panel
          fill
          className="flex-1"
          title={
            <span className="flex items-center gap-2">
              任务队列 <NavBadgeDemo count={running} />
            </span>
          }
          extra={
            <Button
              type="link"
              size="small"
              disabled={!tasks.some((t) => t.status === "success")}
              onClick={() => setTasks((prev) => prev.filter((t) => t.status !== "success"))}
            >
              清除已完成
            </Button>
          }
        >
          <ListWell>
            {tasks.length === 0 ? (
              <EmptyState
                icon={<PictureOutlined />}
                title="队列是空的"
                description="在右侧写好提示词，点「开始生成」加入队列"
                action={<Button onClick={() => setTasks(INITIAL_TASKS)}>载入示例任务</Button>}
              />
            ) : (
              <ul className="m-0 list-none p-0">
                {tasks.map((task, i) => (
                  <TaskRow
                    key={task.id}
                    index={i + 1}
                    task={task}
                    highlight={highlight === task.id}
                    previewOpen={preview === task.id}
                    onPreviewChange={(open) => setPreview(open ? task.id : null)}
                    onRetry={retry}
                    onCancel={cancel}
                    onRemove={remove}
                    onEdit={(t, file) => {
                      setRefs(file ? [file] : t.files.slice(0, 1));
                      setPrompt(t.prompt);
                      log(`继续修改：「${t.prompt}」${file ? `的 ${fileName(file)}` : ""}`);
                    }}
                  />
                ))}
              </ul>
            )}
          </ListWell>
        </Panel>
      </Workspace>

      <Panel fill title="队列日志" size="small" className="h-[170px] shrink-0">
        <LogViewer logs={logs} onClear={clear} emptyText="加入队列、重试、取消的记录会显示在这里" />
      </Panel>
    </Page>
  );
}

/** 卡片标题里的计数：用中性 Tag，不用侧栏徽标（侧栏徽标只给侧栏用） */
function NavBadgeDemo({ count }: { count: number }) {
  return count ? <Tag variant="filled">{count} 个进行中</Tag> : null;
}

interface TaskRowProps {
  index: number;
  task: DemoTask;
  highlight: boolean;
  previewOpen: boolean;
  onPreviewChange: (open: boolean) => void;
  onRetry: (task: DemoTask) => void;
  onCancel: (task: DemoTask) => void;
  onRemove: (task: DemoTask) => void;
  onEdit: (task: DemoTask, file?: string) => void;
}

/** 任务行：ListRow + StatusTag + ThumbStrip；行尾最多 3 个图标按钮，其余进「更多」菜单（design.md「行尾操作」） */
function TaskRow({ index, task, highlight, previewOpen, onPreviewChange, onRetry, onCancel, onRemove, onEdit }: TaskRowProps) {
  const failed = task.status === "error";
  const done = task.status === "success";
  const active = task.status === "processing" || task.status === "queued";
  const multi = task.files.length > 1;

  return (
    <ListRow
      index={index}
      status={failed ? "error" : undefined}
      failedLabel={false}
      highlight={highlight}
      leading={
        <Thumb
          path={task.files[0]}
          size="md"
          loading={task.status === "processing"}
          open={previewOpen}
          onOpenChange={onPreviewChange}
          alt={task.prompt}
        />
      }
      title={<Typography.Text strong ellipsis={{ tooltip: task.prompt }}>{task.prompt}</Typography.Text>}
      meta={
        <>
          <StatusTag status={task.status}>{task.status === "processing" ? `生成中 ${task.progress}%` : undefined}</StatusTag>
          <Tag variant="filled">{task.model}</Tag>
          <Tag variant="filled">{task.ratio}</Tag>
          {multi && <Tag variant="outlined">{task.files.length} 合 1</Tag>}
          <span>#{index}</span>
        </>
      }
      extra={
        <>
          {task.status === "processing" && (
            <Progress percent={task.progress} size="small" showInfo={false} status="active" className="m-0 max-w-[320px]" />
          )}
          {task.error && <Typography.Text type="secondary" className="text-sm">{task.error}</Typography.Text>}
          {multi && <ThumbStrip items={task.files} />}
        </>
      }
      trailing={
        <>
          {done && (
            <Tooltip title="预览">
              <Button type="text" size="small" icon={<EyeOutlined />} aria-label="预览" onClick={() => onPreviewChange(true)} />
            </Tooltip>
          )}
          {done &&
            (multi ? (
              // 多张时「继续修改」要选具体一张：图标按钮套 Dropdown
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: task.files.map((file, i) => ({ key: file, label: `继续修改第 ${i + 1} 张` })),
                  onClick: ({ key }) => onEdit(task, key),
                }}
              >
                <Tooltip title="继续修改（选一张）">
                  <Button type="text" size="small" icon={<EditOutlined />} aria-label="继续修改" />
                </Tooltip>
              </Dropdown>
            ) : (
              <Tooltip title="继续修改">
                <Button type="text" size="small" icon={<EditOutlined />} aria-label="继续修改" onClick={() => onEdit(task)} />
              </Tooltip>
            ))}
          {(failed || task.status === "cancelled") && (
            <Tooltip title="重试">
              <Button type="text" size="small" icon={<RedoOutlined />} aria-label="重试" onClick={() => onRetry(task)} />
            </Tooltip>
          )}
          {active && (
            <Tooltip title={task.status === "queued" ? "取消排队" : "取消"}>
              <Button type="text" size="small" icon={<StopOutlined />} aria-label="取消" onClick={() => onCancel(task)} />
            </Tooltip>
          )}
          {/* 低频与危险操作收进「更多」：删除放最后、danger，文案带「…」 */}
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "copy", icon: <CopyOutlined />, label: "复制提示词" },
                { key: "reveal", icon: <FolderOpenOutlined />, label: "打开所在文件夹", disabled: !done },
                { type: "divider" },
                { key: "delete", icon: <DeleteOutlined />, label: "删除记录…", danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "delete") onRemove(task);
                if (key === "copy") void navigator.clipboard?.writeText(task.prompt);
              },
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label="更多操作" />
          </Dropdown>
        </>
      }
    />
  );
}

interface DemoSettings {
  apiKey: string;
  node: string;
  concurrency: number;
  proxy: string;
  upscale: boolean;
}
const SAVED: DemoSettings = { apiKey: "", node: "cn", concurrency: 2, proxy: "none", upscale: true };

/** 设置页模板：长表单分区 + 草稿 / 保存 / 放弃修改；外观即时生效，不进草稿。 */
export function SettingsPage() {
  const { message } = AntApp.useApp();
  const { logs, log, clear } = useLogger();
  const { accent, setAccent, mode, setMode } = useTheme();
  const [saved, setSaved] = useState<DemoSettings>(SAVED);
  const [draft, setDraft] = useState<DemoSettings>(SAVED);
  const dirty = useMemo(() => JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  const patch = (p: Partial<DemoSettings>) => setDraft((d) => ({ ...d, ...p }));

  const save = () => {
    setSaved(draft);
    log("设置已保存。", "success");
    message.success("设置已保存");
  };

  return (
    <Page>
      <Workspace
        aside={
          <Panel title="关于">
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: "v", label: "版本", children: "V1.0.0" },
                { key: "d", label: "数据目录", children: <Typography.Text ellipsis={{ tooltip: "~/Library/Application Support/demo" }} className="max-w-[170px]">~/Library/Application Support/demo</Typography.Text> },
              ]}
            />
          </Panel>
        }
        asideFooter={
          <>
            {dirty && (
              <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => setDraft(saved)}>
                放弃修改
              </Button>
            )}
            {/* 非批处理页的主按钮：动词 + 对象，没有数量可写 */}
            <Button type="primary" block disabled={!dirty} onClick={save}>
              保存设置
            </Button>
          </>
        }
      >
        <Panel
          fill
          className="flex-1"
          title="设置"
          extra={<span className="text-sm text-text-tertiary">外观即时生效，其余点右下角「保存设置」</span>}
        >
          <SettingsScroll>
            <Form layout="vertical" component="div" className="contents">
              {!saved.apiKey && (
                <EmptyState
                  size="small"
                  icon={<KeyOutlined />}
                  title="还没有填写 API Key"
                  description="填好并保存后就可以开始生成"
                />
              )}
              <SettingsSection title="接口" description="「测试连接」不会扣费">
                <Form.Item label="API Key">
                  <Space.Compact block>
                    <Input.Password value={draft.apiKey} onChange={(e) => patch({ apiKey: e.target.value })} placeholder="sk-…" autoComplete="off" />
                    <Button disabled={!draft.apiKey.trim()} onClick={() => log("连接正常（演示）。", "success")}>
                      测试连接
                    </Button>
                  </Space.Compact>
                </Form.Item>
                <Form.Item label="节点">
                  <Radio.Group
                    orientation="vertical"
                    value={draft.node}
                    onChange={(e) => patch({ node: e.target.value })}
                    options={[
                      { value: "cn", label: "国内节点" },
                      { value: "global", label: "全球节点" },
                    ]}
                  />
                </Form.Item>
              </SettingsSection>
              <SettingsSection
                title="队列"
                extra={
                  <Button type="link" size="small" disabled={draft.concurrency === SAVED.concurrency} onClick={() => patch({ concurrency: SAVED.concurrency })}>
                    恢复默认
                  </Button>
                }
              >
                <Form.Item label="同时进行" extra="超出的任务排队等待，1–5">
                  <InputNumber min={1} max={5} precision={0} value={draft.concurrency} onChange={(v) => patch({ concurrency: v ?? 2 })} suffix="个" />
                </Form.Item>
                <Form.Item label="代理">
                  <Segmented
                    value={draft.proxy}
                    onChange={(v) => patch({ proxy: String(v) })}
                    options={[
                      { value: "none", label: "不使用" },
                      { value: "system", label: "跟随系统" },
                      { value: "custom", label: "自定义" },
                    ]}
                  />
                </Form.Item>
                <Form.Item>
                  <Checkbox checked={draft.upscale} onChange={(e) => patch({ upscale: e.target.checked })}>
                    拆切后放大到单张原尺寸
                  </Checkbox>
                </Form.Item>
              </SettingsSection>
              <SettingsSection title="外观" description="即时生效，不需要保存">
                <Form.Item label="明暗">
                  <Segmented<ThemeMode>
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: "light", label: "浅色" },
                      { value: "dark", label: "深色" },
                      { value: "system", label: "跟随系统" },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="主题">
                  <ThemePicker value={accent} onChange={setAccent} />
                </Form.Item>
              </SettingsSection>
            </Form>
          </SettingsScroll>
        </Panel>
      </Workspace>

      <Panel fill title="设置日志" size="small" className="h-[170px] shrink-0">
        <LogViewer logs={logs} onClear={clear} emptyText="测试连接、保存设置的结果会显示在这里" />
      </Panel>
    </Page>
  );
}

/** 组件一览里的 1.3.0 新组件示例。 */
export function NewComponents() {
  const [selected, setSelected] = useState<string | null>(SAMPLE_IMAGES[0]);
  const [ratio, setRatio] = useState("16:9");
  const gallery = SAMPLE_IMAGES.map((path, i) => ({
    key: path,
    path,
    alt: `样图 ${i + 1}`,
    badge: i === 1 ? <Tag className="m-0" variant="solid">2 / 4</Tag> : undefined,
  }));

  return (
    <>
      <Panel title="列表行 ListRow · 1.3.0" extra={<Typography.Text type="secondary">FileRow 仍可用：纯文件名长列表</Typography.Text>}>
        <ListWell className="flex-none">
          <ul className="m-0 list-none p-0">
            <ListRow
              index={1}
              leading={<Thumb path={SAMPLE_IMAGES[0]} size="md" />}
              title="清晨的湖面，薄雾，远处的山"
              meta={
                <>
                  <StatusTag status="success" />
                  <Tag variant="filled">GPT</Tag>
                  <span>1024 × 1024 · 09:12</span>
                </>
              }
              trailing={<Button type="text" size="small" icon={<EyeOutlined />} aria-label="预览" />}
            />
            <ListRow
              index={2}
              selected
              leading={<Thumb size="md" loading />}
              title="雪山与星空（选中）"
              meta={<StatusTag status="processing">生成中 40%</StatusTag>}
              extra={<Progress percent={40} size="small" showInfo={false} status="active" className="m-0 max-w-[320px]" />}
            />
            <ListRow
              index={3}
              status="error"
              leading={<Thumb size="md" />}
              title={<Typography.Text strong>森林小木屋（失败行：antd 文字、中性 Tag 继承红字）</Typography.Text>}
              meta={
                <>
                  <StatusTag status="error" />
                  <Tag variant="filled">Nano</Tag>
                  <Typography.Text type="secondary">3:4 · 10:05</Typography.Text>
                </>
              }
              extra={<span className="text-sm">接口返回 429：请求过于频繁。</span>}
              trailing={<Button type="text" size="small" icon={<RedoOutlined />} aria-label="重试" />}
            />
            <ListRow
              index={4}
              highlight
              align="center"
              title="定位高亮（highlight）"
              meta={<StatusTag status="queued" />}
              trailing={<Button type="text" size="small" icon={<MoreOutlined />} aria-label="更多" />}
            />
          </ul>
        </ListWell>
      </Panel>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="缩略图 Thumb / ThumbStrip">
          <div className="flex flex-wrap items-end gap-3">
            <Thumb path={SAMPLE_IMAGES[1]} size="xs" />
            <Thumb path={SAMPLE_IMAGES[1]} size="sm" />
            <Thumb path={SAMPLE_IMAGES[1]} size="md" />
            <Thumb path={SAMPLE_IMAGES[1]} size="lg" />
            <Thumb size="md" loading />
            <Thumb path="/samples/不存在.png" size="md" />
          </div>
          <Thumb path={SAMPLE_IMAGES[5]} size="fill" ratio={16 / 9} fit="contain" />
          <Typography.Text type="secondary">缩略图条（点开可翻页）：</Typography.Text>
          <ThumbStrip items={SAMPLE_IMAGES} />
          <Typography.Text type="secondary">参考图墙（4 列 + 移除角标）：</Typography.Text>
          <ThumbStrip items={SAMPLE_IMAGES.slice(0, 5)} columns={4} onRemove={() => {}} showName />
        </Panel>

        <Panel title="图片网格 ImageGrid" extra={<Typography.Text type="secondary">单击选中，双击看大图</Typography.Text>}>
          <ListWell className="flex-none p-3">
            <ImageGrid items={gallery} selectedKey={selected} onSelect={setSelected} minTileWidth={110} />
          </ListWell>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="比例 RatioIcon / RatioPreview">
          <Form layout="vertical">
            <Form.Item label="比例" className="mb-3">
              <Select value={ratio} onChange={setRatio} options={RATIO_OPTIONS} />
            </Form.Item>
          </Form>
          <div className="grid grid-cols-2 gap-3">
            <RatioPreview ratio={ratio} caption={`单张 · ${ratio === "auto" ? "自动" : ratio}`} />
            <RatioPreview ratio="16:9" cols={2} rows={2} cellRatio="1:1" caption="2 × 2 · 每格居中裁成 1:1" />
          </div>
        </Panel>

        <Panel title="状态 / 提示 / 徽标">
          <Space wrap size="small">
            <StatusTag status="queued" />
            <StatusTag status="processing" />
            <StatusTag status="success" />
            <StatusTag status="error" />
            <StatusTag status="warning" />
            <StatusTag status="cancelled" />
          </Space>
          <FieldHint>合图使用更高一档分辨率，单价可能更高</FieldHint>
          <FieldHint type="warning">比例为「自动」时不能多合一</FieldHint>
          <div className="flex items-center gap-3">
            {/* 侧栏徽标只在侧栏里用；这里放在侧栏色块上演示 */}
            <span className="flex items-center gap-2 rounded-lg bg-sidebar px-3 py-2 text-sidebar-text">
              出图 <NavBadge count={3} /> 图库 <NavBadge count={128} tone="muted" /> 溢出 <NavBadge count={120} />
            </span>
          </div>
        </Panel>
      </div>

      <Panel title="空状态 EmptyState">
        <div className="grid grid-cols-2 gap-5">
          <ListWell className="flex-none">
            <EmptyState
              icon={<KeyOutlined />}
              title="还没有填写 API Key"
              description="填好后就可以开始出图；Key 只保存在本机"
              action={<Button>去设置</Button>}
            />
          </ListWell>
          <ListWell className="flex-none">
            <EmptyState size="small" icon={<PictureOutlined />} title="还没有图片" description="出图完成后会出现在这里" />
          </ListWell>
        </div>
      </Panel>
    </>
  );
}
