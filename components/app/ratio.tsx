import * as React from "react";
import { Select, type SelectProps } from "antd";
import { cn } from "../../lib/cn";

/** 宽高比的几种写法："16:9" / "16x9" / 1.777 / [16, 9]；"auto" 或无法解析时为 null。 */
export type RatioValue = string | number | readonly [number, number];

/** 解析宽高比，返回 [宽, 高]；"auto"、空值或格式不对时返回 null。 */
export function parseRatio(value: RatioValue | null | undefined): [number, number] | null {
  if (value == null) return null;
  if (typeof value === "number") return value > 0 ? [value, 1] : null;
  if (Array.isArray(value)) return value[0] > 0 && value[1] > 0 ? [value[0], value[1]] : null;
  const match = String(value).trim().match(/^(\d+(?:\.\d+)?)\s*[:xX×/]\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const w = Number(match[1]);
  const h = Number(match[2]);
  return w > 0 && h > 0 ? [w, h] : null;
}

export interface RatioIconProps {
  /** 宽高比；"auto" 画虚线方框 */
  ratio: RatioValue;
  /** 图标边长，默认 16px（与 12px 正文同行） */
  size?: number;
  className?: string;
}

/**
 * 比例小图示：按真实宽高比画的矩形（长边固定），用在 Select 选项、Segmented 里。
 * 线条用 currentColor，默认次要文字色；放在选中项里会跟着变色。
 *
 * @example
 * const options = ["1:1", "3:4", "16:9", "auto"].map((r) => ({
 *   value: r,
 *   label: <span className="flex items-center gap-2"><RatioIcon ratio={r} />{r === "auto" ? "自动" : r}</span>,
 * }));
 */
export function RatioIcon({ ratio, size = 16, className }: RatioIconProps) {
  const r = parseRatio(ratio);
  const box = 14;
  const [w, h] = r ? (r[0] >= r[1] ? [box, (box * r[1]) / r[0]] : [(box * r[0]) / r[1], box]) : [box, box];
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={cn("shrink-0 text-text-secondary", className)}
      aria-hidden
    >
      <rect
        x={(16 - Math.max(w, 1.2)) / 2}
        y={(16 - Math.max(h, 1.2)) / 2}
        width={Math.max(w, 1.2)}
        height={Math.max(h, 1.2)}
        rx={1}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeDasharray={r ? undefined : "2 1.5"}
      />
    </svg>
  );
}

export interface RatioPreviewProps {
  /** 整体宽高比（多合一时是合成比例）；"auto" 时显示 autoText */
  ratio: RatioValue;
  /** 宫格列数 / 行数，默认 1 × 1（不画分隔线） */
  cols?: number;
  rows?: number;
  /**
   * 「合成后每格居中裁切」的用法才传：每格实际输出的比例，与格子比例不一致时在格内画出裁切范围。
   * 「整张按 cols × rows 等分拆切」（每格比例就是格子本身）不要传，每张的比例 / 尺寸写进 caption 或 labels。
   */
  cellRatio?: RatioValue;
  /** 格内文字（仅 SVG 文本），默认编号 1…N；传 false 不显示；函数可返回「1 · 1:1」这类说明 */
  labels?: boolean | ((index: number) => React.ReactNode);
  /** 预览框高度，默认 110px；宽度撑满父容器，图形按比例居中 */
  height?: number;
  /** 框下的说明文字（尺寸、张数…），说明文字样式 */
  caption?: React.ReactNode;
  /** ratio 为 auto 时的提示 */
  autoText?: React.ReactNode;
  className?: string;
}

/**
 * 比例预览框：按真实比例画出画布，可画宫格划分与每格的裁切范围。用在右栏参数区（尺寸 / 比例 / 多合一）。
 *
 * 配色约定（示意图类组件通用）：画布 `fill-primary-bg stroke-primary`，分隔线 `stroke-primary` 虚线，
 * 裁切范围 `fill-container`，编号 `fill-primary-text`。全部是 Tailwind 的 fill-* / stroke-* token 类，不写色值。
 * 尺寸靠 SVG 的 viewBox 按比例缩放，不需要内联 style。
 *
 * @example
 * <RatioPreview ratio="16:9" cols={2} rows={2} cellRatio="1:1" caption="2 列 × 2 行 · 每张 1024 × 1024" />
 */
