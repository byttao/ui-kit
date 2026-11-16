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

当前版本 **1.6.1**（`package.json` / `UI_KIT_VERSION`）；升级前读 `CHANGELOG.md` 的「从上一版升级」。

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
import { ErrorBoundary, ThemeProvider } from "./ui-kit";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>   {/* 默认森翠雅韵 · 浅色侧栏 · 毛玻璃；可传 accent / mode / sidebar / glass 覆盖 */}
      <ErrorBoundary> {/* 渲染出错时显示原因 + 复制 + 重新加载，而不是整页空白；放在 ThemeProvider 里面 */}
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>
);
```

`ThemeProvider` 已经包含 `StyleProvider layer`、`ConfigProvider`（主题 + 中文语言包）和 antd `App`。**不要再包一层 `ConfigProvider`**；需要局部主题时用嵌套 `ConfigProvider`，只写要改的 token。

### 主题存进应用自己的设置文件（受控主题）

便携版换机器后 WebView 的 localStorage 不跟着走，主题要存进自己的 settings.json。读写设置都发生在 `ThemeProvider` **外面**，而那里拿不到 `App.useApp()` 的 `message`。推荐写法：外层 `Root` 只管数据，把错误放进 state，由 `ThemeProvider` 里面的一个小组件负责提示。

```tsx
// src/main.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { App as AntApp } from "antd";
import { invoke } from "@tauri-apps/api/core";
import { ErrorBoundary, THEMES, ThemeProvider, type Accent, type ThemeMode } from "./ui-kit";

