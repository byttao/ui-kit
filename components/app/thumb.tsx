import * as React from "react";
import { CloseOutlined, FileImageOutlined, LoadingOutlined } from "@ant-design/icons";
import { Button, Image, Tooltip } from "antd";
import { convertFileSrc, isTauri } from "@tauri-apps/api/core";
import { cn } from "../../lib/cn";
import { fileName } from "./file-list";

/**
 * 本地文件路径 → 可显示的图片地址。Tauri 里走 asset 协议（convertFileSrc），
 * 浏览器预览（demo、单元测试）里原样返回，方便传网络图或 data URL。
 * 依赖 tauri.conf 的 assetProtocol 与 CSP（见 tauri/tauri.conf.snippet.json），以及
 * Cargo.toml 里 tauri 的 features = ["protocol-asset"]。
 */
export function localImageSrc(path: string) {
  if (/^(https?:|data:|blob:|asset:)/.test(path)) return path;
  return isTauri() ? convertFileSrc(path) : path;
}

const BOX = {
  xs: "size-6",
  sm: "size-10",
  md: "size-16",
  lg: "size-24",
  fill: "w-full",
} as const;

export type ThumbSize = keyof typeof BOX;

export interface ThumbProps {
  /** 本地文件路径（经 convertFileSrc 显示）；也可以直接给 http / data / blob 地址。没有时显示占位图标 */
  path?: string;
  /** 尺寸：xs 24 / sm 40 / md 64 / lg 96 方框；fill 撑满父容器宽度，高度由 ratio 决定 */
  size?: ThumbSize;
  /** 固定宽高比（宽 / 高，如 16 / 9）；不传时 xs–lg 为正方形，fill 为 1:1 */
  ratio?: number;
  /** cover：居中裁切铺满（缩略图默认）；contain：完整显示（详情大图） */
  fit?: "cover" | "contain";
  /** 生成中 / 下载中：占位图标换成加载动画 */
  loading?: boolean;
  /** 点击缩略图打开 antd 大图预览；放在 Image.PreviewGroup 里时可以左右翻页 */
  preview?: boolean;
  /** 受控打开预览（例如行尾的「预览」按钮） */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  alt?: string;
  className?: string;
}

/**
 * 本地图缩略图：antd Image + 加载 / 失败占位 + 固定比例裁切 + 受控预览。
 * 占位图标用说明文字色（text-tertiary），不用 quaternary（只给禁用态）。
 *
 * @example
 * <Thumb path={file} size="md" />                                   // 64px 方形，点开预览
 * <Thumb path={file} size="fill" ratio={4 / 3} fit="contain" preview={false} />
 * <Thumb path={file} size="md" open={open} onOpenChange={setOpen} />  // 外部按钮打开预览
 */
export function Thumb({
  path,
  size = "md",
  ratio,
  fit = "cover",
  loading,
  preview = true,
  open,
  onOpenChange,
  alt = "",
  className,
}: ThumbProps) {
  const [failed, setFailed] = React.useState(false);
  // 换图后重新尝试加载
  React.useEffect(() => setFailed(false), [path]);

  const square = ratio === undefined;
  const box = cn(
    "relative block shrink-0 overflow-hidden rounded border bg-fill-alter",
    BOX[size],
    square && "aspect-square",
    className
  );
  // 宽高比是运行时数据，只能用内联 style（design.md「内联 style 的例外」）
  const style = square ? undefined : { aspectRatio: String(ratio) };

  if (!path || failed) {
    return (
      <span
        className={cn(box, "grid place-items-center text-text-tertiary", size === "xs" || size === "sm" ? "text-lg" : "text-h4")}
        style={style}
        role="img"
        aria-label={loading ? "加载中" : failed ? "图片无法显示" : "暂无图片"}
      >
        {loading ? <LoadingOutlined /> : <FileImageOutlined />}
      </span>
    );
  }

  const controlled = open !== undefined;
  return (
    <span className={box} style={style}>
      <Image
        src={localImageSrc(path)}
        alt={alt}
        classNames={{
          root: "block size-full",
          image: cn("size-full", fit === "cover" ? "object-cover" : "object-contain"),
        }}
        onError={() => setFailed(true)}
        preview={preview ? (controlled ? { open, onOpenChange } : true) : false}
      />
    </span>
  );
}

