# ui-kit · AI 接入指令

> 给 AI：用本目录为 **Tauri 2 + React + TypeScript + Ant Design 6** 项目搭建界面。按步骤执行，每步做完再进入下一步。
> 不要修改 `ui-kit/` 内部文件（除非用户明确要求）；页面代码写在 `src/` 下、`ui-kit/` 之外。

## 第 0 步：先读这三份

1. **antd 设计语言**：<https://ant.design/design.md>（或 `antd design.md --lang zh`）
2. **ui-kit 的差异**：同目录 `design.md`。两份冲突时以它为准。
3. **antd 的 Agent 说明**：<https://ant.design/docs/react/for-agents-cn.md>。本机已装 `antd` skill 与 `@ant-design/cli`。

写任何 antd 组件前，先查当前版本的 API，不要凭记忆：

```bash
antd info Button --format json      # Props、默认值、弃用标记
antd demo Select basic --format json
antd token Menu --format json       # 组件 token
```

写完跑 `antd lint <改过的文件> --format json`，清掉 deprecated 提示。

## 环境约束

- Tailwind CSS 必须是 **v3**（`tailwindcss@3`），不是 v4。
- 开发端口不要用 **3080 / 3443 / 3081**（本机已被其他服务占用）；清理进程只按本项目路径匹配，禁止 `killall node`。
- 尺寸一律用 px，不要改 `html` 根字号。

## 第 1 步：项目骨架（已有项目跳过）

```bash
npm create tauri-app@latest -- --manager npm -t react-ts -y <项目名>
cd <项目名> && npm install
```

## 第 2 步：放入 ui-kit

把本目录复制为 `src/ui-kit/`，**不要带 `demo/` 子目录**。

```bash
git clone https://github.com/byttao/ui-kit.git /tmp/ui-kit
rsync -a --exclude demo --exclude .git /tmp/ui-kit/ src/ui-kit/
cp src/ui-kit/theme-init.js public/theme-init.js
```

当前版本 **1.3.0**（`package.json` / `UI_KIT_VERSION`）；升级前读 `CHANGELOG.md` 的「从上一版升级」。

## 第 3 步：依赖

```bash
npm i antd@^6.6 @ant-design/cssinjs@^2.1 @ant-design/colors@^8 @ant-design/icons@^6 clsx tailwind-merge
npm i -D tailwindcss@3 postcss autoprefixer
npm run tauri add dialog        # 文件选择框，DropZone 的 onBrowse 要用
npm run tauri add opener        # 打开链接、在访达 / 资源管理器中显示文件
```

- 装完检查 `npm ls @ant-design/cssinjs` 只有一个版本。
- `tauri add` 会同时改 `src-tauri/Cargo.toml`、`src-tauri/src/lib.rs`（注册插件）与 `src-tauri/capabilities/default.json`。确认 `permissions` 里有 `"dialog:default"` 和 `"opener:default"`（后者已含 `openUrl` 与 `revealItemInDir`；用默认程序打开本地文件的 `openPath` 还要加 `opener:allow-open-path` 并配置路径范围）。

## 第 4 步：配置文件

`package.json` 是 `"type": "module"`，所以这两个配置用 `.cjs`：

```js
// tailwind.config.cjs
module.exports = {
  presets: [require("./src/ui-kit/tailwind.preset.cjs")],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
};
```

```js
// postcss.config.cjs
module.exports = { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

```css
/* src/index.css —— 整个文件就这几行，顺序不能换 */
@layer tailwind-base, antd;

@import "./ui-kit/styles/base.css";

@layer tailwind-base {
  @tailwind base;
}
@tailwind components;
@tailwind utilities;
```

- `src/main.tsx` 里加 `import "./index.css";`
- 删除模板的 `src/App.css` 及其 import，删除 `App.tsx` 里的模板内容。
- `index.html` 的 `<head>` 里加 `<script src="/theme-init.js"></script>`。

`src-tauri/tauri.conf.json`：把 `src/ui-kit/tauri/tauri.conf.snippet.json` 的 `app` 合并进去（片段里以 `//` 开头的键是说明，不要抄进去）：

