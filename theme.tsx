import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { StyleProvider } from "@ant-design/cssinjs";
import { App as AntApp, ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  DEFAULTS,
  THEMES,
  buildTheme,
  sidebarStyle,
  tokenToCssVars,
  type Accent,
  type Resolved,
  type SidebarStyle,
} from "./antd-theme";

export type ThemeMode = "light" | "dark" | "system";
export type { Accent, Resolved, SidebarStyle };

interface ThemeContextValue {
  /** 用户选择：浅色 / 深色 / 跟随系统 */
  mode: ThemeMode;
  /** 实际生效的明暗 */
  resolved: Resolved;
  accent: Accent;
  /** 切换主题并记住选择；ThemeProvider 传了 accent（受控）时由外部决定，这里不生效 */
  setAccent: (accent: Accent) => void;
  /** 实际生效的侧栏样式（深色模式下始终为 theme） */
  sidebar: SidebarStyle;
  /** 毛玻璃是否开启；Panel / Topbar / StatusBar 据此加上玻璃面 */
  glass: boolean;
  setMode: (mode: ThemeMode) => void;
  /** 在浅色与深色之间切换（离开“跟随系统”） */
  toggle: () => void;
}

const STORAGE_KEY = "ui-kit:theme";
const ACCENT_KEY = "ui-kit:accent";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // localStorage 不可用时使用系统设置
  }
  return DEFAULTS.mode;
}

function readStoredAccent(): Accent {
  try {
    const value = localStorage.getItem(ACCENT_KEY);
    if (value && Object.hasOwn(THEMES, value)) return value as Accent;
  } catch {
    // localStorage 不可用时使用默认主题
  }
  return DEFAULTS.accent;
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

interface ThemeProviderProps {
  children: ReactNode;
  /**
   * 主题，见 antd-theme.ts 的 THEMES。
   * 不传时由 ThemeProvider 自己保存（默认 DEFAULTS 的森翠雅韵），用 useTheme().setAccent 或 ThemeMenu 切换，
   * 选择会记住；传了就是受控用法，由外部 state 决定。
   */
  accent?: Accent;
  /** 浅色模式下的侧栏："theme" 主题色，"light" 主题色浅底（默认）。深色模式下始终是主题色 */
  sidebar?: SidebarStyle;
  /** 毛玻璃：卡片变成半透明玻璃面，背景换成主题配色的渐变（默认开启） */
  glass?: boolean;
}

/**
 * 主题唯一入口：
 *   StyleProvider layer   → antd 样式进 @layer antd，排在 Tailwind 基础重置之上、工具类之下
 *   ConfigProvider        → antd 主题（antd-theme.ts 的 buildTheme）
 *   App                   → 让 App.useApp() 的 message / modal / notification 拿到主题
 * 同时把解析后的 token 写到 :root 的 CSS 变量，供 Tailwind 类读取。
 */
export function ThemeProvider({
  children,
  accent: accentProp,
  sidebar = DEFAULTS.sidebar,
  glass = DEFAULTS.glass,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [storedAccent, setStoredAccent] = useState<Accent>(readStoredAccent);
  const accent = accentProp ?? storedAccent;
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION).matches);

  // 跟随系统时监听 OS 明暗变化
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemDark(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // 系统「减弱动态效果」→ antd token.motion = false
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolved: Resolved = mode === "system" ? (systemDark ? "dark" : "light") : mode;
  const options = useMemo(
    () => ({ accent, resolved, sidebar, glass, reducedMotion }),
    [accent, resolved, sidebar, glass, reducedMotion]
  );
  const antdThemeConfig = useMemo(() => buildTheme(options), [options]);

  // 在首次绘制前写好 class 与变量，避免先画一帧旧主题
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
    if (glass) root.dataset.glass = "";
    else delete root.dataset.glass;
    for (const [name, value] of Object.entries(tokenToCssVars(options))) {
      root.style.setProperty(name, value);
    }
  }, [options, resolved, glass]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 忽略存储失败，本次会话内仍然生效
    }
  }, []);

  const setAccent = useCallback((next: Accent) => {
    setStoredAccent(next);
    try {
      localStorage.setItem(ACCENT_KEY, next);
    } catch {
      // 忽略存储失败，本次会话内仍然生效
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  const value = useMemo(
    () => ({ mode, resolved, accent, setAccent, sidebar: sidebarStyle(options), glass, setMode, toggle }),
    [mode, resolved, accent, setAccent, options, glass, setMode, toggle]
  );

  return (
    <ThemeContext.Provider value={value}>
      <StyleProvider layer>
        <ConfigProvider theme={antdThemeConfig} locale={zhCN}>
          <AntApp component={false}>{children}</AntApp>
        </ConfigProvider>
      </StyleProvider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme 必须在 <ThemeProvider> 内使用");
  }
  return context;
}
