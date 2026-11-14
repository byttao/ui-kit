import * as React from "react";
import { ClearOutlined, CopyOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Tooltip } from "antd";
import { cn } from "../../lib/cn";

export type LogLevel = "info" | "success" | "warning" | "error" | "processing";

export interface LogEntry {
  id: string;
  time: string;
  level: LogLevel;
  message: string;
}

const LEVEL: Record<LogLevel, { prefix: string; className: string }> = {
  info: { prefix: "[INFO]", className: "text-log-info" },
  success: { prefix: "[SUCCESS]", className: "text-log-success" },
  warning: { prefix: "[WARN]", className: "text-log-warning" },
  error: { prefix: "[ERROR]", className: "text-log-error" },
  processing: { prefix: "[PROCESS]", className: "text-log-processing" },
};

let counter = 0;

/** 生成一条日志（带时间戳与唯一 id）。 */
export function createLogEntry(message: string, level: LogLevel = "info", at = new Date()): LogEntry {
  const time = [at.getHours(), at.getMinutes(), at.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
  counter += 1;
  return { id: `${at.getTime()}-${counter}`, time, level, message };
}

// ── 组件外写入的通道 ────────────────────────────────────────────────────
// 每个通道一份缓冲：页面还没挂载（或还没开始监听）时写入的日志先存着，useLogger({ channel }) 挂载时一次取走。

interface Channel {
  buffer: LogEntry[];
  listener: ((entry: LogEntry) => void) | null;
}

const channels = new Map<string, Channel>();
/** 未被取走时每个通道最多缓冲的条数 */
const CHANNEL_BUFFER = 200;

function channelOf(name: string) {
  let channel = channels.get(name);
  if (!channel) {
    channel = { buffer: [], listener: null };
    channels.set(name, channel);
  }
  return channel;
}

/**
 * 从 React 之外写日志到某个页面：例如 main.tsx 里一启动就订阅 Rust 的日志事件，
 * 页面还没挂载时写入的内容先缓冲，页面的 `useLogger({ channel })` 挂载时补上。
 *
 * @example
 * // main.tsx（渲染之前）
 * listen<{ level: LogLevel; message: string }>("app-log", (e) => pushLog("generate", e.payload.message, e.payload.level));
 * // GeneratePage
 * const { logs, log, clear } = useLogger({ channel: "generate" });
 */
export function pushLog(channel: string, message: string, level: LogLevel = "info") {
  const target = channelOf(channel);
  const entry = createLogEntry(message, level);
  if (target.listener) target.listener(entry);
  else {
    target.buffer.push(entry);
    if (target.buffer.length > CHANNEL_BUFFER) target.buffer.shift();
  }
}

export interface UseLoggerOptions {
  /** 最多保留的条数，默认 1000，超出丢弃最早的 */
  limit?: number;
  /** 通道名：同名的 pushLog 写入会出现在这里（含挂载前缓冲的） */
  channel?: string;
}

/**
 * 日志状态：每个功能页各自一份，互不混用。
 * `useLogger()`、`useLogger(500)`（1.2.0 写法）与 `useLogger({ limit, channel })` 都可以。
 */
export function useLogger(options: number | UseLoggerOptions = {}) {
  const { limit = 1000, channel } = typeof options === "number" ? { limit: options } : options;
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  const append = React.useCallback(
    (entries: LogEntry[]) => {
      if (!entries.length) return;
      // 超出上限时丢弃最早的记录，避免长时间运行后列表过长
      setLogs((prev) => {
        const next = prev.concat(entries);
        return next.length > limit ? next.slice(next.length - limit) : next;
      });
    },
    [limit]
  );

  const log = React.useCallback(
    (message: string, level: LogLevel = "info") => append([createLogEntry(message, level)]),
    [append]
  );

  React.useEffect(() => {
    if (!channel) return;
    const target = channelOf(channel);
    append(target.buffer.splice(0));
    const listener = (entry: LogEntry) => append([entry]);
    target.listener = listener;
    return () => {
      if (target.listener === listener) target.listener = null;
    };
  }, [channel, append]);

  const clear = React.useCallback(() => setLogs([]), []);

  return { logs, log, clear };
}

/** 日志转成纯文本：「时间 [等级] 内容」，一行一条。 */
export function logsToText(logs: LogEntry[]) {
  return logs.map((entry) => `${entry.time} ${LEVEL[entry.level].prefix} ${entry.message}`).join("\n");
}

/** 写剪贴板：默认 navigator.clipboard.writeText；Tauri 里也可传 clipboard-manager 插件的 writeText。 */
export type CopyText = (text: string) => Promise<void>;
const defaultCopy: CopyText = (text) => navigator.clipboard.writeText(text);

export interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  emptyText?: string;
  /** 传了就显示「清空」按钮（通常传 useLogger 的 clear） */
  onClear?: () => void;
  /** 显示「复制全部」按钮；传了 onClear 时默认开启 */
  copyable?: boolean;
  /**
   * 工具条放在哪：
   *   side（默认）：日志区右侧一列竖排小按钮，**不盖住日志文字**（1.4.0 是浮在右上角，会挡住长行末尾）；
   *   none：不渲染，按钮由页面放到 Panel 的 extra——`<Panel extra={<LogActions logs={logs} onClear={clear} />}>`（推荐）。
   */
  toolbar?: "side" | "none";
  /** 自定义写剪贴板（如 @tauri-apps/plugin-clipboard-manager 的 writeText） */
  copyText?: CopyText;
}