function Root() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [notice, setNotice] = useState<string | null>(null);   // 外层发生的错误，交给里面提示

  useEffect(() => {
    invoke<Settings>("get_settings").then(setSettings).catch((err) => setNotice(`读取设置失败：${err}`));
  }, []);

  const ref = useRef(settings);
  ref.current = settings;
  const saveTheme = useCallback((patch: Partial<Settings>) => {
    const current = ref.current;
    if (!current) return;
    const next = { ...current, ...patch };
    setSettings(next);                                          // 先切过去，再写文件
    invoke<Settings>("save_settings", { settings: next }).then(setSettings).catch((err) => setNotice(`保存主题失败：${err}`));
  }, []);

  // 设置读到前传 undefined：用 localStorage 里上次的主题（首帧不闪）；读到后以设置文件为准
  const accent = settings && Object.hasOwn(THEMES, settings.themeAccent) ? (settings.themeAccent as Accent) : undefined;
  const mode = settings && ["light", "dark", "system"].includes(settings.themeMode) ? (settings.themeMode as ThemeMode) : undefined;

  return (
    <ThemeProvider accent={accent} mode={mode} onAccentChange={(a) => saveTheme({ themeAccent: a })} onModeChange={(m) => saveTheme({ themeMode: m })}>
      <ErrorBoundary>
        <RootNotice notice={notice} onShown={() => setNotice(null)} />
        <App settings={settings} setSettings={setSettings} />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

/** 在 ThemeProvider 里面：拿得到带主题的 message */
function RootNotice({ notice, onShown }: { notice: string | null; onShown: () => void }) {
  const { message } = AntApp.useApp();
  useEffect(() => {
    if (!notice) return;
    message.error(notice);
    onShown();
  }, [notice, message, onShown]);
  return null;
}
```

- 读设置失败时主题仍可用（localStorage 的值），页面里需要设置的地方显示 `EmptyState` 引导去设置页。
- 不要为了拿 `message` 把 `ThemeProvider` 拆成两层，也不要用静态 `message.error()`。

## 第 6 步：先选配方，再写页面

kit 的 `recipes/` 里有四个完整可运行的页面配方（demo 的「页面配方」分组就是它们）。**每个功能页先对照下表选一个配方，拷过去再改**，不要从空白开始拼：

| 配方 | 文件 | 什么时候用 | 例子 |
|---|---|---|---|
| 批处理页 | `recipes/batch-page.tsx` | 一批文件、一个总进度、一次跑完 | 图片转换、裁切、压缩、重命名 |
| 任务队列页 | `recipes/queue-page.tsx` | 任务各自独立、可并发、排队 / 取消 / 重试，每个任务有自己的状态与进度 | AI 出图、下载、转码 |
| 图库页 | `recipes/gallery-page.tsx` | 按「每张图」浏览产出，选中看详情、双击大图、对单张操作 | 出图结果、素材库 |
| 设置页 | `recipes/settings-page.tsx` | 应用级配置，草稿 / 保存 / 放弃修改 | 每个应用一个 |

一个应用通常是「一个或两个工作页（批处理 / 队列）+ 图库（可选）+ 设置」。不属于任何一种时（如表格逐行设置模式），以最接近的配方为骨架，demo 的「表格变体」（`demo/src/App.tsx` 的 `CropPage`）是批处理页换成 antd `Table` 的写法。

```bash
cp src/ui-kit/recipes/queue-page.tsx src/pages/QueuePage.tsx
# 改 import："../index" → "../ui-kit"；把 props 里的 api / backend 换成 invoke 实现（见下面各配方）
```

`recipes/mock.ts` 是 demo 用的内存数据层（`createMockQueueApi`、`mockBatchBackend`、`createMockSettingsApi`），**不要拷进项目**；写页面测试时可以借用它的写法。

所有配方共用的外壳（`src/App.tsx`）：

```tsx
import { useState } from "react";
import { OrderedListOutlined, PictureOutlined, SettingOutlined } from "@ant-design/icons";
import { AppShell, ErrorBoundary, NavBadge, ThemeMenu, ThemeToggle, useTaskEvents } from "./ui-kit";

type PageKey = "queue" | "gallery" | "settings";

export default function App() {
  const [page, setPage] = useState<PageKey>("queue");
  const { tasks } = useTaskEvents<Task>();                       // 侧栏徽标、图库都从任务列表派生
  const running = tasks.filter((t) => t.status === "running" || t.status === "queued").length;
  return (
    <AppShell
      brand={{ mark: "A", name: "应用名", subtitle: "一句话说明" }}
      nav={[
        { key: "queue", label: "出图", icon: <OrderedListOutlined />, section: "创作", badge: <NavBadge count={running} /> },
        { key: "gallery", label: "图库", icon: <PictureOutlined /> },
        { key: "settings", label: "设置", icon: <SettingOutlined />, section: "应用" },
      ]}
      active={page}
      onNavigate={setPage}
      sidebarFooter={<><span>版本 V1.0.0</span><span className="flex items-center gap-1"><ThemeMenu /><ThemeToggle /></span></>}
    >
      {/* 有状态的页面常驻，用 hidden 切换；每页一个 ErrorBoundary，一页出错不影响其他页 */}
      <div className={page === "queue" ? "h-full" : "hidden"}>
        <ErrorBoundary size="page"><QueuePage api={queueApi} /></ErrorBoundary>
      </div>
      {/* … gallery / settings 同理 */}
    </AppShell>
  );
}
```

### 配方 · 批处理页

- **何时用**：一批文件、一个总进度、一次跑完。
- **骨架**：`Page` > `Workspace`（左：`DropZone` + `ListWell` > `FileRow`；右：设置 `Panel`，`asideFooter` = `ProgressPanel` + 主按钮）+ 底部日志 `<Panel extra={<LogActions logs onClear />}>` > `LogViewer`。
- **状态与空态**：`files`、`failed`（失败标记）、`running`、`progress`；列表空时 `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE}>`；有文件后 `DropZone compact`；跑完后成功的移出、失败的留下标红，重新添加时清除失败标记；处理中禁用拖拽（`useFileDrop(add, { enabled: active && !running })`）。
- **主按钮**：「开始转换 · N 张」，处理中显示「处理中…」并禁用。
- **数据层**（`BatchBackend`）：

```tsx
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const tauriBatchBackend: BatchBackend = {
  pick: async () => {
    const picked = await open({ multiple: true, filters: [{ name: "Images", extensions: IMAGE_EXTENSIONS }] });
    return picked ? (Array.isArray(picked) ? picked : [picked]) : [];
  },
  run: async (files, options, report) => {
    const unlisten = await listen<BatchProgress>("batch-progress", (e) => report(e.payload));
    try { return await invoke<{ failed: string[]; message: string }>("batch_convert", { files, options }); }
    finally { unlisten(); }
  },
};
```

- **Rust 端**：见下文「Rust 端约定 · 批处理」，命令返回 `{ failed: Vec<String>, message: String }`。

### 配方 · 任务队列页

- **何时用**：任务各自独立、可并发、排队 / 取消 / 重试。
- **骨架**：`Page` > `Workspace`（左：`ListWell` > `ListRow`；右：一张 `<Panel fill className="min-h-0 flex-1">` + `SettingsScroll` 放参数，低频参数收进最后的 `AdvancedSection`，`asideFooter` 主按钮）+ 底部日志。
- **参数区导航**：`SettingsScroll` 内容超出时，下方自带「向下滚动查看更多」提示行（不遮挡内容）；关键参数离得远时，参数卡片标题栏放「比例与张数 ↓」跳转入口：`const fields = useFieldScroll()`，`<SettingsScroll ref={fields.ref}>`，目标表单项外包 `<ScrollField name="size">`，点击 `fields.scrollToField("size")`。
- **行**：`leading` = `Thumb`（运行中 `loading`）；`meta` = `StatusTag` + 参数 `Tag` + `LinkTag`（「改自 #n」，点击 `flash(parent.id)`）；`extra` = 运行中的 `Progress`、报错文字、多合一的 `ThumbStrip`（`caption` 常显 `#n-i`）；`trailing` 最多 3 个图标按钮 + 「更多」。失败行 `status="error"` + `failedLabel={false}`（行里已有失败 Tag）。
- **定位**：`const { flashKey, flash } = useRowFlash()`，行上 `highlight={flashKey === t.id}`；外部跳转（如从图库「定位到任务」）传 `focus={{ id, nonce: Date.now() }}`，先切页再定位。
- **状态与空态**：列表只由 `useTaskEvents` 维护（Rust 推事件），提交 / 重试 / 取消只调命令、不本地改列表；加载中 `EmptyState size="small" title="正在读取任务…"`，空队列 `EmptyState` 引导写提示词；缺配置（API Key）时 `EmptyState` + 「去设置」按钮。
- **主按钮**：「开始生成 · N 张」（张数是参数时照写）；被参数拦下时禁用，原因用 `FieldHint type="warning"` 写在相关控件下。
- **数据层**（`QueueApi`）：

