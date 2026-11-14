/**
 * 页面配方 · 任务队列页（拷到 src/pages/ 后把 "../index" 改成 "../ui-kit"）
 *
 * 何时用：任务各自独立、可并发、排队 / 取消 / 重试（AI 出图、下载、转码队列），每个任务有自己的状态与进度。
 * 骨架：Page > Workspace（左：任务列表 ListRow；右：参数卡片 fill + SettingsScroll，asideFooter 主按钮）+ 底部日志。
 * 数据层：api（load / listen / submit / retry / cancel / remove）。列表由 useTaskEvents 维护：
 *        Rust 推 task-updated / task-removed，前端不自己改列表。demo 用 recipes/mock.ts 的 createMockQueueApi；
 *        Tauri 写法见 AI_GUIDE「配方 · 任务队列页」。
 */
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownOutlined,
  BranchesOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PictureOutlined,
  RedoOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { App as AntApp, Button, Dropdown, Form, Input, Progress, Segmented, Tag, Tooltip, Typography } from "antd";
import {
  AdvancedSection,
  EmptyState,
  FieldHint,
  LinkTag,
  ListRow,
  ListWell,
  LogActions,
  LogViewer,
  Page,
  Panel,
  RatioPreview,
  RatioSelect,
  ScrollField,
  SettingsScroll,
  StatusTag,
  Thumb,
  ThumbStrip,
  Workspace,
  parseRatio,
  useLogger,
  useFieldScroll,
  useRowFlash,
  useTaskEvents,
  type TaskListen,
  type TaskStatusKind,
} from "../index";

export type QueueStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

/** 与 Rust 端 Task 结构对应（serde camelCase）。按业务增减字段。 */
export interface QueueTask {
  id: string;
  /** 给人看的序号 #n，Rust 端自增，删除后不复用 */
  number: number;
  prompt: string;
  status: QueueStatus;
  progress: number;
  files: string[];
  model: string;
  ratio: string;
  count: number;
  createdAt: number;
  error?: string;
  /** 「继续修改」来源任务 */
  parentId?: string;
}

export type QueueTaskInput = Pick<QueueTask, "prompt" | "model" | "ratio" | "count"> & { parentId?: string };

export interface QueueApi {
  load: () => Promise<QueueTask[]>;
  /** 不传时在 Tauri 里用 @tauri-apps/api/event 的 listen */
  listen?: TaskListen;
  submit: (input: QueueTaskInput) => Promise<QueueTask>;
  retry: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  remove: (ids: string[]) => Promise<void>;
}

/** Rust 端状态 → StatusTag 预设 */
const STATUS: Record<QueueStatus, TaskStatusKind> = {
  queued: "queued",
  running: "processing",
  succeeded: "success",
  failed: "error",
  cancelled: "cancelled",
};

const RATIOS = [
  { value: "auto" },
  { value: "1:1", size: "1024 × 1024" },
  { value: "3:4", size: "896 × 1200" },
  { value: "4:3", size: "1200 × 896" },
  { value: "9:16", size: "768 × 1365" },
  { value: "16:9", size: "1365 × 768" },
];
const COUNTS = [1, 2, 3, 4].map((n) => ({ value: n, label: n === 1 ? "1 张" : `${n} 合 1` }));
/** 多合一：整张按 cols × rows 等分拆切 */
const GRID: Record<number, [number, number]> = { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [2, 2] };

export interface QueuePageProps {
  api: QueueApi;
  /** 外部「定位到某个任务」（如从图库跳回来）：每次换 nonce 都会重新定位 */
  focus?: { id: string; nonce: number } | null;
  /** 「在图库中查看」 */
  onOpenInGallery?: (task: QueueTask) => void;
}

