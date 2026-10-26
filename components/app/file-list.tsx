import * as React from "react";
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
  /** 行尾操作或附加信息 */
  trailing?: React.ReactNode;
}

/**
 * 文件行：32px 高，序号 + 截断文件名 + 行尾。
 * 几百行的纯文件名列表用它（比 antd Table 轻）；需要列、排序、筛选时换 antd Table。
 */
export function FileRow({ index, selected, trailing, className, children, ...props }: FileRowProps) {
  return (
    <li
      aria-selected={selected}
      className={cn(
        "flex h-8 items-center gap-2 border-b px-3 last:border-b-0",
        props.onClick && "cursor-pointer transition-colors duration-fast hover:bg-item-hover",
        selected && "bg-item-active hover:bg-item-active",
        className
      )}
      {...props}
    >
      {index !== undefined && (
        <span
          className={cn(
            "w-6 shrink-0 text-right tabular-nums",
            selected ? "text-primary-text" : "text-text-tertiary"
          )}
        >
          {index}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing}
    </li>
  );
}

/** 从路径取文件名，兼容 Windows 分隔符。 */
export function fileName(path: string) {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}
