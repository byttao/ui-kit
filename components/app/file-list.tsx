import * as React from "react";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

/**
 * 列表 / 表格滚动容器：1px 描边、6px 圆角，内容自己滚动。
 * 里面放 FileRow 列表，或 antd Table（配 sticky={{ getContainer }} 让表头吸顶）。
 * 毛玻璃开启时换成内嵌玻璃（半透明底），里面的 antd Table 一起透明。
 */
export const ListWell = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { glass } = useTheme();
    return (
      <div
        ref={ref}
        className={cn(
          "min-h-0 flex-1 overflow-auto rounded border",
          glass ? "kit-glass-inset" : "bg-container",
          className
        )}
        {...props}
      />
    );
  }
);
ListWell.displayName = "ListWell";

interface FileRowProps extends React.LiHTMLAttributes<HTMLLIElement> {
  index?: number;
  selected?: boolean;
  /** error：处理失败，整行用次级危险样式（浅红底 + 红字 + 失败图标），留在列表里便于重试 */
  status?: "error";
  /** 行尾操作或附加信息 */
  trailing?: React.ReactNode;
}

/**
 * 文件行：32px 高，序号 + 截断文件名 + 行尾。
 * 几百行的纯文件名列表用它（比 antd Table 轻）；需要列、排序、筛选时换 antd Table。
 * antd Table 里的失败行用 rowClassName 套 FILE_ROW_ERROR_CLASS，样式一致。
 */
export function FileRow({ index, selected, status, trailing, className, children, ...props }: FileRowProps) {
  const failed = status === "error";
  return (
    <li
      aria-selected={selected}
      className={cn(
        "flex h-8 items-center gap-2 border-b px-3 last:border-b-0",
        props.onClick && "cursor-pointer transition-colors duration-fast hover:bg-item-hover",
        failed && FILE_ROW_ERROR_CLASS,
        selected && "bg-item-active hover:bg-item-active",
        className
      )}
      {...props}
    >
      {index !== undefined && (
        <span
          className={cn(
            "w-6 shrink-0 text-right tabular-nums",
            // 失败行的序号继承整行颜色，悬停时跟着加深
            !failed && (selected ? "text-primary-text" : "text-text-tertiary")
          )}
        >
          {index}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {failed && <FailedMark />}
      {trailing}
    </li>
  );
}

/** 失败行的样式：浅红底 + 红字（与 antd 描边危险按钮同一档）；悬停时底色与文字一起加深一档，保持 ≥ 4.5:1。 */
export const FILE_ROW_ERROR_CLASS =
  "bg-error-bg text-error-text hover:bg-error-bg-hover hover:text-error-text-hover";

/** 失败标记：图标 + 文字，状态不只靠颜色表达。颜色继承所在行（FILE_ROW_ERROR_CLASS）。 */
export function FailedMark({ label = "失败" }: { label?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-sm">
      <CloseCircleOutlined aria-hidden />
      {label}
    </span>
  );
}

/** 从路径取文件名，兼容 Windows 分隔符。 */
export function fileName(path: string) {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}
