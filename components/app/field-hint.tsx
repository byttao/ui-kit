import * as React from "react";
import { ExclamationCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { cn } from "../../lib/cn";

export interface FieldHintProps {
  /** info：补充说明（说明文字色）；warning：依赖其他参数的限制 / 代价提醒（警告文字色） */
  type?: "info" | "warning";
  children: React.ReactNode;
  className?: string;
}

/**
 * 右栏参数区的轻量提示：11px + 小图标，不占 Alert 那么大的块。
 * 放在相关控件正下方（或作为 `Form.Item` 的 `extra`）。只说一件事；需要用户处理的错误用 Form.Item 的
 * `validateStatus` / `help`，整页级的问题用 `<Alert showIcon>`。约定见 design.md「参数提示与警示」。
 *
 * @example
 * <Form.Item label="张数" extra={<FieldHint type="warning">比例为「自动」时不能多合一</FieldHint>}>
 */
export function FieldHint({ type = "info", children, className }: FieldHintProps) {
  const warning = type === "warning";
  return (
    <span
      className={cn(
        "flex items-start gap-1 text-sm",
        warning ? "text-warning-text" : "text-text-tertiary",
        className
      )}
    >
      <span className="mt-[3px] shrink-0 leading-none" aria-hidden>
        {warning ? <ExclamationCircleOutlined /> : <InfoCircleOutlined />}
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}
