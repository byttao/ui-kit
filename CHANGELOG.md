# 更新记录

版本号遵循语义化版本：主版本号变化表示有不兼容的接口或视觉规范调整，次版本号表示新增主题 / 组件，修订号表示修复。

## 1.6.2 · 2026-11-28

修复 macOS（WKWebView）上自定义滚动条不生效的缺陷。只改样式，未新增或删除导出，属修订版。

### 修复

- **macOS 上滚动条不可见，横向溢出的表格看起来像被截断。** 原因：WebKit 只有在 `::-webkit-scrollbar` 上重置 `-webkit-appearance` 后才会采用自定义滚动条样式，否则仍用系统覆盖式滚动条——不滚动时整条隐藏。`styles/base.css` 的全局 `::-webkit-scrollbar` 已补 `-webkit-appearance: none;`，Windows（WebView2）与 macOS 行为一致。

### 对使用方的影响

- macOS 上滚动条从「滚动时才浮现」变成常显细条（宽 8px）；Windows 无变化。
- 以源码拷入的项目需重新拷贝 `styles/base.css`，或在各自全局样式里补一条 `::-webkit-scrollbar { -webkit-appearance: none; }`。

## 1.6.1 · 2026-11-16

修复毛玻璃下 `StatusBar` / `Topbar` 底色被盖成实心的缺陷，并统一侧栏底栏与 `StatusBar` 相邻时的高度、边线和底色。只改内部类名与样式，没有新增或删除导出，所以是修订版。

### 修复

- **毛玻璃开启时，`StatusBar`（底部状态栏）是纯白条（深色下是实心卡片色），不是半透明玻璃面；`Topbar` 同理。** 原因：两个组件的根元素同时带了 `bg-container`（Tailwind 工具类，不分层、优先级最高）和 `kit-glass`（`@layer components`），`bg-container` 把 `kit-glass` 的玻璃底色盖掉了。现在毛玻璃开启时 `Topbar` 只带 `kit-glass`（底色与描边都来自玻璃面，与 `Panel` 一致），关闭时保持 `bg-container` 实心。
- **侧栏底栏（`sidebarFooter`）与 `StatusBar` 并排时接缝不齐：**
  1. 高度差 1px：`sidebarFooter` 是 `py-3` + 24px 按钮 + 1px 上边线 = 49px，`StatusBar` 是 48px，两条上边线错开一行。现在两栏都是 48px（含上边线），`sidebarFooter` 改为 `h-12` 内容垂直居中，不再靠 padding 撑高。
  2. 上边线颜色不一致：浅色侧栏下，侧栏底栏是 `sidebar-border`，`StatusBar` 是玻璃描边（白 30%，比底色还亮，几乎看不见）。现在浅色侧栏下两条线都是 `color-border-secondary`（与侧栏右侧竖线同色，竖线贯穿到底）；主题色 / 深色侧栏下侧栏那条仍用 `sidebar-border`。
  3. 深色毛玻璃下 `StatusBar` 是比两侧都亮的玻璃色带，在侧栏边被切断。现在毛玻璃开启时 `StatusBar` **背景透明**（跟主区这一列，露出背景渐变），不再有玻璃底、模糊、玻璃描边和阴影，只留一条上边线。毛玻璃关闭时仍是实心 `bg-container`。
- 排查了其它同时带实心底色类和 `kit-glass` 的组件：`Panel`（本来就不带 `bg-*`）、`ListWell`（本来就是 `glass ? "kit-glass-inset" : "bg-container"`）没有这个问题，只有 `Topbar` 与 `StatusBar` 受影响。

### 对使用方的影响

