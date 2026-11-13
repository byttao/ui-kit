/**
 * WCAG 对比度计算。antd 的中性色是 rgba 透明色，必须先叠到背景上再算。
 * 只解析 antd token 实际会出现的两种写法：#rgb / #rrggbb(aa) 与 rgb()/rgba()。
 */

type RGBA = [number, number, number, number];

export function parseColor(input: string): RGBA {
  const value = input.trim().toLowerCase();
  if (value.startsWith("#")) {
    let hex = value.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join("");
    const n = (i: number) => parseInt(hex.slice(i, i + 2), 16);
    return [n(0), n(2), n(4), hex.length === 8 ? n(6) / 255 : 1];
  }
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`无法解析颜色：${input}`);
  const parts = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return [parts[0], parts[1], parts[2], parts[3] ?? 1];
}

/** 把半透明前景叠到不透明背景上。 */
export function composite(fg: string, bg: string): RGBA {
  const [r, g, b, a] = parseColor(fg);
  const [br, bgG, bb] = parseColor(bg);
  return [r * a + br * (1 - a), g * a + bgG * (1 - a), b * a + bb * (1 - a), 1];
}

function luminance([r, g, b]: RGBA) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * fg 叠在 bg 上的对比度。bg 本身也可以是半透明色，此时再给 base 作为最底层。
 */
export function contrast(fg: string, bg: string, base = "#ffffff") {
  const solidBg = composite(bg, base);
  const solidBgStr = `rgb(${solidBg[0]}, ${solidBg[1]}, ${solidBg[2]})`;
  const front = luminance(composite(fg, solidBgStr));
  const back = luminance(solidBg);
  const [hi, lo] = front > back ? [front, back] : [back, front];
  return (hi + 0.05) / (lo + 0.05);
}

function oklab(color: string) {
  const [r, g, b] = parseColor(color).map((c, i) => {
    if (i === 3) return c;
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** 不透明色 → OKLCH：[明度 L 0–1, 彩度 C, 色相 h 0–360]。 */
export function toOklch(color: string): [number, number, number] {
  const [L, a, b] = oklab(color);
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

/**
 * OKLCH → #rrggbb。超出 sRGB 色域时逐步降低彩度（保持明度与色相），
 * 用来从主题色推出「同色相、低彩度」的表面色。
 */
export function fromOklch(L: number, C: number, h: number): string {
  const rad = (h * Math.PI) / 180;
  const toRgb = (chroma: number) => {
    const a = chroma * Math.cos(rad);
    const b = chroma * Math.sin(rad);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  let chroma = C;
  let rgb = toRgb(chroma);
  while (chroma > 0 && rgb.some((c) => c < -1e-4 || c > 1 + 1e-4)) {
    chroma = Math.max(0, chroma - 0.002);
    rgb = toRgb(chroma);
  }
  const encode = (c: number) => {
    const v = Math.min(1, Math.max(0, c));
    const s = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.round(s * 255).toString(16).padStart(2, "0");
  };
  return `#${rgb.map(encode).join("")}`;
}

/**
 * 两色的感知差异（OKLab 距离 × 100）。经验值：< 10 并排时容易看混，> 15 一眼可分。
 * 用来检查主色与功能色是否拉得开，只接受不透明色。
 */
export function deltaE(a: string, b: string) {
  const x = oklab(a);
  const y = oklab(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100;
}