- `app.windows[0]`：`"dragDropEnabled": true`、`"minWidth": 1100`、`"minHeight": 700`
- `app.security.csp`：照抄片段里的值（放行 `asset:` 图片；`style-src` 含 `'unsafe-inline'`，antd 运行时样式需要）
- `app.security.assetProtocol`：`{ "enable": true, "scope": ["**"] }`

`src-tauri/Cargo.toml`：**tauri 依赖必须开 `protocol-asset`**，否则开了 assetProtocol 会编译报错：

```toml
tauri = { version = "2", features = ["protocol-asset"] }
```

## 第 5 步：入口

```tsx
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ThemeProvider } from "./ui-kit";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>   {/* 默认森翠雅韵 · 浅色侧栏 · 毛玻璃；可传 accent / mode / sidebar / glass 覆盖 */}
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

`ThemeProvider` 已经包含 `StyleProvider layer`、`ConfigProvider`（主题 + 中文语言包）和 antd `App`。**不要再包一层 `ConfigProvider`**；需要局部主题时用嵌套 `ConfigProvider`，只写要改的 token。

**主题存进应用自己的设置文件**（便携版换机器后 WebView 数据不跟着走）：读到设置后受控传入，切换时写回：

```tsx
<ThemeProvider
  accent={settings.themeAccent}            // 受控；设置还没读到时传 undefined，用 localStorage 里的值
  mode={settings.themeMode}
  onAccentChange={(accent) => saveSettings({ ...settings, themeAccent: accent })}
  onModeChange={(mode) => saveSettings({ ...settings, themeMode: mode })}
>
```

## 第 6 步：页面模板（照这个结构写每个功能页）

```tsx
// src/App.tsx
import { useState } from "react";
import { SwapOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Empty, Radio } from "antd";
import { open } from "@tauri-apps/plugin-dialog";
import {
  AppShell, DropZone, FileRow, ListWell, LogViewer, NavBadge, Page, Panel, ProgressPanel,
  ThemeMenu, ThemeToggle, Workspace, fileName, useFileDrop, useLogger,
} from "./ui-kit";

type PageKey = "home" | "other";

export default function App() {
  const [page, setPage] = useState<PageKey>("home");
  return (
    <AppShell
      brand={{ mark: "A", name: "应用名", subtitle: "一句话说明" }}
      nav={[
        { key: "home", label: "功能一", icon: <SwapOutlined />, section: "分组名", badge: <NavBadge count={0} /> },
        { key: "other", label: "功能二", icon: <SwapOutlined /> },
      ]}
      active={page}
      onNavigate={setPage}
      sidebarFooter={<><span>版本 V1.0.0</span><span className="flex items-center gap-1"><ThemeMenu /><ThemeToggle /></span></>}
    >
      {/* 有状态的页面常驻，用 hidden 切换：日志、草稿、事件订阅不丢 */}
      <div className={page === "home" ? "h-full" : "hidden"}>
        <FeaturePage active={page === "home"} />
      </div>
      <div className={page === "other" ? "h-full" : "hidden"}>{/* … */}</div>
    </AppShell>
  );
}

const OPTIONS = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
];

