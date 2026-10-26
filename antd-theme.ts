/**
 * ui-kit · antd 主题规范（唯一的 token 来源）
 *
 * 按 antd 定制主题的结构组织（https://ant.design/docs/react/customize-theme-cn）：
 *
 *   第 1 层 · Seed    主题 = 一个交互主色种子 + 一组配色；功能色固定为 antd 红 / 金 / 绿 / 蓝
 *                     + 字号 12、字体栈、文字基色
 *   第 2 层 · 算法    defaultAlgorithm / darkAlgorithm（不叠 compactAlgorithm）
 *   第 3 层 · Map     种子经 antd 色板生成算法（@ant-design/colors 的 generate）展开成 10 档，
 *                     按固定档位规则写入 colorXxx / Hover / Active / Bg / Border / Text
 *   第 4 层 · 组件    Layout / Menu（侧栏随主题）、Tag、Tabs、Button 等只在组件作用域里覆盖
 *
 * 色板来源（https://ant.design/docs/spec/colors-cn）：antd 预设主题用官方色板的主色作种子，
 * generate(主色) 与官方色板逐档一致；自定义主题用配色里的一个颜色作种子，走同一个生成算法。
 *
 * 档位规则（ui-kit 补充，保证 12px 小字 ≥ 4.5:1）：
 *   浅色实心色：第 6 档起，取第一个白字 ≥ 4.5:1 的档位；悬停 / 按下再深一档、两档。
 *   深色实心色：种子从浅色色板第 6 档起往浅处取，取第一个经 darkAlgorithm 推导后能直接当文字用的档位；
 *              白字不达标时实心块上用深色字，悬停 / 按下朝远离文字色的方向走。
 *   彩色文字：从实心档起，取第一个在卡片和浅底上都 ≥ 4.5:1 的档位。
 *
 * 配色（swatches）不直接做交互色：马卡龙、莫兰迪这类浅色做按钮底时，白字、勾选框、焦点框都不达标。
 * 它们用在侧栏、毛玻璃背景和品牌标记上；交互主色取种子按档位规则推出的可读档位。
 */
import { generate, presetPalettes } from "@ant-design/colors";
import { theme as antdTheme, type ThemeConfig } from "antd";
import { composite, contrast, deltaE } from "./lib/contrast";

export type Resolved = "light" | "dark";
/** theme：侧栏用主题色；light：浅色侧栏（主题色浅底）。深色模式下始终是主题色侧栏。 */
export type SidebarStyle = "theme" | "light";

export interface ThemeDef {
  label: string;
  /** antd：官方色板；custom：自定义配色 */
  source: "antd" | "custom";
  /** 主题配色，用于侧栏、毛玻璃背景、品牌标记与主题选择器的色块 */
  swatches: readonly string[];
  /** 交互主色种子；深浅可分开指定（低明度种子在深色下推不出可读色时用） */
  primary: string | { light: string; dark: string };
  /** 侧栏底色（浅色模式）；深色模式下自动压暗 */
  sidebar: string;
  /** 适用场景 / 取舍说明 */
  note: string;
}

const geekblue = presetPalettes.geekblue;
const purple = presetPalettes.purple;
const cyan = presetPalettes.cyan;

/**
 * 主题。antd 预设只留与功能色拉得开的冷色；自定义主题按给定配色搭，
 * 与功能色区分度不足的会在审计里给出警告，并在 note 里写明。
 */
