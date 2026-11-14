import * as React from "react";
import { DownOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { cn } from "../../lib/cn";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * 「下面还有内容」提示：内容超出且没滚到底时，底部居中浮一个小按钮，点击向下滚一屏。
   * true（默认）显示「下面还有」；传 ReactNode 自定义文字；false 关闭。
   */
  moreHint?: boolean | React.ReactNode;
  /** 外层（不滚动的那一层）的 className；className 作用在滚动容器上 */
  rootClassName?: string;
}

/**
 * 纵向滚动区：撑满父容器剩余高度、自己滚动，并在「下面还有内容」时给出提示。
 * ref 指向滚动容器本身，可用来滚到某个字段：
 *
 * @example
 * const scroller = useRef<HTMLDivElement>(null);
 * const jump = () => scroller.current?.querySelector("#field-ratio")?.scrollIntoView({ block: "start", behavior: "smooth" });
 * <ScrollArea ref={scroller}>…</ScrollArea>
 *
 * 提示用 antd 小按钮（实底、带描边），毛玻璃和深浅主题下都看得清；不做渐隐遮罩（玻璃面上渐隐色对不上底色）。
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
    // 容器尺寸变化（窗口缩放）与内容高度变化（折叠展开、条件字段）都要重新判断
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

  const hint = moreHint === true ? "下面还有" : moreHint;

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", rootClassName)}>
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
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center">
          <Button
            size="small"
            shape="round"
            icon={<DownOutlined />}
            className="pointer-events-auto shadow-secondary"
            onClick={() => {
              const el = ref.current;
              el?.scrollBy({ top: el.clientHeight * 0.8, behavior: "smooth" });
            }}
          >
            {hint}
          </Button>
        </div>
      )}
    </div>
  );
});
