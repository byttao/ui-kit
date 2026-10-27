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
- 开发端口不要用 **3080 / 3443**（本机已被其他服务占用）；清理进程只按本项目路径匹配，禁止 `killall node`。
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

当前版本 1.1.0（`package.json` / `UI_KIT_VERSION`）；升级前读 `CHANGELOG.md`。

## 第 3 步：依赖

```bash
npm i antd@^6.6 @ant-design/cssinjs@^2.1 @ant-design/colors@^8 @ant-design/icons@^6 clsx tailwind-merge
npm i -D tailwindcss@3 postcss autoprefixer
npm run tauri add dialog        # 文件选择框，DropZone 的 onBrowse 要用
```

装完检查 `npm ls @ant-design/cssinjs` 只有一个版本。

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

`src-tauri/tauri.conf.json`：把 `src/ui-kit/tauri/tauri.conf.snippet.json` 的内容合并进 `app`：

- `app.windows[0]`：`"dragDropEnabled": true`、`"minWidth": 1100`、`"minHeight": 700`
- `app.security.csp`：照抄片段里的值（放行 `asset:` 图片；`style-src` 含 `'unsafe-inline'`，antd 运行时样式需要）
- `app.security.assetProtocol`：`{ "enable": true, "scope": ["**"] }`

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
    <ThemeProvider>   {/* 默认森翠雅韵 · 浅色侧栏 · 毛玻璃；可传 accent / sidebar / glass 覆盖 */}
      <App />
    </ThemeProvider>
  </StrictMode>
);
```

`ThemeProvider` 已经包含 `StyleProvider layer`、`ConfigProvider`（主题 + 中文语言包）和 antd `App`。**不要再包一层 `ConfigProvider`**；需要局部主题时用嵌套 `ConfigProvider`，只写要改的 token。

## 第 6 步：页面模板（照这个结构写每个功能页）

```tsx
// src/App.tsx
import { useState } from "react";
import { SwapOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Empty, Radio } from "antd";
import { open } from "@tauri-apps/plugin-dialog";
import {
  AppShell, DropZone, FileRow, ListWell, LogViewer, Page, Panel, ProgressPanel,
  ThemeMenu, ThemeToggle, Workspace, fileName, useFileDrop, useLogger,
} from "./ui-kit";

type PageKey = "home";

export default function App() {
  const [page, setPage] = useState<PageKey>("home");
  return (
    <AppShell
      brand={{ mark: "A", name: "应用名", subtitle: "一句话说明" }}
      nav={[{ key: "home", label: "功能一", icon: <SwapOutlined />, section: "分组名" }]}
      active={page}
      onNavigate={setPage}
      sidebarFooter={<><span>版本 V1.0.0</span><span className="flex items-center gap-1"><ThemeMenu /><ThemeToggle /></span></>}
    >
      <FeaturePage />
    </AppShell>
  );
}

const OPTIONS = [
  { value: "a", label: "选项 A" },
  { value: "b", label: "选项 B" },
];