export const THEMES = {
  geekblue: {
    label: "极客蓝",
    source: "antd",
    swatches: [geekblue[5], geekblue[3], "#19283C", geekblue[1], presetPalettes.purple[3]],
    primary: geekblue[5],
    // 集诚工具箱的深蓝墨色侧栏，不用色板第 9 档的饱和深蓝
    sidebar: "#19283C",
    note: "antd 官方色板 geekblue，侧栏为深蓝墨色",
  },
  purple: {
    label: "酱紫",
    source: "antd",
    swatches: [purple[5], purple[3], purple[8], purple[1], presetPalettes.magenta[2]],
    primary: purple[5],
    sidebar: purple[8],
    note: "antd 官方色板 purple；深色下与危险色 ΔE≈12，勉强可分",
  },
  cyan: {
    label: "明青",
    source: "antd",
    swatches: [cyan[5], cyan[3], cyan[8], cyan[1], presetPalettes.blue[2]],
    primary: cyan[5],
    sidebar: cyan[8],
    note: "antd 官方色板 cyan",
  },
  forest: {
    label: "森翠雅韵",
    source: "custom",
    swatches: ["#3A5F3B", "#2E8B57", "#228B22", "#6B8E23", "#8B4513"],
    // #3A5F3B 本身就能压白字；深色下它推不出可读色，改用同组的 #2E8B57
    primary: { light: "#3A5F3B", dark: "#2E8B57" },
    sidebar: "#3A5F3B",
    note: "默认主题。主色与「成功」绿同色系，区分度不足：成功状态务必带图标",
  },
  gold: {
    label: "辉煌金韵",
    source: "custom",
    swatches: ["#FFD700", "#FFC0CB", "#FFDAB9", "#DAA520", "#B8860B"],
    primary: "#FFD700",
    sidebar: "#B8860B",
    note: "主色与「警告」金同色系，区分度不足：警告状态务必带图标",
  },
  morandi: {
    label: "莫兰迪色彩",
    source: "custom",
    swatches: ["#D4B9B9", "#A8B6C4", "#B8C4B0", "#C2B2C2", "#E8D9B9"],
    primary: "#A8B6C4",
    sidebar: "#A8B6C4",
    note: "低饱和灰调；交互主色取灰蓝 #A8B6C4 的深档",
  },
  macaron: {
    label: "马卡龙色彩",
    source: "custom",
    swatches: ["#FFB6C1", "#FF69B4", "#FFD700", "#FFA07A", "#FFDAB9"],
    primary: "#FF69B4",
    sidebar: "#FFB6C1",
    note: "主色与「危险」红相近，区分度不足：危险操作必须遵守 design.md 的用法约束",
  },
} as const satisfies Record<string, ThemeDef>;

export type Accent = keyof typeof THEMES;
/** 默认外观：森翠雅韵、浅色、浅色侧栏、开启毛玻璃。ThemeProvider、theme-init.js、demo 共用。 */
export const DEFAULTS = {
  accent: "forest",
  mode: "light",
  sidebar: "light",
  glass: true,
} as const satisfies { accent: Accent; mode: "light" | "dark" | "system"; sidebar: SidebarStyle; glass: boolean };

export const DEFAULT_ACCENT: Accent = DEFAULTS.accent;

/** 功能色：规范要求一个产品内保持一致，不随主题变化。值是 antd 官方色板的主色。 */
export const FUNCTIONAL = {
  Success: presetPalettes.green.primary!,
  Warning: presetPalettes.gold.primary!,
  Error: presetPalettes.red.primary!,
  Info: presetPalettes.blue.primary!,
} as const;

const FONT_FAMILY =
  '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';
const FONT_FAMILY_CODE = 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

const WHITE = "#ffffff";
/** 深色字：深色模式下浅色实心块上的文字、浅色侧栏上的文字 */
const INK = "#0f1621";
/** 留 0.1 余量，避免取整后卡在 4.5 线上 */
const AA = 4.6;

/** 表面与中性色（Map 覆盖）。中性色仍是 antd 的透明度写法，只换基色。 */
const SURFACES = {
  light: {
    colorTextBase: "#1d2c40", // 墨色，不是纯黑
    colorBgLayout: "#f4f6fa", // 画布略带冷调
    colorBorder: "#d5dce6", // 与冷调画布配套；antd 默认是中性灰 #d9d9d9 / #f0f0f0
    colorBorderSecondary: "#e5eaf1",
  },
  dark: {
    // 不用 colorBgBase 推导：darkAlgorithm 会把任何带色相的底色推得过饱和
    colorTextBase: "#e6edf7",
    colorBgLayout: "#151d29",
    colorBgContainer: "#1d2735",
    colorBgElevated: "#243042",
    colorBorder: "#3a4b61",
    colorBorderSecondary: "#2b3a4d",
    colorSplit: "rgba(230, 237, 247, 0.08)",
  },
} as const;