function FeaturePage({ active }: { active: boolean }) {
  const [files, setFiles] = useState<string[]>([]);
  const [option, setOption] = useState("a");
  const { logs, log, clear } = useLogger();
  const { message } = AntApp.useApp();

  const add = (paths: string[]) => {
    const fresh = paths.filter((p) => !files.includes(p));
    if (fresh.length) { setFiles((prev) => [...prev, ...fresh]); log(`已添加 ${fresh.length} 个文件。`); }
  };
  // 常驻页面只在可见时接收拖拽
  const { hovering } = useFileDrop(add, { enabled: active });
  const browse = async () => {
    const picked = await open({ multiple: true, filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }] });
    if (picked) add(Array.isArray(picked) ? picked : [picked]);
  };

  return (
    <Page>
      <Workspace
        aside={
          <Panel title="设置">
            <Radio.Group orientation="vertical" options={OPTIONS} value={option} onChange={(e) => setOption(e.target.value)} />
          </Panel>
        }
        // 主按钮常驻右栏底部：参数再多也不会被挤出可视区
        asideFooter={
          <>
            <ProgressPanel progress={null} />
            <Button type="primary" block disabled={!files.length} onClick={() => message.success("已开始")}>
              开始处理 · {files.length} 个
            </Button>
          </>
        }
      >
        <Panel
          fill
          className="flex-1"
          title="待处理文件"
          extra={<Button type="link" size="small" disabled={!files.length} onClick={() => setFiles([])}>清空列表</Button>}
        >
          <DropZone active={hovering} compact={files.length > 0} onBrowse={browse} />
          <ListWell>
            {files.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="添加文件后显示在这里" className="py-9" />
            ) : (
              <ul className="m-0 list-none p-0">
                {files.map((f, i) => <FileRow key={f} index={i + 1}>{fileName(f)}</FileRow>)}
              </ul>
            )}
          </ListWell>
        </Panel>
      </Workspace>

      <Panel fill title="处理日志" size="small" className="h-[170px] shrink-0">
        <LogViewer logs={logs} onClear={clear} />   {/* 自带「清空」「复制全部」 */}
      </Panel>
    </Page>
  );
}
```

参数很多的页面（模式 + 模型 + 提示词 + 参考图 + 若干参数）：`aside` 只放一张 `<Panel fill title="参数" className="min-h-0 flex-1"><SettingsScroll>…</SettingsScroll></Panel>`，只滚参数区，主按钮仍在 `asideFooter`。任务队列页与设置页的完整写法见 `demo/src/templates.tsx`（`QueuePage`、`SettingsPage`），设置页排版规范见 design.md「设置页」。

## 规则（写页面时必须遵守）

1. **控件一律用 antd**，从 `"antd"` 导入。只有应用级组件（`AppShell`、`Panel`、`ListRow`、`Thumb`、`LogViewer` 等）从 `./ui-kit` 导入。不要自己写按钮、输入框、下拉、弹窗、Tooltip。**例外**：antd 没有的「可选中卡片」（图片瓦片、色块卡片）用原生 `<button type="button">` + `aria-pressed` / `role="radio"`，照 `ImageGrid` / `ThemePicker` 的写法（先看 kit 有没有现成件）。
2. **颜色只用 token**：组件里用 `theme.useToken()`；className 用 preset 的语义类（`bg-container`、`bg-layout`、`text-text-secondary`、`text-primary-text`、`border`、`bg-item-active`、`text-error` …）；SVG 用 `fill-*` / `stroke-*` 类（`fill-primary-bg stroke-primary`）或 `currentColor`。**禁止** `bg-gray-*`、`text-slate-*`、`bg-orange-*` 这类色板类和内联色值；**禁止** `bg-primary/10` 这类透明度写法（变量不支持）。`text-text-quaternary` 只用于禁用态。
3. **主题只通过 `ThemeProvider` 的 `accent` / `mode` / `sidebar` / `glass`（或 `useTheme().setAccent / setMode`）切换**，不要在页面里传 `ConfigProvider theme` 覆盖颜色。要新增主题，改 `ui-kit/antd-theme.ts` 的 `THEMES` 并跑审计（需用户同意修改 ui-kit）。用户只给配色时：取饱和度最高的一个作 `primary`、最深或最有辨识度的一个作 `sidebar`，审计出现区分度警告时写进 `note` 并告诉用户。深色表面会按 `sidebar` 的色相自动推出，不用写。
4. **字号**：正文 `text-base`（12px，默认），说明 `text-sm`（11px），卡片标题由 Card 自带（14px），页面标题用 `PageHeader`（26px）。不要用 14px / 16px 做正文。不要叠加 `compactAlgorithm`。
5. **按钮**：每个区域最多一个 `type="primary"`，放在 `Workspace` 的 `asideFooter`。批处理页写明数量（「开始转换 · 5 张」）；非批处理页写「动词 + 对象」（「保存设置」「继续修改 · 这张」）。「清空列表」用 `type="link" size="small"` 放在 `Panel` 的 `extra`。
6. **危险操作**：页面上用 `<Button danger icon={<DeleteOutlined />}>删除…</Button>` 或 `danger type="text"`；**实心危险按钮只出现在 `modal.confirm({ okButtonProps: { danger: true } })` 里**，不与实心主按钮并排。
7. **状态一律带图标**：用 `<StatusTag status="success" />`（排队 / 进行中 / 成功 / 失败 / 警告 / 已取消），或 `<Tag icon={<CheckCircleOutlined />} color="success">`、`<Alert showIcon …>`，不单靠颜色表达（部分主题的主色与功能色同色系）。
8. **毛玻璃**只通过 `glass` 开关；卡片级容器用 `Panel` 才会自动变成玻璃面，不要自己写 `backdrop-filter`。
9. **反馈**：`const { message, modal, notification } = App.useApp()`，然后照常 `message.success(...)`。不要 `import { message } from "antd"` 后调用静态方法（拿不到主题）。
10. **布局**：每个功能页 = `Page` > `Workspace`（左列表、右设置栏 + `asideFooter`，右栏宽度全应用一致）+ 底部日志 `Panel`。只让列表 / 日志 / 参数区滚动，`Page` 本身不滚。列表卡片 `<Panel fill className="flex-1">`。**有状态的功能页常驻、用 `hidden` 切换**，不要按 `page === x &&` 卸载（日志、草稿、事件订阅会丢）。
11. **日志**：每个功能页各自 `useLogger()`，不要多页共用一份；清空 / 复制用 `<LogViewer onClear={clear} />`。页面挂载前就可能产生的日志（Rust 启动时发的事件）在 `main.tsx` 里订阅并 `pushLog("页面名", msg, level)`，页面用 `useLogger({ channel: "页面名" })` 接收。
12. **批处理部分失败**：成功的移出列表，失败的留下并用 `FileRow status="error"` / `ListRow status="error"`（表格用 `FILE_ROW_ERROR_CLASS` + `FailedMark`）标红，方便重试。失败行里的 antd 文字与中性 Tag 会自动继承红字，不用手写 `text-inherit`。
13. **拖拽**只用 `useFileDrop`（窗口级 Tauri 事件）。不要用 HTML5 `onDrop`，也不要用 antd `Upload.Dragger`（都拿不到本地路径）。
14. **本地图片**用 `<Thumb path={…} />`（缩略图）、`<ThumbStrip items={…} />`（缩略图条 / 参考图墙）、`<ImageGrid items={…} />`（图库网格），它们内部用 `convertFileSrc`，依赖第 4 步的 assetProtocol、CSP 与 Cargo `protocol-asset`。自己拼地址时用 `localImageSrc(path)`。
15. **行尾操作**：`type="text" size="small"` 图标按钮 + `Tooltip` + `aria-label`，最多 3 个，其余收进「更多」（`MoreOutlined` + `Dropdown`），删除放菜单最后。
16. **右栏提示**：单项说明写 `Form.Item extra`；依赖其他参数的提示 / 警示用 `<FieldHint>` / `<FieldHint type="warning">`，不要在 300px 右栏里放 `Alert`。空状态需要引导操作时用 `EmptyState`。侧栏徽标用 `NavBadge`，不用 antd `Badge`（默认红色是危险语义）。
17. **内联 `style`** 只给运行时算出的数据（宽高比、列数、调用方传入的尺寸、要原样展示的色块）；颜色、间距、字号一律用类名。
18. **v6 弃用 API 不要写**：`Space direction`（用 `orientation`）、`Alert message`（用 `title`）、`Progress trailColor`（用 `railColor`）。以 `antd lint` 的结果为准。

## 组件速查（从 `./ui-kit` 导入）

| 组件 / Hook | 关键参数 |
|---|---|
| `AppShell` | `brand={{ mark, name, subtitle? }}`（`mark`：字母 / 单色 SVG / `{ src, alt? }` 图片）`nav={NavItem[]}` `active` `onNavigate` `sidebarFooter?` `topbar?` `statusbar?` |
| `NavItem` | `{ key, label, icon?, section?（分组标题，写在组内第一项）, badge? }` |
| `NavBadge` | `count` `max=99` `tone="accent"\|"muted"` `showZero?`；传给 `NavItem.badge` |
| `Page` | `fill`（默认 true 不滚动；内容型页面传 `fill={false}` 整页滚动） |
| `PageHeader` | `eyebrow?` `title` `description?` `actions?` |
| `Workspace` | `aside` `asideFooter?`（常驻主按钮区）`asideWidth=300` `children` |
| `Panel` | antd `Card` 的全部参数 + `fill`（内容区撑满卡片） |
| `Topbar` / `StatusBar` | 普通容器，传给 AppShell 的 `topbar` / `statusbar` |
| `DropZone` | `active` `onBrowse` `title?` `hint?` `icon?` `compact?` `disabled?` |
| `ListWell` | 列表滚动容器（可传 ref，给 antd Table 的 sticky 用） |
| `FileRow` | 32px 文件行：`index` `selected` `status="error"` `trailing` `onClick` |
| `ListRow` | 富列表行：`index?` `leading?`（缩略图）`title?` `meta?` `extra?`（第二行起）`trailing?` `status?="error"` `failedLabel?` `selected?` `highlight?`（定位高亮并滚到可见）`align="start"\|"center"` |
| `FILE_ROW_ERROR_CLASS` / `FailedMark` | antd Table 失败行的 `rowClassName` / 失败图标 + 文字 |
| `Thumb` | `path?` `size="xs"\|"sm"\|"md"\|"lg"\|"fill"` `ratio?` `fit="cover"\|"contain"` `loading?` `preview=true` `open?` `onOpenChange?` `alt?` |
| `ThumbStrip` | `items: (string \| { key?, path, alt? })[]` `size="sm"` `columns?` `onRemove?(key)` `preview=true` `showName?` |
| `ImageGrid` | `items: { key, path, alt?, badge? }[]` `selectedKey?` `onSelect?` `minTileWidth=148` `ratio=1` `preview=true` `previewIndex?` `onPreviewIndexChange?` |
| `localImageSrc(path)` | 本地路径 → `convertFileSrc`（浏览器里原样返回） |
| `RatioIcon` | `ratio`（"16:9" / 1.5 / [16, 9] / "auto"）`size=16` |
| `RatioPreview` | `ratio` `cols=1` `rows=1` `cellRatio?`（画格内裁切）`labels=true` `height=110` `caption?` `autoText?` |
| `parseRatio(value)` | → `[宽, 高] \| null` |
| `SettingsSection` | `title` `description?` `extra?` `children` |
| `SettingsScroll` | 长表单滚动容器，`maxWidth=640` |
| `EmptyState` | `icon?` `title?` `description?` `action?` `size="default"\|"small"` |
| `StatusTag` | `status="queued"\|"processing"\|"success"\|"error"\|"warning"\|"cancelled"`，`children` 覆盖文案 |
| `FieldHint` | `type="info"\|"warning"` `children` |
| `LogViewer` | `logs` `onClear?` `copyable?`（传 onClear 时默认开）`emptyText?` |
| `useLogger(options?)` | `useLogger()` / `useLogger(500)` / `useLogger({ limit, channel })` → `{ logs, log, clear }`；`log(msg, "info"\|"success"\|"warning"\|"error"\|"processing")` |
| `pushLog(channel, msg, level?)` | 组件外写日志，页面挂载前的先缓冲 |
| `ProgressPanel` | `progress: BatchProgress \| null`（null 时不渲染） |
| `ThemeProvider` | `accent?` `mode?`（都可受控）`onAccentChange?` `onModeChange?` `sidebar="theme"\|"light"` `glass` |
| `useTheme()` | `{ mode, resolved, accent, setAccent, sidebar, glass, setMode, toggle }` |
| `ThemeToggle` / `ThemeMenu` | 放在 `sidebarFooter` 里 |
| `ThemePicker` | `value` `onChange`；主题选择卡片（配色色块 + 区分度提示），放在设置页 |
| `THEMES` / `FUNCTIONAL` / `surfaceColors(accent, resolved)` | 主题、功能色定义与某主题的表面色（只读） |
| `useFileDrop` | `useFileDrop(onDrop, { extensions?, enabled? })` → `{ hovering }` |
| `useBatchProgress` | `useBatchProgress("事件名", onFileStart?)` → `{ progress, start(total), finish(stage, completed?) }` |
| `useTaskEvents<T>(options?)` | `{ load?, updatedEvent="task-updated", removedEvent="task-removed", getId?, sort? }` → `{ tasks, loaded, setTasks, reload }` |
| `fileName(path)` / `cn(...)` | 取文件名 / 合并 className |

## Rust 端约定

两种后台工作模式，选一种（同一应用可以都有）：

| | 批处理 | 多任务队列 |
|---|---|---|
| 场景 | 一批文件、一个总进度（转换、裁切、压缩） | 任务各自独立、可并发、排队 / 取消 / 重试（AI 出图、下载、转码） |
| 前端 | `useBatchProgress` + `ProgressPanel` + `FileRow` | `useTaskEvents` + `ListRow` + `StatusTag` + 行内 `Progress` |
| 事件 | `xxx-progress`：`{ current, total, file_name, percent, stage }` | `task-updated`：整条任务；`task-removed`：id 数组 |
| 失败 | 成功的移出列表，失败的留下标红 | 任务留在列表，`status: "failed"` + `error` 文案，行尾给「重试」 |

### 批处理

```rust
#[derive(Clone, serde::Serialize)]
struct ProgressEvent { current: usize, total: usize, file_name: String, percent: f64, stage: String }