function FeaturePage() {
  const [files, setFiles] = useState<string[]>([]);
  const [option, setOption] = useState("a");
  const { logs, log } = useLogger();
  const { message } = AntApp.useApp();

  const add = (paths: string[]) => {
    const fresh = paths.filter((p) => !files.includes(p));
    if (fresh.length) { setFiles((prev) => [...prev, ...fresh]); log(`已添加 ${fresh.length} 个文件。`); }
  };
  const { hovering } = useFileDrop(add);
  const browse = async () => {
    const picked = await open({ multiple: true, filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png"] }] });
    if (picked) add(Array.isArray(picked) ? picked : [picked]);
  };

  return (
    <Page>
      <Workspace
        aside={
          <>
            <Panel title="设置">
              <Radio.Group orientation="vertical" options={OPTIONS} value={option} onChange={(e) => setOption(e.target.value)} />
            </Panel>
            <div className="mt-auto flex flex-col gap-3">
              <ProgressPanel progress={null} />
              <Button type="primary" block disabled={!files.length} onClick={() => message.success("已开始")}>
                开始处理 · {files.length} 个
              </Button>
            </div>
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
        <LogViewer logs={logs} />
      </Panel>
    </Page>
  );
}
```

## 规则（写页面时必须遵守）

1. **控件一律用 antd**，从 `"antd"` 导入。只有应用级组件（`AppShell`、`Panel`、`DropZone`、`LogViewer` 等）从 `./ui-kit` 导入。不要自己写按钮、输入框、下拉、弹窗、Tooltip。
2. **颜色只用 token**：组件里用 `theme.useToken()`；className 用 preset 的语义类（`bg-container`、`bg-layout`、`text-text-secondary`、`text-primary-text`、`border`、`bg-item-active`、`text-error` …）。**禁止** `bg-gray-*`、`text-slate-*`、`bg-orange-*` 这类色板类和内联色值；**禁止** `bg-primary/10` 这类透明度写法（变量不支持）。
3. **主题只通过 `ThemeProvider` 的 `accent` / `sidebar` / `glass`（或 `useTheme().setAccent`）切换**，不要在页面里传 `ConfigProvider theme` 覆盖颜色。要新增主题，改 `ui-kit/antd-theme.ts` 的 `THEMES` 并跑审计（需用户同意修改 ui-kit）。用户只给配色时：取饱和度最高的一个作 `primary`、最深或最有辨识度的一个作 `sidebar`，审计出现区分度警告时写进 `note` 并告诉用户。
4. **字号**：正文 `text-base`（12px，默认），说明 `text-sm`（11px），卡片标题由 Card 自带（14px），页面标题用 `PageHeader`（26px）。不要用 14px / 16px 做正文。不要叠加 `compactAlgorithm`。
5. **按钮**：每个区域最多一个 `type="primary"`，放在右栏底部并写明数量；「清空列表」用 `type="link" size="small"` 放在 `Panel` 的 `extra`。
6. **危险操作**：页面上用 `<Button danger icon={<DeleteOutlined />}>删除…</Button>` 或 `danger type="text"`；**实心危险按钮只出现在 `modal.confirm({ okButtonProps: { danger: true } })` 里**，不与实心主按钮并排。
7. **状态一律带图标**：`<Tag icon={<CheckCircleOutlined />} color="success">`、`<Alert showIcon …>`，不单靠颜色表达成功 / 警告 / 失败（部分主题的主色与功能色同色系）。
8. **毛玻璃**只通过 `glass` 开关；卡片级容器用 `Panel` 才会自动变成玻璃面，不要自己写 `backdrop-filter`。
9. **反馈**：`const { message, modal, notification } = App.useApp()`。不要用 `message.success()` 这类静态方法（拿不到主题）。
10. **布局**：每个功能页 = `Page` > `Workspace`（左列表、右设置栏，右栏宽度全应用一致）+ 底部日志 `Panel`。只让列表 / 日志滚动，`Page` 本身不滚。列表卡片 `<Panel fill className="flex-1">`。
11. **日志**：每个功能页各自 `useLogger()`，不要多页共用一份。
12. **批处理部分失败**：成功的移出列表，失败的留下并用 `FileRow status="error"`（表格用 `FILE_ROW_ERROR_CLASS` + `FailedMark`）标红，方便重试。
13. **拖拽**只用 `useFileDrop`（窗口级 Tauri 事件）。不要用 HTML5 `onDrop`，也不要用 antd `Upload.Dragger`（都拿不到本地路径）。
14. **本地图片预览**用 `convertFileSrc(path)`（`@tauri-apps/api/core`），依赖第 4 步的 assetProtocol 与 CSP。
15. **v6 弃用 API 不要写**：`Space direction`（用 `orientation`）、`Alert message`（用 `title`）、`Progress trailColor`（用 `railColor`）。以 `antd lint` 的结果为准。

## 组件速查（从 `./ui-kit` 导入）

| 组件 / Hook | 关键参数 |
|---|---|
| `AppShell` | `brand={{mark,name,subtitle?}}` `nav={NavItem[]}` `active` `onNavigate` `sidebarFooter?` `topbar?` `statusbar?` |
| `NavItem` | `{ key, label, icon?, section?（分组标题，写在组内第一项）, badge? }` |
| `Page` | `fill`（默认 true 不滚动；内容型页面传 `fill={false}` 整页滚动） |
| `PageHeader` | `eyebrow?` `title` `description?` `actions?` |
| `Workspace` | `aside` `asideWidth=300` `children` |
| `Panel` | antd `Card` 的全部参数 + `fill`（内容区撑满卡片） |
| `Topbar` / `StatusBar` | 普通容器，传给 AppShell 的 `topbar` / `statusbar` |
| `DropZone` | `active` `onBrowse` `title?` `hint?` `icon?` `compact?` `disabled?` |
| `ListWell` / `FileRow` | 列表滚动容器（可传 ref，给 antd Table 的 sticky 用）/ 文件行（`index` `selected` `status="error"` `trailing` `onClick`） |
| `FILE_ROW_ERROR_CLASS` / `FailedMark` | antd Table 失败行的 `rowClassName` / 失败图标 + 文字 |
| `LogViewer` + `useLogger(limit=1000)` | `const { logs, log, clear } = useLogger()`；`log(msg, "info"\|"success"\|"warning"\|"error"\|"processing")` |
| `ProgressPanel` | `progress: BatchProgress \| null`（null 时不渲染） |
| `ThemeProvider` / `useTheme` | `accent`（不传则自己保存并记住）`sidebar="theme"\|"light"` `glass`；`useTheme()` → `{ mode, resolved, accent, setAccent, sidebar, glass, setMode, toggle }` |
| `ThemeToggle` | 放在 `sidebarFooter` 里 |
| `ThemeMenu` | 主题切换下拉，放在 `sidebarFooter` 里 `ThemeToggle` 旁边 |
| `ThemePicker` | `value` `onChange`；主题选择卡片（配色色块 + 区分度提示），放在设置页 |
| `THEMES` / `FUNCTIONAL` | 主题与功能色定义（只读） |
| `useFileDrop` | `useFileDrop(onDrop, { extensions?, enabled? })` → `{ hovering }` |
| `useBatchProgress` | `useBatchProgress("事件名", onFileStart?)` → `{ progress, start(total), finish(stage, completed?) }` |
| `fileName(path)` / `cn(...)` | 取文件名 / 合并 className |

## 批处理与 Rust 端约定

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

## 完成后自检

1. `npm run build` 无报错。
2. `antd lint ./src --format json` 没有 deprecated 与 a11y 问题。
3. `npm run tauri dev` 能打开窗口，浅色 / 深色切换正常，重启后保持。
4. 从文件管理器拖文件到窗口任意位置能加入列表。
5. 全局搜索 `bg-gray-` `text-gray-` `bg-slate-` `bg-orange-` `/10"` `style={{` `message.success(` —— 页面代码里不应出现；搜索 `<Tag color=`，每处都应带 `icon`。
6. 窗口缩到 1100px 宽，没有横向滚动条。
