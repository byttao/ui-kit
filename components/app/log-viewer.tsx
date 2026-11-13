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

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  emptyText?: string;
  /** 传了就在右上角显示「清空」按钮（通常传 useLogger 的 clear） */
  onClear?: () => void;
  /** 右上角显示「复制全部」按钮；传了 onClear 时默认开启 */
  copyable?: boolean;
}

/**
 * 彩色日志：等宽 11px，自动滚到底部；用户上翻查看时不打断。等级色是 ui-kit 扩展色 --kit-log-*。
 * 传 onClear / copyable 时右上角浮一个小工具条（清空、复制全部），不必在 Panel extra 里自己写。
 *
 * @example
 * const { logs, log, clear } = useLogger();
 * <Panel fill title="处理日志" size="small" className="h-[170px] shrink-0">
 *   <LogViewer logs={logs} onClear={clear} />
 * </Panel>
 */
export function LogViewer({ logs, className, emptyText = "暂无日志", onClear, copyable = !!onClear }: LogViewerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const stickToBottom = React.useRef(true);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  const toolbar = !!onClear || copyable;

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
        !toolbar && className
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

  if (!toolbar) return body;
  return (
    <div className={cn("relative flex min-h-0 w-full flex-1 flex-col", className)}>
      {body}
      <LogToolbar logs={logs} onClear={onClear} copyable={copyable} />
    </div>
  );
}

function LogToolbar({ logs, onClear, copyable }: { logs: LogEntry[]; onClear?: () => void; copyable: boolean }) {
  const { message } = AntApp.useApp();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(logsToText(logs));
      message.success(`已复制 ${logs.length} 条日志`);
    } catch (err) {
      message.error(`复制失败：${err instanceof Error ? err.message : String(err)}`);
    }
  };
  return (
    // 实底小工具条：盖住滚到它下面的日志，按钮始终可点
    <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded border bg-container p-0.5">
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
    </div>
  );
}