- 视觉：毛玻璃开启时，`Topbar` 从实心变回半透明玻璃面；`StatusBar` 变成透明底（不是玻璃面）；侧栏底栏变矮 1px 并与 `StatusBar` 同线。毛玻璃关闭时，只有侧栏底栏高度从 49px 变成 48px、浅色侧栏下它的上边线颜色改为 `color-border-secondary`。
- 对比度：`StatusBar` 文字（正文 / 次要 / 说明）直接压在背景渐变上，审计新增「毛玻璃 · 状态栏 … · 色块 1–5 / 画布底色」，每种毛玻璃组合多 18 组（共 168 组），42 种组合全部通过。
- 之前为绕开此缺陷写的 `className="!bg-[var(--kit-glass-bg)]"` 之类可以删掉：不删的话它会把 `StatusBar` 重新涂成玻璃底，又和侧栏底栏对不齐。

### 新增

- demo 外壳现在带 `Topbar` 与 `StatusBar`，作为这类回归的检查点。
- 审计：毛玻璃下的状态栏文字（见上）。

### 约定（design.md / AI_GUIDE）

- 玻璃面的底色只来自 `kit-glass`：组件里写 `glass ? "kit-glass …" : "bg-container"`，不要两者同时带；使用方也不要给 `Topbar` / `StatusBar` / `Panel` 传 `bg-*` 去改底色。
- 新增「相邻底栏」规则（design.md「Colors · 毛玻璃」）：侧栏底栏与 `StatusBar` 要么合成一条，要么各自继承所在列的底色，接缝处不出现第三种颜色；两栏等高 48px（含上边线）；上边线粗细一致，浅色侧栏下同色；竖线不被截断。`sidebarFooter` / `StatusBar` 内容自己居中，不加 `py-*` 撑高。

### 不兼容变化

没有删改导出。`sidebarFooter` 的容器不再带 `py-3`，改为固定 48px 高；如果你放进去的内容高于 24px（例如自己加了 `py-*` 的大按钮），会被裁切 / 溢出，请改成不超过 48px 的单行内容。

### 从 1.6.0 升级

1. 覆盖 ui-kit 目录：`rsync -a --delete --exclude demo --exclude .git --exclude .claude <ui-kit>/ src/ui-kit/`（`theme-init.js` 未改）。
2. 在业务代码里搜 `kit-glass-bg`、`!bg-[`，删掉传给 `StatusBar` / `Topbar` 的 `className="!bg-[var(--kit-glass-bg)]"` 这类绕法（毛玻璃开关的条件判断一并去掉）。例如「税审·服务器管理工具」的 App 里给 `StatusBar` 传的那个 `className`。
3. 检查 `sidebarFooter` 里有没有自己加的 `py-*` / 高于 24px 的元素，去掉。
4. 跑 `npm run build`、`antd lint`，在毛玻璃开 / 关、浅 / 深下各看一眼窗口底部：侧栏底栏与状态栏等高、上边线在同一行；毛玻璃开时状态栏是透明的（能看到背景渐变），关时是实心。

## 1.6.0 · 2026-11-14

处理绘境升级到 1.5.0 后记下的三条问题（摩擦点第十一节）。新增导出（`ScrollField`、`useFieldScroll`、`scrollToField`、`FIELD_ATTR`）与参数，没有删除或改名任何导出，所以是次版本。

### 修复

- **「下面还有」按钮盖住底边那一行内容、在设置页里像控件选项。** 改为滚动区**下方**的提示行：虚线分隔 + 说明色 11px「向下滚动查看更多 ↓」，占自己的 24px 高度（滚动区相应变矮），不叠在内容上，也不是按钮外观；点击向下滚一屏，滚到底自动消失。`ScrollArea`、`SettingsScroll`、`Workspace` 右栏是同一实现，三处一致。
- **`AdvancedSection` 长标题在 300px 右栏换行。** 标题单行省略；「已改 N 项」与「恢复默认」不收缩、不换行；新增 `description`（标题下第二行，说明色、单行省略）。

### 新增