export function QueuePage({ api, focus, onOpenInGallery }: QueuePageProps) {
  const { message, modal } = AntApp.useApp();
  const { logs, log, clear } = useLogger();
  const { tasks, loaded } = useTaskEvents<QueueTask>({
    load: api.load,
    listen: api.listen,
    sort: (a, b) => b.createdAt - a.createdAt,
  });
  const { flashKey, flash } = useRowFlash();
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("1:1");
  const [count, setCount] = useState(1);
  const [parent, setParent] = useState<QueueTask | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 低频参数收进「高级」；changedCount 让折叠着也看得出有改动
  const [background, setBackground] = useState("auto");
  const [format, setFormat] = useState("png");
  const advancedChanged = Number(background !== "auto") + Number(format !== "png");
  // 参数区按字段滚动：小窗口下标题栏给一个「比例与张数 ↓」入口直接滚过去
  const fields = useFieldScroll();

  useEffect(() => {
    if (focus) flash(focus.id);
  }, [focus, flash]);

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const multiBlocked = ratio === "auto" && count > 1 ? "比例为「自动」时不能多合一" : null;
  const [cols, rows] = GRID[count];
  const r = parseRatio(ratio);

  const submit = async () => {
    setSubmitting(true);
    try {
      const created = await api.submit({ prompt: prompt.trim() || "未命名提示词", model: "GPT", ratio, count, parentId: parent?.id });
      log(`已加入队列 #${created.number}：「${created.prompt}」`, "processing");
      flash(created.id);
      setParent(null);
    } catch (err) {
      message.error(String(err));
      log(`加入队列失败：${String(err)}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = (task: QueueTask) =>
    modal.confirm({
      title: `删除任务 #${task.number}？`,
      content: "只删除记录，已下载的图片仍保留在输出目录。",
      okText: "删除",
      okButtonProps: { danger: true },
      onOk: async () => {
        await api.remove([task.id]);
        log(`已删除 #${task.number}`, "warning");
      },
    });

  const edit = (task: QueueTask, file?: string) => {
    setParent(task);
    setPrompt(task.prompt);
    setRatio(task.ratio);
    log(`继续修改 #${task.number}${file ? `（${task.files.indexOf(file) + 1} / ${task.files.length}）` : ""}`);
  };

  return (
    <Page>
      <Workspace
        aside={
          // 参数多：一张 fill 卡片 + SettingsScroll，只滚参数区；主按钮在 asideFooter 常驻
          <Panel
            fill
            title="出图参数"
            className="min-h-0 flex-1"
            extra={
              <Button type="link" size="small" icon={<ArrowDownOutlined />} iconPlacement="end" onClick={() => fields.scrollToField("size")}>
                比例与张数
              </Button>
            }
          >
            <SettingsScroll ref={fields.ref}>
              <Form layout="vertical" component="div" className="contents">
                {parent && (
                  <FieldHint>
                    继续修改 #{parent.number}，结果图作为参考图。{" "}
                    <Typography.Link onClick={() => setParent(null)}>取消</Typography.Link>
                  </FieldHint>
                )}
                <Form.Item label="提示词">
                  <Input.TextArea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder="描述想要的画面…"
                  />
                </Form.Item>
                {parent && parent.files.length > 0 && (
                  <Form.Item label="参考图">
                    <ThumbStrip items={parent.files.slice(0, 1)} columns={4} onRemove={() => setParent(null)} showName />
                  </Form.Item>
                )}
                {/* 字段锚点：scrollToField("size") 滚到这里（比例、张数、预览一组） */}
                <ScrollField name="size">
                  <Form.Item label="比例">
                    <RatioSelect value={ratio} onChange={setRatio} options={RATIOS} />
                  </Form.Item>
                  <Form.Item
                    label="张数"
                    extra={
                      multiBlocked ? (
                        <FieldHint type="warning">{multiBlocked}</FieldHint>
                      ) : count > 1 ? (
                        <FieldHint>一次请求画 {count} 个方案，按 {cols} × {rows} 等分拆成 {count} 张</FieldHint>
                      ) : undefined
                    }
                  >
                    <Segmented block options={COUNTS} value={count} onChange={(v) => setCount(Number(v))} />
                  </Form.Item>
                  <RatioPreview
                    ratio={ratio}
                    cols={cols}
                    rows={rows}
                    caption={
                      !r ? undefined : count > 1 ? `整张 ${ratio} · ${cols} × ${rows} 等分，每张 ${r[0] * rows}:${r[1] * cols}` : `单张 · ${ratio}`
                    }
                  />
                </ScrollField>
                <AdvancedSection
                  changedCount={advancedChanged}
                  extra={
                    <Button
                      type="link"
                      size="small"
                      disabled={!advancedChanged}
                      onClick={() => {
                        setBackground("auto");
                        setFormat("png");
                      }}
                    >
                      恢复默认
                    </Button>
                  }
                >
                  <Form.Item label="背景">
                    <Segmented
                      block
                      value={background}
                      onChange={(v) => setBackground(String(v))}
                      options={[
                        { value: "auto", label: "自动" },
                        { value: "transparent", label: "透明" },
                        { value: "opaque", label: "不透明" },
                      ]}
                    />
                  </Form.Item>
                  <Form.Item label="输出格式">
                    <Segmented
                      block
                      value={format}
                      onChange={(v) => setFormat(String(v))}
                      options={[
                        { value: "png", label: "PNG" },
                        { value: "jpeg", label: "JPEG" },
                        { value: "webp", label: "WebP" },
                      ]}
                    />
                  </Form.Item>
                </AdvancedSection>
              </Form>
            </SettingsScroll>
          </Panel>
        }
        asideFooter={
          <Button type="primary" block loading={submitting} disabled={!!multiBlocked} onClick={submit}>
            开始生成 · {count} 张
          </Button>
        }
      >
        <Panel
          fill
          className="flex-1"
          title={`任务队列 · ${tasks.length}`}
          extra={
            <Button
              type="link"
              size="small"
              disabled={!tasks.some((t) => t.status === "succeeded")}
              onClick={async () => {
                const ids = tasks.filter((t) => t.status === "succeeded").map((t) => t.id);
                await api.remove(ids);
                log(`已清除 ${ids.length} 条已完成任务`, "warning");
              }}
            >
              清除已完成
            </Button>
          }
        >
          <ListWell>
            {!loaded ? (
              <EmptyState size="small" icon={<PictureOutlined />} title="正在读取任务…" />
            ) : tasks.length === 0 ? (
              <EmptyState
                icon={<PictureOutlined />}
                title="队列是空的"
                description="在右侧写好提示词，点「开始生成」加入队列"
              />
            ) : (
              <ul className="m-0 list-none p-0">
                {tasks.map((task) => (
                  <QueueRow
                    key={task.id}
                    task={task}
                    parent={task.parentId ? byId.get(task.parentId) : undefined}
                    highlight={flashKey === task.id}
                    previewOpen={preview === task.id}
                    onPreviewChange={(open) => setPreview(open ? task.id : null)}
                    onJump={(t) => flash(t.id)}
                    onEdit={edit}
                    onRetry={async (t) => {
                      await api.retry(t.id);
                      log(`重试 #${t.number}`, "processing");
                    }}
                    onCancel={async (t) => {
                      await api.cancel(t.id);
                      log(`已取消 #${t.number}`, "warning");
                    }}
                    onRemove={remove}
                    onOpenInGallery={onOpenInGallery}
                    onCopy={async (t) => {
                      try {
                        await navigator.clipboard.writeText(t.prompt);
                        message.success("已复制提示词");
                      } catch (err) {
                        message.error(`复制失败：${String(err)}`);
                      }
                    }}
                  />
                ))}
              </ul>
            )}
          </ListWell>
        </Panel>
      </Workspace>

      <Panel
        fill
        title="队列日志"
        size="small"
        className="h-[170px] shrink-0"
        extra={<LogActions logs={logs} onClear={clear} />}
      >
        <LogViewer logs={logs} emptyText="加入队列、重试、取消的记录会显示在这里" />
      </Panel>
    </Page>
  );
}

interface QueueRowProps {
  task: QueueTask;
  parent?: QueueTask;
  highlight: boolean;
  previewOpen: boolean;
  onPreviewChange: (open: boolean) => void;
  onJump: (task: QueueTask) => void;
  onEdit: (task: QueueTask, file?: string) => void;
  onRetry: (task: QueueTask) => void;
  onCancel: (task: QueueTask) => void;
  onRemove: (task: QueueTask) => void;
  onCopy: (task: QueueTask) => void;
  onOpenInGallery?: (task: QueueTask) => void;
}

/** 任务行：行尾最多 3 个常用图标按钮（预览、继续修改、重试 / 取消），其余收进「更多」。 */
function QueueRow({
  task,
  parent,
  highlight,
  previewOpen,
  onPreviewChange,
  onJump,
  onEdit,
  onRetry,
  onCancel,
  onRemove,
  onCopy,
  onOpenInGallery,
}: QueueRowProps) {
  const done = task.status === "succeeded";
  const active = task.status === "queued" || task.status === "running";
  const multi = task.files.length > 1;

  return (
    <ListRow
      index={task.number}
      status={task.status === "failed" ? "error" : undefined}
      failedLabel={false}
      highlight={highlight}
      leading={
        <Thumb
          path={task.files[0]}
          size="md"
          loading={task.status === "running"}
          open={previewOpen}
          onOpenChange={onPreviewChange}
          alt={task.prompt}
        />
      }
      title={
        <Typography.Text strong ellipsis={{ tooltip: task.prompt }}>
          {task.prompt}
        </Typography.Text>
      }
      meta={
        <>
          <StatusTag status={STATUS[task.status]}>{task.status === "running" ? `生成中 ${task.progress}%` : undefined}</StatusTag>
          <Tag variant="filled">{task.model}</Tag>
          <Tag variant="filled">{task.ratio}</Tag>
          {task.count > 1 && <Tag variant="outlined">{task.count} 合 1</Tag>}
          {task.parentId &&
            (parent ? (
              // 可点击的标签：既表达「改自」关系，又能跳到原记录并闪一下
              <LinkTag icon={<BranchesOutlined />} onClick={() => onJump(parent)}>
                改自 #{parent.number}
              </LinkTag>
            ) : (
              <LinkTag icon={<BranchesOutlined />} disabled>
                改自已删除的任务
              </LinkTag>
            ))}
        </>
      }
      extra={
        <>
          {task.status === "running" && (
            <Progress percent={task.progress} size="small" showInfo={false} status="active" className="m-0 max-w-[320px]" />
          )}
          {task.error && <Typography.Text className="text-sm">{task.error}</Typography.Text>}
          {multi && <ThumbStrip items={task.files.map((path, i) => ({ path, key: `${path}-${i}`, caption: `#${task.number}-${i + 1}` }))} />}
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
              <Dropdown
                trigger={["click"]}
                menu={{
                  items: task.files.map((_file, i) => ({ key: `${i}`, label: `继续修改 #${task.number}-${i + 1}` })),
                  onClick: ({ key }) => onEdit(task, task.files[Number(key)]),
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
          {(task.status === "failed" || task.status === "cancelled") && (
            <Tooltip title="重试">
              <Button type="text" size="small" icon={<RedoOutlined />} aria-label="重试" onClick={() => onRetry(task)} />
            </Tooltip>
          )}
          {active && (
            <Tooltip title={task.status === "queued" ? "取消排队" : "取消"}>
              <Button type="text" size="small" icon={<StopOutlined />} aria-label="取消" onClick={() => onCancel(task)} />
            </Tooltip>
          )}
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "copy", icon: <CopyOutlined />, label: "复制提示词" },
                ...(onOpenInGallery ? [{ key: "gallery", icon: <PictureOutlined />, label: "在图库中查看", disabled: !done }] : []),
                { type: "divider" as const },
                { key: "delete", icon: <DeleteOutlined />, label: "删除记录…", danger: true },
              ],
              onClick: ({ key }) => {
                if (key === "copy") onCopy(task);
                if (key === "gallery") onOpenInGallery?.(task);
                if (key === "delete") onRemove(task);
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
