# ui-kit · Tauri 2 + React + Ant Design 6 桌面界面套件

**版本 1.1.0** · 仓库 <https://github.com/byttao/ui-kit> · 更新记录见 [CHANGELOG.md](CHANGELOG.md)

以 **Ant Design v6** 为主：控件、动效、主题系统、色彩体系都用 antd；ui-kit 只补 antd 没覆盖的部分——12px 高密度正文、AA 对比度、深蓝墨色侧栏、桌面工具的页面骨架和 Tauri 集成。

| 来源 | 拿来了什么 |
|---|---|
| **Ant Design v6**（框架） | 全部控件、动效、`ConfigProvider` 主题、色彩体系（12 色板）、[design.md](https://ant.design/design.md) 设计语言 |
| **Tailwind CSS v3** | 只负责布局（flex / grid / 间距 / 尺寸）和自写元素的颜色；所有值读 antd token |
| **ui-kit**（本目录） | 主题规范 `antd-theme.ts`、设计差异 `design.md`、应用外壳、拖拽区、日志、进度面板、Tauri hooks、对比度审计 |

先读 **[design.md](design.md)**：它继承 antd 的 design.md，只写差异（字号、对比度、主题、侧栏、毛玻璃、页面骨架、组件用法约束）。

```bash
cd ui-kit/demo && npm install && npm run dev   # http://localhost:5180
npm run check:contrast                          # 主题审计：42 种组合的对比度与区分度
```

---

## 一、目录

```
ui-kit/
├── package.json              版本号与依赖（peerDependencies），不发布到 npm
├── CHANGELOG.md              更新记录
├── design.md                 设计差异（google design.md 格式，继承 antd design.md）
├── antd-theme.ts             主题规范：主题（种子 + 配色）、功能色、档位规则、侧栏、毛玻璃 → ConfigProvider theme
├── theme.tsx                 ThemeProvider / useTheme（StyleProvider + ConfigProvider + App）
├── theme-init.js             首帧主题脚本（防闪烁）
├── tailwind.preset.cjs       Tailwind preset：颜色、字号、圆角、阴影、时长都指向 antd 变量
├── styles/base.css           桌面化基础样式（滚动条、不可选中、减弱动效）
├── lib/
│   ├── cn.ts                 className 合并（已登记自定义刻度）
│   ├── contrast.ts           WCAG 对比度、OKLab ΔE
│   └── audit.ts              主题审计清单
├── components/app/           antd 没有的应用级组件
│   ├── app-shell.tsx         AppShell / Topbar / StatusBar / Page / PageHeader / Workspace / Panel
│   ├── drop-zone.tsx         DropZone
│   ├── file-list.tsx         ListWell / FileRow（含失败状态）/ FailedMark / fileName
│   ├── log-viewer.tsx        LogViewer + useLogger
│   ├── progress-panel.tsx    ProgressPanel（antd Progress）
│   ├── theme-toggle.tsx      ThemeToggle
│   ├── theme-menu.tsx        ThemeMenu（侧栏主题切换）
│   └── theme-picker.tsx      ThemePicker（主题选择）
├── tauri/
│   ├── useFileDrop.ts        窗口级拖拽（拿得到真实路径）
│   ├── useBatchProgress.ts   订阅 Rust 进度事件
│   └── tauri.conf.snippet.json
├── index.ts                  统一出口
└── demo/                     演示与验证工程（含「组件一览」「对比度」页）
```

---

## 二、接入新项目

**1. 拷贝目录**：把 ui-kit 放进 `src/ui-kit/`，不带 `demo/`。

```bash
git clone https://github.com/byttao/ui-kit.git /tmp/ui-kit
rsync -a --exclude demo --exclude .git /tmp/ui-kit/ src/ui-kit/
```

升级时同样操作，再对照 CHANGELOG.md 检查不兼容变化。项目里用的版本可以读 `UI_KIT_VERSION`。

**2. 装依赖**（版本与 demo 一致）

```bash
npm i antd@^6.6 @ant-design/cssinjs@^2.1 @ant-design/colors@^8 @ant-design/icons@^6 clsx tailwind-merge
npm i -D tailwindcss@3 postcss autoprefixer
```

`@ant-design/cssinjs` 的版本必须与 antd 依赖的一致（`npm ls @ant-design/cssinjs` 只应出现一个版本）。

**3. Tailwind**

```js
// tailwind.config.cjs
module.exports = {
  presets: [require("./src/ui-kit/tailwind.preset.cjs")],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

**4. 入口 CSS**：顺序不能换。

```css
/* src/index.css */
@layer tailwind-base, antd;

@import "./ui-kit/styles/base.css";

@layer tailwind-base {
  @tailwind base;
}
@tailwind components;
@tailwind utilities;
```

第一行决定层级：Tailwind 的基础重置在 antd 之下（否则 preflight 会把 antd 按钮的背景清成透明），工具类不分层、优先级最高（写在 antd 组件上的 Tailwind 类能生效）。

**5. HTML**：把 `theme-init.js` 拷到 `public/`，在 `index.html` 的 `<head>` 里加 `<script src="/theme-init.js"></script>`。

**6. Provider**

```tsx
import { ThemeProvider } from "./ui-kit";

<ThemeProvider>   {/* 默认：accent="forest" sidebar="light" glass，见 DEFAULTS */}
  {/* accent: geekblue | purple | cyan | forest | gold | morandi | macaron */}
  <App />
</ThemeProvider>
```

`ThemeProvider` 内部已经包好 `StyleProvider layer` → `ConfigProvider`（主题 + 中文语言包）→ antd `App`，不要再自己包一层 `ConfigProvider`。

---

## 三、主题规范

按 antd [定制主题](https://ant.design/docs/react/customize-theme-cn) 的四层组织；交互色由 antd [色彩体系](https://ant.design/docs/spec/colors-cn) 的色板生成算法展开，不手写：

| 层 | 内容 |
|---|---|
| Seed | 主题的交互主色种子、功能色（antd 红 / 绿 / 金 / 蓝）、`fontSize: 12`、字体栈、墨色文字基色、`motion` |
| 算法 | `defaultAlgorithm` / `darkAlgorithm` |
| Map | 色板各档按档位规则写入 Hover / Active / Bg / Border / Text；表面色、文字透明度、`fontSizeSM: 11` |
| 组件 | Menu / Layout（侧栏随主题）、Tag、Tabs、Button、Card、Table、Image |

**主题**（`<ThemeProvider accent>`）= 交互主色种子 + 一组配色。种子推出按钮、链接等交互色（保证 AA）；配色用在侧栏、毛玻璃背景和主题选择器上。

| `accent` | 名称 | 来源 | 区分度提示 |
|---|---|---|---|
| `geekblue` | 极客蓝 | antd 色板 | 侧栏为深蓝墨色 |
| `purple` | 酱紫 | antd 色板 | 深色下与危险色 ΔE ≈ 12 |
| `cyan` | 明青 | antd 色板 | — |
| `forest` | 森翠雅韵 | 自定义 | **默认**；与「成功」同色系：成功状态带图标 |
| `gold` | 辉煌金韵 | 自定义 | 与「警告」同色系：警告状态带图标 |
| `morandi` | 莫兰迪色彩 | 自定义 | 深色下与危险色 ΔE ≈ 12 |
| `macaron` | 马卡龙色彩 | 自定义 | 与「危险」相近：严格遵守危险操作约束 |

每个主题的配色、种子、深浅实心色、侧栏色和区分度数值见 design.md「Colors · 主题」。功能色不随主题变化。

**新增主题**：在 `antd-theme.ts` 的 `THEMES` 里加一项 `{ label, source, swatches, primary, sidebar, note }`，然后跑 `npm run check:contrast`。对比度必须全过；区分度警告写进 `note`。字段含义见 design.md。

**侧栏**跟随主题：`THEMES[x].sidebar` 是底色，文字、悬停、选中、图标自动推出。`<ThemeProvider sidebar="light">` 换成主题色浅底；深色模式下始终是主题色侧栏（压暗）。

**毛玻璃**：`<ThemeProvider glass>`。`Panel`、`Topbar`、`StatusBar` 变成玻璃面，卡片里的 `ListWell`（含其中的 antd Table）变成更实的内嵌玻璃（`rgba(255,255,255,0.2)` + `blur(16px) saturate(180%)` + 16px 圆角），背景换成主题配色的径向渐变。背景强度会自动收敛到玻璃上的 12px 文字仍 ≥ 4.5:1，所以是柔和的渐变。深色模式用低透明度版本，数值见 design.md「Colors · 毛玻璃」。

**主题切换**：不给 `ThemeProvider` 传 `accent` 时，主题由它自己保存并记住（`localStorage` 的 `ui-kit:accent`），用 `useTheme().setAccent` 切换。侧栏底部放 `<ThemeMenu />`（下拉列表）；设置页用 `<ThemePicker value={accent} onChange={setAccent} />`（卡片，带配色色块和区分度提示）。

---

## 四、Token 与 Tailwind 类

ThemeProvider 把 antd 解析后的全部 token 写到 `:root`：`--ant-color-primary`、`--ant-font-size`…（antd 自己的 CSS 变量只挂在组件节点上，自写元素读不到）。preset 的类名 = antd token 去掉 `color` / `colorBg` 前缀：

| antd token | Tailwind 类 |
|---|---|
| `colorBgLayout` / `colorBgContainer` / `colorBgElevated` | `bg-layout` / `bg-container` / `bg-elevated` |
| `colorText` / `colorTextSecondary` / `colorTextTertiary` | `text-text` / `text-text-secondary` / `text-text-tertiary` |
| `colorBorder` / `colorBorderSecondary` | `border-border` / `border`（默认就是 secondary） |
| `colorPrimary` / `colorPrimaryBg` / `colorPrimaryText` | `bg-primary` / `bg-primary-bg` / `text-primary-text` |
| `colorSuccess` 等（Warning / Error / Info 同理） | `text-success`、`bg-success-bg`、`border-success-border` |
| `colorFillTertiary` / `colorFillQuaternary` / `colorFillAlter` | `bg-fill-tertiary` / `bg-fill-quaternary` / `bg-fill-alter` |
| `controlItemBgHover` / `controlItemBgActive` | `bg-item-hover` / `bg-item-active` |
| `fontSizeSM` / `fontSize` / `fontSizeLG` / `fontSizeXL` | `text-sm` 11 / `text-base` 12 / `text-lg` 14 / `text-xl` 16 |
| `fontSizeHeading1–5` | `text-h1` 32 … `text-h2` 26 … `text-h5` 14 |
| `borderRadiusXS / SM / 默认 / LG` | `rounded-xs` 2 / `rounded-sm` 4 / `rounded` 6 / `rounded-lg` 8 |
| `boxShadow` / `boxShadowSecondary` / `boxShadowCard` | `shadow` / `shadow-secondary` / `shadow-card` |
| `motionDurationFast / Mid / Slow` | `duration-fast` / `duration-mid` / `duration-slow` |
| `controlHeight / SM / LG` | `h-control` 32 / `h-control-sm` 24 / `h-control-lg` 40 |
| ui-kit 扩展 | `bg-sidebar`、`text-sidebar-text`、`text-log-info` … |

- **不要用透明度写法**（`bg-primary/10`）：变量是完整颜色，不支持；要浅色用 antd 推导好的档位。
- **不要写色板类**（`bg-orange-500`、`text-gray-400`）或内联十六进制：不随主题切换。
- 组件里需要数值时用 `theme.useToken()`。

---

## 五、页面骨架

PigResize 的功能页是同一种结构：**左边列表、右边设置、底部日志**。

```tsx
import { Button, Radio, Space, Typography } from "antd";
import { AppShell, DropZone, FileRow, ListWell, LogViewer, Page, Panel, ProgressPanel, ThemeMenu, ThemeToggle, Workspace } from "./ui-kit";

<AppShell
  brand={{ mark: "P", name: "PigResize", subtitle: "图片批量处理" }}
  nav={[
    { key: "convert", label: "图片转换", icon: <SwapOutlined />, section: "图片处理" },
    { key: "crop", label: "图片裁切", icon: <ScissorOutlined /> },
  ]}
  active={page}
  onNavigate={setPage}
  sidebarFooter={<><span>版本 V1.6.1</span><span className="flex items-center gap-1"><ThemeMenu /><ThemeToggle /></span></>}
>
  <Page>
    <Workspace
      aside={
        <>
          <Panel title="转换样式">
            <Radio.Group orientation="vertical" options={presets} value={preset} onChange={(e) => setPreset(e.target.value)} />
          </Panel>
          <div className="mt-auto flex flex-col gap-3">
            <ProgressPanel progress={progress} />
            <Button type="primary" block>开始转换 · {files.length} 张</Button>
          </div>
        </>
      }
    >
      <Panel
        fill
        className="flex-1"
        title="待转换图片"
        extra={<Button type="link" size="small" onClick={clear}>清空列表</Button>}
      >
        <DropZone active={hovering} compact={files.length > 0} onBrowse={pickFiles} />
        <ListWell>{/* FileRow 列表，或 antd Table */}</ListWell>
      </Panel>
    </Workspace>

    <Panel fill title="处理日志" size="small" className="h-[170px] shrink-0">
      <LogViewer logs={logs} />
    </Panel>
  </Page>
</AppShell>
```

布局规则：

- **右栏宽度全应用统一**。`Workspace` 默认 300px；切页时右栏不能跳。
- **只让列表滚动**。`Page` 撑满主区不滚，`ListWell` / `LogViewer` 各自滚。内容型页面用 `<Page fill={false}>`。
- `Panel fill` 让内容区撑满卡片；卡片本身多高由 className 决定（列表 `flex-1`，日志 `h-[170px] shrink-0`）。
- **清空列表**放在卡片标题右侧（`extra`），用 `type="link"`。
- **主按钮固定在右栏底部**，写明数量。
- 表格放进 `ListWell`，用 `sticky={{ getContainer: () => wellRef.current }}` 让表头吸顶。
- **部分失败时保留失败项**：成功的移出列表，失败的留下并标红，方便重试。列表用 `<FileRow status="error">`；antd Table 用 `rowClassName={(r) => failed.has(r.path) ? FILE_ROW_ERROR_CLASS : ""}`，名称列加 `<FailedMark />`。

---

## 六、组件用法（antd 约定）

| 场景 | 写法 |
|---|---|
| 主操作 | `<Button type="primary">`，每个区域最多一个 |
| 危险操作 | 页面上 `<Button danger icon={<DeleteOutlined />}>删除…</Button>`；实心危险按钮只出现在 `modal.confirm({ okButtonProps: { danger: true } })` 里 |
| 竖排单选 | `<Radio.Group orientation="vertical" options={…} />` |
| 横排模式切换 | `<Segmented options={…} />` |
| 表格内下拉 | `<Select size="small" />` |
| 状态标签 | `<Tag icon={<CheckCircleOutlined />} color="success">`，**一律带图标**（警告 `ExclamationCircleOutlined`、失败 `CloseCircleOutlined`、处理中 `<SyncOutlined spin />`） |
| 提示条 | `<Alert showIcon type="warning" title="…" />`（v6：`title`，不是 `message`） |
| 轻提示 / 确认框 | `const { message, modal } = App.useApp()`，不要用静态 `message.success()` |
| 空状态 | `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="…" />` |

v6 已弃用：`Space direction` → `orientation`、`Alert message` → `title`、`Progress trailColor` → `railColor`。写 antd 代码前先 `antd info <组件> --format json` 查 API，写完 `antd lint <文件>`。

---

## 七、Tauri 部分

### 拖拽

```tsx
const { hovering } = useFileDrop((paths) => addFiles(paths), {
  extensions: ["jpg", "png"],   // 默认常见图片格式
  enabled: !processing,         // 处理中忽略拖入
});
<DropZone active={hovering} onBrowse={pickFiles} />
```

必须用 `getCurrentWebview().onDragDropEvent()`。HTML5 的 `dataTransfer.files` 在 WebView 里拿不到本地路径，所以**也不要用 antd 的 `Upload.Dragger`**。拖到窗口任何位置都会生效，`DropZone` 只负责视觉提示。

### 批处理进度

Rust 端约定：

```rust
#[derive(Clone, Serialize)]
struct ProgressEvent { current: usize, total: usize, file_name: String, percent: f64, stage: String }

#[tauri::command]
async fn batch_resize(app: AppHandle, files: Vec<String>) -> Result<BatchResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        // 每张图、每个阶段：
        app.emit("resize-progress", ProgressEvent { … }).ok();
    }).await.map_err(|e| e.to_string())?
}
```

前端：

```tsx
const { progress, start, finish } = useBatchProgress("resize-progress", (e) =>
  log(`[*] 正在处理: ${e.file_name}`, "processing")
);