- `ScrollField`：字段锚点，包住一个或几个表单项（只加 `data-kit-field` 属性，不依赖 antd 内部类名）。
- `scrollToField(container, name)` 与 `useFieldScroll()`：只滚指定的滚动容器，字段顶部对齐容器顶部；`useFieldScroll()` 返回给 `SettingsScroll` / `ScrollArea` 用的 `ref` 与 `scrollToField(name)`。
- `AdvancedSection` 新增 `description`。
- 配方：任务队列页「比例与张数 ↓」改用 `ScrollField` + `useFieldScroll`。
- demo「组件一览」：300px 宽的 `AdvancedSection`（过长标题 + 说明 + 已改 N 项 + 恢复默认）、`ScrollArea` 提示行 + 按字段滚动。
- 审计：「滚动提示行」「高级折叠 · 说明」（说明文字 · 卡片底；毛玻璃下由「说明 · 色块」覆盖）。每种组合 70 组（毛玻璃 150 组），42 种组合全过。

### 约定（design.md / AI_GUIDE）

- 滚动提示放在滚动区下方、占自己的高度，不叠在内容上、不做成按钮外观；不用渐隐遮罩。
- 按字段滚动用 `ScrollField` + `scrollToField`，不再写 `querySelector("#id").closest(".ant-form-item")`。
- `AdvancedSection` 标题 2–4 个字，说明写 `description`。

### 不兼容变化

没有删改导出。视觉上的差别：

- `moreHint` 的默认文字从「下面还有」变成「向下滚动查看更多」，样式从浮动小按钮变成下方提示行；内容超出时滚动区会矮 24px。传了自定义 `moreHint` 文字的照常显示在提示行里。

### 从 1.5.0 升级

1. 覆盖 ui-kit 目录：`rsync -a --delete --exclude demo --exclude .git --exclude .claude <ui-kit>/ src/ui-kit/`（`theme-init.js` 未改）。
2. 「比例与张数 ↓」这类跳转：`const fields = useFieldScroll()`，`<SettingsScroll ref={fields.ref}>`，目标表单项外包 `<ScrollField name="size">`，点击时 `fields.scrollToField("size")`；删掉 `querySelector("#…").closest(".ant-form-item")` 与控件上为此加的 `id`。
3. `AdvancedSection` 的标题若写过「高级 · xxx」，改回「高级」，说明放 `description`。
4. 跑 `npm run build`、`antd lint`。

## 1.5.0 · 2026-11-14

处理绘境真实窗口验收后记下的问题（摩擦点第九节）。新增组件与参数、没有删除或改名任何导出，所以是次版本（不是 1.4.1）。

### 修复

- **`LogViewer` 的工具条盖住长日志行末尾。** 传 `onClear` / `copyable` 时，「复制全部」「清空」不再浮在日志区右上角，改为日志区右侧单独一列竖排，不与文字重叠。

### 新增

- `LogActions`：日志的「复制全部」「清空」图标按钮，放在 Panel 标题栏：`<Panel extra={<LogActions logs={logs} onClear={clear} />}>`（推荐写法，四个配方已改用）。
- `LogViewer` 新增 `toolbar="side" | "none"`（none 时不渲染工具条）与 `copyText`（自定义写剪贴板，如 Tauri clipboard-manager 插件）；`LogActions` 同样支持 `copyText`。导出 `LogViewerProps`、`LogActionsProps`、`CopyText` 类型。
- `ImageGrid`、`ThumbStrip` 新增 `fit="cover" | "contain"`（`Thumb` 已有）：长条图、比例悬殊的一组图完整显示。
- `ScrollArea`：纵向滚动区，内容超出且没滚到底时底部浮「下面还有」小按钮（点击下滚一屏），ref 指向滚动容器。
- `SettingsScroll` 支持 `ref`（指向滚动容器，可滚到某个字段）与 `moreHint`（默认开启）。
- `Workspace` 右栏滚动区改用 `ScrollArea`：新增 `asideRef`、`asideMoreHint`（默认开启）。
- `AdvancedSection`：「高级」折叠（antd Collapse ghost），与上下 Form.Item 左对齐，不再需要 `-mx-3`；`changedCount` 显示「已改 N 项」，`extra` 放「恢复默认」。
- 配方：任务队列页加「高级」折叠与标题栏「比例与张数 ↓」跳转入口（演示 `SettingsScroll` 的 ref）；图库页加「裁切 / 完整」切换；四个配方的日志按钮改放标题栏。
- 审计新增：「下面还有」提示按钮、「已改 N 项」标签。每种组合 69 组（毛玻璃 149 组），42 种组合全过。
- demo「组件一览」：长日志行两种工具条对比、`ImageGrid` cover / contain 切换（含 1376 × 383 长条样图）、`ScrollArea` 提示、`AdvancedSection`。

