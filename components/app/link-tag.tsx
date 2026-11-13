import * as React from "react";
import { Tag, type TagProps } from "antd";
import { cn } from "../../lib/cn";

export interface LinkTagProps extends Omit<TagProps, "onClick" | "role" | "tabIndex"> {
  /** 点击 / 回车 / 空格时调用（跳转、定位） */
  onClick?: () => void;
  /** 目标已不存在（如原记录已删除）：置灰、不可点，文案自己写清原因 */
  disabled?: boolean;
  /** 读屏文字，默认取 children 的文本；图标型标签必须传 */
  "aria-label"?: string;
}

/**
 * 可点击的标签：既表达状态 / 关系，又能点击跳转（如「改自 #7」「来自 3 张参考图」）。
 * 基于 antd Tag（规则 1：不自写按钮），补齐按钮语义：role="button"、可聚焦、回车 / 空格触发、悬停主色描边。
 * 只用于「跳转 / 定位」；会改数据的操作仍用 antd Button。
 *
 * @example
 * <LinkTag icon={<BranchesOutlined />} onClick={() => jumpTo(parent.id)}>改自 #{parent.number}</LinkTag>
 * <LinkTag icon={<BranchesOutlined />} disabled>改自已删除的任务</LinkTag>
 */
export function LinkTag({ onClick, disabled, className, variant = "outlined", children, ...props }: LinkTagProps) {
  if (disabled || !onClick) {
    return (
      <Tag variant={variant} className={cn(disabled && "text-text-tertiary", className)} {...props}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag
      variant={variant}
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-pointer transition-colors duration-fast hover:border-primary hover:text-primary-text",
        className
      )}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
