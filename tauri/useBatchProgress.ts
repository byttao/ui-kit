import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { isTauri } from "@tauri-apps/api/core";
import type { BatchProgress } from "../components/app/progress-panel";

/** 完成后进度条保留的时间，便于用户看到 100%。 */
const HIDE_DELAY_MS = 2500;

/**
 * 订阅 Rust 端推送的批处理进度事件。
 *
 * Rust 端约定：
 *   app.emit("xxx-progress", ProgressEvent { current, total, file_name, percent, stage })
 * 命令本身用 async + spawn_blocking 执行，避免阻塞主线程。
 *
 * onFileStart：每张文件第一次出现时回调一次，常用来写日志。
 */
export function useBatchProgress(eventName: string, onFileStart?: (event: BatchProgress) => void) {
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const active = useRef(false);
  const lastIndex = useRef(-1);
  const hideTimer = useRef<number | undefined>(undefined);
  const onFileStartRef = useRef(onFileStart);
  onFileStartRef.current = onFileStart;

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    listen<BatchProgress>(eventName, (event) => {
      // 任务结束后才到达的事件直接丢弃，避免进度条回退
      if (!active.current) return;
      setProgress(event.payload);
      if (event.payload.current !== lastIndex.current) {
        lastIndex.current = event.payload.current;
        onFileStartRef.current?.(event.payload);
      }
    })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unlisten?.();
      window.clearTimeout(hideTimer.current);
    };
  }, [eventName]);

  /** 开始一批任务，立即显示 0%。 */
  const start = useCallback((total: number) => {
    window.clearTimeout(hideTimer.current);
    active.current = true;
    lastIndex.current = -1;
    setProgress({ current: 0, total, file_name: "", percent: 0, stage: "准备中" });
  }, []);

  /** 结束一批任务，展示最终状态后自动隐藏。 */
  const finish = useCallback((stage: string, completed = true) => {
    active.current = false;
    setProgress((prev) =>
      prev
        ? {
            ...prev,
            current: completed ? prev.total : prev.current,
            percent: completed ? 100 : prev.percent,
            stage,
          }
        : null
    );
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setProgress(null), HIDE_DELAY_MS);
  }, []);

  return { progress, start, finish, running: progress !== null && active.current };
}