### 验证

- **「复制全部」写系统剪贴板已在真实 Tauri 窗口验证**：Tauri 2.12.5（macOS WKWebView）加载 demo，用辅助功能接口按下「复制全部日志」，`pbpaste` 读到完整的 9 行日志（含中文）。Windows（WebView2）未验证。

### 约定（design.md / AI_GUIDE）

- 日志的清空 / 复制全部放日志卡片标题栏（`LogActions`），与「清空列表」同一位置。
- 会被截断的滚动区给「下面还有」提示；关键参数离得远时，参数卡片标题栏放跳转入口；不用渐隐遮罩（毛玻璃面上对不上底色）。
- 「高级」折叠：低频参数放参数区最后、默认折叠，标题旁「已改 N 项」，右侧「恢复默认」；一个页面最多一个。
- 图片默认 cover，长条图 / 比例悬殊时 contain，图库可给「裁切 / 完整」切换。

### 不兼容变化

没有删改导出。视觉上的差别：

- `LogViewer` 传 `onClear` / `copyable` 时，工具条从「浮在右上角」变成「右侧一列」，日志区宽度少约 28px。想保持全宽，改用 `LogActions` 放标题栏。
- `SettingsScroll` 与 `Workspace` 右栏多了一层不滚动的外层（用于定位提示按钮）；`className` 仍作用在滚动容器上。内容超出时会出现「下面还有」按钮，不想要传 `moreHint={false}` / `asideMoreHint={false}`。

### 从 1.4.0 升级

1. 覆盖 ui-kit 目录：`rsync -a --delete --exclude demo --exclude .git --exclude .claude <ui-kit>/ src/ui-kit/`（`theme-init.js` 未改）。
2. 自写的日志按钮（如绘境 `src/components/LogActions.tsx`）换成 kit 的 `LogActions`，放在 Panel 的 `extra`；`LogViewer` 不再传 `onClear`。
3. 图库从外层写的 `[&_img]:object-contain` 换成 `ImageGrid` 的 `fit="contain"`。
4. 参数区自写的 IntersectionObserver +「比例与张数 ↓」：滚动提示交给 `SettingsScroll`（默认开启）；跳转入口保留，滚动容器改用 `SettingsScroll` 的 ref。
5. `Collapse ghost` + `-mx-3` 的「高级」折叠换成 `AdvancedSection`。
6. 跑 `npm run build`、`antd lint`。

## 1.4.0 · 2026-11-13

绘境升级到 1.3.0 后记下的问题（摩擦点第七、八节）全部处理；新增四个页面配方，AI_GUIDE 第 6 步改成「先选配方再写页面」。新增组件与参数、没有删除或改名任何导出，所以是次版本。

### 新增