```tsx
const queueApi: QueueApi = {
  load: () => invoke<QueueTask[]>("list_tasks"),
  // listen 不传：Tauri 里 useTaskEvents 自己用 @tauri-apps/api/event
  submit: (input) => invoke<QueueTask>("submit_task", { input }),
  retry: (id) => invoke("retry_task", { id }),
  cancel: (id) => invoke("cancel_task", { id }),
  remove: (ids) => invoke("remove_tasks", { ids }),
};
```

- **Rust 端**：见下文「Rust 端约定 · 多任务队列」；`number` 由 Rust 自增、删除后不复用。
- **测试 / 浏览器预览**：`useTaskEvents({ listen: backend.listen, load: backend.load })` 配 `createMockTaskBackend()`，非 Tauri 环境也会订阅与加载。

### 配方 · 图库页

- **何时用**：按「每张图」浏览已产出的结果。
- **骨架**：`Page` > `Workspace`（左：`Segmented` 筛选（Panel `extra`）+ `ListWell className="p-3"` > `ImageGrid`；右：`<Panel fill title="图片信息" className="min-h-0 flex-1">` 内部滚动的详情，`asideFooter` 主按钮）+ 底部日志。
- **瓦片角标**：编号用 `<ImageBadge>#12-3</ImageBadge>` + `badgePlacement="top-left"`。
- **裁切 / 完整**：标题栏给 `Segmented` 切换 `ImageGrid` 的 `fit`；有长条图时默认「完整」。
- **状态与空态**：`items` 由任务列表派生（每个成功任务的每个文件一项）；选中项可受控——外部改 `selectedKey` 即定位，`ImageGrid` 自动滚到可见，选中项被筛掉时切回「全部」；没有图时 `EmptyState`，没选中时详情区 `EmptyState size="small"`。
- **主按钮**：「继续修改 · 这张」；详情区放次级按钮（大图预览、复制、打开文件夹、定位到任务、`danger` 的「删除记录…」）。
- **数据层**：`items` + `onEdit` / `onReveal`（`revealItemInDir(path)`，opener 插件）/ `onRemove`（`invoke("remove_tasks")`）/ `onLocateTask`。

