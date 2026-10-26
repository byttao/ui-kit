# 更新记录

版本号遵循语义化版本：主版本号变化表示有不兼容的接口或视觉规范调整，次版本号表示新增主题 / 组件，修订号表示修复。

## 1.0.0 · 2026-10-26

首个独立版本。界面体系以 Ant Design v6 为主，ui-kit 只补 antd 没有覆盖的部分。

### 主题规范（antd-theme.ts）

- 按 antd 定制主题的 Seed → 算法 → Map → 组件四层组织；交互色由 antd 色板生成算法展开，不手写色值。
- 档位规则保证 12px 小字 ≥ 4.5:1：浅色实心色取第一个白字达标的档；深色种子往浅处取，保证 antd 用实心色写字的地方也可读；悬停 / 按下朝远离文字色的方向变化。
- 7 套主题：极客蓝、酱紫、明青（antd 色板），森翠雅韵、辉煌金韵、莫兰迪色彩、马卡龙色彩（自定义配色）。
- 默认外观：森翠雅韵、浅色、浅色侧栏、开启毛玻璃（`DEFAULTS`）。
- 功能色固定为 antd 红 / 金 / 绿 / 蓝，不随主题变化；与功能色区分度不足的主题在审计和主题选择器中标注。
- 正文 12px、说明 11px，苹方优先字体栈，墨色文字基色，冷调画布与描边。
- 系统「减弱动态效果」时使用 antd 官方的 `token.motion = false`。

### 侧栏与毛玻璃

- 侧栏随主题变化，文字、悬停、选中、图标由底色自动推出；可切换为主题色浅底；深色模式下自动压暗。
- 毛玻璃两层：卡片级玻璃面（`rgba(255,255,255,0.2)` + `blur(16px) saturate(180%)`），卡片内的列表 / 表格为内嵌玻璃；背景为主题配色渐变，强度自动收敛到文字可读。

### 组件

- 应用级组件：`AppShell`、`Page`、`Workspace`、`PageHeader`、`Panel`、`Topbar`、`StatusBar`、`DropZone`、`ListWell`、`FileRow`、`LogViewer`、`ProgressPanel`、`ThemeToggle`、`ThemePicker`。
- Tauri：`useFileDrop`（窗口级拖拽，拿得到真实路径）、`useBatchProgress`（Rust 进度事件）。
- 控件一律使用 antd；状态一律带图标；实心危险按钮只出现在确认弹窗里。

### 工具

- `design.md`：Google design.md 格式，继承 antd design.md，只写差异。
- `lib/audit.ts` + `demo` 的 `npm run check:contrast`：7 主题 × 深浅 × 侧栏样式 × 毛玻璃共 42 种组合的对比度与区分度审计。
- Tailwind v3 preset：所有值读 ThemeProvider 写在 `:root` 上的 antd token 变量。
