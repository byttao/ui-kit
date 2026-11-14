import * as React from "react";
import { Collapse, Tag, Typography } from "antd";
import { cn } from "../../lib/cn";
import { ScrollArea } from "./scroll-area";

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
  /** 「下面还有内容」提示，默认开启；见 ScrollArea */
  moreHint?: boolean | React.ReactNode;
}

/**
 * 长表单滚动容器：放在 `<Panel fill className="flex-1">` 里，占满卡片剩余高度并自己滚动；
 * 内容纵向排布、分区间距 20px，并去掉 antd Form.Item 的默认下边距（间距由分区统一控制）。
 * 与 ListWell 的区别：没有描边和底色，是表单而不是列表。
 *
 * - 内容超出且没滚到底时，底部浮一个「下面还有」小按钮（`moreHint={false}` 关闭）。
 * - ref 指向滚动容器：`ref.current?.querySelector("#控件id")?.closest(".ant-form-item")?.scrollIntoView({ behavior: "smooth" })` 滚到某个字段（id 给控件本身，antd Form.Item 不把 id 落到 DOM）。
 */
export const SettingsScroll = React.forwardRef<HTMLDivElement, SettingsScrollProps>(function SettingsScroll(
  { maxWidth = 640, moreHint = true, className, children, ...props },
  ref
) {
  return (
    <ScrollArea ref={ref} moreHint={moreHint} className={cn("-mr-2 pr-2", className)} {...props}>
      <div
        className="flex flex-col gap-5 [&_.ant-form-item]:mb-0"
        // 最大宽度是调用方参数，只能用内联 style
        style={{ maxWidth }}
      >
        {children}
      </div>
    </ScrollArea>
  );
});

export interface AdvancedSectionProps {
  /** 折叠标题，默认「高级」 */
  title?: React.ReactNode;
  /** 已偏离默认值的项数：> 0 时标题旁显示「已改 N 项」，折叠着也看得出有改动 */
  changedCount?: number;
  /** 标题右侧的操作（如「恢复默认」link 按钮），点击不会触发折叠 */
  extra?: React.ReactNode;
  /** 默认是否展开，默认 false */
  defaultOpen?: boolean;
  /** 受控展开 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * 「高级」折叠区：把低频参数收起来（antd Collapse ghost）。
 * 标题与内容都与上下的 Form.Item 左对齐（去掉了 Collapse 的左右内边距，不需要 `-mx-3`），
 * 内容区的 Form.Item 间距与 SettingsSection 一致。约定见 design.md「高级折叠」。
 *
 * @example
 * <AdvancedSection changedCount={changed} extra={<Button type="link" size="small" onClick={reset}>恢复默认</Button>}>
 *   <Form.Item label="背景">…</Form.Item>
 *   <Form.Item label="输出格式">…</Form.Item>
 * </AdvancedSection>
 */
export function AdvancedSection({
  title = "高级",
  changedCount = 0,
  extra,
  defaultOpen = false,
  open,
  onOpenChange,
  children,
  className,
}: AdvancedSectionProps) {
  const [innerOpen, setInnerOpen] = React.useState(defaultOpen);
  const expanded = open ?? innerOpen;
  return (
    <Collapse
      ghost
      size="small"
      className={className}
      activeKey={expanded ? ["advanced"] : []}
      onChange={(keys) => {
        const next = (Array.isArray(keys) ? keys : [keys]).includes("advanced");
        if (open === undefined) setInnerOpen(next);
        onOpenChange?.(next);
      }}
      classNames={{ header: "!px-0 !py-1", body: "!px-0 !pb-0 !pt-2", title: "font-strong" }}
      items={[
        {
          key: "advanced",
          label: (
            <span className="flex items-center gap-2">
              {title}
              {changedCount > 0 && (
                <Tag className="m-0" variant="filled">
                  已改 {changedCount} 项
                </Tag>
              )}
            </span>
          ),
          extra: extra ? (
            <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
              {extra}
            </span>
          ) : undefined,
          children: <div className="flex flex-col gap-3 [&_.ant-form-item]:mb-0">{children}</div>,
        },
      ]}
    />
  );
}