### 配方 · 设置页

- **何时用**：每个应用一个。排版规范见 design.md「设置页」。
- **骨架**：`Page` > `Workspace`（左：`<Panel fill className="flex-1" title="设置" extra="外观即时生效…">` > `SettingsScroll` > `<Form layout="vertical" component="div" className="contents">` > 若干 `SettingsSection`；右：「关于」卡片，`asideFooter` = 有改动时的「放弃修改」+ 主按钮）+ 底部日志。
- **状态**：`saved` / `draft` 两份，`dirty` 比较两者；外观（明暗、主题）直接调 `useTheme().setMode / setAccent`，不进草稿；缺必填项时顶部 `EmptyState size="small"`；输入格式错误用 `Form.Item validateStatus / help`，并禁用保存。
- **主按钮**：「保存设置」（无改动或有错误时禁用）。
- **数据层**（`SettingsApi`）：`load: () => invoke("get_settings")`、`save: (s) => invoke("save_settings", { settings: s })`、`test`（测试连接，不扣费）、`pickDir: () => open({ directory: true })`、`about`（版本、数据目录）。

## 规则（写页面时必须遵守）

1. **控件一律用 antd**，从 `"antd"` 导入。只有应用级组件（`AppShell`、`Panel`、`ListRow`、`Thumb`、`LogViewer` 等）从 `./ui-kit` 导入。不要自己写按钮、输入框、下拉、弹窗、Tooltip。**例外**：antd 没有的「可选中卡片」（图片瓦片、色块卡片）用原生 `<button type="button">` + `aria-pressed` / `role="radio"`，照 `ImageGrid` / `ThemePicker` 的写法（先看 kit 有没有现成件）。
2. **颜色只用 token**：组件里用 `theme.useToken()`；className 用 preset 的语义类（`bg-container`、`bg-layout`、`text-text-secondary`、`text-primary-text`、`border`、`bg-item-active`、`text-error` …）；SVG 用 `fill-*` / `stroke-*` 类（`fill-primary-bg stroke-primary`）或 `currentColor`。**禁止** `bg-gray-*`、`text-slate-*`、`bg-orange-*` 这类色板类和内联色值；**禁止** `bg-primary/10` 这类透明度写法（变量不支持）。`text-text-quaternary` 只用于禁用态。
3. **主题只通过 `ThemeProvider` 的 `accent` / `mode` / `sidebar` / `glass`（或 `useTheme().setAccent / setMode`）切换**，不要在页面里传 `ConfigProvider theme` 覆盖颜色。要新增主题，改 `ui-kit/antd-theme.ts` 的 `THEMES` 并跑审计（需用户同意修改 ui-kit）。用户只给配色时：取饱和度最高的一个作 `primary`、最深或最有辨识度的一个作 `sidebar`，审计出现区分度警告时写进 `note` 并告诉用户。深色表面会按 `sidebar` 的色相自动推出，不用写。
4. **字号**：正文 `text-base`（12px，默认），说明 `text-sm`（11px），卡片标题由 Card 自带（14px），页面标题用 `PageHeader`（26px）。不要用 14px / 16px 做正文。不要叠加 `compactAlgorithm`。
5. **按钮**：每个区域最多一个 `type="primary"`，放在 `Workspace` 的 `asideFooter`。批处理页写明数量（「开始转换 · 5 张」）；非批处理页写「动词 + 对象」（「保存设置」「继续修改 · 这张」）。「清空列表」用 `type="link" size="small"` 放在 `Panel` 的 `extra`。
6. **危险操作**：页面上用 `<Button danger icon={<DeleteOutlined />}>删除…</Button>` 或 `danger type="text"`；**实心危险按钮只出现在 `modal.confirm({ okButtonProps: { danger: true } })` 里**，不与实心主按钮并排。
7. **状态一律带图标**：用 `<StatusTag status="success" />`（排队 / 进行中 / 成功 / 失败 / 警告 / 已取消），或 `<Tag icon={<CheckCircleOutlined />} color="success">`、`<Alert showIcon …>`，不单靠颜色表达（部分主题的主色与功能色同色系）。
8. **毛玻璃**只通过 `glass` 开关；卡片级容器用 `Panel` 才会自动变成玻璃面，不要自己写 `backdrop-filter`；也不要给 `Topbar` / `StatusBar` / `Panel` 传 `bg-*` 或 `!bg-[…]` 去改底色（Tailwind 工具类优先级高于玻璃类，会把玻璃盖成实心；1.6.1 起这两个组件毛玻璃下已是玻璃面，不需要绕法）。
9. **反馈**：`const { message, modal, notification } = App.useApp()`，然后照常 `message.success(...)`。不要 `import { message } from "antd"` 后调用静态方法（拿不到主题）。
10. **布局**：每个功能页 = `Page` > `Workspace`（左列表、右设置栏 + `asideFooter`，右栏宽度全应用一致）+ 底部日志 `Panel`。只让列表 / 日志 / 参数区滚动，`Page` 本身不滚。列表卡片 `<Panel fill className="flex-1">`。**有状态的功能页常驻、用 `hidden` 切换**，不要按 `page === x &&` 卸载（日志、草稿、事件订阅会丢）。
11. **日志**：每个功能页各自 `useLogger()`，不要多页共用一份；清空 / 复制用 `<Panel extra={<LogActions logs={logs} onClear={clear} />}>`。页面挂载前就可能产生的日志（Rust 启动时发的事件）在 `main.tsx` 里订阅并 `pushLog("页面名", msg, level)`，页面用 `useLogger({ channel: "页面名" })` 接收。
12. **批处理部分失败**：成功的移出列表，失败的留下并用 `FileRow status="error"` / `ListRow status="error"`（表格用 `FILE_ROW_ERROR_CLASS` + `FailedMark`）标红，方便重试。失败行里的 antd 文字与中性 Tag 会自动继承红字，不用手写 `text-inherit`。
13. **拖拽**只用 `useFileDrop`（窗口级 Tauri 事件）。不要用 HTML5 `onDrop`，也不要用 antd `Upload.Dragger`（都拿不到本地路径）。
14. **本地图片**用 `<Thumb path={…} />`（缩略图）、`<ThumbStrip items={…} />`（缩略图条 / 参考图墙）、`<ImageGrid items={…} />`（图库网格），它们内部用 `convertFileSrc`，依赖第 4 步的 assetProtocol、CSP 与 Cargo `protocol-asset`。自己拼地址时用 `localImageSrc(path)`。
15. **行尾操作**：`type="text" size="small"` 图标按钮 + `Tooltip` + `aria-label`，最多 3 个，其余收进「更多」（`MoreOutlined` + `Dropdown`），删除放菜单最后。
16. **右栏提示**：单项说明写 `Form.Item extra`；依赖其他参数的提示 / 警示用 `<FieldHint>` / `<FieldHint type="warning">`，不要在 300px 右栏里放 `Alert`。空状态需要引导操作时用 `EmptyState`。侧栏徽标用 `NavBadge`，不用 antd `Badge`（默认红色是危险语义）。
17. **内联 `style`** 只给运行时算出的数据（宽高比、列数、调用方传入的尺寸、要原样展示的色块）；颜色、间距、字号一律用类名。
18. **可点击的标签**（既表达状态 / 关系，又能跳转定位，如「改自 #7」）用 `LinkTag`，不要给 `Tag` 自己补 `role="button"` 与键盘事件；会改数据的操作仍用 `Button`。
19. **日志按钮**：「清空」「复制全部」用 `<Panel extra={<LogActions logs={logs} onClear={clear} />}>`，不要自己写这两个按钮。**低频参数**收进 `AdvancedSection`（参数区最后、默认折叠）。
20. **定位高亮**：跳到某条记录用 `useRowFlash` 的 `flash(id)`（主色内描边 2 秒，自动滚到可见）；图库定位用 `ImageGrid` 的受控 `selectedKey`（自动滚到可见）。目标在另一页时先切页再定位。
21. **图片上的文字**（编号、张数、模型名角标）用 `ImageBadge`（实底卡片色 + 描边 + 正文色），不要用 `bg-spotlight`、半透明黑底或主色底。
22. **错误兜底**：入口在 `ThemeProvider` 里面包一层 `ErrorBoundary`；每个常驻功能页再包 `<ErrorBoundary size="page">`。事件回调、Promise 里的异常进不了错误边界，用 try/catch + `message` / 日志。
23. **比例 / 尺寸选择**用 `RatioSelect`（选项可带尺寸说明），下面配 `RatioPreview`；「整张等分拆切」不要传 `cellRatio`，每张比例写进 `caption`。
24. **v6 弃用 API 不要写**：`Space direction`（用 `orientation`）、`Alert message`（用 `title`）、`Progress trailColor`（用 `railColor`）。以 `antd lint` 的结果为准。

