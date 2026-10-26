import { useEffect, useRef, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { isTauri } from "@tauri-apps/api/core";

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "bmp", "gif", "webp", "tif", "tiff"];

/** 按扩展名过滤路径，大小写不敏感。 */
export function filterByExtension(paths: string[], extensions: string[] = IMAGE_EXTENSIONS) {
  const allowed = new Set(extensions.map((ext) => ext.toLowerCase().replace(/^\./, "")));
  return paths.filter((path) => {
    const dot = path.lastIndexOf(".");
    return dot >= 0 && allowed.has(path.slice(dot + 1).toLowerCase());
  });
}

interface UseFileDropOptions {
  /** 允许的扩展名，默认常见图片格式 */
  extensions?: string[];
  /** 为 false 时忽略拖入（例如处理中，或当前页不可见） */
  enabled?: boolean;
}

/**
 * 窗口级文件拖拽（Tauri 2）。
 *
 * - 必须用 getCurrentWebview().onDragDropEvent：WebView 里的
 *   HTML5 dataTransfer.files 拿不到本地绝对路径。
 * - 需要 tauri.conf.json 窗口配置 "dragDropEnabled": true（默认即 true）。
 * - Windows 上开启后 HTML5 拖拽 API 失效，二者不能同时用。
 */
export function useFileDrop(onDrop: (paths: string[]) => void, options: UseFileDropOptions = {}) {
  const { extensions = IMAGE_EXTENSIONS, enabled = true } = options;
  const [hovering, setHovering] = useState(false);
  const handler = useRef(onDrop);
  const enabledRef = useRef(enabled);
  const extensionsRef = useRef(extensions);
  handler.current = onDrop;
  enabledRef.current = enabled;
  extensionsRef.current = extensions;

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | undefined;
    let cancelled = false;

    getCurrentWebview()
      .onDragDropEvent((event) => {
        const payload = event.payload;
        if (payload.type === "enter") setHovering(enabledRef.current);
        else if (payload.type === "leave") setHovering(false);
        else if (payload.type === "drop") {
          setHovering(false);
          if (!enabledRef.current) return;
          const paths = filterByExtension(payload.paths, extensionsRef.current);
          if (paths.length > 0) handler.current(paths);
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
    };
  }, []);

  return { hovering: hovering && enabled };
}