#[tauri::command]
async fn batch_xxx(app: tauri::AppHandle, files: Vec<String>) -> Result<BatchResult, String> {
    // 重活放进阻塞线程池，不要占用主线程
    tauri::async_runtime::spawn_blocking(move || {
        // 每张文件、每个阶段推一次；percent 综合“第几张 + 单张内阶段”
        let _ = app.emit("xxx-progress", ProgressEvent { /* ... */ });
        Ok(BatchResult { /* ... */ })
    }).await.map_err(|e| e.to_string())?
}
```

```tsx
const { progress, start, finish } = useBatchProgress("xxx-progress", (e) => log(`[*] 正在处理: ${e.file_name}`, "processing"));
start(files.length);
try { const r = await invoke<BatchResult>("batch_xxx", { files }); log(r.message, "success"); finish("完成"); }
catch (err) { log(`处理失败：${err}`, "error"); finish("失败", false); }
// <ProgressPanel progress={progress} />
```

### 多任务队列

```rust
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Task {
    id: String,
    status: String,          // queued / running / succeeded / failed / cancelled
    progress: u8,            // 0–100，running 时有意义
    error: Option<String>,   // failed 时的报错文案（给人看的）
    created_at: i64,
    // ……业务字段：输入参数、输出文件路径
}

// 1. 任务存在 State<Mutex<Vec<Task>>>（或写 tasks.json 持久化），list_tasks 返回全部
#[tauri::command]
fn list_tasks(state: tauri::State<'_, Queue>) -> Vec<Task> { state.snapshot() }

// 2. 任何字段变化都推整条任务（不是增量），前端按 id 覆盖
fn emit(app: &tauri::AppHandle, task: &Task) { let _ = app.emit("task-updated", task); }

// 3. 删除推 id 数组
let _ = app.emit("task-removed", &ids);

// 4. 并发数用 tokio Semaphore 控制，超出的保持 queued；取消 = 标记 cancelled 并让 worker 丢弃结果
// 5. 应用启动时恢复的任务（上次没跑完的）在 setup 里重新入队；要写日志就 emit 一个 app-log 事件
```

```tsx
// main.tsx：渲染前订阅启动日志，页面挂载前发的也不会丢
listen<{ level: LogLevel; message: string }>("app-log", (e) => pushLog("queue", e.payload.message, e.payload.level));

// 页面
const { tasks, loaded } = useTaskEvents<Task>({ sort: (a, b) => b.createdAt - a.createdAt });
const { logs, log, clear } = useLogger({ channel: "queue" });
const running = tasks.filter((t) => t.status === "running" || t.status === "queued").length;
// 侧栏：badge: <NavBadge count={running} />
// 列表：<ListRow leading={<Thumb path={t.output} loading={t.status === "running"} />}
//                meta={<StatusTag status={toKind(t.status)} />}
//                extra={t.status === "running" && <Progress percent={t.progress} size="small" showInfo={false} />}
//                status={t.status === "failed" ? "error" : undefined} trailing={…} />
```

`useTaskEvents` 先订阅再加载，加载期间到达的事件会在加载完成后合并，不会被旧数据覆盖。状态到 `StatusTag` 的映射：`queued → queued`、`running → processing`、`succeeded → success`、`failed → error`、`cancelled → cancelled`。

## 应用图标

```bash
bash src/ui-kit/scripts/icon/make-icons.sh src-tauri/app-icon.svg   # macOS
```

SVG 按 design.md「应用图标」的规范画（1024 画布、底板 824 居中、四周透明）。脚本用 AppKit 渲染透明底 PNG → `npx tauri icon` 生成各尺寸 → 逐尺寸校验四角透明。**不要用 `qlmanage` 渲染**（会垫白底）。

## 完成后自检

1. `npm run build` 无报错。
2. `antd lint ./src --format json` 没有 deprecated 与 a11y 问题。
3. `npm run tauri dev` 能打开窗口，浅色 / 深色切换正常，重启后保持；深色下主区颜色跟随主题（不是固定的蓝灰）。
4. 从文件管理器拖文件到窗口任意位置能加入列表；本地图片缩略图能显示。
5. 全局搜索，页面代码（`src/` 下、`ui-kit/` 之外）里不应出现：
   - 色板类与透明度写法：`bg-gray-` `text-gray-` `bg-slate-` `bg-orange-` `/10"`；
   - 静态反馈方法：从 `"antd"` 导入的 `message` / `notification`（搜 `import {` 那一行里有没有这两个名字），以及 `Modal.confirm(` `Modal.info(` `Modal.warning(` `Modal.error(`。`message.success(` 本身不算违规，只要 `message` 来自 `App.useApp()`；`<Modal open>` 组件照常使用；
   - 内联色值：`style={{` 里出现 `#`、`rgb(`、`color:`、`background:`（运行时尺寸、比例、列数例外）；
   - `text-text-quaternary`（只给禁用态）。
   搜索 `<Tag color=`，每处都应带 `icon`（或改用 `StatusTag`）。
6. 窗口缩到 1100px 宽，没有横向滚动条；参数很多的页面，主按钮仍在可视区内。
