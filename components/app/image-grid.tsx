import * as React from "react";
import { FileImageOutlined } from "@ant-design/icons";
import { Image } from "antd";
import { cn } from "../../lib/cn";
import { localImageSrc } from "./thumb";

export interface ImageGridItem {
  /** 唯一键（通常就是文件路径） */
  key: string;
  /** 本地路径或 http / data 地址 */
  path: string;
  /** 替代文字；也作为悬停提示的第一行 */
  alt?: string;
  /** 瓦片上的角标（如「#12」「2 / 4」），用 `<ImageBadge>`；位置见 badgePlacement */
  badge?: React.ReactNode;
}

export interface ImageGridProps {
  items: ImageGridItem[];
  /** 当前选中的 key（受控）；不传则不显示选中态 */
  selectedKey?: string | null;
  /** 单击 / 空格 / 回车选中 */
  onSelect?: (key: string) => void;
  /** 每格最小宽度，默认 148px；格子按 auto-fill 铺满一行 */
  minTileWidth?: number;
  /** 瓦片宽高比（宽 / 高），默认 1（方形，居中裁切） */
  ratio?: number;
  /** 双击打开大图预览（Image.PreviewGroup，可左右翻页；翻页时同步选中）。默认开启 */
  preview?: boolean;
  /** 受控预览：外部按钮打开时传入；不传则由组件自己管理 */
  previewIndex?: number | null;
  onPreviewIndexChange?: (index: number | null) => void;
  /** 角标位置，默认 bottom-left（1.3.0 行为）；编号类角标建议 top-left */
  badgePlacement?: "top-left" | "bottom-left";
  /** selectedKey 变化时把选中瓦片滚到可见范围（外部定位跳转用），默认开启 */
  scrollToSelected?: boolean;
  className?: string;
}

/**
 * 图片网格：可选中的图片瓦片，双击看大图，大图里左右翻页时同步选中。用在图库、结果页。
 *
 * 瓦片是原生 `<button>`：antd 没有「可选中的图片卡片」，这属于 design.md「可选中卡片」的例外
 * （与 ThemePicker、DropZone 相同），焦点框、选中态、悬停态都按 token 写好了。
 *
 * @example
 * const [selected, setSelected] = useState<string | null>(null);
 * <ListWell className="p-3">
 *   <ImageGrid items={items} selectedKey={selected} onSelect={setSelected} />
 * </ListWell>
 */
export function ImageGrid({
  items,
  selectedKey,
  onSelect,
  minTileWidth = 148,
  ratio = 1,
  preview = true,
  previewIndex,
  onPreviewIndexChange,
  badgePlacement = "bottom-left",
  scrollToSelected = true,
  className,
}: ImageGridProps) {
  const listRef = React.useRef<HTMLUListElement>(null);
  // 选中项变化（含外部跳转）时滚到可见；用 data-key 查找，不依赖每个瓦片的 ref
  React.useEffect(() => {
    if (!scrollToSelected || selectedKey == null) return;
    const tile = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-key]") ?? [])].find(
      (el) => el.dataset.key === selectedKey
    );
    tile?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedKey, scrollToSelected]);
  const [innerIndex, setInnerIndex] = React.useState<number | null>(null);
  const controlled = previewIndex !== undefined;
  const current = controlled ? previewIndex : innerIndex;
  const setCurrent = (index: number | null) => {
    if (!controlled) setInnerIndex(index);
    onPreviewIndexChange?.(index);
  };
  const [broken, setBroken] = React.useState<Set<string>>(() => new Set());

  const sources = React.useMemo(() => items.map((item) => localImageSrc(item.path)), [items]);

  return (
    <>
      <ul
        ref={listRef}
        className={cn("m-0 grid list-none gap-3 p-0", className)}
        // 列宽与比例是调用方给的数据，只能用内联 style
        style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))` }}
      >
        {items.map((item, index) => {
          const selected = selectedKey === item.key;
          return (
            <li key={item.key} data-key={item.key} className="relative">
              <button
                type="button"
                aria-pressed={onSelect ? selected : undefined}
                aria-label={item.alt}
                title={[item.alt, preview ? "双击查看大图" : ""].filter(Boolean).join("\n") || undefined}
                onClick={() => onSelect?.(item.key)}
                onDoubleClick={() => preview && setCurrent(index)}
                className={cn(
                  "block w-full overflow-hidden rounded-lg border-2 bg-fill-alter p-0 transition-colors duration-fast",
                  selected ? "border-primary" : "border-transparent hover:border-primary-border-hover"
                )}
                style={{ aspectRatio: String(ratio) }}
              >
                {broken.has(item.key) ? (
                  <span className="grid size-full place-items-center text-h4 text-text-tertiary">
                    <FileImageOutlined />
                  </span>
                ) : (
                  <img
                    src={sources[index]}
                    alt={item.alt ?? ""}
                    loading="lazy"
                    draggable={false}
                    onError={() => setBroken((prev) => new Set(prev).add(item.key))}
                    className="size-full object-cover"
                  />
                )}
              </button>
              {item.badge && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-1.5",
                    badgePlacement === "top-left" ? "top-1.5" : "bottom-1.5"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {preview && (
        <Image.PreviewGroup
          items={sources}
          preview={{
            open: current !== null,
            current: current ?? 0,
            onOpenChange: (open) => !open && setCurrent(null),
            onChange: (next) => {
              setCurrent(next);
              const key = items[next]?.key;
              if (key) onSelect?.(key);
            },
          }}
        />
      )}
    </>
  );
}