export function RatioPreview({
  ratio,
  cols = 1,
  rows = 1,
  cellRatio,
  labels = true,
  height = 110,
  caption,
  autoText = "比例为「自动」：由生成方决定画面比例。",
  className,
}: RatioPreviewProps) {
  const total = parseRatio(ratio);
  if (!total) {
    return <span className={cn("text-sm text-text-tertiary", className)}>{autoText}</span>;
  }
  const multi = cols * rows > 1;
  const cell = parseRatio(cellRatio ?? null);
  const W = 100;
  const H = (100 * total[1]) / total[0];
  const cw = W / cols;
  const ch = H / rows;
  const stroke = Math.max(W, H) / 120;
  const crop = (c: number, r: number) => {
    if (!cell) return null;
    const target = cell[0] / cell[1];
    if (Math.abs(cw / ch - target) < 0.01) return null;
    const [fw, fh] = cw / ch > target ? [ch * target, ch] : [cw, cw / target];
    return { x: c * cw + (cw - fw) / 2, y: r * ch + (ch - fh) / 2, w: fw, h: fh };
  };
  const cells = Array.from({ length: cols * rows }, (_, i) => ({ c: i % cols, r: Math.floor(i / cols), i }));
  const label = (i: number) => (typeof labels === "function" ? labels(i) : labels ? i + 1 : null);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="grid place-items-center rounded border bg-fill-alter p-2">
        <svg
          viewBox={`${-stroke} ${-stroke} ${W + 2 * stroke} ${H + 2 * stroke}`}
          height={height}
          className="w-full"
          role="img"
          aria-label={`比例预览：${total[0]}:${total[1]}${multi ? `，${cols} 列 ${rows} 行` : ""}`}
        >
          <rect x={0} y={0} width={W} height={H} className="fill-primary-bg stroke-primary" strokeWidth={stroke} />
          {cells.map(({ c, r, i }) => {
            const box = crop(c, r);
            const text = multi || cell ? label(i) : null;
            return (
              <g key={i}>
                {box && (
                  <rect x={box.x} y={box.y} width={box.w} height={box.h} className="fill-container stroke-primary" strokeWidth={stroke * 0.7} />
                )}
                {text !== null && text !== undefined && multi && (
                  <text
                    x={c * cw + cw / 2}
                    y={r * ch + ch / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.min(cw, ch) * 0.32}
                    className="fill-primary-text"
                  >
                    {text}
                  </text>
                )}
              </g>
            );
          })}
          {Array.from({ length: cols - 1 }, (_, k) => (
            <line
              key={`v${k}`}
              x1={(k + 1) * cw}
              y1={0}
              x2={(k + 1) * cw}
              y2={H}
              className="stroke-primary"
              strokeWidth={stroke}
              strokeDasharray={`${stroke * 3} ${stroke * 2}`}
            />
          ))}
          {Array.from({ length: rows - 1 }, (_, k) => (
            <line
              key={`h${k}`}
              x1={0}
              y1={(k + 1) * ch}
              x2={W}
              y2={(k + 1) * ch}
              className="stroke-primary"
              strokeWidth={stroke}
              strokeDasharray={`${stroke * 3} ${stroke * 2}`}
            />
          ))}
        </svg>
      </div>
      {caption && <div className="flex flex-col text-sm text-text-tertiary">{caption}</div>}
    </div>
  );
}

export interface RatioOption {
  /** 比例值："1:1"、"16:9"、"auto" */
  value: string;
  /** 显示名，默认 value（auto 显示「自动」） */
  label?: React.ReactNode;
  /** 尺寸说明，如「1024 × 1024」，排在比例后面（说明文字色）；auto 不显示 */
  size?: React.ReactNode;
  disabled?: boolean;
}

export interface RatioSelectProps
  extends Omit<SelectProps<string>, "options" | "value" | "onChange" | "mode" | "labelRender" | "optionRender"> {
  /** 比例选项：字符串，或带尺寸说明的 { value, label?, size? } */
  options: (string | RatioOption)[];
  value?: string;
  onChange?: (value: string) => void;
  /** auto 的显示名，默认「自动」 */
  autoLabel?: React.ReactNode;
}

/** 比例选项的显示：小图示 + 比例 + 尺寸说明。也可单独用在 Segmented、Radio 里。 */
export function ratioOptionLabel(option: string | RatioOption, autoLabel: React.ReactNode = "自动") {
  const o = typeof option === "string" ? { value: option } : option;
  const auto = !parseRatio(o.value);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <RatioIcon ratio={o.value} />
      <span className="truncate">{o.label ?? (auto ? autoLabel : o.value)}</span>
      {o.size && !auto && <span className="shrink-0 text-text-tertiary">{o.size}</span>}
    </span>
  );
}

/**
 * 比例 / 尺寸选择器：antd Select，每个选项带按真实比例画的小图示与可选的尺寸说明。
 * 配 RatioPreview 放在右栏参数区：上面选、下面看预览。
 *
 * @example
 * <RatioSelect
 *   value={ratio}
 *   onChange={setRatio}
 *   options={[{ value: "auto" }, { value: "1:1", size: "1024 × 1024" }, { value: "16:9", size: "1536 × 864" }]}
 * />
 * <RatioPreview ratio={ratio} caption={`单张 · ${ratio}`} />
 */
export function RatioSelect({ options, value, onChange, autoLabel = "自动", className, ...props }: RatioSelectProps) {
  const items = React.useMemo(
    () =>
      options.map((option) => {
        const o = typeof option === "string" ? { value: option } : option;
        return { value: o.value, disabled: o.disabled, label: ratioOptionLabel(o, autoLabel) };
      }),
    [options, autoLabel]
  );
  return <Select<string> value={value} onChange={onChange} options={items} className={cn("w-full", className)} {...props} />;
}
