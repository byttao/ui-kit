import * as React from "react";
import { InboxOutlined } from "@ant-design/icons";
import { Empty } from "antd";
import { cn } from "../../lib/cn";

export interface EmptyStateProps {
  /** 大图标，默认 InboxOutlined；用说明文字色（tertiary），不要用 quaternary（只给禁用态） */
  icon?: React.ReactNode;
  /** 主文案（正文色） */
  title?: React.ReactNode;
  /** 引导说明（说明文字色） */
  description?: React.ReactNode;
  /** 操作按钮：引导去设置、添加文件……通常一个 `<Button>`，最多再加一个 link 按钮 */
  action?: React.ReactNode;
  /** small：嵌在列表 / 卡片里；default：占满整块区域的大号空状态 */
  size?: "default" | "small";
  className?: string;
}

/**
 * 空状态 / 缺配置引导：图标 + 文案 + 操作按钮。基于 antd Empty。
 * 只有一句话、不需要操作时，直接用 `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="…" />`。
 *
 * @example
 * <EmptyState
 *   icon={<KeyOutlined />}
 *   title="还没有填写 API Key"
 *   description="填好后就可以开始出图"
 *   action={<Button onClick={goSettings}>去设置</Button>}
 * />
 */
export function EmptyState({ icon = <InboxOutlined />, title, description, action, size = "default", className }: EmptyStateProps) {
  const small = size === "small";
  return (
    <Empty
      className={cn("m-0 flex flex-col items-center", small ? "py-6" : "py-12", className)}
      classNames={{ image: cn("mb-3 h-auto", small ? "text-h3" : "text-h1"), description: "flex flex-col items-center gap-1" }}
      image={<span className="leading-none text-text-tertiary">{icon}</span>}
      description={
        title || description ? (
          <>
            {title && <span className={cn("text-text", small ? "text-base" : "text-lg")}>{title}</span>}
            {description && <span className="max-w-[360px] text-text-tertiary">{description}</span>}
          </>
        ) : null
      }
    >
      {action && <div className="flex items-center justify-center gap-2">{action}</div>}
    </Empty>
  );
}