- **页面配方** `recipes/`：批处理页、任务队列页、图库页、设置页，完整可运行（demo「页面配方」分组），数据层以 props 注入（`BatchBackend` / `QueueApi` / `SettingsApi` / 图库 `items`），拷到项目后换成 invoke 实现即可。`recipes/mock.ts` 是 demo / 测试用的内存数据层。AI_GUIDE 每个配方一章：何时用、骨架、状态与空态、主按钮、数据层与 Rust 端约定。
- `RatioSelect`：比例 / 尺寸选择器（antd Select，选项带按真实比例画的小图示与尺寸说明）；`ratioOptionLabel` 可单独用在 Segmented / Radio 里。
- `ErrorBoundary`：渲染出错时显示原因、「复制错误信息」与「重新加载」（`size="page"` 时是「重试」，只重建这一页）；`fallback` / `onError` 可自定义。
- `LinkTag`：可点击的标签（跳转 / 定位），antd Tag + 按钮语义（role、可聚焦、回车 / 空格），`disabled` 表示目标已不存在。
- `useRowFlash` / `ROW_FLASH_MS`：「定位并闪一下」，`flash(id)` 后行高亮 2 秒自动取消；目标在另一页时先切页再 flash 即可。
- `ImageBadge`：叠在图片上的角标（实底卡片色 + 描边 + 正文色），任意图片、深浅主题下都看得清。
- `ThumbStrip` 的 `ThumbItem` 新增 `caption`（图下常显说明，如 `#12-1`）与 `badge`（左上角标）。
- `ImageGrid`：`selectedKey` 变化时自动把选中瓦片滚到可见（`scrollToSelected`，默认开）；`badgePlacement="top-left" | "bottom-left"`；瓦片带 `data-key`。
- `useTaskEvents` 新增 `listen`（注入订阅函数）与 `enabled`；新增 `createMockTaskBackend()`：非 Tauri 环境（浏览器预览、组件测试）也能订阅与加载，不必伪造 `window.isTauri`。
- 审计新增：图片角标、可点击标签悬停 / 不可用、缩略图说明。每种组合 67 组（毛玻璃 147 组），42 种组合全过。
- demo：四个配方页（队列 ↔ 图库互相定位、`ErrorBoundary size="page"` 包住每页）；「组件一览」加入 `LinkTag` + `useRowFlash`、`ThumbStrip caption / badge`、`ImageGrid` 定位、`RatioSelect`、`ErrorBoundary` 演示。

### 修复 / 补测

- `scripts/icon/make-icons.sh` 在真实 Tauri 项目（绘境的副本）里完整跑通：渲染 → `npx tauri icon` → png / ico / icns 各尺寸四角透明校验全部通过。
- `LogViewer`「复制全部」的成功路径已验证（复制内容为「时间 [等级] 内容」逐行，提示「已复制 N 条日志」）。

### 约定（design.md / AI_GUIDE）

- AI_GUIDE 第 5 步：主题受控时「读设置 → 受控主题」的完整入口写法，外层错误放进 state、由 ThemeProvider 里面的小组件用 `App.useApp().message` 提示；入口包 `ErrorBoundary`。
- AI_GUIDE 第 6 步：先按「批处理 / 任务队列 / 图库 / 设置」选配方，再写页面。
- 可点击标签用 `LinkTag`；定位高亮主色内描边 2 秒（图库用选中定位）；图片上的文字用 `ImageBadge`，不用 `bg-spotlight` / 半透明黑底 / 主色底。
- `brand.mark` 两种情况写清：单色字形（字母 / currentColor SVG，套反色块）与彩色图标（`{ src }`，原样显示、不套色块，用不带留边的版本）。
- `RatioPreview` 的两种语义：整张等分拆切不传 `cellRatio`（每张比例写进 caption）；只有「合成后每格再裁切」才传。
- 错误兜底：入口一层、每个常驻功能页一层；事件回调与 Promise 里的异常用 try/catch。

### 不兼容变化

没有。行为上的细小差别：

- `ImageGrid` 默认会在 `selectedKey` 变化时滚动列表；不想要时传 `scrollToSelected={false}`。

### 从 1.3.0 升级

