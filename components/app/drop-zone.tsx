import * as React from "react";
import { CloudUploadOutlined } from "@ant-design/icons";
import { cn } from "../../lib/cn";

interface DropZoneProps {
  /** 是否有文件正悬停在窗口上（来自 useFileDrop） */
  active: boolean;
  /** 点击后打开文件选择框 */
  onBrowse: () => void;
  title?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** 紧凑型：列表已有内容时缩成一行 */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * 拖拽区：虚线框 + 点击选择，外观对齐 antd Upload.Dragger。
 * 不直接用 Upload.Dragger：它读 HTML5 dataTransfer，在 Tauri 里拿不到本地路径。
 * 真正的文件路径由窗口级 Tauri 事件提供（见 tauri/useFileDrop），
 * 这里只负责视觉与“点击选择”入口，所以拖到窗口任何位置都能生效。
 */
export function DropZone({
  active,
  onBrowse,
  title = "拖入图片，或点击选择文件",
  hint,
  icon = <CloudUploadOutlined />,
  compact,
  disabled,
  className,
}: DropZoneProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onBrowse}
      className={cn(
        "flex w-full shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-center",
        "transition-colors duration-mid disabled:cursor-not-allowed disabled:opacity-50",
        compact ? "flex-row gap-2 px-4 py-2.5" : "px-4 py-7",
        active
          ? "border-primary bg-primary-bg"
          : "border-border bg-fill-alter enabled:hover:border-primary-hover",
        className
      )}
    >
      <span className={cn("leading-none text-primary", compact ? "text-lg" : "text-h2")}>{icon}</span>
      <span className={cn("text-text", compact ? "text-base" : "text-lg")}>
        {active ? "松开即可添加" : title}
      </span>
      {hint && !compact && <span className="text-sm text-text-tertiary">{hint}</span>}
    </button>
  );
}
