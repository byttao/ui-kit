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
---

## Overview

本文件**继承 [Ant Design design.md](https://ant.design/design.md) 的全部规则**，只写差异。读的顺序：先读 antd 那份，再读这份；两份冲突时以这份为准。

ui-kit 服务的是 PigResize 这类 **Tauri 桌面批处理工具**：一个侧栏、几个功能页，每页是「左侧文件列表 + 右侧设置栏 + 底部日志」。和 antd 默认面向的中后台相比，窗口更小（最小 1100 × 700）、信息更密、没有路由和整页滚动。所以差异集中在三处：

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
- 深色模式：主题侧栏色与 `#0B0F16` 按 62% 混合压暗，保留色相。
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
| 吸顶表头 | `rgba(255, 255, 255, 0.82)` | `rgba(29, 39, 53, 0.88)` |

- 深色下白色 20% 会把卡片顶成灰色、文字发虚，所以换成同结构的低透明度版本。
- 背景是主题配色放在四角与中下的径向渐变。每个色块与画布混合，混合比例从 45% 起逐步加大，直到色块中心叠上玻璃后，正文、次要、说明、主色文字、链接以及日志底上的说明文字都 ≥ 4.5:1。所以背景是柔和的，不会是高饱和大色块：玻璃只有 20% 白，背景再艳文字就压不住。
- **两层玻璃**：卡片级容器（`Panel`、`Topbar`、`StatusBar`）是玻璃面；卡片里的列表、表格（`ListWell` 及其中的 antd `Table`）是**内嵌玻璃**，只换半透明底和浅描边，不再叠模糊（嵌套的 `backdrop-filter` 只会把外层已模糊的背景再糊一次，看不出区别还费性能）。
- 内嵌玻璃浅色往上浮（白 45%，磨砂感），深色往下沉（黑 12%，凹槽感）。深色若也用白色，会把底色抬亮，主色文字掉到 4.1:1。
- 吸顶表头接近不透明，挡住滚到它下面的行。
- 输入框、下拉、弹窗、Tooltip 仍是不透明面，保证可读和可点范围清楚。
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
- **深色表面用墨色。** 深色不改 `colorBgBase`（任何带色相的底色都会被推得过饱和），而是直接覆盖 `colorBgLayout #151D29`、`colorBgContainer #1D2735`、`colorBgElevated #243042` 与两级描边。
- **深色下实心块上是深色字时，Tooltip 跟着变成浅底深字**（`colorBgSpotlight #DFE6F0`），仍是 antd 的「高对比反色面」。
- **浅色描边带冷调。** `colorBorder #D5DCE6` / `colorBorderSecondary #E5EAF1`，与冷调画布 `#F4F6FA` 配套。
- **Tag 的状态文字。** Tag 直接用 `colorSuccess` 等实心色写字，只在 `components.Tag` 里换成彩色文字档。
- **日志等级色是分类色。** 按规范取预设色板（INFO 蓝、SUCCESS 绿、WARN 橙、ERROR 红、PROCESS 紫），档位同彩色文字规则，写成 `--kit-log-*`。

**对比度是硬性要求。** 改任何颜色后，在 demo 目录运行 `npm run check:contrast`，或打开 demo 的「对比度」页。清单覆盖正文、次要、说明、占位符、表头、选中行、链接、主按钮三态、危险按钮、四种状态文字与标签、Tooltip、侧栏、日志，以及主色与功能色的区分度。共 7 套主题 × 深浅 × 侧栏样式 × 毛玻璃开关 42 种组合；毛玻璃组合额外逐个背景色块检查卡片文字、内嵌玻璃上的列表文字、吸顶表头与日志。对比度不达标即失败，区分度不足只警告。

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

每个功能页的结构：`Page` > `Workspace`（左：文件列表卡片；右：设置卡片 + 底部主按钮）+ 底部日志卡（170px）。

- **只让列表和日志滚动。** 页面本身不滚；内容型页面（如组件一览）例外，用 `<Page fill={false}>`。
- 拖拽区在列表有内容后缩成一行，把高度让给列表。

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
| `AppShell` | 侧栏 + 主区外壳 | `Layout`、`Layout.Sider`、`Menu` |
| `Page` / `Workspace` / `PageHeader` / `Topbar` / `StatusBar` | 页面骨架 | `Typography.Title` |
| `Panel` | 撑满高度的卡片，内容区可滚动 | `Card` |
| `DropZone` | 拖拽区视觉 + 点击选择 | — |
| `ListWell` / `FileRow` | 文件列表滚动容器与行 | — |
| `LogViewer` + `useLogger` | 彩色日志，跟随但可上翻 | — |
| `ProgressPanel` | 批处理进度 | `Progress` |
| `ThemeToggle` | 明暗切换 | `Button` |
| `ThemePicker` | 主题选择（配色色块 + 区分度提示） | `Tag`、`Tooltip` |
| `useFileDrop` / `useBatchProgress` | Tauri 拖拽与进度事件 | — |

ui-kit 对 antd 组件的用法约定：

- **主按钮**：每个区域最多一个 `type="primary"`，放在右栏底部，文案写明数量：「开始转换 · 5 张」。
- **危险操作不靠颜色区分。** 实心主按钮与实心危险按钮在任何主题下都不并排。规则：
  - 页面上的删除、清空用 `<Button danger>`（描边）或 `<Button danger type="text">`，**带 `DeleteOutlined` / `ClearOutlined` 图标**，文案以「…」结尾表示会先确认。
  - **实心危险按钮（`danger type="primary"`）只出现在确认弹窗里**：`modal.confirm({ okButtonProps: { danger: true } })`。它取代该弹窗的主按钮，不与实心主按钮同屏并排。
  - 同一区域不同时出现实心主按钮和实心危险按钮。
- **清空列表**：`<Button type="link" size="small">` 放在卡片标题右侧（Card 的 `extra`）。
- **部分失败保留失败项**：批处理部分失败时，成功的移出列表，失败的留在列表里并用**次级危险样式**标出：浅红底 `colorErrorBg` + 红字 `colorErrorText`（与描边危险按钮同一档），行尾带失败图标与「失败」文字，悬停时底色与文字一起加深一档。`FileRow status="error"`；antd Table 用 `FILE_ROW_ERROR_CLASS` + `FailedMark`。重新添加或清空列表时清除失败标记。
- **单选组**：竖排用 `Radio.Group` 加 `orientation="vertical"`；2–4 个互斥模式横排用 `Segmented`。
- **表格内下拉**：`<Select size="small">`。
- **状态一律带图标，不单靠颜色**（WCAG 1.4.1；森翠、金韵、马卡龙下主色与功能色同色系，更要遵守）：
  - 标签：`<Tag icon={<CheckCircleOutlined />} color="success">`；警告 `ExclamationCircleOutlined`、失败 `CloseCircleOutlined`、处理中 `<SyncOutlined spin />`、待处理 `ClockCircleOutlined`。
  - 提示条：`<Alert showIcon type="…" title="…" />`，写 `title` 不写 `message`（v6 已弃用）。
  - 日志等级已有 `[SUCCESS]` / `[WARN]` 等文字前缀，不需要另加图标。
- **轻提示**：`App.useApp().message`，不要用静态的 `message.success()`（拿不到主题）。
- **拖拽上传不用 `Upload.Dragger`**：它走 HTML5 `dataTransfer`，在 Tauri 里拿不到本地路径。用 `useFileDrop` + `DropZone`。
- v6 已弃用、不要再写：`Space direction`（改 `orientation`）、`Alert message`（改 `title`）、`Progress trailColor`（改 `railColor`）。

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
- **Do** 每个功能页各自一份 `useLogger()`。

## Theming

`ThemeProvider` 是唯一入口，它做四件事：

1. 管理明暗模式（浅色 / 深色 / 跟随系统），存到 `localStorage`；`theme-init.js` 在首帧前写好 `<html class="dark">`，避免闪烁。
2. 用 `buildTheme({ accent, resolved, sidebar, glass, reducedMotion })` 生成 antd 主题，交给 `ConfigProvider`，外面包 `StyleProvider layer`，里面包 `App`。
3. 把解析后的 token 写到 `:root` 的 CSS 变量（`--ant-color-primary`、`--ant-font-size`…，扩展色是 `--kit-*`）。antd 自己的 CSS 变量只挂在组件节点上，页面里自写的元素读不到，所以要再写一遍。
4. Tailwind preset 的颜色、字号、圆角、阴影、时长都指向这些变量。

样式层级：入口 CSS 第一行声明 `@layer tailwind-base, antd;`，Tailwind 的基础重置在 antd 之下，工具类不分层、优先级最高。这样 Tailwind preflight 不会把 antd 按钮的背景清成透明，而写在 antd 组件上的 Tailwind 类仍然生效。
