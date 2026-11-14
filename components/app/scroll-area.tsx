import * as React from "react";
import { DownOutlined } from "@ant-design/icons";
import { cn } from "../../lib/cn";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 「下面还有内容」提示：内容超出且没滚到底时，滚动区**下方**出现一条提示行（细分隔线 + 说明色小字 + 向下箭头），
   * 点击向下滚一屏。提示行占自己的高度、不叠在内容上，也不像表单控件。
   * true（默认）文字为「向下滚动查看更多」；传 ReactNode 自定义文字；false 关闭。
   */
  moreHint?: boolean | React.ReactNode;
  /** 外层（不滚动的那一层）的 className；className 作用在滚动容器上 */
  rootClassName?: string;
}

/** 字段锚点的 data 属性名：`<ScrollField name>` 渲染 `data-kit-field="name"` */
export const FIELD_ATTR = "data-kit-field";

/**
 * 在滚动容器里滚到某个字段（`<ScrollField name="…">` 包住的那一块），字段顶部对齐容器顶部。
 * 不依赖 antd 内部类名。找不到时返回 false。
 *
 * @example
 * scrollToField(scrollerRef.current, "ratio");
 */
export function scrollToField(container: HTMLElement | null | undefined, name: string, behavior: ScrollBehavior = "smooth") {
  if (!container) return false;
  const target = Array.from(container.querySelectorAll<HTMLElement>(`[${FIELD_ATTR}]`)).find(
    (el) => el.getAttribute(FIELD_ATTR) === name
  );
  if (!target) return false;
  // 只滚这个容器（不用 scrollIntoView：它会连带滚动外层）
  const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  container.scrollTo({ top: Math.max(0, top - 4), behavior });
  return true;
}

/**
 * 按字段滚动：返回给 `SettingsScroll` / `ScrollArea` 用的 ref，和 `scrollToField(name)`。
 *
 * @example
 * const fields = useFieldScroll();
 * <Panel extra={<Button type="link" size="small" onClick={() => fields.scrollToField("ratio")}>比例与张数</Button>}>
 *   <SettingsScroll ref={fields.ref}>
 *     <ScrollField name="ratio"><Form.Item label="比例">…</Form.Item></ScrollField>
 *   </SettingsScroll>
 * </Panel>
 */
export function useFieldScroll() {
  const ref = React.useRef<HTMLDivElement>(null);
  const scroll = React.useCallback((name: string, behavior: ScrollBehavior = "smooth") => scrollToField(ref.current, name, behavior), []);
  return { ref, scrollToField: scroll };
}

/**
 * 字段锚点：包住一个或几个表单项，给 `scrollToField(name)` 定位用。
 * 里面的表单项纵向排布，间距默认 20px（与 SettingsScroll 顶层一致）；放在 SettingsSection 里时传 `className="gap-3"`（12px）。
 */
export function ScrollField({ name, className, children }: { name: string; className?: string; children: React.ReactNode }) {
  return (
    <div {...{ [FIELD_ATTR]: name }} className={cn("flex flex-col gap-5", className)}>
      {children}
    </div>
  );
}

/**
 * 纵向滚动区：撑满父容器剩余高度、自己滚动，并在「下面还有内容」时于下方给出提示行。
 * ref 指向滚动容器本身；滚到某个字段用 `ScrollField` + `scrollToField` / `useFieldScroll`。
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { moreHint = true, rootClassName, className, children, onScroll, ...props },
  forwardedRef
) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement);
  const [more, setMore] = React.useState(false);

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 留 8px 余量：滚到「差不多到底」就不再提示
    setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || moreHint === false) return;
    measure();
    // 容器尺寸变化（窗口缩放、提示行出现 / 消失）与内容高度变化（折叠展开、条件字段）都要重新判断
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of Array.from(el.children)) observer.observe(child);
    const mutations = new MutationObserver(() => {
      for (const child of Array.from(el.children)) observer.observe(child);
      measure();
    });
    mutations.observe(el, { childList: true });
    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [measure, moreHint]);

  const hint = moreHint === true ? "向下滚动查看更多" : moreHint;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", rootClassName)}>
      <div
        ref={ref}
        onScroll={(e) => {
          if (moreHint !== false) measure();
          onScroll?.(e);
        }}
        className={cn("min-h-0 flex-1 overflow-y-auto", className)}
        {...props}
      >
        {children}
      </div>
      {moreHint !== false && more && (
        // 提示行在滚动区下方、占自己的高度：不盖住任何内容；样式是分隔线 + 说明色小字，不像表单控件。
        // 键盘用户用 Tab 进入滚动区即可滚动，这一行只是鼠标的快捷入口，所以不进 Tab 顺序
        <div
          role="presentation"
          tabIndex={-1}
          onClick={() => {
            const el = ref.current;
            el?.scrollBy({ top: el.clientHeight * 0.8, behavior: "smooth" });
          }}
          className="flex h-6 shrink-0 cursor-pointer select-none items-center justify-center gap-1 border-t border-dashed text-sm text-text-tertiary transition-colors duration-fast hover:text-text-secondary"
        >
          <span>{hint}</span>
          <DownOutlined aria-hidden className="text-[10px]" />
        </div>
      )}
    </div>
  );
});
