import * as React from "react";
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

/** 日志状态：每个功能页各自一份，互不混用。 */
export function useLogger(limit = 1000) {
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const counter = React.useRef(0);

  const log = React.useCallback(
    (message: string, level: LogLevel = "info") => {
      const now = new Date();
      const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");
      counter.current += 1;
      const entry = { id: `${Date.now()}-${counter.current}`, time, level, message };
      // 超出上限时丢弃最早的记录，避免长时间运行后列表过长
      setLogs((prev) => (prev.length >= limit ? [...prev.slice(1 - limit), entry] : [...prev, entry]));
    },
    [limit]
  );

  const clear = React.useCallback(() => setLogs([]), []);

  return { logs, log, clear };
}

interface LogViewerProps {
  logs: LogEntry[];
  className?: string;
  emptyText?: string;
}

/** 彩色日志：等宽 11px，自动滚到底部；用户上翻查看时不打断。等级色是 ui-kit 扩展色 --kit-log-*。 */
export function LogViewer({ logs, className, emptyText = "暂无日志" }: LogViewerProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const stickToBottom = React.useRef(true);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
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
        className
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
}