start(files.length);
try { await invoke("batch_resize", { files }); finish("完成"); }
catch { finish("失败", false); }

<ProgressPanel progress={progress} />
```

`percent` 由 Rust 端综合"第几张 + 单张内部阶段"算出，进度条才不会一张一跳。

### 预览本地图片

`convertFileSrc(path)` 依赖 asset 协议。`tauri.conf.json` 里要同时有：

- `app.security.assetProtocol.enable = true` 和 `scope`
- CSP 的 `img-src` 放行 `asset: http://asset.localhost`

缺任何一项图片都是空白，且不报错。antd 运行时会插入 `<style>`，CSP 的 `style-src` 需要包含 `'unsafe-inline'`（片段里已有）。

---

## 八、对比度与审计

正文 11–12px 属于小字，所有文字 / 背景组合按 WCAG AA **4.5:1** 校验，图标 3:1。antd 默认主题有好几组不达标（`#1677FF` 白字 4.10:1、说明文字 0.45 透明度约 3.3:1、暗色色板第 6 档当文字约 2–3:1），所以 `antd-theme.ts` 用档位规则顺延。

两种检查：

- `npm run check:contrast`（demo 目录）：用 `lib/audit.ts` 的清单逐组计算，7 主题 × 深浅 × 侧栏样式 × 毛玻璃开关 = 42 种组合；每种 50 组对比度（毛玻璃再加每个背景色块上的卡片文字与日志）+ 3 组区分度（主色与危险 / 警告 / 成功的 ΔE）。对比度不达标退出码为 1；区分度不足只警告。
- demo「对比度」页：同一份清单的可视化，含样张。