/**
 * 文字透明度：antd 的 tertiary（0.45）用于说明文字，12px 下只有约 3.3:1，
 * 提到在卡片、画布、日志底、表头底上都 ≥ 4.5:1 的档位。quaternary 只用于禁用态。
 */
const TEXT_ALPHA = {
  light: { primary: 0.88, secondary: 0.78, tertiary: 0.68 },
  dark: { primary: 0.85, secondary: 0.74, tertiary: 0.6 },
} as const;

/**
 * 毛玻璃。浅色是设计稿原值；深色下白色 20% 会把卡片顶成灰色、文字发虚，
 * 换成同结构的低透明度版本。背景由 glassBackdrop() 用主题配色生成。
 */
export const GLASS = {
  light: {
    background: "rgba(255, 255, 255, 0.2)",
    border: "rgba(255, 255, 255, 0.3)",
    shadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
    // 内嵌玻璃：卡片里的列表、表格。比卡片更实，承载密集文字；不再叠模糊（嵌套的 backdrop-filter 只会重复模糊外层）
    inset: "rgba(255, 255, 255, 0.45)",
    insetBorder: "rgba(255, 255, 255, 0.55)",
    // 吸顶表头要挡住滚到下面的行，接近不透明
    insetHeader: "rgba(255, 255, 255, 0.82)",
  },
  dark: {
    background: "rgba(255, 255, 255, 0.06)",
    border: "rgba(255, 255, 255, 0.12)",
    shadow: "0 4px 30px rgba(0, 0, 0, 0.35)",
    // 深色下内嵌层往下沉（压暗）而不是往上浮：白色会抬亮底色，彩色文字掉到 4.1:1
    inset: "rgba(0, 0, 0, 0.12)",
    insetBorder: "rgba(255, 255, 255, 0.1)",
    insetHeader: "rgba(29, 39, 53, 0.88)",
  },
  blur: "blur(16px) saturate(180%)",
  radius: 16,
} as const;

// ── 颜色工具 ────────────────────────────────────────────────────────────