## 组件速查（从 `./ui-kit` 导入）

| 组件 / Hook | 关键参数 |
|---|---|
| `AppShell` | `brand={{ mark, name, subtitle? }}`（`mark`：单色字形——字母或 `currentColor` SVG，画在反色块里随主题变色；彩色图标——`{ src, alt? }`，原样显示、不套色块）`nav={NavItem[]}` `active` `onNavigate` `sidebarFooter?` `topbar?` `statusbar?` |
| `ErrorBoundary` | `title?` `onError?` `fallback?(error, reset)` `size="screen"\|"page"`；放在 ThemeProvider 里面 |
| `NavItem` | `{ key, label, icon?, section?（分组标题，写在组内第一项）, badge? }` |
| `NavBadge` | `count` `max=99` `tone="accent"\|"muted"` `showZero?`；传给 `NavItem.badge` |
| `Page` | `fill`（默认 true 不滚动；内容型页面传 `fill={false}` 整页滚动） |
| `PageHeader` | `eyebrow?` `title` `description?` `actions?` |
| `Workspace` | `aside` `asideFooter?`（常驻主按钮区）`asideWidth=300` `asideRef?` `asideMoreHint=true` `children` |
| `Panel` | antd `Card` 的全部参数 + `fill`（内容区撑满卡片） |
| `Topbar` / `StatusBar` | 普通容器，传给 AppShell 的 `topbar` / `statusbar` |
| `DropZone` | `active` `onBrowse` `title?` `hint?` `icon?` `compact?` `disabled?` |
| `ListWell` | 列表滚动容器（可传 ref，给 antd Table 的 sticky 用） |
| `FileRow` | 32px 文件行：`index` `selected` `status="error"` `trailing` `onClick` |
| `ListRow` | 富列表行：`index?` `leading?`（缩略图）`title?` `meta?` `extra?`（第二行起）`trailing?` `status?="error"` `failedLabel?` `selected?` `highlight?`（定位高亮并滚到可见）`align="start"\|"center"` |
| `useRowFlash(duration=2000)` | → `{ flashKey, flash(key), clear }`；行上 `highlight={flashKey === id}` |
| `LinkTag` | antd Tag 的全部参数 + `onClick` `disabled`；可点击标签（跳转 / 定位） |
| `FILE_ROW_ERROR_CLASS` / `FailedMark` | antd Table 失败行的 `rowClassName` / 失败图标 + 文字 |
| `Thumb` | `path?` `size="xs"\|"sm"\|"md"\|"lg"\|"fill"` `ratio?` `fit="cover"\|"contain"` `loading?` `preview=true` `open?` `onOpenChange?` `alt?` |
| `ThumbStrip` | `items: (string \| { key?, path, alt?, caption?, badge? })[]` `size="sm"` `columns?` `onRemove?(key)` `preview=true` `showName?` `fit="cover"\|"contain"` |
| `ImageGrid` | `items: { key, path, alt?, badge? }[]` `selectedKey?`（变化时自动滚到可见）`onSelect?` `minTileWidth=148` `ratio=1` `preview=true` `previewIndex?` `onPreviewIndexChange?` `badgePlacement="bottom-left"\|"top-left"` `scrollToSelected=true` `fit="cover"\|"contain"` |
| `ImageBadge` | 图片上的角标（编号、张数） |
| `localImageSrc(path)` | 本地路径 → `convertFileSrc`（浏览器里原样返回） |
| `RatioIcon` | `ratio`（"16:9" / 1.5 / [16, 9] / "auto"）`size=16` |
| `RatioSelect` | antd Select 的参数 + `options: (string \| { value, label?, size?, disabled? })[]` `value` `onChange` `autoLabel="自动"` |
| `RatioPreview` | `ratio` `cols=1` `rows=1` `cellRatio?`（只用于「合成后每格居中裁切」）`labels=true` `height=110` `caption?` `autoText?` |
| `parseRatio(value)` | → `[宽, 高] \| null` |
| `SettingsSection` | `title` `description?` `extra?` `children` |
| `SettingsScroll` | 长表单滚动容器，`maxWidth=640` `moreHint=true`；ref 指向滚动容器 |
| `AdvancedSection` | 「高级」折叠：`title="高级"`（2–4 个字，超长单行省略）`description?`（第二行）`changedCount?` `extra?` `defaultOpen=false` `open?` `onOpenChange?` |
| `ScrollArea` | 纵向滚动区：`moreHint=true`（下方「向下滚动查看更多」提示行，不遮挡内容）`rootClassName?`；ref 指向滚动容器 |
| `ScrollField` / `useFieldScroll()` / `scrollToField(el, name)` | 字段锚点 `<ScrollField name>`；`const { ref, scrollToField } = useFieldScroll()`，ref 给 `SettingsScroll` / `ScrollArea` |
| `EmptyState` | `icon?` `title?` `description?` `action?` `size="default"\|"small"` |
| `StatusTag` | `status="queued"\|"processing"\|"success"\|"error"\|"warning"\|"cancelled"`，`children` 覆盖文案 |
| `FieldHint` | `type="info"\|"warning"` `children` |
| `LogViewer` | `logs` `onClear?` `copyable?`（传 onClear 时默认开）`toolbar="side"\|"none"` `copyText?` `emptyText?` |
| `LogActions` | `logs` `onClear?` `copyable=true` `copyText?`；放 Panel 的 `extra` |
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
| `useTaskEvents<T>(options?)` | `{ load?, listen?, enabled?, updatedEvent="task-updated", removedEvent="task-removed", getId?, sort? }` → `{ tasks, loaded, setTasks, reload }` |
| `createMockTaskBackend<T>(initial?)` | 内存模拟后端 → `{ listen, load, update(task), remove(ids), snapshot() }`；浏览器预览、测试用 |
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