1. 覆盖 ui-kit 目录：`rsync -a --delete --exclude demo --exclude .git --exclude .claude <ui-kit>/ src/ui-kit/`（`theme-init.js` 本版未改，不用重拷）。`recipes/` 会一起拷进来，不引用不会进包；不想要可以加 `--exclude recipes`。
2. 自写的错误边界换成 kit 的 `ErrorBoundary`（放在 `ThemeProvider` 里面）；常驻功能页可再包 `<ErrorBoundary size="page">`。
3. 自写的定位计时器换成 `useRowFlash`；`Tag` 上手写的 `role="button"` / `tabIndex` / `onKeyDown` 换成 `LinkTag`。
4. 自写的「缩略图 + 下方编号」条换成 `ThumbStrip` 的 `caption`；图片角标换成 `ImageBadge`；图库外层按 `[aria-pressed]` 查找再滚动的代码可以删（`ImageGrid` 自带）。
5. 比例下拉换成 `RatioSelect`（选项 `{ value, size }`）。
6. 为测试伪造 `window.isTauri` 的地方改成 `useTaskEvents({ listen: backend.listen, load: backend.load })` + `createMockTaskBackend()`。
7. 跑 `npm run build`、`antd lint`；改过颜色的跑 `npm run check:contrast`。

## 1.3.0 · 2026-11-13

按「绘境」（AI 出图应用）的使用摩擦点改进：补齐列表、缩略图、设置页、队列这类应用级组件，修复深色模式配色，文档与 1.2.0 的实际导出对齐。

### 修复

- **深色模式主区不随主题变化。** 选了极客蓝以外的主题后切到深色，侧栏跟随主题，但画布、`Panel`、毛玻璃背景、日志区、输入框底色始终是极客蓝的冷蓝墨色。原因是 `antd-theme.ts` 的深色表面（`SURFACES.dark`）、深色吸顶表头、日志底、深色侧栏的压暗色都是写死的极客蓝墨色。现在由 `surfaceColors(accent, "dark")` 从参考墨色按主题侧栏色的色相重新着色：低彩度、按 WCAG 相对亮度对齐参考值（对比度结论不随主题变化），新增主题不需要写任何深色色值。极客蓝与全部主题的浅色模式逐值不变。
- 深色主题启动时首帧闪一下极客蓝画布：`ThemeProvider` 记下画布色（`localStorage` 的 `ui-kit:canvas`），`theme-init.js` 首帧前套用。
- 失败行（`FILE_ROW_ERROR_CLASS`）里的 antd `Typography` 与中性 `Tag` 保留自己的颜色，盖过整行红字：现在自动继承行色（中性 Tag 去底、换危险描边）；带状态色的 Tag 保留语义色。不再需要手写 `text-inherit`。
- 文档版本号仍写 1.1.0、目录树与组件速查表缺 1.2.0 的 `ThemeMenu` 等：README、AI_GUIDE 与 `index.ts` 导出逐项对齐。

### 新增