/**
 * 彩色日志：等宽 11px，自动滚到底部；用户上翻查看时不打断。等级色是 ui-kit 扩展色 --kit-log-*。
 *
 * 清空 / 复制全部两种放法：
 *   - 推荐：按钮放 Panel 标题栏——`<Panel extra={<LogActions logs={logs} onClear={clear} />}>` + `<LogViewer logs={logs} />`；
 *   - 省事：`<LogViewer logs={logs} onClear={clear} />`，按钮在日志区右侧一列，不遮挡文字。
 *
 * @example
 * const { logs, log, clear } = useLogger();
 * <Panel fill title="处理日志" size="small" className="h-[170px] shrink-0" extra={<LogActions logs={logs} onClear={clear} />}>
 *   <LogViewer logs={logs} />
 * </Panel>
 */
export function LogViewer({
  logs,
  className,
  emptyText = "暂无日志",
  onClear,
  copyable = !!onClear,
  toolbar = "side",
  copyText,
}: LogViewerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const stickToBottom = React.useRef(true);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const withToolbar = toolbar !== "none" && (!!onClear || copyable);

  const body = (
    <div
      ref={ref}
      data-selectable
      role="log"
      aria-live="polite"
      onScroll={(e) => {
        const el = e.currentTarget;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
      }}
      className={cn(
        "min-h-0 w-full flex-1 overflow-auto rounded bg-fill-quaternary px-3 py-2 font-mono text-sm",
        !withToolbar && className
      )}
    >
      {logs.length === 0 ? (
        <p className="m-0 text-text-tertiary">{emptyText}</p>
      ) : (
        logs.map((entry) => (
          <div key={entry.id} className="flex gap-2 whitespace-pre-wrap">
            <span className="shrink-0 text-text-tertiary">{entry.time}</span>
            <span className={cn("shrink-0 font-strong", LEVEL[entry.level].className)}>
              {LEVEL[entry.level].prefix}
            </span>
            <span className="min-w-0">{entry.message}</span>
          </div>
        ))
      )}
    </div>
  );

  if (!withToolbar) return body;
  // 工具条在日志区外侧单独一列：不叠在文字上，长行也不会被挡住
  return (
    <div className={cn("flex min-h-0 w-full flex-1 gap-1", className)}>
      {body}
      <div className="flex shrink-0 flex-col gap-0.5">
        <LogActions logs={logs} onClear={onClear} copyable={copyable} copyText={copyText} />
      </div>
    </div>
  );
}

export interface LogActionsProps {
  logs: LogEntry[];
  /** 传了才显示「清空」 */
  onClear?: () => void;
  /** 显示「复制全部」，默认 true */
  copyable?: boolean;
  /** 自定义写剪贴板（如 Tauri clipboard-manager 插件） */
  copyText?: CopyText;
  className?: string;
}

/**
 * 日志的「复制全部」「清空」图标按钮，放在 Panel 标题栏（`extra`）里。
 * 复制内容是「时间 [等级] 内容」逐行（logsToText）。
 */
export function LogActions({ logs, onClear, copyable = true, copyText = defaultCopy, className }: LogActionsProps) {
  const { message } = AntApp.useApp();
  const copy = async () => {
    try {
      await copyText(logsToText(logs));
      message.success(`已复制 ${logs.length} 条日志`);
    } catch (err) {
      message.error(`复制失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };
  return (
    <span className={cn("contents", className)}>
      {copyable && (
        <Tooltip title="复制全部">
          <Button type="text" size="small" icon={<CopyOutlined />} aria-label="复制全部日志" disabled={!logs.length} onClick={copy} />
        </Tooltip>
      )}
      {onClear && (
        <Tooltip title="清空日志">
          <Button type="text" size="small" icon={<ClearOutlined />} aria-label="清空日志" disabled={!logs.length} onClick={onClear} />
        </Tooltip>
      )}
    </span>
  );
}