**改任何颜色后都要跑一遍，必须全绿。** 清单覆盖不到的组合（自写元素的新配色），在 demo 里打开对应页面目测，或补进 `lib/audit.ts`。

---

## 九、迁移

**从 ui-kit v1（shadcn 结构）**：

| v1 写法 | 改成 |
|---|---|
| `<Button variant="primary">` / `secondary` / `ghost` / `text` / `destructive` | antd `<Button type="primary">` / 默认 / `type="dashed"` / `type="link"` / `danger` |
| `Card` + `CardHeader` / `CardTitle` / `CardContent` | `<Panel title extra>`（antd Card） |
| `Field` + `Input` / `Select` | `<Form layout="vertical"><Form.Item label extra>` + antd `Input` / `Select` |
| `Choice boxed` | `Radio.Group orientation="vertical"` |
| `Badge tone` / `Notice tone` | `Tag color` / `Alert type` |
| `Progress` | antd `Progress` |
| `ToastProvider` + `useToast()` | `App.useApp().message` |
| `ListRow` / `DataTable` / `EmptyState` | `FileRow` / antd `Table` / antd `Empty` |
| `accent="blue" \| "orange" \| "green"` | `accent` 取 `THEMES` 的键（橙色、拂晓蓝已停用）；`sidebar="dark"` 改为 `"theme"` |
| `bg-card` / `bg-background` / `text-muted-foreground` / `bg-accent` | `bg-container` / `bg-layout` / `text-text-secondary` / `bg-item-active` |
| `text-xs` 11 / `text-sm` 12 / `text-base` 14 | `text-sm` 11 / `text-base` 12 / `text-lg` 14 |
| `rounded-md` 8 / `rounded-xl` 14 | `rounded` 6 / `rounded-lg` 8 |
| `styles/tokens.css` | 删除，颜色由 ThemeProvider 写入 |