export interface ThumbItem {
  /** 唯一键；不传时用 path */
  key?: string;
  path: string;
  alt?: string;
  /** 图下常显的说明（如编号「#12-1」、尺寸），11px 说明文字色，单行截断 */
  caption?: React.ReactNode;
  /** 图片左上角的角标（如序号），用 `<ImageBadge>`，见 design.md「图片上的角标」 */
  badge?: React.ReactNode;
}

export interface ThumbStripProps {
  /** 图片路径或 { key, path, alt } */
  items: (string | ThumbItem)[];
  /** 缩略图尺寸，默认 sm（40px）；columns 模式下忽略，按格宽撑满 */
  size?: Exclude<ThumbSize, "fill">;
  /** 按列数排成网格（如参考图墙 4 列）；不传时排成一行，超出换行 */
  columns?: number;
  /** 传了就在每张右上角显示「移除」角标 */
  onRemove?: (key: string) => void;
  /** 点开大图并可左右翻页（Image.PreviewGroup），默认开启 */
  preview?: boolean;
  /** 悬停显示文件名 */
  showName?: boolean;
  /** cover（默认）居中裁切；contain 完整显示（长条图、比例差异大的一组图） */
  fit?: "cover" | "contain";
  className?: string;
}

/**
 * 小缩略图条 / 缩略图墙：一排（或 N 列）本地图，可预览翻页、可带移除角标、图下说明、左上角标。
 * 用在任务行的「拆切后各张」、右栏的「参考图」等位置。
 *
 * @example
 * <ThumbStrip items={task.files} />                                   // 一排 40px
 * <ThumbStrip items={refs} columns={4} onRemove={removeRef} showName />  // 参考图墙
 * <ThumbStrip items={parts.map((p, i) => ({ path: p, caption: `#${n}-${i + 1}` }))} />  // 常显编号
 */
export function ThumbStrip({
  items,
  size = "sm",
  columns,
  onRemove,
  preview = true,
  showName,
  fit = "cover",
  className,
}: ThumbStripProps) {
  if (!items.length) return null;
  const list = items.map((item) => (typeof item === "string" ? { key: item, path: item } : { key: item.key ?? item.path, ...item }));
  const grid = columns !== undefined;
  const content = (
    <ul
      className={cn("m-0 list-none p-0", grid ? "grid gap-2" : "flex flex-wrap gap-1.5", className)}
      // 列数是调用方给的数据，只能用内联 style
      style={grid ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined}
    >
      {list.map((item, i) => {
        const name = item.alt ?? fileName(item.path);
        const thumb = (
          <Thumb
            path={item.path}
            size={grid ? "fill" : size}
            fit={fit}
            alt={name || `第 ${i + 1} 张`}
            preview={preview}
          />
        );
        return (
          <li key={item.key} className={cn("relative", item.caption !== undefined && "flex min-w-0 flex-col items-center gap-0.5")}>
            {showName ? (
              <Tooltip title={name}>
                <span className={cn("block", grid && "w-full")}>{thumb}</span>
              </Tooltip>
            ) : (
              thumb
            )}
            {item.badge && <span className="pointer-events-none absolute left-1 top-1">{item.badge}</span>}
            {item.caption !== undefined && (
              <span className="max-w-full truncate text-sm tabular-nums text-text-tertiary">{item.caption}</span>
            )}
            {onRemove && (
              <Tooltip title="移除">
                <Button
                  size="small"
                  shape="circle"
                  icon={<CloseOutlined />}
                  aria-label={`移除 ${name}`}
                  className="absolute -right-1.5 -top-1.5 size-5 min-w-0"
                  onClick={() => onRemove(item.key)}
                />
              </Tooltip>
            )}
          </li>
        );
      })}
    </ul>
  );
  return preview ? <Image.PreviewGroup>{content}</Image.PreviewGroup> : content;
}

/**
 * 叠在图片上的角标（编号、张数、模型名）：实底卡片色 + 描边 + 正文色，任意图片、深浅主题下都看得清。
 * 不要用 `bg-spotlight`（深色主题下是浅底，配白字不够）、半透明黑底或主色底（主题可能就是图片的主色）。
 *
 * @example
 * <ImageGrid items={items.map((it) => ({ ...it, badge: <ImageBadge>#{it.number}</ImageBadge> }))} badgePlacement="top-left" />
 */
export function ImageBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border border-border bg-container px-1 text-sm leading-[18px] tabular-nums text-text",
        className
      )}
    >
      {children}
    </span>
  );
}
