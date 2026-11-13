/**
 * 主题审计：
 *   对比度   界面上真实出现的「文字 / 底色」组合，文字 ≥ 4.5:1、图标 ≥ 3:1，不达标即失败。
 *   区分度   主色与「危险 / 警告 / 成功」实心色的 ΔE，< 12 记为警告。
 *   毛玻璃   开启时，卡片、内嵌玻璃（列表 / 表格）、表头、日志的文字叠在「玻璃 + 背景色块」上，逐个色块中心检查。
 * demo 的「对比度」页和 `npm run check:contrast` 共用这份清单。
 * 改 antd-theme.ts 里任何颜色后都要跑一遍。
 */
import {
  DISTANCE_MIN,
  glassColors,
  THEMES,
  buildTheme,
  glassBlobs,
  kitColors,
  logBackgrounds,
  resolveToken,
  sidebarColors,
  type Accent,
  type Resolved,
  type SidebarStyle,
  type ThemeOptions,
} from "../antd-theme";
import { composite, contrast, deltaE } from "./contrast";

export interface AuditRow {
  /** contrast：对比度，不达标即失败；distance：区分度（ΔE），不达标只警告 */
  kind: "contrast" | "distance";
  group: string;
  label: string;
  fg: string;
  bg: string;
  /** 对比度或 ΔE */
  ratio: number;
  /** 文字 4.5；图标等非文字元素 3；区分度 12 */
  min: number;
  pass: boolean;
}

export { DISTANCE_MIN };

