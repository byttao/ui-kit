// ui-kit 出口：只有应用级组件与主题。控件（Button、Input、Select、Table、Modal…）直接从 "antd" 导入。

/** 当前 ui-kit 版本，与 package.json 一致。 */
export const UI_KIT_VERSION = "1.1.0";

export { cn } from "./lib/cn";
export { ThemeProvider, useTheme, type ThemeMode, type Accent, type Resolved, type SidebarStyle } from "./theme";
export {
  DEFAULT_ACCENT,
  DEFAULTS,
  DISTANCE_MIN,
  FUNCTIONAL,
  GLASS,
  THEMES,
  buildTheme,
  familyColors,
  glassBackdrop,
  kitColors,
  primaryColors,
  resolveToken,
  sidebarColors,
  themeDistances,
  tokenToCssVars,
  type FamilyColors,
  type SidebarColors,
  type ThemeDef,
  type ThemeOptions,
} from "./antd-theme";

// 应用级组件（antd 没有的部分）
export {
  AppShell,
  Topbar,
  StatusBar,
  PageHeader,
  Page,
  Panel,
  Workspace,
  type NavItem,
} from "./components/app/app-shell";
export { DropZone } from "./components/app/drop-zone";
export {
  LogViewer,
  useLogger,
  type LogEntry,
  type LogLevel,
} from "./components/app/log-viewer";
export { ProgressPanel, type BatchProgress } from "./components/app/progress-panel";
export { ListWell, FileRow, FailedMark, FILE_ROW_ERROR_CLASS, fileName } from "./components/app/file-list";
export { ThemeToggle } from "./components/app/theme-toggle";
export { ThemePicker } from "./components/app/theme-picker";

// Tauri 专用
export { useFileDrop, filterByExtension, IMAGE_EXTENSIONS } from "./tauri/useFileDrop";
export { useBatchProgress } from "./tauri/useBatchProgress";
