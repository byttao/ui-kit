---
version: alpha
name: ui-kit（PigResize）
description: >
  继承 Ant Design v6 设计语言（https://ant.design/design.md）与色彩体系（https://ant.design/docs/spec/colors-cn），
  为 Tauri 桌面工具补充 12px 高密度正文、AA 对比度、随主题变化的侧栏、毛玻璃与桌面化规则。
  下面的 token 是极客蓝 · 浅色 · 主题色侧栏的解析值（默认外观是森翠雅韵 · 浅色侧栏 · 毛玻璃，见 DEFAULTS）；
  唯一来源是 antd-theme.ts，其余主题、深色与毛玻璃见「Colors」一节。
colors:
  primary: '#2F54EB'
  primary-hover: '#1D39C4'
  primary-active: '#10239E'
  primary-bg: '#F0F5FF'
  primary-text: '#2F54EB'
  success: '#237804'
  success-bg: '#F6FFED'
  warning: '#874D00'
  warning-bg: '#FFFBE6'
  error: '#CF1322'
  error-bg: '#FFF1F0'
  info: '#0958D9'
  surface: '#FFFFFF'
  surface-container: '#FFFFFF'
  surface-layout: '#F4F6FA'
  on-surface: 'rgba(29, 44, 64, 0.88)'
  on-surface-variant: 'rgba(29, 44, 64, 0.78)'
  on-surface-description: 'rgba(29, 44, 64, 0.68)'
  on-surface-disabled: 'rgba(29, 44, 64, 0.25)'
  outline: '#D5DCE6'
  outline-variant: '#E5EAF1'
  sidebar: '#19283C'
  sidebar-text: '#BFC3C8'
  sidebar-active: '#3E4A5B'
  on-sidebar-active: '#FFFFFF'
typography:
  headline-lg:
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif'
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-sm:
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif'
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif'
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif'
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, sans-serif'
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 20px
  code:
    fontFamily: 'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace'
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  xs: 2px
  sm: 4px
  DEFAULT: 6px
  lg: 8px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  control-height: 32px
  control-height-sm: 24px
  sidebar-width: 224px
  aside-width: 300px
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#FFFFFF'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    height: 32px
    padding: 0 15px
  button-primary-hover:
    backgroundColor: '{colors.primary-hover}'
    textColor: '#FFFFFF'
  button-primary-active:
    backgroundColor: '{colors.primary-active}'
    textColor: '#FFFFFF'
  input-field:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.on-surface}'
    typography: '{typography.body-md}'
    rounded: '{rounded.DEFAULT}'
    height: 32px
  card:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 20px
  sidebar-item:
    backgroundColor: '{colors.sidebar}'
    textColor: '{colors.sidebar-text}'
    typography: '{typography.body-md}'
    rounded: '{rounded.lg}'
    height: 36px
  sidebar-item-selected:
    backgroundColor: '{colors.sidebar-active}'
    textColor: '{colors.on-sidebar-active}'
  tag-success:
    backgroundColor: '{colors.success-bg}'
    textColor: '{colors.success}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.sm}'
  log-viewer:
    textColor: '{colors.on-surface}'
    typography: '{typography.code}'
    rounded: '{rounded.DEFAULT}'
  list-row-error:
    backgroundColor: '{colors.error-bg}'
    textColor: '{colors.error}'
    typography: '{typography.body-md}'
  nav-badge:
    backgroundColor: '{colors.on-sidebar-active}'
    textColor: '{colors.sidebar}'
    typography: '{typography.body-sm}'
    rounded: '{rounded.full}'
---

## Overview