/** 半透明底色先叠到所在表面上，避免透明度被当成白色。 */
function solid(color: string, under: string) {
  const [r, g, b] = composite(color, under);
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function auditTheme(options: ThemeOptions): AuditRow[] {
  const t = resolveToken(options);
  const config = buildTheme(options);
  const button = (config.components?.Button ?? {}) as { primaryColor?: string; dangerColor?: string };
  const tag = (config.components?.Tag ?? {}) as Record<string, string | undefined>;
  const kit = kitColors(options);
  const side = sidebarColors(options);
  const rows: AuditRow[] = [];

  /** base：bg 为半透明色时，它下面那一层（默认卡片色） */
  const add = (group: string, label: string, fg: string, bg: string, min = 4.5, base = t.colorBgContainer) => {
    const ratio = contrast(fg, bg, base);
    rows.push({ kind: "contrast", group, label, fg, bg, ratio, min, pass: ratio >= min - 0.005 });
  };
  const distance = (label: string, a: string, b: string) => {
    const ratio = deltaE(a, b);
    rows.push({ kind: "distance", group: "区分度", label, fg: a, bg: b, ratio, min: DISTANCE_MIN, pass: ratio >= DISTANCE_MIN });
  };

  const container = t.colorBgContainer;
  const layout = t.colorBgLayout;
  const fillAlter = solid(t.colorFillAlter, container);
  const logBg = solid(t.colorFillQuaternary, container);

  add("文字", "正文 · 卡片", t.colorText, container);
  add("文字", "正文 · 画布", t.colorText, layout);
  add("文字", "正文 · 浮层", t.colorText, t.colorBgElevated);
  add("文字", "次要 · 卡片", t.colorTextSecondary, container);
  add("文字", "次要 · 画布", t.colorTextSecondary, layout);
  add("文字", "说明 · 卡片", t.colorTextTertiary, container);
  add("文字", "说明 · 画布", t.colorTextTertiary, layout);
  add("文字", "占位符 · 输入框", t.colorTextPlaceholder, container);
  add("文字", "表头 · 表头底", t.colorTextSecondary, fillAlter);
  add("文字", "正文 · 选中行", t.colorText, solid(t.controlItemBgActive, container));
  // 失败行（FileRow status="error" / FILE_ROW_ERROR_CLASS）：红字压在浅红底、悬停底、选中底上
  add("文字", "失败行", t.colorErrorText, t.colorErrorBg);
  add("文字", "失败行 · 悬停", t.colorErrorTextHover, t.colorErrorBgHover);
  add("文字", "失败行 · 选中", t.colorErrorText, solid(t.controlItemBgActive, container));

  // 1.3.0 新组件
  // 中性 Tag（StatusTag 的排队 / 已取消、参数标签）：正文色压在 fillTertiary 叠卡片的底上
  add("组件", "中性标签", t.colorText, solid(t.colorFillTertiary, container));
  // ListRow / FileRow 失败行里的中性 Tag：去底后继承红字，描边换成危险描边（非文字 3:1 不要求，文字同「失败行」）
  add("组件", "失败行 · 中性标签", t.colorErrorText, t.colorErrorBg);
  // Thumb / ImageGrid 的占位图标：说明文字色压在 fillAlter 上（图标 3:1）
  add("组件", "缩略图占位图标", t.colorTextTertiary, solid(t.colorFillAlter, container), 3);
  // ImageGrid 选中描边、RatioPreview 画布描边（非文字 3:1）
  add("组件", "图片瓦片选中描边", t.colorPrimary, container, 3);
  add("组件", "比例预览描边 · 主色浅底", t.colorPrimary, t.colorPrimaryBg, 3);
  add("组件", "比例预览编号 · 主色浅底", t.colorPrimaryText, t.colorPrimaryBg);
  // FieldHint：说明 / 警示文字在卡片上
  add("组件", "参数提示", t.colorTextTertiary, container);
  add("组件", "参数警示", t.colorWarningText, container);
  // 1.4.0：ImageBadge 是实底卡片色 + 正文色（不随图片变化）；LinkTag 悬停是主色文字 + 主色描边；
  // ThumbStrip caption 是说明文字；描边用于把角标从图片上分出来（非文字 3:1 不强制，图片颜色不可控）
  add("组件", "图片角标", t.colorText, container);
  add("组件", "可点击标签 · 悬停", t.colorPrimaryText, container);
  add("组件", "可点击标签 · 不可用", t.colorTextTertiary, container);
  add("组件", "缩略图说明", t.colorTextTertiary, container);

  add("主色", "链接 · 卡片", t.colorLink, container);
  add("主色", "链接 · 悬停", t.colorLinkHover, container);
  add("主色", "主色文字 · 卡片", t.colorPrimaryText, container);
  // Tabs 选中项、分页当前页等直接用 colorPrimary 写字
  add("主色", "主色基础色文字 · 卡片", t.colorPrimary, container);
  add("主色", "主色文字 · 主色浅底", t.colorPrimaryText, t.colorPrimaryBg);
  const onPrimary = button.primaryColor ?? t.colorTextLightSolid;
  add("主色", "主按钮", onPrimary, t.colorPrimary);
  add("主色", "主按钮 · 悬停", onPrimary, t.colorPrimaryHover);
  add("主色", "主按钮 · 按下", onPrimary, t.colorPrimaryActive);

  const onDanger = button.dangerColor ?? t.colorTextLightSolid;
  add("状态", "危险按钮", onDanger, t.colorError);
  add("状态", "危险按钮 · 悬停", onDanger, t.colorErrorHover);
  for (const [name, key] of [
    ["成功", "Success"],
    ["警告", "Warning"],
    ["错误", "Error"],
    ["信息", "Info"],
  ] as const) {
    const text = t[`color${key}Text`];
    const bg = t[`color${key}Bg`];
    add("状态", `${name}文字 · 卡片`, text, container);
    // Tag 的状态文字用的是 colorXxx 基础色（可被 components.Tag 覆盖），不是 colorXxxText
    add("状态", `${name}标签 · 浅底`, tag[`color${key}`] ?? t[`color${key}`], bg);
    // 默认危险按钮、Typography type 等直接用基础色写字
    add("状态", `${name}基础色文字 · 卡片`, t[`color${key}`], container);
    add("状态", `提示条正文 · ${name}浅底`, t.colorText, bg);
  }

  add("浮层", "Tooltip", t.colorTextLightSolid, t.colorBgSpotlight);

  add("侧栏", "导航文字", side.text, side.bg);
  add("侧栏", "分组标题", side.muted, side.bg);
  add("侧栏", "品牌名", side.activeText, side.bg);
  add("侧栏", "悬停", side.activeText, side.hoverBg);
  add("侧栏", "选中", side.activeText, side.activeBg);
  add("侧栏", "图标", side.icon, side.bg, 3);
  add("侧栏", "图标 · 选中", side.icon, side.activeBg, 3);
  // NavBadge：反色块（侧栏文字色做底、侧栏底色写字），块本身在选中底上要看得出（3:1）。
  // 弱徽标（tone="muted"）继承菜单项文字色：常态 = 导航文字，悬停 / 选中 = 品牌名色，已由上面几组覆盖。
  // 不用分组标题色（muted）：它在悬停 / 选中底上只有 3.0–4.3:1。
  add("侧栏", "徽标数字", side.bg, side.activeText);
  add("侧栏", "徽标块 · 选中底", side.activeText, side.activeBg, 3);

  add("日志", "INFO", kit.logInfo, logBg);
  add("日志", "SUCCESS", kit.logSuccess, logBg);
  add("日志", "WARN", kit.logWarning, logBg);
  add("日志", "ERROR", kit.logError, logBg);
  add("日志", "PROCESS", kit.logProcessing, logBg);
  add("日志", "时间戳", t.colorTextTertiary, logBg);

  if (options.glass) {
    // 日志在玻璃卡片里：日志底 + 玻璃 + 背景色块，逐块检查
    logBackgrounds(options).forEach((bg, i) => {
      for (const [label, fg] of [
        ["INFO", kit.logInfo],
        ["SUCCESS", kit.logSuccess],
        ["WARN", kit.logWarning],
        ["ERROR", kit.logError],
        ["PROCESS", kit.logProcessing],
        ["时间戳", t.colorTextTertiary],
      ] as const) {
        add("毛玻璃", `日志 ${label} · 色块 ${i + 1}`, fg, bg);
      }
    });
    // 内嵌玻璃（列表 / 表格）与吸顶表头：再叠一层半透明白
    const g = glassColors(options.accent, options.resolved);
    glassBlobs(options.accent, options.resolved).forEach((blob, i) => {
      const card = composite(g.background, blob);
      const cardHex = `rgb(${card[0]}, ${card[1]}, ${card[2]})`;
      for (const [label, fg] of [
        ["列表正文", t.colorText],
        ["列表序号", t.colorTextTertiary],
        ["列表主色文字", t.colorPrimaryText],
      ] as const) {
        add("毛玻璃", `${label} · 色块 ${i + 1}`, fg, g.inset, 4.5, cardHex);
      }
      add("毛玻璃", `表头 · 色块 ${i + 1}`, t.colorTextSecondary, g.insetHeader, 4.5, cardHex);
    });

    // 玻璃是半透明白，叠在色块上；contrast 的第三个参数是玻璃下面那一层
    const glass = g.background;
    glassBlobs(options.accent, options.resolved).forEach((blob, i) => {
      const at = (fg: string) => contrast(fg, glass, blob);
      for (const [label, fg] of [
        ["正文", t.colorText],
        ["次要", t.colorTextSecondary],
        ["说明", t.colorTextTertiary],
        ["主色文字", t.colorPrimaryText],
        ["链接", t.colorLink],
        ["参数警示", t.colorWarningText],
      ] as const) {
        const ratio = at(fg);
        rows.push({
          kind: "contrast",
          group: "毛玻璃",
          label: `${label} · 色块 ${i + 1}`,
          fg,
          bg: blob,
          ratio,
          min: 4.5,
          pass: ratio >= 4.495,
        });
      }
    });
  }

  distance("主色 vs 危险", t.colorPrimary, t.colorError);
  distance("主色 vs 警告", t.colorPrimary, t.colorWarning);
  distance("主色 vs 成功", t.colorPrimary, t.colorSuccess);

  return rows;
}

export interface AuditCase extends Required<Pick<ThemeOptions, "accent" | "resolved" | "sidebar" | "glass">> {
  rows: AuditRow[];
}

/** 全部主题 × 2 明暗 × 侧栏样式（浅色侧栏只在浅色下有意义）× 毛玻璃开关。 */
export function auditAll(): AuditCase[] {
  const cases: AuditCase[] = [];
  for (const accent of Object.keys(THEMES) as Accent[]) {
    for (const resolved of ["light", "dark"] as Resolved[]) {
      const sidebars: SidebarStyle[] = resolved === "light" ? ["theme", "light"] : ["theme"];
      for (const sidebar of sidebars) {
        for (const glass of [false, true]) {
          cases.push({ accent, resolved, sidebar, glass, rows: auditTheme({ accent, resolved, sidebar, glass }) });
        }
      }
    }
  }
  return cases;
}