**从 PigResize 1.6.1**：先换外壳（`ThemeProvider` + `AppShell`），再逐页把 `components/ui/*` 换成 antd 组件，每换一页对照截图检查。`bg-orange-500` 这类色板类和 `style={{ color: hsl(var(--…)) }}` 都改成语义类。

---

## 十、验收清单

1. `npm run check:contrast` 没有对比度失败；区分度警告只出现在 design.md 主题表里加粗的那几项。
2. 浅色、深色、跟随系统都能切换，重启后保持；启动时无闪烁。
3. 只有一个主色；同一区域最多一个实心主按钮；实心危险按钮只在确认弹窗里出现。
4. 正文 12px、说明 11px、页面标题 26px；没有 14px / 16px 正文。
5. 控件 32px 高、6px 圆角；卡片 8px 圆角 + 1px 描边，没有大阴影。
6. Tab 键走一遍，每个可操作元素都有焦点提示。
7. 系统开启「减弱动态效果」后，Segmented、弹窗、下拉仍能正常切换和关闭，下拉出现在触发器旁边而不是屏幕外。
8. 开毛玻璃后逐个主题看一遍：卡片文字清楚、背景渐变不刺眼、深色下卡片不发灰。
9. 从 Finder / 资源管理器拖文件到窗口任何位置都能添加。
10. 预览图能显示（asset 协议已开）。
11. 处理时进度条连续前进，日志自动跟随但可以上翻。
12. 窗口缩到 1100px 宽：无横向滚动条、标签不截断、侧栏收窄到 195px。
13. Windows（WebView2）与 macOS（WKWebView）各看一次：滚动条宽度一致、字体不发虚。
