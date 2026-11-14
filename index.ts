// ui-kit 出口：只有应用级组件与主题。控件（Button、Input、Select、Table、Modal…）直接从 "antd" 导入。

/** 当前 ui-kit 版本，与 package.json 一致。 */
export const UI_KIT_VERSION = "1.6.0";

export { cn } from "./lib/cn";
export {
  ThemeProvider,
  useTheme,
  type ThemeMode,
  type ThemeProviderProps,
  type Accent,
  type Resolved,
  type SidebarStyle,
} from "./theme";
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
  glassColors,
  kitColors,
  primaryColors,
  resolveToken,
  sidebarColors,
  surfaceColors,
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
  type Brand,
  type BrandImage,
  type NavItem,
  type WorkspaceProps,
} from "./components/app/app-shell";
export { DropZone } from "./components/app/drop-zone";
export {
  LogViewer,
  LogActions,
  useLogger,
  pushLog,
  createLogEntry,
  logsToText,
  type LogEntry,
  type LogLevel,
  type LogViewerProps,
  type LogActionsProps,
  type CopyText,
  type UseLoggerOptions,
} from "./components/app/log-viewer";
export { ProgressPanel, type BatchProgress } from "./components/app/progress-panel";
export { ListWell, FileRow, FailedMark, FILE_ROW_ERROR_CLASS, fileName } from "./components/app/file-list";
export { ListRow, useRowFlash, ROW_FLASH_MS, type ListRowProps } from "./components/app/list-row";
export { LinkTag, type LinkTagProps } from "./components/app/link-tag";
export { ErrorBoundary, type ErrorBoundaryProps } from "./components/app/error-boundary";
export {
  Thumb,
  ThumbStrip,
  ImageBadge,
  localImageSrc,
  type ThumbProps,
  type ThumbSize,
  type ThumbItem,
  type ThumbStripProps,
} from "./components/app/thumb";
export { ImageGrid, type ImageGridItem, type ImageGridProps } from "./components/app/image-grid";
export {
  RatioIcon,
  RatioPreview,
  RatioSelect,
  ratioOptionLabel,
  parseRatio,
  type RatioOption,
  type RatioSelectProps,
  type RatioValue,
  type RatioIconProps,
  type RatioPreviewProps,
} from "./components/app/ratio";
export {
  SettingsSection,
  SettingsScroll,
  AdvancedSection,
  type SettingsSectionProps,
  type SettingsScrollProps,
  type AdvancedSectionProps,
} from "./components/app/settings-section";
export {
  ScrollArea,
  ScrollField,
  scrollToField,
  useFieldScroll,
  FIELD_ATTR,
  type ScrollAreaProps,
} from "./components/app/scroll-area";
export { EmptyState, type EmptyStateProps } from "./components/app/empty-state";
export { NavBadge, type NavBadgeProps } from "./components/app/nav-badge";
export { StatusTag, type StatusTagProps, type TaskStatusKind } from "./components/app/status-tag";
export { FieldHint, type FieldHintProps } from "./components/app/field-hint";
export { ThemeToggle } from "./components/app/theme-toggle";
export { ThemeMenu } from "./components/app/theme-menu";
export { ThemePicker } from "./components/app/theme-picker";

// Tauri 专用
export { useFileDrop, filterByExtension, IMAGE_EXTENSIONS } from "./tauri/useFileDrop";
export { useBatchProgress } from "./tauri/useBatchProgress";
export {
  useTaskEvents,
  createMockTaskBackend,
  type UseTaskEventsOptions,
  type TaskListen,
  type MockTaskBackend,
} from "./tauri/useTaskEvents";
