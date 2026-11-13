import { useCallback, useEffect, useRef, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * 多任务队列的前端约定（与批处理 useBatchProgress 并列）。
 *
 * 适用：任务各自独立、可并发、可排队 / 取消 / 重试（AI 出图、下载、转码队列……），
 * 每个任务有自己的状态与进度，界面是一张「任务列表」而不是一个总进度条。
 *
 * Rust 端约定（见 AI_GUIDE「多任务队列」）：
 *   - `list_tasks` 命令返回全部任务（启动时恢复的也在内）；
 *   - 任务任何字段变化时 `app.emit("task-updated", &task)`，推整条任务（不是增量）；
 *   - 删除时 `app.emit("task-removed", &ids)`，推被删任务的 id 数组；
 *   - 任务至少带 `id`；状态建议用 queued / running / succeeded / failed / cancelled，
 *     界面用 `StatusTag` 显示（running → processing，succeeded → success，failed → error）。
 */
export interface UseTaskEventsOptions<T> {
  /** 初次加载：默认 `invoke<T[]>("list_tasks")` */
  load?: () => Promise<T[]>;
  /** 任务变化事件名，默认 "task-updated"，payload 是整条任务 */
  updatedEvent?: string;
  /** 任务删除事件名，默认 "task-removed"，payload 是 id 数组 */
  removedEvent?: string;
  /** 取任务 id，默认 `task.id` */
  getId?: (task: T) => string;
  /** 列表排序（如按创建时间倒序）；不传则保持「加载顺序 + 新任务追加在末尾」 */
  sort?: (a: T, b: T) => number;
}

/**
 * 订阅 Rust 推送的任务变更事件，维护一份任务列表。
 * 先订阅再加载：加载期间到达的事件会在加载完成后合并进去，不会丢更新、也不会被旧数据覆盖。
 * 在浏览器里（非 Tauri）不订阅、不加载，返回空列表，便于 demo 与测试。
 *
 * @example
 * const { tasks, loaded, reload } = useTaskEvents<Task>({ sort: (a, b) => b.createdAt - a.createdAt });
 * const running = tasks.filter((t) => t.status === "running").length;
 */
export function useTaskEvents<T>(options: UseTaskEventsOptions<T> = {}) {
  const {
    load,
    updatedEvent = "task-updated",
    removedEvent = "task-removed",
    getId = (task: T) => (task as { id: string }).id,
    sort,
  } = options;
  const [tasks, setTasks] = useState<T[]>([]);
  const [loaded, setLoaded] = useState(false);
  // 回调放进 ref：调用方传内联函数时不必 useCallback，也不会反复重订阅
  const fns = useRef({ load, getId, sort });
  fns.current = { load, getId, sort };

  const upsert = useCallback((list: T[], task: T) => {
    const id = fns.current.getId(task);
    const index = list.findIndex((t) => fns.current.getId(t) === id);
    const next = index < 0 ? [...list, task] : list.map((t, i) => (i === index ? task : t));
    return fns.current.sort ? next.sort(fns.current.sort) : next;
  }, []);

  const fetchAll = useCallback(async () => {
    const loader = fns.current.load ?? (() => invoke<T[]>("list_tasks"));
    const list = await loader();
    return fns.current.sort ? [...list].sort(fns.current.sort) : list;
  }, []);

  /** 重新从 Rust 拉一次全量（例如切换数据目录后） */
  const reload = useCallback(async () => {
    const list = await fetchAll();
    setTasks(list);
    setLoaded(true);
    return list;
  }, [fetchAll]);

  useEffect(() => {
    if (!isTauri()) {
      setLoaded(true);
      return;
    }
    let disposed = false;
    let ready = false;
    // 加载完成前到达的事件先记下，加载完再按顺序应用
    const pending: Array<{ type: "updated"; task: T } | { type: "removed"; ids: string[] }> = [];
    const unlisteners: Array<() => void> = [];
    const keep = (fn: () => void) => (disposed ? fn() : unlisteners.push(fn));

    const applyRemoved = (list: T[], ids: string[]) => {
      const removed = new Set(ids);
      return list.filter((t) => !removed.has(fns.current.getId(t)));
    };

    const subscribed = Promise.all([
      listen<T>(updatedEvent, ({ payload }) => {
        if (!ready) pending.push({ type: "updated", task: payload });
        else setTasks((prev) => upsert(prev, payload));
      }).then(keep),
      listen<string[]>(removedEvent, ({ payload }) => {
        if (!ready) pending.push({ type: "removed", ids: payload });
        else setTasks((prev) => applyRemoved(prev, payload));
      }).then(keep),
    ]);

    subscribed
      .then(fetchAll)
      .then((list) => {
        if (disposed) return;
        let next = list;
        for (const event of pending) next = event.type === "updated" ? upsert(next, event.task) : applyRemoved(next, event.ids);
        pending.length = 0;
        ready = true;
        setTasks(next);
      })
      .catch((err) => {
        // 加载失败也把已收到的事件放进列表，之后的事件照常更新
        let next: T[] = [];
        for (const event of pending) next = event.type === "updated" ? upsert(next, event.task) : applyRemoved(next, event.ids);
        pending.length = 0;
        ready = true;
        if (!disposed) setTasks(next);
        console.error("[ui-kit] useTaskEvents 加载任务失败：", err);
      })
      .finally(() => !disposed && setLoaded(true));

    return () => {
      disposed = true;
      unlisteners.forEach((fn) => fn());
    };
  }, [updatedEvent, removedEvent, fetchAll, upsert]);

  return { tasks, loaded, setTasks, reload };
}