/** 两色按 weight（b 的占比 0–1）混合，只接受 #rrggbb。 */
export function mix(a: string, b: string, weight: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const channel = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - weight) + ((pb >> shift) & 255) * weight);
  return `#${[16, 8, 0].map((sh) => channel(sh).toString(16).padStart(2, "0")).join("")}`;
}

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const c = [16, 8, 0].map((sh) => {
    const v = ((n >> sh) & 255) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

const lightPalette = (seed: string) => generate(seed);
/** 与 antd darkAlgorithm 相同的推导（已逐色板验证结果一致）。 */
const deriveDark = (seed: string) => generate(seed, { theme: "dark", backgroundColor: "#141414" });

// ── 色板档位规则 ────────────────────────────────────────────────────────

/** 一组语义色在某个模式下的完整取值。 */
export interface FamilyColors {
  /** 交给 antd 的种子 */
  seed: string;
  /** 实心色所在档（1–10）；深色下是种子在浅色色板中的档位 */
  step: number;
  solid: string;
  hover: string;
  active: string;
  /** 实心块上的文字色 */
  onSolid: string;
  text: string;
  textHover: string;
  bg: string;
  bgHover: string;
  border: string;
  borderHover: string;
}

/**
 * 深色种子：浅色色板第 6 档起往浅处找，取第一个推导结果在卡片上 ≥ 4.5:1 的档位；
 * 都不行（低明度、低饱和种子）时再把第 1 档逐步与白色混合。
 */
function darkSeed(seed: string) {
  const card = SURFACES.dark.colorBgContainer;
  const light = lightPalette(seed);
  for (let k = 5; k >= 0; k--) {
    const palette = deriveDark(light[k]);
    if (contrast(palette[5], card) >= AA) return { seed: light[k], step: k + 1, palette };
  }
  for (let w = 0.1; w < 1; w += 0.1) {
    const candidate = mix(light[0], WHITE, w);
    const palette = deriveDark(candidate);
    if (contrast(palette[5], card) >= AA) return { seed: candidate, step: 1, palette };
  }
  return { seed: WHITE, step: 1, palette: deriveDark(WHITE) };
}

export function familyColors(seed: string, resolved: Resolved): FamilyColors {
  const at = (p: readonly string[], i: number) => p[Math.min(9, Math.max(0, i))];

  if (resolved === "light") {
    const p = lightPalette(seed);
    let s = 5;
    while (s < 9 && contrast(WHITE, p[s]) < AA) s += 1;
    // 低明度种子（如 #3A5F3B）的第 1 档仍是暗色，推不出浅底；改为种子与白色混合
    const tint = luminance(p[0]) < 0.85;
    const light = tint
      ? [0.92, 0.85, 0.7, 0.55].map((w) => mix(p[s], WHITE, w))
      : [p[0], p[1], p[2], p[3]];
    let t = s;
    while (t < 9 && (contrast(p[t], light[0]) < AA || contrast(p[t], WHITE) < AA)) t += 1;
    return {
      seed: p[s],
      step: s + 1,
      solid: p[s],
      hover: at(p, s + 1),
      active: at(p, s + 2),
      onSolid: WHITE,
      text: p[t],
      textHover: at(p, t + 1),
      bg: light[0],
      bgHover: light[1],
      border: light[2],
      borderHover: light[3],
    };
  }

  const card = SURFACES.dark.colorBgContainer;
  const { seed: dSeed, step, palette: p } = darkSeed(seed);
  const s = 5;
  const onSolid = contrast(WHITE, p[s]) >= AA ? WHITE : INK;
  // 白字时变暗、深色字时变亮，保证悬停 / 按下对比度只升不降
  const dir = onSolid === WHITE ? -1 : 1;
  let t = s;
  while (t < 9 && (contrast(p[t], card) < AA || contrast(p[t], p[0]) < AA)) t += 1;
  return {
    seed: dSeed,
    step,
    solid: p[s],
    hover: at(p, s + dir),
    active: at(p, s + dir * 2),
    onSolid,
    text: p[t],
    textHover: at(p, t + 1),
    bg: p[0],
    bgHover: p[1],
    border: p[2],
    borderHover: p[3],
  };
}

/** FamilyColors → antd Map token（colorPrimary* / colorSuccess* …）。 */
function familyTokens(prefix: string, f: FamilyColors): Record<string, string> {
  return {
    [`color${prefix}Hover`]: f.hover,
    [`color${prefix}Active`]: f.active,
    [`color${prefix}Text`]: f.text,
    [`color${prefix}TextHover`]: f.textHover,
    [`color${prefix}TextActive`]: f.textHover,
    [`color${prefix}Bg`]: f.bg,
    [`color${prefix}BgHover`]: f.bgHover,
    [`color${prefix}Border`]: f.border,
    [`color${prefix}BorderHover`]: f.borderHover,
  };
}

export function primarySeed(accent: Accent, resolved: Resolved): string {
  const primary: ThemeDef["primary"] = THEMES[accent].primary;
  return typeof primary === "string" ? primary : primary[resolved];
}

export function primaryColors(accent: Accent, resolved: Resolved) {
  return familyColors(primarySeed(accent, resolved), resolved);
}

export function functionalColors(resolved: Resolved) {
  return Object.fromEntries(
    Object.entries(FUNCTIONAL).map(([prefix, seed]) => [prefix, familyColors(seed, resolved)])
  ) as Record<keyof typeof FUNCTIONAL, FamilyColors>;
}

// ── 侧栏 ────────────────────────────────────────────────────────────────

export interface SidebarColors {
  bg: string;
  text: string;
  muted: string;
  hoverBg: string;
  activeBg: string;
  activeText: string;
  icon: string;
  border: string;
}

/**
 * 从一个底色推出整套侧栏颜色：文字取白 / 深色里对比度高的那个，
 * 再在底色与文字色之间混出悬停、选中、分组标题、分隔线。
 * 底色明度居中（选中底上文字不到 4.5:1）时，把底色往远离文字的方向推。
 */
export function sidebarFrom(base: string, iconSeed: string): SidebarColors {
  const fg = contrast(WHITE, base) >= contrast(INK, base) ? WHITE : INK;
  const away = fg === WHITE ? "#000000" : WHITE;
  let bg = base;
  for (let w = 0.05; w < 1 && contrast(fg, mix(bg, fg, 0.16)) < AA; w += 0.05) bg = mix(base, away, w);
  const pick = (from: number) => {
    let w = from;
    while (w < 1 && contrast(mix(bg, fg, w), bg) < AA) w += 0.02;
    return mix(bg, fg, Math.min(w, 1));
  };
  // 图标：主色色板里第一个在侧栏底和选中底上都 ≥ 3:1 的档（非文字元素），找不到就用文字色
  const palette = lightPalette(iconSeed);
  const order = fg === WHITE ? [3, 2, 4, 1, 5, 0] : [6, 7, 5, 8, 9];
  const activeBg = mix(bg, fg, 0.16);
  const iconStep = order.find((i) => contrast(palette[i], bg) >= 3 && contrast(palette[i], activeBg) >= 3);
  return {
    bg,
    text: pick(0.72),
    muted: pick(0.55),
    hoverBg: mix(bg, fg, 0.08),
    activeBg,
    activeText: fg,
    icon: iconStep === undefined ? pick(0.72) : palette[iconStep],
    border: mix(bg, fg, 0.1),
  };
}

export interface ThemeOptions {
  accent: Accent;
  resolved: Resolved;
  sidebar?: SidebarStyle;
  /** 毛玻璃 */
  glass?: boolean;
  /** 系统开启「减弱动态效果」时为 true，对应 antd 的 token.motion = false */
  reducedMotion?: boolean;
}

/** 侧栏实际用哪一套：深色模式下始终是主题色侧栏。 */
export function sidebarStyle({ resolved, sidebar = "theme" }: ThemeOptions): SidebarStyle {
  return resolved === "dark" ? "theme" : sidebar;
}

export function sidebarColors(options: ThemeOptions): SidebarColors {
  const def: ThemeDef = THEMES[options.accent];
  const seed = primarySeed(options.accent, "light");
  if (sidebarStyle(options) === "light") return sidebarFrom(mix(seed, WHITE, 0.94), seed);
  // 深色模式：主题侧栏色压暗，仍保留色相
  const base = options.resolved === "dark" ? mix(def.sidebar, "#0b0f16", 0.62) : def.sidebar;
  return sidebarFrom(base, seed);
}

// ── 毛玻璃背景 ──────────────────────────────────────────────────────────

/** 背景色块的位置：四角 + 中下，和 swatches 一一对应。 */
const BLOB_POSITIONS = ["0% 0%", "100% 0%", "100% 100%", "0% 100%", "50% 60%"];

/**
 * 毛玻璃的背景色块：主题配色与画布混合。混合比例从 0.45 起逐步加大，
 * 直到色块中心叠上玻璃后，正文、次要、说明、主色文字、链接都 ≥ 4.5:1——
 * 包括卡片玻璃面、内嵌玻璃（列表 / 表格）、吸顶表头、日志底上的说明文字。
 */
export function glassBlobs(accent: Accent, resolved: Resolved): string[] {
  const base = SURFACES[resolved].colorBgLayout;
  const glass = GLASS[resolved].background;
  const textBase = SURFACES[resolved].colorTextBase;
  const alpha = TEXT_ALPHA[resolved];
  const primary = primaryColors(accent, resolved);
  // 深色下 colorLink 与主色同种子，推导结果就是实心色
  const colored = [primary.text, resolved === "dark" ? primary.solid : primary.text];
  const texts = [alpha.primary, alpha.secondary, alpha.tertiary].map((a) => rgba(textBase, a)).concat(colored);
  const swatches: readonly string[] = THEMES[accent].swatches;
  return swatches.map((swatch) => {
    for (let w = 0.45; w <= 1; w += 0.05) {
      const blob = mix(swatch, base, w);
      const surface = flatten(glass, blob);
      // 玻璃上直接写的文字，以及日志底（再叠一层半透明填充）上的说明文字
      const inset = flatten(GLASS[resolved].inset, surface);
      const header = flatten(GLASS[resolved].insetHeader, surface);
      const ok =
        texts.every((fg) => contrast(fg, surface) >= AA && contrast(fg, inset) >= AA) &&
        contrast(rgba(textBase, alpha.secondary), header) >= AA &&
        contrast(rgba(textBase, alpha.tertiary), LOG_FILL[resolved], surface) >= AA;
      if (ok) return blob;
    }
    return base;
  });
}

export function glassBackdrop(accent: Accent, resolved: Resolved) {
  const layers = glassBlobs(accent, resolved).map(
    (c, i) => `radial-gradient(at ${BLOB_POSITIONS[i]}, ${c} 0, transparent 55%)`
  );
  return `${layers.join(", ")}, ${SURFACES[resolved].colorBgLayout}`;
}

// ── ui-kit 扩展色：日志 ─────────────────────────────────────────────────

export interface KitColors {
  logInfo: string;
  logSuccess: string;
  logWarning: string;
  logError: string;
  logProcessing: string;
}

/** 日志等级是分类色，按规范取 antd 预设色板，档位同彩色文字规则。 */
const LOG_SEEDS = {
  logInfo: presetPalettes.blue.primary!,
  logSuccess: presetPalettes.green.primary!,
  logWarning: presetPalettes.orange.primary!,
  logError: presetPalettes.red.primary!,
  logProcessing: presetPalettes.purple.primary!,
} as const;

/** 日志底：fillQuaternary 叠在卡片上的近似值，用来挑日志色档位。 */
const LOG_BG = { light: "#fafbfb", dark: "#212b39" } as const;
/** 日志底（colorFillQuaternary）本身是半透明色 */
const LOG_FILL = { light: "rgba(29, 44, 64, 0.02)", dark: "rgba(230, 237, 247, 0.04)" } as const;

/** 不透明化：把半透明前景叠到背景上，得到 #rrggbb。 */
function flatten(color: string, under: string) {
  const [r, g, b] = composite(color, under);
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * 日志可能出现的所有底色：普通卡片上的日志底；毛玻璃时是「日志底 + 玻璃 + 每个背景色块」。
 * 深色玻璃会把底色抬亮，日志色要在最亮的那一块上也达标。
 */
export function logBackgrounds(options: ThemeOptions): string[] {
  const { resolved } = options;
  if (!options.glass) return [LOG_BG[resolved]];
  const glass = GLASS[resolved].background;
  return glassBlobs(options.accent, resolved).map((blob) => flatten(LOG_FILL[resolved], flatten(glass, blob)));
}

function readableStep(seed: string, resolved: Resolved, backgrounds: string[]) {
  const p = resolved === "light" ? lightPalette(seed) : darkSeed(seed).palette;
  for (let i = 5; i < 10; i++) if (backgrounds.every((bg) => contrast(p[i], bg) >= AA)) return p[i];
  return p[9];
}

export function kitColors(options: ThemeOptions): KitColors {
  const backgrounds = logBackgrounds(options);
  return Object.fromEntries(
    Object.entries(LOG_SEEDS).map(([key, seed]) => [key, readableStep(seed, options.resolved, backgrounds)])
  ) as unknown as KitColors;
}

/** 区分度门槛：主色与功能色的 ΔE 低于它时，并排容易看混。 */
export const DISTANCE_MIN = 12;

/** 主色与功能色的区分度（OKLab ΔE，取深浅两种模式中较小的），审计与主题选择器用。 */
export function themeDistances(accent: Accent) {
  const min = (fn: keyof typeof FUNCTIONAL) =>
    Math.min(
      ...(["light", "dark"] as Resolved[]).map((r) =>
        deltaE(primaryColors(accent, r).solid, functionalColors(r)[fn].solid)
      )
    );
  return { Error: min("Error"), Warning: min("Warning"), Success: min("Success") };
}

// ── 组装 ────────────────────────────────────────────────────────────────

/** 生成 ConfigProvider 的 theme。 */
export function buildTheme(options: ThemeOptions): ThemeConfig {
  const { accent, resolved, glass = false } = options;
  const dark = resolved === "dark";
  const surface = SURFACES[resolved];
  const alpha = TEXT_ALPHA[resolved];
  const side = sidebarColors(options);
  const textSecondary = rgba(surface.colorTextBase, alpha.secondary);
  const textTertiary = rgba(surface.colorTextBase, alpha.tertiary);

  const primary = primaryColors(accent, resolved);
  const functional = functionalColors(resolved);

  return {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    // v6 默认开启 cssVar；显式写出，便于读代码的人知道组件样式走 CSS 变量
    cssVar: { key: "ui-kit" },
    hashed: false,
    token: {
      // ── 第 1 层 · Seed ──
      colorPrimary: primary.seed,
      colorSuccess: functional.Success.seed,
      colorWarning: functional.Warning.seed,
      colorError: functional.Error.seed,
      colorInfo: functional.Info.seed,
      // antd 的链接色默认跟 colorInfo 走；浅色用彩色文字档，深色下和主色同种子即可读
      colorLink: dark ? primary.seed : primary.text,
      fontSize: 12,
      // antd 官方的关闭动效开关；自写元素读 --ant-motion-duration-* 会一起归零
      motion: !options.reducedMotion,
      fontFamily: FONT_FAMILY,
      fontFamilyCode: FONT_FAMILY_CODE,
      ...surface,

      // ── 第 3 层 · Map / Alias 覆盖 ──
      fontSizeSM: 11, // 12px 种子会推出 10px，中文说明文字太小
      colorTextSecondary: textSecondary,
      colorTextTertiary: textTertiary,
      colorTextDescription: textTertiary,
      colorTextPlaceholder: textTertiary,
      ...familyTokens("Primary", primary),
      ...familyTokens("Success", functional.Success),
      ...familyTokens("Warning", functional.Warning),
      ...familyTokens("Error", functional.Error),
      ...familyTokens("Info", functional.Info),
      colorLinkHover: primary.textHover,
      colorLinkActive: primary.textHover,
      colorTextLightSolid: primary.onSolid,
      // 实心块上是深色字时，Tooltip 也换成浅底深字，仍是 antd 的「高对比反色面」
      ...(primary.onSolid === INK ? { colorBgSpotlight: "#dfe6f0" } : {}),
    },

    // ── 第 4 层 · 组件 ──
    components: {
      Button: {
        fontWeight: 500,
        primaryColor: primary.onSolid,
        dangerColor: functional.Error.onSolid,
      },
      Layout: {
        siderBg: side.bg,
        lightSiderBg: side.bg,
        // 毛玻璃时主区透明，露出 body 上的主题色背景
        bodyBg: glass ? "transparent" : surface.colorBgLayout,
        headerBg: dark ? SURFACES.dark.colorBgContainer : WHITE,
      },
      Menu: {
        // 侧栏随主题：两套 Menu 主题都用同一组侧栏色，选中态是底色浅一档，不用整块主色
        darkItemBg: "transparent",
        darkSubMenuItemBg: "transparent",
        darkPopupBg: side.bg,
        darkItemColor: side.text,
        darkItemHoverBg: side.hoverBg,
        darkItemHoverColor: side.activeText,
        darkItemSelectedBg: side.activeBg,
        darkItemSelectedColor: side.activeText,
        darkGroupTitleColor: side.muted,
        itemBg: "transparent",
        subMenuItemBg: "transparent",
        itemColor: side.text,
        itemHoverBg: side.hoverBg,
        itemHoverColor: side.activeText,
        itemSelectedBg: side.activeBg,
        itemSelectedColor: side.activeText,
        itemActiveBg: side.activeBg,
        groupTitleColor: side.muted,
        groupTitleFontSize: 11,
        itemHeight: 36,
        itemMarginInline: 12,
        itemBorderRadius: 8,
        iconSize: 14,
      },
      Card: {
        headerFontSize: 14,
        headerHeight: 48,
        bodyPadding: 20,
      },
      Table: {
        headerColor: textSecondary,
        cellPaddingBlockSM: 6,
      },
      Tag: {
        // Tag 的状态文字直接用 colorSuccess / colorError 等实心色，浅底上不到 4.5:1，
        // 只在 Tag 作用域里换成彩色文字档
        colorSuccess: functional.Success.text,
        colorWarning: functional.Warning.text,
        colorError: functional.Error.text,
        colorInfo: functional.Info.text,
      },
      Tabs: {
        // 选中标签直接用 colorPrimary 写字，统一换成彩色文字档
        itemSelectedColor: primary.text,
        itemHoverColor: primary.textHover,
        itemActiveColor: primary.textHover,
      },
      Image: {
        // 预览浮层是深色遮罩，不能跟着 colorTextLightSolid 变成深字
        previewOperationColor: "rgba(255, 255, 255, 0.85)",
      },
    },
  };
}

/** 解析后的全局 token（不含组件 token）。 */
export function resolveToken(options: ThemeOptions) {
  return antdTheme.getDesignToken(buildTheme(options));
}

/** colorPrimaryBg → color-primary-bg，与 antd cssVar 的命名规则一致。 */
export function toKebab(key: string) {
  return key
    .replace(/([A-Z]+)([A-Z][a-z]+)/g, "$1-$2")
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .toLowerCase();
}

/** 数值 token：这些带 px，其余（行高、字重、透明度、层级）原样输出。 */
const PX_TOKENS = /^(fontSize|borderRadius|controlHeight|lineWidth|padding|margin|size|screen)/;

/**
 * 把 antd token 转成 :root 上的 CSS 变量：--ant-color-primary、--ant-font-size …
 * antd 自己的 cssVar 只挂在组件节点上（.css-var-xxx），页面里自己写的元素读不到，
 * 所以 ThemeProvider 用这份结果再写一遍到 :root。扩展色写成 --kit-*。
 */
export function tokenToCssVars(options: ThemeOptions): Record<string, string> {
  const token = resolveToken(options) as unknown as Record<string, unknown>;
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(token)) {
    const name = `--ant-${toKebab(key)}`;
    if (typeof value === "string") vars[name] = value;
    else if (typeof value === "number") vars[name] = PX_TOKENS.test(key) ? `${value}px` : String(value);
  }
  for (const [key, value] of Object.entries(kitColors(options))) {
    vars[`--kit-${toKebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(sidebarColors(options))) {
    vars[`--kit-sidebar-${toKebab(key)}`] = value;
  }
  const glass = GLASS[options.resolved];
  vars["--kit-glass-bg"] = glass.background;
  vars["--kit-glass-border"] = glass.border;
  vars["--kit-glass-shadow"] = glass.shadow;
  vars["--kit-glass-blur"] = GLASS.blur;
  vars["--kit-glass-radius"] = `${GLASS.radius}px`;
  vars["--kit-glass-inset-bg"] = glass.inset;
  vars["--kit-glass-inset-border"] = glass.insetBorder;
  vars["--kit-glass-inset-header"] = glass.insetHeader;
  vars["--kit-backdrop"] = options.glass ? glassBackdrop(options.accent, options.resolved) : "none";
  return vars;
}