- `Workspace` 的 `asideFooter`：右栏底部常驻区（进度 + 主按钮），右栏参数区单独滚动，参数再多主按钮也不会被挤出可视区。
- `ListRow`：富列表行（序号、`leading` 缩略图槽、`title`、`meta`、`extra` 第二行起、`trailing` 行尾操作、`status="error"`、`selected`、`highlight` 定位高亮并滚到可见、多行高度）。`FileRow` 不变。
- `Thumb` / `ThumbStrip` / `localImageSrc`：本地图缩略图（`convertFileSrc` + antd `Image`、加载 / 失败占位、固定比例裁切、受控预览）；缩略图条与参考图墙（可带移除角标、可翻页预览）。
- `ImageGrid`：可选中图片瓦片，双击大图，大图里翻页同步选中（`Image.PreviewGroup` 受控）。
- `RatioIcon` / `RatioPreview` / `parseRatio`：按真实宽高比画的小图示与比例 / 宫格预览框（可画每格裁切范围）。
- `SettingsSection` / `SettingsScroll`：设置页表单分区与长表单滚动容器。
- `EmptyState`：图标 + 文案 + 操作按钮的空状态 / 缺配置引导（基于 antd `Empty`）。
- `NavBadge`：侧栏徽标，反色块（进行中）/ 弱数字（数量），各主题、深浅侧栏、悬停 / 选中底上都可读。
- `StatusTag`：带图标的状态 Tag 预设（排队中 / 进行中 / 已完成 / 失败 / 警告 / 已取消）。
- `FieldHint`：右栏参数提示 / 警示（11px + 图标）。
- `AppShell` 的 `brand.mark` 可传 `{ src, alt? }` 图片（应用图标）。
- `ThemeProvider`：`mode` 可受控；新增 `onAccentChange` / `onModeChange`（受控、非受控都会回调），便携版可把主题存进自己的设置文件。
- `LogViewer` 的 `onClear` / `copyable`：右上角内置「复制全部」「清空」。`useLogger` 新增 `{ limit, channel }` 写法与 `pushLog(channel, …)`：React 之外写入，页面挂载前的日志先缓冲。另导出 `createLogEntry`、`logsToText`。
- `useTaskEvents`（Tauri）：多任务队列的约定与 hook，订阅 `task-updated` / `task-removed`、先订阅后加载、加载期间的事件不丢。
- `scripts/icon/`：`render-svg.swift`（AppKit 渲染透明底 PNG）、`check-alpha.swift`（逐尺寸校验四角透明）、`make-icons.sh`（一条龙）。
- 导出 `surfaceColors`、`glassColors`、`ThemeProviderProps`、`WorkspaceProps`、`Brand` 等类型。
- 审计新增：中性标签、失败行中性标签、缩略图占位图标、图片瓦片选中描边、比例预览描边与编号、参数提示 / 警示（含毛玻璃各色块）、导航徽标。每种组合 63 组（毛玻璃 143 组），42 种组合全过。
- demo：「任务队列」「设置」两个页面模板（`demo/src/templates.tsx`），「组件一览」加入全部新组件，品牌标记字母 / 图片切换，`ThemeProvider` 回调演示。

### 约定（design.md / AI_GUIDE）

- 主按钮放 `asideFooter`；非批处理页的主按钮写「动词 + 对象」（「保存设置」「继续修改 · 这张」）。
- 有状态的功能页常驻、用 `hidden` 切换，不要按路由卸载（日志、草稿、事件订阅会丢）。
- 行尾操作最多 3 个图标按钮，其余收进「更多」菜单，删除放最后。
- 右栏参数提示 / 警示用 `FieldHint`，不在 300px 右栏里放 `Alert`。
- 「控件一律用 antd」的例外写明：可选中卡片用原生 `button`（照 `ImageGrid` / `ThemePicker`）；内联 `style` 只给运行时算出的尺寸、比例、列数与要原样展示的色块。
- SVG 用 `fill-*` / `stroke-*` token 类；示意图配色约定。
- 设置页排版规范（分区、草稿 / 保存 / 放弃修改、外观即时生效）。
- 应用图标：macOS 留边规范；`qlmanage` 渲染 SVG 会垫白底，不要用。
- AI_GUIDE：tauri 依赖需 `features = ["protocol-asset"]`；opener 插件与 `opener:default` 权限；自检第 5 条改为检查静态导入的 `message` / `notification` 与 `Modal.confirm(` 等，不再误伤 `App.useApp()` 的 `message.success(`；Rust 端「多任务队列」约定与批处理并列。

### 不兼容变化

都是视觉或边角行为，没有删除或改名任何导出，所以定为次版本 1.3.0（深色配色的变化属于修复）：

