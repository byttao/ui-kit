import * as React from "react";
import { Typography } from "antd";
import { cn } from "../../lib/cn";

export interface SettingsSectionProps {
  /** 分区标题（antd h5，14px） */
  title: React.ReactNode;
  /** 标题下一行说明（11px 说明文字） */
  description?: React.ReactNode;
  /** 标题右侧的操作（如「恢复默认」link 按钮） */
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * 设置页的表单分区：标题 + 说明 + 若干 Form.Item，分区之间一条分隔线。
 * 放在 `SettingsScroll` 里，外面包 `<Form layout="vertical" component="div">`。排版规范见 design.md「设置页」。
 *
 * @example
 * <SettingsSection title="接口" description="测试连接不会扣费">
 *   <Form.Item label="API Key"><Input.Password /></Form.Item>
 * </SettingsSection>
 */
export function SettingsSection({ title, description, extra, children, className }: SettingsSectionProps) {
  return (
    <section className={cn("flex flex-col gap-3 border-b pb-5 last:border-b-0 last:pb-0", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography.Title level={5} className="m-0">
            {title}
          </Typography.Title>
          {description && <div className="mt-0.5 text-sm text-text-tertiary">{description}</div>}
        </div>
        {extra && <div className="flex shrink-0 items-center gap-2">{extra}</div>}
      </div>
      {children}
    </section>
  );
}

export interface SettingsScrollProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 表单内容最大宽度，默认 640px（长表单不铺满宽屏） */
  maxWidth?: number;
}

/**
 * 长表单滚动容器：放在 `<Panel fill className="flex-1">` 里，占满卡片剩余高度并自己滚动；
 * 内容纵向排布、分区间距 20px，并去掉 antd Form.Item 的默认下边距（间距由分区统一控制）。
 * 与 ListWell 的区别：没有描边和底色，是表单而不是列表。
 */
export function SettingsScroll({ maxWidth = 640, className, children, ...props }: SettingsScrollProps) {
  return (
    <div className={cn("-mr-2 min-h-0 flex-1 overflow-y-auto pr-2", className)} {...props}>
      <div
        className="flex flex-col gap-5 [&_.ant-form-item]:mb-0"
        // 最大宽度是调用方参数，只能用内联 style
        style={{ maxWidth }}
      >
        {children}
      </div>
    </div>
  );
}
