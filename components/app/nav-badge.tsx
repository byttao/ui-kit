import { cn } from "../../lib/cn";

export interface NavBadgeProps {
  /** 数字；0 或未传时不渲染（除非 showZero） */
  count?: number;
  /** 超过时显示「99+」 */
  max?: number;
  showZero?: boolean;
  /**
   * accent：反色块（侧栏文字色做底、侧栏底色写字，与品牌标记同一规则），表示「需要注意 / 进行中」；
   * muted：纯数字（继承菜单项文字色，悬停 / 选中时跟着变），表示「数量统计」。
   */
  tone?: "accent" | "muted";
  className?: string;
}

/**
 * 侧栏导航徽标，传给 `NavItem.badge`。
 * 不用 antd Badge 的默认红色：红色是危险语义，不该表示「进行中」；也不用主色：侧栏本身可能就是主色。
 * 反色块在 7 个主题、深浅侧栏、选中 / 悬停底上都可读（已纳入 check:contrast）。
 *
 * @example
 * nav={[
 *   { key: "generate", label: "出图", badge: <NavBadge count={running} /> },
 *   { key: "gallery", label: "图库", badge: <NavBadge count={total} tone="muted" /> },
 * ]}
 */
export function NavBadge({ count = 0, max = 99, showZero, tone = "accent", className }: NavBadgeProps) {
  if (!count && !showZero) return null;
  const text = count > max ? `${max}+` : String(count);
  if (tone === "muted") {
    // 继承菜单项颜色：分组标题色（sidebar-muted）在悬停 / 选中底上不到 4.5:1
    return <span className={cn("shrink-0 text-sm tabular-nums text-inherit", className)}>{text}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-sidebar-active-text px-1 text-sm font-strong leading-none tabular-nums text-sidebar",
        className
      )}
    >
      {text}
    </span>
  );
}
