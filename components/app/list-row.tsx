import * as React from "react";
import { cn } from "../../lib/cn";
import { FILE_ROW_ERROR_CLASS, FailedMark } from "./file-list";

export interface ListRowProps extends Omit<React.LiHTMLAttributes<HTMLLIElement>, "title"> {
  /** 序号，右对齐等宽数字 */
  index?: number;
  /** 行首槽：缩略图（`<Thumb size="md" />`）、图标、头像 */
  leading?: React.ReactNode;
  /** 第一行：标题。纯文字会单行截断；需要悬停看全文时传 `<Typography.Text strong ellipsis={{ tooltip }}>` */
  title?: React.ReactNode;
  /** 标题下的一行元信息：状态 Tag、参数、时间等，自动换行 */
  meta?: React.ReactNode;
  /** 第二行以后的内容：进度条、报错文字、缩略图条（`<ThumbStrip />`）…… */
  extra?: React.ReactNode;
  /** 行尾操作区：图标按钮（`type="text" size="small"`），约定见 design.md「行尾操作」 */
  trailing?: React.ReactNode;
  /** error：处理失败，整行次级危险样式；行内 antd 文字与中性 Tag 继承红字，状态 Tag 保留语义色 */
  status?: "error";
  /** 失败行行尾的标记文字；传 false 不显示（行里已有「失败」状态 Tag 时） */
  failedLabel?: string | false;
  /** 选中（键盘 / 点击选择的当前行） */
  selected?: boolean;
  /** 定位高亮：例如从别处「定位到这条」时，主色内描边并滚动到可见范围 */
  highlight?: boolean;
  /** 竖直对齐：多行内容默认顶对齐；单行行高时用 center */
  align?: "start" | "center";
}

/**
 * 富列表行：序号 + 行首缩略图 + 标题 / 元信息 / 附加内容 + 行尾操作，高度随内容。
 * 放在 `ListWell` 里的 `<ul className="m-0 list-none p-0">` 中使用。
 * 纯文件名的长列表仍用更轻的 `FileRow`（32px 单行）；要列、排序、筛选时用 antd `Table`。
 *
 * @example
 * <ListRow
 *   leading={<Thumb path={task.file} size="md" />}
 *   title={task.prompt}
 *   meta={<><StatusTag status="success" /><Tag variant="filled">GPT</Tag></>}
 *   extra={<Progress percent={40} size="small" showInfo={false} />}
 *   trailing={<Button type="text" size="small" icon={<EyeOutlined />} aria-label="预览" />}
 *   status={failed ? "error" : undefined}
 * />
 */
export const ListRow = React.forwardRef<HTMLLIElement, ListRowProps>(function ListRow(
  {
    index,
    leading,
    title,
    meta,
    extra,
    trailing,
    status,
    failedLabel = "失败",
    selected,
    highlight,
    align = "start",
    className,
    children,
    ...props
  },
  forwardedRef
) {
  const failed = status === "error";
  const ref = React.useRef<HTMLLIElement>(null);
  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLLIElement);

  // 定位高亮时滚到可见范围（只在变成 true 的那一刻）
  React.useEffect(() => {
    if (highlight) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlight]);

  return (
    <li
      ref={ref}
      aria-selected={selected}
      className={cn(
        "flex gap-3 border-b px-3 py-2.5 last:border-b-0",
        align === "center" ? "items-center" : "items-start",
        props.onClick && "cursor-pointer transition-colors duration-fast hover:bg-item-hover",
        failed && FILE_ROW_ERROR_CLASS,
        selected && "bg-item-active hover:bg-item-active",
        highlight && "kit-row-highlight",
        className
      )}
      {...props}
    >
      {index !== undefined && (
        <span
          className={cn(
            "w-6 shrink-0 text-right tabular-nums",
            align === "start" && "leading-[22px]",
            !failed && (selected ? "text-primary-text" : "text-text-tertiary")
          )}
        >
          {index}
        </span>
      )}
      {leading && <span className="shrink-0">{leading}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title !== undefined &&
          (typeof title === "string" ? (
            <span className="truncate font-strong" title={title}>
              {title}
            </span>
          ) : (
            title
          ))}
        {meta && (
          <div className={cn("flex flex-wrap items-center gap-x-1 gap-y-1 text-sm", !failed && "text-text-tertiary")}>
            {meta}
          </div>
        )}
        {extra}
        {children}
      </div>
      {(trailing || (failed && failedLabel)) && (
        <div className="flex shrink-0 items-center gap-1">
          {failed && failedLabel && <FailedMark label={failedLabel} />}
          {trailing}
        </div>
      )}
    </li>
  );
});

/** 定位高亮的推荐时长：够用户看清是哪一行，又不会一直占着描边。 */
export const ROW_FLASH_MS = 2000;

/**
 * 「定位并闪一下」：跳到某条记录时调用 `flash(key)`，行在 `duration` 毫秒内 `highlight`，之后自动取消。
 * ListRow 在 highlight 变成 true 时会 scrollIntoView，所以不需要另写滚动。
 *
 * - 连续 flash 同一个 key 会重新闪（先取消再在下一帧设上）。
 * - 目标在另一页（`hidden` 常驻的页面）时：先切页，再 flash —— flash 内部等 50ms，页面已可见，滚动才生效。
 * - 图库瓦片用 `ImageGrid` 的 `selectedKey`（自带滚到可见），不需要这个 hook。
 *
 * @example
 * const { flashKey, flash } = useRowFlash();
 * const jumpTo = (id: string) => { setPage("queue"); flash(id); };
 * <ListRow key={t.id} highlight={flashKey === t.id} … />
 */
export function useRowFlash(duration = ROW_FLASH_MS) {
  const [flashKey, setFlashKey] = React.useState<string | null>(null);
  const timer = React.useRef<number | undefined>(undefined);
  const defer = React.useRef<number | undefined>(undefined);

  React.useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      window.clearTimeout(defer.current);
    },
    []
  );

  const flash = React.useCallback(
    (key: string) => {
      window.clearTimeout(timer.current);
      window.clearTimeout(defer.current);
      setFlashKey(null);
      // 稍等片刻：让「先切页再定位」时目标已经可见，也让同一 key 的重复定位能重新触发滚动。
      // 用 setTimeout 而不是 requestAnimationFrame：窗口在后台时 rAF 会被暂停
      defer.current = window.setTimeout(() => {
        setFlashKey(key);
        timer.current = window.setTimeout(() => setFlashKey(null), duration);
      }, 50);
    },
    [duration]
  );

  const clear = React.useCallback(() => {
    window.clearTimeout(timer.current);
    setFlashKey(null);
  }, []);

  return { flashKey, flash, clear };
}