本文件**继承 [Ant Design design.md](https://ant.design/design.md) 的全部规则**，只写差异。读的顺序：先读 antd 那份，再读这份；两份冲突时以这份为准。

ui-kit 服务的是 PigResize、绘境这类 **Tauri 桌面工具**：一个侧栏、几个功能页，每页是「左侧列表（文件 / 任务 / 图片）+ 右侧设置栏 + 底部日志」，外加一个设置页。和 antd 默认面向的中后台相比，窗口更小（最小 1100 × 700）、信息更密、没有路由和整页滚动。所以差异集中在三处：

1. **更密**：正文 12px，说明 11px。控件高度保持 antd 的 32px。
2. **更严**：所有文字 / 底色组合 ≥ 4.5:1（WCAG AA 小字标准）。antd 默认主题有几组不达标，见下文。
3. **桌面化**：随主题变化的侧栏、可选毛玻璃、固定页面骨架、只让列表滚动、窗口级拖拽。

antd 的四条价值观（自然、确定、有意义、生长）原样适用，作为两个方案打架时的裁决依据。

## Colors

**色值不手写：主题只给种子和配色，交互色由 antd 色板生成算法（`@ant-design/colors` 的 `generate`）展开，再由 `antd-theme.ts` 按固定档位规则映射到 token。** 页面代码里读 token（`theme.useToken()`，或 Tailwind 的语义类），不写十六进制。

### 结构：antd 定制主题的四层

按 [定制主题](https://ant.design/docs/react/customize-theme-cn) 的 Seed → 算法 → Map → 组件 组织：

| 层 | ui-kit 的设定 |
|---|---|
| Seed | 主题的交互主色种子；功能色 = antd 红 / 绿 / 金 / 蓝 四个色板的主色；`fontSize: 12`；字体栈；`colorTextBase`；`motion` |
| 算法 | 浅色 `defaultAlgorithm`，深色 `darkAlgorithm`；不叠 `compactAlgorithm` |
| Map | 色板各档按下面的规则写入 `colorXxx / Hover / Active / Bg / BgHover / Border / BorderHover / Text`；表面、文字透明度、`fontSizeSM: 11` |
| 组件 | `Menu` / `Layout`（侧栏随主题）、`Tag`（状态文字）、`Tabs`（选中文字）、`Button`（实心块文字）、`Card`、`Table`、`Image` |

### 档位规则

色彩规范建议「选择色板从浅至深的第六个颜色作为主色」。12px 按钮字属于小字，需要 ≥ 4.5:1，所以第 6 档不达标时往深处顺延：

| | 浅色 | 深色 |
|---|---|---|
| 实心色（按钮、选中填充） | 第 6 档起，取第一个白字 ≥ 4.5:1 的档 | 种子从浅色色板第 6 档起往**浅**处取（6、5、4…），取第一个经 `darkAlgorithm` 推导后能直接当文字用的档 |
| 实心块上的字 | 白 | 白字不达标时用深色字 `#0F1621` |
| 悬停 / 按下 | 再深一档 / 两档 | 朝远离文字色的方向：白字变暗、深色字变亮 |
| 彩色文字（链接、标签、主色文字） | 从实心档起，取第一个在卡片和浅底上都 ≥ 4.5:1 的档 | 同左，在推导出的暗色色板里取 |
| 浅底 / 描边 | 第 1、2 档 / 第 3、4 档；第 1 档仍是暗色时（低明度种子，如 `#3A5F3B`）改为种子与白色按 8% / 15% / 30% / 45% 混合 | 推导出的暗色色板第 1、2 / 3、4 档 |

深色种子为什么往浅处取：antd 在 Tabs 选中项、表单报错、危险按钮文字等处**直接用实心色写字**。官方暗色色板第 6 档（如 `#2B4ACB`、`#D32029`）在 `#1D2735` 卡片上只有 1.8–2.9:1。

### 主题

**默认外观**（`DEFAULTS`）：森翠雅韵、浅色、浅色侧栏、开启毛玻璃。

一个主题 = **交互主色种子** + **一组配色**（swatches）。两者分工：

- **种子**按档位规则推出按钮、链接、选中态等交互色，保证 AA。浅色的配色（马卡龙、莫兰迪）直接做按钮底时，白字、勾选框、焦点框都不达标，所以交互色总是种子的可读档位。
- **配色**承载主题的辨识度：侧栏底色、毛玻璃背景的色块、主题选择器的色块。

| 主题 | 来源 | 配色 | 交互主色种子 | 浅色实心 | 深色实心 | 侧栏 | 区分度（危险 / 警告 / 成功） |
|---|---|---|---|---|---|---|---|
| 极客蓝 | antd 色板 | `#2F54EB` `#85A5FF` `#19283C` `#D6E4FF` `#B37FEB` | `#2F54EB` | 6 · `#2F54EB` | `#748FDC`（深字） | `#19283C` 深蓝墨色（白字） | 19 / 27 / 29 |
| 酱紫 | antd 色板 | `#722ED1` `#B37FEB` `#22075E` `#EFDBFF` `#FFADD2` | `#722ED1` | 6 · `#722ED1` | `#B696D5`（深字） | `#22075E`（白字） | **12** / 22 / 30 |
| 明青 | antd 色板 | `#13C2C2` `#5CDBD3` `#00474F` `#B5F5EC` `#91CAFF` | `#13C2C2` | 8 · `#006D75` | `#13A8A8`（深字） | `#00474F`（白字） | 21 / 18 / 14 |
| **森翠雅韵**（默认） | 自定义 | `#3A5F3B` `#2E8B57` `#228B22` `#6B8E23` `#8B4513` | `#3A5F3B`，深色 `#2E8B57` | 6 · `#3A5F3B` | `#7E9B88`（深字） | `#3A5F3B`（白字） | 14 / 13 / **10** |
| 辉煌金韵 | 自定义 | `#FFD700` `#FFC0CB` `#FFDAB9` `#DAA520` `#B8860B` | `#FFD700` | 9 · `#8C6900` | `#DCBA03`（深字） | `#BF9223`（深字） | 18 / **8** / 14 |
| 莫兰迪色彩 | 自定义 | `#D4B9B9` `#A8B6C4` `#B8C4B0` `#C2B2C2` `#E8D9B9` | `#A8B6C4` | 8 · `#5B6878` | `#929EAA`（深字） | `#A8B6C4`（深字） | **12** / 14 / 17 |
| 马卡龙色彩 | 自定义 | `#FFB6C1` `#FF69B4` `#FFD700` `#FFA07A` `#FFDAB9` | `#FF69B4` | 8 · `#B3377D` | `#DC7EAA`（深字） | `#FFB6C1`（深字） | **7** / 19 / 31 |

区分度是主色与功能色实心色的 OKLab ΔE，取深浅两种模式中较小的；低于 12（表中加粗）时并排容易看混，主题选择器上会标「区分度」。

**区分度不足的主题怎么用。** 功能色不随主题变化（见下节），所以与功能色同色系的主题只能靠用法区分。森翠雅韵、辉煌金韵、马卡龙色彩已确认保留，按下表使用：

| 主题 | 撞色 | 必须遵守 |
|---|---|---|
| 森翠雅韵 | 成功 | 成功状态带图标（所有主题的通用规则，见「Components」），不单靠绿色 |
| 辉煌金韵 | 警告 | 警告状态带图标（同上） |
| 马卡龙色彩 | 危险 | 「Components」里的危险操作约束：页面上不出现实心危险按钮 |
| 酱紫、莫兰迪（深色） | 危险（ΔE ≈ 11.7–11.8） | 同上 |

试过的替代方案：给撞色主题换功能色。金韵把警告换成火山橙后与危险红 ΔE 只剩 5，马卡龙把危险换成火山后与警告金只剩 8，都是把冲突挪到别处，所以不采用。

**新增主题。** 在 `antd-theme.ts` 的 `THEMES` 里加一项：`label`、`source`、`swatches`（3–5 个配色）、`primary`（交互主色种子，通常取配色里饱和度最高的一个；低明度种子在深色下推不出可读色时，用 `{ light, dark }` 分开指定）、`sidebar`（侧栏底色，通常取配色里最深或最有辨识度的一个）、`note`。然后在 demo 目录跑 `npm run check:contrast`：对比度必须全过；区分度警告写进 `note` 与上表。

未收录的 antd 色板：薄暮 `red`、极光绿 `green`、金盏花 `gold` 就是功能色；日暮 `orange`、火山 `volcano`、法式洋红 `magenta` 夹在危险红与警告金之间；拂晓蓝 `blue` 与极客蓝太像，且与「信息」同色；日出 `yellow`、青柠 `lime` 白字要取到第 9 档，接近棕 / 橄榄色。

### 侧栏

侧栏随主题变化，颜色由 `sidebarFrom(底色)` 自动推出：

- 文字取白色 / 深色 `#0F1621` 中对比度高的一个；正文、分组标题在底色与文字色之间混出，保证 ≥ 4.5:1。
- 悬停底、选中底分别是底色向文字色混 8%、16%；底色明度居中、选中底上文字不达标时，先把底色往远离文字的方向推。
- 图标取主色色板中第一个在底色和选中底上都 ≥ 3:1 的档位。
- 品牌标记用反色块（文字色做底、侧栏色写字）：侧栏可能就是主色（如森翠），用主色做底会看不见。
- 深色模式：主题侧栏色与「该主题的深色墨」（参考值 `#0B0F16`，按主题色相重新着色，见「其余覆盖 · 深色表面随主题」）按 62% 混合压暗，保留色相。
- `sidebar="light"`：侧栏用主色与白色按 94% 混合的浅底、深色字。深色模式下不生效。

### 毛玻璃

`<ThemeProvider glass>` 开启。卡片（`Panel`）、`Topbar`、`StatusBar` 变成玻璃面，主区背景换成主题配色的渐变：

| | 浅色（设计稿原值） | 深色 |
|---|---|---|
| 玻璃底 | `rgba(255, 255, 255, 0.2)` | `rgba(255, 255, 255, 0.06)` |
| 模糊 | `blur(16px) saturate(180%)` | 同左 |
| 描边 | `1px solid rgba(255, 255, 255, 0.3)` | `rgba(255, 255, 255, 0.12)` |
| 圆角 | 16px | 同左 |
| 阴影 | `0 4px 30px rgba(0, 0, 0, 0.1)` | `0 4px 30px rgba(0, 0, 0, 0.35)` |
| 内嵌玻璃（列表、表格） | `rgba(255, 255, 255, 0.45)`，描边 `rgba(255, 255, 255, 0.55)` | `rgba(0, 0, 0, 0.12)`，描边 `rgba(255, 255, 255, 0.1)` |
| 吸顶表头 | `rgba(255, 255, 255, 0.82)` | 该主题的卡片色 88%（极客蓝为 `rgba(29, 39, 53, 0.88)`） |

- 深色下白色 20% 会把卡片顶成灰色、文字发虚，所以换成同结构的低透明度版本。
- 背景是主题配色放在四角与中下的径向渐变，底色是该主题的画布色（深色下随主题色相变化）。每个色块与画布混合，混合比例从 45% 起逐步加大，直到色块中心叠上玻璃后，正文、次要、说明、主色文字、链接以及日志底上的说明文字都 ≥ 4.5:1。所以背景是柔和的，不会是高饱和大色块：玻璃只有 20% 白，背景再艳文字就压不住。
- **两层玻璃**：卡片级容器（`Panel`、`Topbar`、`StatusBar`）是玻璃面；卡片里的列表、表格（`ListWell` 及其中的 antd `Table`）是**内嵌玻璃**，只换半透明底和浅描边，不再叠模糊（嵌套的 `backdrop-filter` 只会把外层已模糊的背景再糊一次，看不出区别还费性能）。
- 内嵌玻璃浅色往上浮（白 45%，磨砂感），深色往下沉（黑 12%，凹槽感）。深色若也用白色，会把底色抬亮，主色文字掉到 4.1:1。
- 吸顶表头接近不透明，挡住滚到它下面的行。
- 输入框、下拉、弹窗、Tooltip 仍是不透明面，保证可读和可点范围清楚。
- 玻璃面的底色只来自 `kit-glass`：组件里毛玻璃开启时**不能**同时带实心底色类（`bg-container` 等）——Tailwind 工具类不分层、优先级高于 `kit-glass`，会把玻璃盖成实心。写法是 `glass ? "kit-glass …" : "bg-container"`（`Topbar`、`StatusBar` 即如此）。
- 玻璃面的圆角 16px 是设计稿要求，属于对 antd 卡片 8px 的有意覆盖，只在毛玻璃开启时生效。

### 功能色

色彩规范要求功能色在一套产品里保持一致，所以**功能色不随主题变化**：

| 功能 | 色板 | 浅色实心 | 深色实心（种子档 → 推导色） |
|---|---|---|---|
| 成功 | `green` | 8 · `#237804` | 6 → `#49AA19` |
| 警告 | `gold` | 9 · `#874D00` | 6 → `#D89614` |
| 危险 | `red` | 7 · `#CF1322` | 3 → `#DC8E89` |
| 信息 | `blue` | 7 · `#0958D9` | 4 → `#5C99DC` |

深色下的危险色是偏粉的 `#DC8E89`，因为它要在卡片上当报错文字用。这是可读性的代价。

### 其余覆盖

- **链接色跟随主色。** antd 的 `colorLink` 默认跟 `colorInfo` 走，换了主题后会冒出蓝色链接。
- **中性色以墨色为基。** `colorTextBase` 设为 `#1D2C40`（深色 `#E6EDF7`），各级文字仍是 antd 的透明度写法。说明文字（tertiary）的透明度由 0.45 提到 0.68（深色 0.60），次要文字 0.78（深色 0.74），否则 12px 下只有 3.3:1。quaternary（0.25）只用于禁用态。
- **深色表面随主题（1.3.0）。** 深色不改 `colorBgBase`（darkAlgorithm 会把任何带色相的底色推得过饱和），而是直接覆盖 `colorTextBase`、`colorBgLayout`、`colorBgContainer`、`colorBgElevated`、两级描边与 `colorSplit`。这些值由 `surfaceColors(accent, "dark")` 从一组**参考墨色**（极客蓝：画布 `#151D29`、卡片 `#1D2735`、浮层 `#243042`、描边 `#3A4B61` / `#2B3A4D`、文字基色 `#E6EDF7`）推出：
  - 色相换成主题侧栏色（`THEMES[x].sidebar`）的 OKLCH 色相；
  - 彩度按侧栏的饱和程度缩放（侧栏彩度 ÷ 极客蓝侧栏彩度，限制在 0.5–1），上限是参考墨色彩度的 1.5 倍，所以永远是低饱和的深色，不会出现高饱和大色块；
  - **按 WCAG 相对亮度对齐**参考墨色（不是 OKLab 明度：同明度下紫、粉色相亮度更高）。任何颜色叠在这些表面上的对比度与极客蓝相同，审计结论不随主题变化；
  - 极客蓝侧栏与参考墨色同色相、同饱和，结果逐值等于 1.2.0。浅色表面不变（各主题共用冷调近白）。

  | 主题 | 画布 | 卡片 | 浮层 | 描边 |
  |---|---|---|---|---|
  | 极客蓝 | `#151D29` | `#1D2735` | `#243042` | `#3A4B61` |
  | 酱紫 | `#1C1B29` | `#252535` | `#2E2D42` | `#484861` |
  | 明青 | `#0C2022` | `#12292D` | `#153338` | `#2B4F55` |
  | 森翠雅韵 | `#141F15` | `#1C2A1D` | `#233323` | `#3A4F3A` |
  | 辉煌金韵 | `#231B0E` | `#2E2516` | `#392E19` | `#56472E` |
  | 莫兰迪色彩 | `#171D24` | `#20282F` | `#27313A` | `#3F4B58` |
  | 马卡龙色彩 | `#28181B` | `#342124` | `#41292C` | `#604146` |

  深色侧栏的压暗色、日志底、深色 Tooltip 底（见下条）也按同一规则重新着色。新增主题不需要写任何深色表面色值。
- **首帧画布色。** `ThemeProvider` 把当前画布色写在 `<html>` 的内联背景上，并记到 `localStorage` 的 `ui-kit:canvas`；`theme-init.js` 首帧前读它，深色主题启动时不会先闪一帧极客蓝墨色。`styles/base.css` 里的 `#F4F6FA` / `#151D29` 只是没有记录时的兜底。
- **深色下实心块上是深色字时，Tooltip 跟着变成浅底深字**（`colorBgSpotlight`，参考值 `#DFE6F0`，深色下按主题色相重新着色），仍是 antd 的「高对比反色面」。
- **浅色描边带冷调。** `colorBorder #D5DCE6` / `colorBorderSecondary #E5EAF1`，与冷调画布 `#F4F6FA` 配套。
- **Tag 的状态文字。** Tag 直接用 `colorSuccess` 等实心色写字，只在 `components.Tag` 里换成彩色文字档。
- **日志等级色是分类色。** 按规范取预设色板（INFO 蓝、SUCCESS 绿、WARN 橙、ERROR 红、PROCESS 紫），档位同彩色文字规则，写成 `--kit-log-*`。

**对比度是硬性要求。** 改任何颜色后，在 demo 目录运行 `npm run check:contrast`，或打开 demo 的「对比度」页。清单覆盖正文、次要、说明、占位符、表头、选中行、失败行、链接、主按钮三态、危险按钮、四种状态文字与标签、中性标签、Tooltip、侧栏与导航徽标、日志、1.3.0 / 1.4.0 新组件（缩略图占位图标与说明、图片瓦片选中描边、图片角标、可点击标签、比例预览、参数提示 / 警示），以及主色与功能色的区分度。共 7 套主题 × 深浅 × 侧栏样式 × 毛玻璃开关 42 种组合；毛玻璃组合额外逐个背景色块检查卡片文字（含参数警示）、内嵌玻璃上的列表文字、吸顶表头与日志。对比度不达标即失败，区分度不足只警告。

## Typography

| 用途 | token | 值 | antd 默认 |
|---|---|---|---|
| 正文、按钮、输入值、表格 | `fontSize` | **12px** / 行高 20px | 14px |
| 说明、表头辅助、标签、日志 | `fontSizeSM` | **11px** | 12px（按 12px 种子会推出 10px，已手动改回 11） |
| 卡片标题 | `fontSizeLG` | 14px | 16px |
| 分区标题 | `fontSizeHeading4` | 16px | 20px |
| 页面标题 | `fontSizeHeading2` | 26px | 30px |

- 只改 `fontSize` 种子，标题和行高仍由 antd 推导。**不要叠加 `compactAlgorithm`**：它会把 12px 再压到 10px、控件压到 28px。
- 字体栈苹方优先：`"PingFang SC", "Microsoft YaHei", "Segoe UI", system-ui, …`。antd 默认以 `-apple-system` 开头，中文会回落到系统默认字形。
- 字重只用 400 和 600（antd 规则）。按钮文字是 500，例外。
- 不用 16px 做正文。

## Layout

沿用 antd 的 4px 网格与间距档位。ui-kit 补充桌面工具的固定骨架：

| 区域 | 尺寸 |
|---|---|
| 窗口最小 | 1100 × 700 |
| 侧栏 | 224px，窗口 ≤ 1180px 时 195px |
| 页面内边距 | 横向 32px、纵向 28px（紧凑时 24px） |
| 两栏间距 | 20px |
| 右侧设置栏 | 300px，**全应用统一**，切页时不能跳 |
| 内容最大宽 | 1650px |

每个功能页的结构：`Page` > `Workspace`（左：列表卡片；右：设置卡片 + 底部主按钮）+ 底部日志卡（170px）。

- **只让列表和日志滚动。** 页面本身不滚；内容型页面（如组件一览）例外，用 `<Page fill={false}>`。
- 拖拽区在列表有内容后缩成一行，把高度让给列表。
- **右栏主按钮常驻。** 主按钮（和进度）放 `Workspace` 的 `asideFooter`，不要放在 `aside` 里用 `mt-auto` 顶到底部：参数一多，主按钮会被挤出可视区。参数只有一两张卡片时 `aside` 直接放 `Panel`（右栏整体滚动）；参数多时用一张 `<Panel fill className="min-h-0 flex-1">`，里面放 `SettingsScroll`，只滚参数区。
- **页面切换：有状态的功能页常驻，用 `hidden` 切换。** `AppShell` 只渲染 children，按 `page === x &&` 切换会卸载页面，日志（`useLogger`）、未提交的草稿、事件订阅都会丢。功能页、设置页包一层 `<div className={page === "x" ? "h-full" : "hidden"}>` 常驻；内容型、无状态的页面（帮助、关于、组件一览）可以按需挂载。常驻页面里的拖拽要用 `useFileDrop(add, { enabled: active })` 只在可见时接收。

### 页面配方

功能页不从空白开始写：kit 的 `recipes/` 有四个完整可运行的配方（批处理页、任务队列页、图库页、设置页），各自的适用场景、骨架、状态与空态、主按钮、Rust 端约定见 AI_GUIDE「第 6 步：先选配方」。它们都遵守本文件的全部规则，是规则的参考实现。

### 设置页

设置页也是 `Page` > `Workspace` + 底部日志，和功能页同一骨架，切页时右栏不跳：

| 区域 | 内容 |
|---|---|
| 左：`<Panel fill className="flex-1" title="设置" extra="外观即时生效，其余点「保存设置」">` | `SettingsScroll`（最大宽 640px，自己滚动）> `<Form layout="vertical" component="div">` > 若干 `SettingsSection` |
| 右：`aside` | 「关于」卡片：版本、数据目录（`Typography.Text copyable ellipsis`）、官网链接 |
| 右：`asideFooter` | 有改动时出现「放弃修改」（`type="link" size="small"` + `RollbackOutlined`），下面是主按钮「保存设置」（无改动时禁用） |

- **分区**：`SettingsSection` 的标题是 14px（antd h5），分区间距 20px、分隔线；分区内的 `Form.Item` 间距 12px，去掉 antd 的默认下边距。分区顺序：连接 / 账号 → 网络 → 输出 → 默认参数 → 外观 → 高级。
- **草稿模式**：表单改的是草稿，点「保存设置」才写入；只有「外观」（明暗、主题）即时生效、不进草稿。缺必填配置（如 API Key）时，在最上面放一个 `EmptyState size="small"` 引导，功能页里同样用 `EmptyState` 加「去设置」按钮。
- **单项说明**写在 `Form.Item extra`；两列排布用 `grid grid-cols-2 gap-3`，单列控件（目录、Key）占满宽度。

三层表面沿用 antd：`colorBgLayout`（画布）→ `colorBgContainer`（卡片、表格）→ `colorBgElevated`（弹窗、下拉、消息）。

## Elevation & Depth

完全沿用 antd：先靠描边，阴影只给真正浮起的表面（弹窗、下拉、消息、Tooltip）。卡片默认无阴影，靠 `colorBorderSecondary` 1px 描边分层。

动效完全沿用 antd 的三档时长与内置缓动：`motionDurationFast` 0.1s（悬停、聚焦、按下）、`motionDurationMid` 0.2s（展开、淡入）、`motionDurationSlow` 0.3s（弹窗、抽屉）。按钮点击波纹保留。自写元素的过渡用 Tailwind 的 `duration-fast / duration-mid / duration-slow`，不要自定义 `cubic-bezier`。

系统开启「减弱动态效果」时，ThemeProvider 给 antd 设 `token.motion: false`（[定制主题](https://ant.design/docs/react/customize-theme-cn) 里的官方开关），antd 组件的动效全部关闭，`--ant-motion-duration-*` 归零，自写元素的过渡跟着归零。**不要用全局 CSS 把 `transition-duration` / `animation-duration` 压到 0**：antd 的下拉、弹窗在动效过程中计算位置，时长被强行压缩后会停在屏幕外。

毛玻璃面例外地带阴影（`0 4px 30px`），用来把半透明卡片从渐变背景上托起来。

## Shapes

沿用 antd 圆角：控件 6px、卡片 / 弹窗 / 拖拽区 8px、标签和 Tooltip 4px、全圆角只给头像、圆点和徽标。相邻元素不混用圆角。唯一例外是毛玻璃开启时的卡片级玻璃面：16px（设计稿要求）。

## Components

**控件一律用 antd。** 写之前先用 `antd info <组件> --format json` 查当前版本的 API，写完跑 `antd lint`。ui-kit 只提供 antd 没有的应用级组件：

| ui-kit | 作用 | 内部用到的 antd |
|---|---|---|
| `AppShell` | 侧栏 + 主区外壳；`brand.mark` 可传字母 / 单色 SVG / `{ src }` 图片 | `Layout`、`Layout.Sider`、`Menu` |
| `NavBadge` | 侧栏徽标（反色块 / 弱数字） | — |
| `Page` / `Workspace` / `PageHeader` / `Topbar` / `StatusBar` | 页面骨架；`Workspace` 的 `asideFooter` 是常驻主按钮区 | `Typography.Title` |
| `Panel` | 撑满高度的卡片，内容区可滚动 | `Card` |
| `DropZone` | 拖拽区视觉 + 点击选择 | — |
| `ListWell` / `FileRow` | 列表滚动容器 / 32px 单行文件行 | — |
| `ListRow` + `useRowFlash` | 富列表行：序号、缩略图、标题、元信息、附加行、行尾操作、失败 / 选中 / 定位高亮；「定位并闪一下」 | — |
| `LinkTag` | 可点击的标签（跳转 / 定位） | `Tag` |
| `ImageBadge` | 叠在图片上的角标 | — |
| `ErrorBoundary` | 渲染出错兜底（整窗 / 单页） | `Result`、`Button` |
| `Thumb` / `ThumbStrip` | 本地图缩略图（加载 / 失败占位、比例裁切、受控预览）/ 缩略图条与参考图墙 | `Image`、`Image.PreviewGroup` |
| `ImageGrid` | 可选中图片瓦片，双击大图、翻页同步选中 | `Image.PreviewGroup` |
| `RatioIcon` / `RatioSelect` / `RatioPreview` | 比例小图示 / 比例尺寸选择器 / 比例与宫格预览框 | `Select` |
| `SettingsSection` / `SettingsScroll` / `AdvancedSection` | 设置页分区 / 长表单滚动容器（「下面还有」提示、ref）/ 「高级」折叠 | `Typography.Title`、`Collapse` |
| `ScrollArea` | 纵向滚动区：「下面还有」提示 + ref（右栏、参数区） | `Button` |
| `EmptyState` | 图标 + 文案 + 操作按钮的空状态 / 缺配置引导 | `Empty` |
| `StatusTag` | 带图标的状态标签：排队 / 进行中 / 成功 / 失败 / 警告 / 已取消 | `Tag` |
| `FieldHint` | 右栏参数提示 / 警示 | — |
| `LogViewer` + `LogActions` + `useLogger` / `pushLog` | 彩色日志，跟随但可上翻；清空、复制全部（放标题栏或日志区右侧）；组件外写入通道 | `Button`、`Tooltip` |
| `ProgressPanel` | 批处理进度 | `Progress` |
| `ThemeToggle` / `ThemeMenu` | 明暗切换 / 主题下拉 | `Button`、`Dropdown` |
| `ThemePicker` | 主题选择（配色色块 + 区分度提示） | `Tag`、`Tooltip` |
| `useFileDrop` / `useBatchProgress` / `useTaskEvents` | Tauri 拖拽 / 批处理进度事件 / 多任务队列事件 | — |

ui-kit 对 antd 组件的用法约定：

- **主按钮**：每个区域最多一个 `type="primary"`，放在右栏底部（`asideFooter`）。批处理页文案写明数量：「开始转换 · 5 张」；**非批处理页没有数量可写时，写「动词 + 对象」**：「保存设置」「继续修改 · 这张」「开始生成 · 4 张」（张数是参数时照写）。不要只写「确定」「提交」。
- **危险操作不靠颜色区分。** 实心主按钮与实心危险按钮在任何主题下都不并排。规则：
  - 页面上的删除、清空用 `<Button danger>`（描边）或 `<Button danger type="text">`，**带 `DeleteOutlined` / `ClearOutlined` 图标**，文案以「…」结尾表示会先确认。
  - **实心危险按钮（`danger type="primary"`）只出现在确认弹窗里**：`modal.confirm({ okButtonProps: { danger: true } })`。它取代该弹窗的主按钮，不与实心主按钮同屏并排。
  - 同一区域不同时出现实心主按钮和实心危险按钮。
- **清空列表**：`<Button type="link" size="small">` 放在卡片标题右侧（Card 的 `extra`）。
- **日志的清空 / 复制全部**：放在日志卡片的标题栏——`<Panel extra={<LogActions logs={logs} onClear={clear} />}>` + `<LogViewer logs={logs} />`（推荐，与「清空列表」同一位置）。省事写法 `<LogViewer onClear={clear} />` 会把两个按钮竖排在日志区**右侧一列**，不盖住文字（1.4.0 浮在右上角，会挡住长行末尾）。复制写系统剪贴板已在 Tauri（macOS WKWebView）真实窗口验证。
- **「下面还有内容」**：右栏、参数区这类在最小窗口下会被截断的滚动区，内容超出且没滚到底时，**滚动区下方**出现一条提示行：虚线分隔 + 说明色 11px「向下滚动查看更多 ↓」，点击向下滚一屏，滚到底自动消失（`ScrollArea` / `SettingsScroll` / `Workspace` 右栏默认开启，三处同一实现）。
  - 提示行**占自己的高度**（24px），滚动区相应变矮，所以不会盖住底边那一行内容；它不是按钮外观（无底色、无描边框），不会被看成旁边表单控件的一个选项。
  - 1.5.0 的浮动小按钮已废弃：它叠在内容上、会遮住最后一行文字，在设置页里还落在分段控件旁边像一个选项。也不要用渐隐遮罩：毛玻璃面上渐隐色对不上底色。
- **按字段滚动**：关键参数离得远时（如提示词下面的「比例与张数」），参数卡片标题栏放一个 `type="link" size="small"` 的跳转入口（`ArrowDownOutlined` 在文字后）。目标表单项外包 `<ScrollField name="size">`，用 `useFieldScroll()` 的 `ref` 给 `SettingsScroll`、点击时 `scrollToField("size")`：只滚这个容器、字段顶部对齐容器顶部，不依赖 antd 内部类名（不要再写 `querySelector("#id").closest(".ant-form-item")`）。
- **「高级」折叠**：低频、默认值大多数人不用改的参数（背景、输出格式、种子、重试次数）收进 `AdvancedSection`，放在参数区最后、默认折叠。标题「高级」，有偏离默认值的项时标题旁显示「已改 N 项」，右侧放「恢复默认」link 按钮。**标题 2–4 个字**（「高级」「更多参数」），300px 右栏里「标题 + 已改 N 项 + 恢复默认」要排在一行；要说明里面有什么，写 `description`（第二行，说明色、单行省略），不要写成「高级 · 合图分辨率」这种长标题（超长时会单行省略，不会换行）；展开后与上面的 Form.Item 左对齐（组件已去掉 Collapse 的左右内边距，不要再写 `-mx-3`）。高频参数不要藏进去；一个页面最多一个「高级」。设置页同样适用（放在对应分区的最后）。
- **图片的裁切与完整显示**：缩略图、图库瓦片默认 `fit="cover"`（居中裁切铺满）；长条图（如 1376 × 383 的切片）或一组比例差异很大的图用 `fit="contain"`（完整显示，瓦片底色作留白），否则看不出形状。图库可在标题栏给「裁切 / 完整」切换（`Segmented size="small"`）。
- **行尾操作**（`ListRow` / `FileRow` 的 `trailing`、表格操作列）：一律 `<Button type="text" size="small" icon aria-label>` 外套 `Tooltip`，**最多 3 个常用操作**，按「查看 → 编辑 → 状态操作（重试 / 取消）」排；其余（复制、打开文件夹、删除）收进最后一个「更多」（`MoreOutlined` + antd `Dropdown`），删除放菜单最后、`danger`、文案带「…」并走确认弹窗。一个操作要先选对象（如多张图里选一张继续修改）时，图标按钮外套 `Dropdown`，菜单项写清对象。
- **参数提示与警示**（右栏）：单项说明写在 `Form.Item extra`；依赖其他参数的提示用 `<FieldHint>`（11px 说明色 + 信息图标），会被拦下或有代价的写 `<FieldHint type="warning">`（警告文字色 + 感叹号），都放在相关控件下方。300px 右栏里不用 `Alert`（太重）；要用户改正的错误用 `Form.Item` 的 `validateStatus` / `help`；整页级问题才用 `<Alert showIcon>`，放在左侧列表上方。
- **空状态**：一句话、无操作时用 `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>`；需要引导（缺配置、去添加）时用 `EmptyState`（图标 + 主文案 + 说明 + 一个按钮）。图标用说明文字色，不要用 `quaternary`（只给禁用态）。
- **可点击的标签**：既表达状态 / 关系、又能点击跳转的（「改自 #7」「来自 3 张参考图」），用 `LinkTag`：antd `Tag` + 按钮语义（`role="button"`、可聚焦、回车 / 空格触发），悬停主色描边与主色文字；目标已不存在时 `disabled`（说明文字色、不可点）。只用于跳转 / 定位；会改数据的操作仍用 `Button`。
- **定位高亮**：跳到某条记录时，行用主色 2px 内描边（`ListRow highlight`，不改底色，选中 / 失败底色仍可辨），**持续 2 秒**（`ROW_FLASH_MS`）后自动取消，并滚到可见（`block: "nearest"`）。用 `useRowFlash`；目标在另一页时先切页、再定位（hook 内部等 50ms）。图库的定位是「选中」而不是闪烁：改 `ImageGrid` 的 `selectedKey`，自动滚到可见。不要用 `bg-primary-bg` 做高亮：深色下太暗。
- **图片上的角标**（编号、张数、模型）：`ImageBadge`——实底 `bg-container` + `border-border` 描边 + 正文色 `text-text`，11px，4px 圆角，放在左上（编号）或左下（附加信息）。图片颜色不可控，所以角标自带实底，不用半透明；不要用 `bg-spotlight`（深色主题下是浅底，配白字不够）、半透明黑底或主色底（主题可能就是图片的主色）。
- **错误兜底**：入口在 `ThemeProvider` 里面包 `ErrorBoundary`（整窗：错误信息 + 复制 + 重新加载）；常驻功能页各自再包 `<ErrorBoundary size="page">`（一页出错不影响侧栏和其他页，「重试」只重建这一页）。事件回调、Promise 里的异常进不了错误边界，用 try/catch + `message` / 日志。
- **侧栏徽标**：`NavItem.badge` 传 `NavBadge`。不用 antd `Badge` 默认的红色（危险语义），也不用主色（侧栏可能就是主色）；「进行中 / 待处理」用反色块，「数量统计」用 `tone="muted"`（继承菜单文字色）。
- **部分失败保留失败项**：批处理部分失败时，成功的移出列表，失败的留在列表里并用**次级危险样式**标出：浅红底 `colorErrorBg` + 红字 `colorErrorText`（与描边危险按钮同一档），行尾带失败图标与「失败」文字，悬停时底色与文字一起加深一档。`FileRow status="error"`；antd Table 用 `FILE_ROW_ERROR_CLASS` + `FailedMark`。重新添加或清空列表时清除失败标记。
- **单选组**：竖排用 `Radio.Group` 加 `orientation="vertical"`；2–4 个互斥模式横排用 `Segmented`。
- **表格内下拉**：`<Select size="small">`。
- **状态一律带图标，不单靠颜色**（WCAG 1.4.1；森翠、金韵、马卡龙下主色与功能色同色系，更要遵守）：
  - 标签：`<Tag icon={<CheckCircleOutlined />} color="success">`；警告 `ExclamationCircleOutlined`、失败 `CloseCircleOutlined`、处理中 `<SyncOutlined spin />`、待处理 `ClockCircleOutlined`。
  - 提示条：`<Alert showIcon type="…" title="…" />`，写 `title` 不写 `message`（v6 已弃用）。
  - 日志等级已有 `[SUCCESS]` / `[WARN]` 等文字前缀，不需要另加图标。
- **轻提示**：`const { message } = App.useApp()` 再 `message.success()`；不要 `import { message } from "antd"` 后调用静态方法（拿不到主题）。
- **拖拽上传不用 `Upload.Dragger`**：它走 HTML5 `dataTransfer`，在 Tauri 里拿不到本地路径。用 `useFileDrop` + `DropZone`。
- v6 已弃用、不要再写：`Space direction`（改 `orientation`）、`Alert message`（改 `title`）、`Progress trailColor`（改 `railColor`）。

**「控件一律用 antd」的两个例外**（都已按 token 写好焦点、悬停、选中态）：

- **可选中卡片**用原生 `<button type="button">`：antd 没有「可选中的图片 / 色块卡片」。用 `aria-pressed`（多选、切换）或 `role="radio"` + `aria-checked`（单选组），选中态 `border-primary`，悬停 `hover:border-primary-border-hover`，焦点由 `base.css` 的 `:focus-visible` 提供。kit 里的 `ImageGrid`、`ThemePicker`、`DropZone` 都是这种写法；自写同类卡片照抄。普通按钮、链接、开关仍然一律 antd。
- **内联 `style`** 只用于**运行时算出的数据**：宽高比（`aspectRatio`）、网格列数 / 列宽（`gridTemplateColumns`）、调用方传入的尺寸（右栏宽、最大宽）、要原样展示的配色色块（主题选择器、审计样张）。颜色、间距、字号、圆角仍然只用 token 类，不写在 `style` 里。能用 SVG `viewBox` 按比例缩放的示意图优先用 `viewBox`。

**比例预览的两种语义**：`RatioPreview` 的 `ratio` 是整张画布的比例，`cols × rows` 是等分格。「整张按格等分拆切」（每张比例就是格子本身）**不传 `cellRatio`**，每张的比例 / 尺寸写进 `caption`（或 `labels` 返回「1 · 9:16」）；只有「合成后每格再居中裁成另一比例」时才传 `cellRatio`，格内会画出裁切范围。选择器用 `RatioSelect`（选项带小图示与尺寸说明），放在预览上方。

**SVG 与示意图的颜色**：preset 的颜色也会生成 `fill-*` / `stroke-*` 类，SVG 元素直接写 `className="fill-primary-bg stroke-primary"`、`fill-container`、`fill-primary-text`、`stroke-border`，或用 `stroke="currentColor"` 继承文字色（`text-text-secondary`）。示意图（比例、宫格、流程）统一：画布 `fill-primary-bg stroke-primary`、分隔线 `stroke-primary` 虚线、裁切 / 留白 `fill-container`、编号 `fill-primary-text`，线条在主色浅底上 ≥ 3:1（已在审计里）。不要在 SVG 里写十六进制。

### 应用图标

`brand.mark` 是侧栏里的品牌标记，应用图标是 Dock / 任务栏 / 安装包里的图标，两者用同一图形：

- **macOS 留边**：1024 × 1024 画布，底板 824 × 824 居中（四周各留 100px 透明），圆角约 185px；底板外必须透明。Windows / Linux 共用同一张图（四周透明不影响）。
- **生成**：SVG 源文件放 `src-tauri/app-icon.svg`，执行 `bash src/ui-kit/scripts/icon/make-icons.sh`：用 AppKit 渲染透明底 1024 PNG → `npx tauri icon` 生成各尺寸 → 逐尺寸检查四角 alpha = 0、中心 alpha = 255。
- **不要用 `qlmanage -t` 渲染 SVG**：它会垫白底，四角不透明，Dock 里是一块白方块，而且不报错。
- **侧栏品牌标记，两种情况**：
  - **单色字形**：一个字母，或 `fill="currentColor"` 的单色 SVG 组件。画在 40px 反色块里（侧栏文字色做底、侧栏底色画形，与 `NavBadge` 同一规则），随主题、深浅自动变色，侧栏统一。没有彩色图标、或图标在侧栏底色上看不清时用它。
  - **彩色图标**：`brand={{ mark: { src: iconUrl, alt } }}`，原样显示、**不套反色块**（透明圆角处不会露出色块）。用**不带 macOS 留边**的版本（底板铺满画布，另导一张 `brand-mark.png`），否则 40px 里只剩约 32px；浅色底板在浅色侧栏上要自带描边或阴影。
  - 不要把彩色图标的 `<img>` 当 ReactNode 传给 `mark`：那会被套进反色块，透明圆角处露出色块。

侧栏随主题变化（规则见「Colors · 侧栏」）。选中项用侧栏底色向文字色混 16%，不用 antd 默认的整块主色填充：侧栏本身可能就是主色。

## Do's and Don'ts

- **Do** 先读 antd design.md，再读这份；冲突时以这份为准。
- **Do** 颜色、字号、圆角、阴影、时长都从 token 读：组件里用 `theme.useToken()`，className 里用 Tailwind 语义类（`bg-container`、`text-text-secondary`、`border-border-secondary`…）。
- **Don't** 写 `bg-gray-*`、`text-slate-*`、`bg-orange-*` 这类色板类，或在 `style` 里写十六进制色值。
- **Don't** 用 Tailwind 的透明度写法（`bg-primary/10`）。token 变量是完整颜色，不支持；要浅色就用 antd 推导好的档位（`bg-primary-bg`、`bg-fill-tertiary`）。
- **Do** 改颜色后跑 `npm run check:contrast`，必须全绿。
- **Don't** 叠加 `compactAlgorithm`，也不要把正文改回 14px。
- **Do** 在页面代码里直接 `import { Button } from "antd"`；只有应用级组件从 ui-kit 导入。
- **Don't** 自己写按钮、输入框、下拉、弹窗、Tooltip。antd 有的都用 antd。
- **Don't** 用 HTML5 `onDrop` 读文件，也不要用 `Upload.Dragger`。
- **Do** 每个功能页各自一份 `useLogger()`；页面挂载前就要写入的日志（Rust 启动时恢复队列等）用 `pushLog(channel, …)` + `useLogger({ channel })`。
- **Do** 有状态的功能页常驻（`hidden` 切换），不要按路由卸载。
- **Don't** 用 `text-text-quaternary` 画图标或说明文字：quaternary 只给禁用态。

## Theming

`ThemeProvider` 是唯一入口，它做四件事：

1. 管理明暗模式（浅色 / 深色 / 跟随系统）与主题，默认存到 `localStorage`（`ui-kit:theme`、`ui-kit:accent`）；`theme-init.js` 在首帧前写好 `<html class="dark">` 与上次的画布色（`ui-kit:canvas`），避免闪烁。
   - `accent`、`mode` 都可以受控；`onAccentChange` / `onModeChange` 在 `ThemeMenu`、`ThemeToggle`、`useTheme().setAccent / setMode / toggle` 触发切换时回调（`ThemePicker` 的 `onChange` 传 `setAccent` 即可）（受控、非受控都会调）。便携版要把主题存进自己的设置文件时：读到设置后把值传给 `accent` / `mode`，回调里写回设置文件。不传这些参数时行为与 1.2.0 一致。
2. 用 `buildTheme({ accent, resolved, sidebar, glass, reducedMotion })` 生成 antd 主题，交给 `ConfigProvider`，外面包 `StyleProvider layer`，里面包 `App`。
3. 把解析后的 token 写到 `:root` 的 CSS 变量（`--ant-color-primary`、`--ant-font-size`…，扩展色是 `--kit-*`）。antd 自己的 CSS 变量只挂在组件节点上，页面里自写的元素读不到，所以要再写一遍。
4. Tailwind preset 的颜色、字号、圆角、阴影、时长都指向这些变量。

样式层级：入口 CSS 第一行声明 `@layer tailwind-base, antd;`，Tailwind 的基础重置在 antd 之下，工具类不分层、优先级最高。这样 Tailwind preflight 不会把 antd 按钮的背景清成透明，而写在 antd 组件上的 Tailwind 类仍然生效。