- **深色模式下，极客蓝以外的 6 个主题主区颜色变了**（画布、卡片、浮层、描边、文字基色、毛玻璃背景、日志等级色可能差一档）。对比度结论不变，审计全过。截图对比、视觉回归测试需要更新基线。
- **失败行里的 `Typography` 与中性 `Tag` 变成红字**（原来保留自己的颜色）。之前手写的 `text-inherit` 可以删，留着也无害。
- `ThemeProvider` 传了 `accent`（受控）时，`setAccent` 不再偷偷写 `localStorage` / 内部状态，只调用 `onAccentChange`；`mode` 受控时同理。
- `ThemeProvider` 会在 `<html>` 上写内联 `background-color`（当前画布色）。项目里若给 `html` 设过背景色，会被覆盖。
- `theme-init.js` 更新了，需要重新拷到 `public/`。
- `LogViewer` 传了 `onClear` / `copyable` 时，`className` 作用在外层容器上（不传时与 1.2.0 相同）。

### 从 1.2.0 升级

1. 覆盖 ui-kit 目录：`rsync -a --delete --exclude demo --exclude .git /tmp/ui-kit/ src/ui-kit/`，再 `cp src/ui-kit/theme-init.js public/theme-init.js`。
2. 确认 `src-tauri/Cargo.toml` 的 tauri 依赖有 `features = ["protocol-asset"]`、capabilities 里有 `opener:default`（用到打开链接 / 在访达中显示时）。
3. 右栏主按钮：把 `aside` 里 `<div className="mt-auto …">进度 + 主按钮</div>` 移到 `Workspace` 的 `asideFooter`；参数多的页面把参数卡片改成 `<Panel fill className="min-h-0 flex-1">` + `SettingsScroll`。
4. 日志：删掉 Panel `extra` 里自写的「清空日志」按钮，改成 `<LogViewer logs={logs} onClear={clear} />`。
5. 自写组件换成 kit 组件（可选，逐个换）：任务行 → `ListRow` + `StatusTag`；缩略图 → `Thumb`；参考图墙 → `ThumbStrip columns={4} onRemove`；图库瓦片 → `ImageGrid`；比例图示 → `RatioIcon` / `RatioPreview`；设置分区 → `SettingsSection` / `SettingsScroll`；侧栏徽标 → `NavBadge`；大号空状态 → `EmptyState`。
6. 主题存在自己设置文件里的项目：把同步逻辑换成 `ThemeProvider` 的 `accent` / `mode` 受控 + `onAccentChange` / `onModeChange`。
7. `demo` 目录下（或项目里）跑一遍 `npm run build`；改过颜色的项目跑 `npm run check:contrast`；深色模式逐个主题看一遍。

## 1.2.0 · 2026-10-27

### 新增

- `ThemeMenu`：侧栏底部的主题切换按钮，点开是主题列表（配色色块 + 名称），放在 `ThemeToggle` 旁边。
- `useTheme()` 新增 `setAccent`。`ThemeProvider` 不传 `accent` 时自己保存主题，选择写入 `localStorage`（`ui-kit:accent`），下次打开沿用；传了 `accent` 仍是受控用法，与 1.1.0 一致。

## 1.1.0 · 2026-10-27

### 新增

- `FileRow` 新增 `status="error"`：处理失败的行用次级危险样式（浅红底 `colorErrorBg` + 红字 `colorErrorText`，与 antd 描边危险按钮同一档），行尾带失败图标与「失败」文字；悬停时底色与文字一起加深一档，保持 ≥ 4.5:1。
- 导出 `FILE_ROW_ERROR_CLASS`（给 antd Table 的 `rowClassName` 用，与 `FileRow` 失败行一致）与 `FailedMark`（失败图标 + 文字，颜色继承所在行）。
- 审计新增「失败行」「失败行 · 悬停」「失败行 · 选中」三组对比度。

### 约定

- 批处理部分失败时：成功的移出列表，失败的留在列表并标为失败，方便调整后重试；重新添加或清空列表时清除失败标记。

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
