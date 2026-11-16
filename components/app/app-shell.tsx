import * as React from "react";
import { Card, Layout, Menu, Typography, type CardProps, type MenuProps } from "antd";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";
import { ScrollArea } from "./scroll-area";

export interface NavItem<K extends string = string> {
  key: K;
  label: string;
  icon?: React.ReactNode;
  /** 分组标题，写在该组第一项上 */
  section?: string;
  /** 右侧徽标：用 `<NavBadge count={n} />`（反色块）或 `<NavBadge tone="muted" />`（纯数字） */
  badge?: React.ReactNode;
}

/** 品牌标记用图片（应用图标）时的写法。 */
export interface BrandImage {
  /** 图片地址：import 进来的 png / svg（`import icon from "./assets/app-icon.png"`） */
  src: string;
  alt?: string;
}

export interface Brand {
  /**
   * 品牌标记，两种情况：
   *   - **单色字形**（一个字母，或 `fill="currentColor"` 的单色 SVG 组件）：画在 40px 反色块里
   *     （侧栏文字色做底、侧栏底色画形），随主题、深浅自动变色。适合没有彩色图标、或想让侧栏统一的应用。
   *   - **彩色图标**（`{ src, alt }`，import 进来的 png / svg）：原样显示、**不套反色块**，
   *     所以透明圆角处不会露出色块。用不带 macOS 留边的版本（底板铺满画布，可另导一张 brand-mark.png），
   *     否则 40px 里只剩约 32px。图标底板在深浅侧栏上都要看得清（浅色底板在浅色侧栏上要有描边或阴影）。
   *   不要把彩色图标的 `<img>` 当 ReactNode 传进来：那会被套进反色块。
   */
  mark: React.ReactNode | BrandImage;
  name: string;
  subtitle?: string;
}

function isBrandImage(mark: Brand["mark"]): mark is BrandImage {
  return typeof mark === "object" && mark !== null && !React.isValidElement(mark) && "src" in mark;
}

interface AppShellProps<K extends string> {
  brand: Brand;
  nav: NavItem<K>[];
  active: K;
  onNavigate: (key: K) => void;
  /** 侧栏底部（版本号、主题切换等） */
  sidebarFooter?: React.ReactNode;
  /** 顶栏；不传则不渲染 */
  topbar?: React.ReactNode;
  /** 底部固定状态栏（输出位置等）；不传则不渲染 */
  statusbar?: React.ReactNode;
  children: React.ReactNode;
}

const COMPACT_QUERY = "(max-width: 1180px)";

function useCompact() {
  const [compact, setCompact] = React.useState(() => window.matchMedia(COMPACT_QUERY).matches);
  React.useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const onChange = () => setCompact(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return compact;
}

/** NavItem[] → antd Menu items：带 section 的项开启一个分组，直到下一个 section。 */
function toMenuItems<K extends string>(nav: NavItem<K>[]): MenuProps["items"] {
  const items: NonNullable<MenuProps["items"]> = [];
  let group: { type: "group"; key: string; label: string; children: NonNullable<MenuProps["items"]> } | null =
    null;
  for (const item of nav) {
    const entry = {
      key: item.key,
      icon: item.icon,
      label: item.badge ? (
        <span className="flex items-center justify-between gap-2">
          <span className="truncate">{item.label}</span>
          {item.badge}
        </span>
      ) : (
        item.label
      ),
    };
    if (item.section) {
      group = { type: "group", key: `section:${item.section}`, label: item.section, children: [] };
      items.push(group);
    }
    if (group) group.children.push(entry);
    else items.push(entry);
  }
  return items;
}

/**
 * 应用外壳：224px 侧栏（≤ 1180px 时 195px）+ 主区（可选顶栏 / 底部状态栏）。
 * 侧栏是 antd Layout.Sider + Menu，颜色来自 antd-theme.ts 的 Menu / Layout 组件 token。
 * 主区不滚动，页面自己决定哪个区域滚动。
 */
export function AppShell<K extends string>({
  brand,
  nav,
  active,
  onNavigate,
  sidebarFooter,
  topbar,
  statusbar,
  children,
}: AppShellProps<K>) {
  const { sidebar } = useTheme();
  // antd 的 Sider / Menu 只有 light / dark 两种；颜色全部由 antd-theme.ts 的侧栏 token 决定
  const antdSidebarTheme = sidebar === "light" ? "light" : "dark";
  const compact = useCompact();
  const items = React.useMemo(() => toMenuItems(nav), [nav]);

  return (
    <Layout hasSider className="h-screen w-screen overflow-hidden">
      <Layout.Sider
        theme={antdSidebarTheme}
        width={compact ? 195 : 224}
        className={cn("shrink-0", sidebar === "light" && "border-r")}
      >
        <div className="flex h-full flex-col text-sidebar-text">
          <div className={cn("flex shrink-0 items-center gap-3 pb-5 pt-6", compact ? "px-4" : "px-6")}>
            {isBrandImage(brand.mark) ? (
              <img
                src={brand.mark.src}
                alt={brand.mark.alt ?? ""}
                draggable={false}
                className="size-10 shrink-0 rounded-lg object-contain"
              />
            ) : (
              // 反色块：侧栏可能就是主色（如森翠），用侧栏文字色做底才保证看得见
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sidebar-active-text text-xl font-strong text-sidebar">
                {brand.mark}
              </span>
            )}
            <div className="min-w-0">
              <div className="truncate text-xl font-strong text-sidebar-active-text">{brand.name}</div>
              {brand.subtitle && <div className="truncate text-sm text-sidebar-muted">{brand.subtitle}</div>}
            </div>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto pb-3" aria-label="主导航">
            <Menu
              theme={antdSidebarTheme}
              mode="inline"
              items={items}
              selectedKeys={[active]}
              onClick={({ key }) => onNavigate(key as K)}
              className="border-none bg-transparent [&_.anticon]:text-sidebar-icon"
            />
          </nav>

          {sidebarFooter && (
            <div
              className={cn(
                // 与 StatusBar 等高（48px，含上边线），内容垂直居中，不靠 padding 撑高。
                // 浅色侧栏与 StatusBar 用同一条边线色（默认 border token）；主题色 / 深色侧栏用 sidebar-border
                "flex h-12 shrink-0 items-center justify-between gap-2 border-t text-sm text-sidebar-muted",
                sidebar !== "light" && "border-sidebar-border",
                compact ? "px-4" : "px-6"
              )}
            >
              {sidebarFooter}
            </div>
          )}
        </div>
      </Layout.Sider>

      <Layout className="min-w-0">
        {topbar}
        <Layout.Content className="min-h-0 flex-1 overflow-hidden">{children}</Layout.Content>
        {statusbar}
      </Layout>
    </Layout>
  );
}

/** 顶栏：64px，左侧面包屑 / 标题，右侧操作。毛玻璃开启时是玻璃面。 */
export function Topbar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { glass } = useTheme();
  return (
    <header
      className={cn(
        "flex h-16 shrink-0 items-center justify-between gap-4 border-b px-8 compact:px-6",
        // 毛玻璃开启时底色只来自 kit-glass：Tailwind 工具类（bg-container）优先级高于 kit-glass，不能同时带
        glass ? "kit-glass rounded-none border-x-0 border-t-0" : "bg-container",
        className
      )}
      {...props}
    />
  );
}

/**
 * 底部状态栏：48px（含上边线，与侧栏底栏等高），显示输出位置等常驻信息。
 * 毛玻璃开启时背景透明（跟主区这一列，露出背景渐变），不做玻璃面，只留上边线；关闭时是实心 bg-container。
 * 不要给它传 bg-*：见 design.md「相邻底栏」。
 */
export function StatusBar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const { glass } = useTheme();
  return (
    <footer
      className={cn(
        "flex min-h-12 shrink-0 items-center gap-3 border-t px-8 text-sm text-text-secondary compact:px-6",
        !glass && "bg-container",
        className
      )}
      {...props}
    />
  );
}

interface PageHeaderProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** 页面标题区：11px 标签 + 26px 标题（antd h2）+ 12px 说明。 */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex shrink-0 items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && <div className="text-sm text-text-tertiary">{eyebrow}</div>}
        <Typography.Title level={2} className="my-1">
          {title}
        </Typography.Title>
        {description && <Typography.Text type="secondary">{description}</Typography.Text>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * 页面容器：内边距 + 纵向排布，高度撑满主区。
 * 工作台式页面（列表 + 设置 + 日志）用 fill；内容型页面去掉 fill 让它自然滚动。
 */
export function Page({
  className,
  fill = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { fill?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-page flex-col gap-5 px-8 py-7 compact:px-6 compact:py-6",
        fill ? "h-full min-h-0" : "h-full overflow-y-auto",
        className
      )}
      {...props}
    />
  );
}

export interface WorkspaceProps {
  className?: string;
  /** 右栏内容：设置卡片（`Panel`）。只传 aside 时整个右栏一起滚动（1.2.0 行为） */
  aside: React.ReactNode;
  /**
   * 右栏底部常驻区：进度 + 主按钮。传了它，右栏变成「aside 区内部滚动 + 底部常驻」，
   * 参数再多主按钮也不会被挤出可视区。aside 里的参数卡片用 `<Panel fill className="min-h-0 flex-1">`
   * 并把长表单放进 `SettingsScroll`，或者直接放多个普通 Panel（由右栏整体滚动）。
   */
  asideFooter?: React.ReactNode;
  /** 右栏宽度，默认 300；同一应用所有页面保持一致 */
  asideWidth?: number;
  /** 右栏滚动区（aside 那一层）的 ref，用来滚到某个字段 */
  asideRef?: React.Ref<HTMLDivElement>;
  /** 右栏滚动区内容超出时底部的「下面还有」提示，默认开启（参数卡片内部用 SettingsScroll 时它自己也有提示） */
  asideMoreHint?: boolean | React.ReactNode;
  children: React.ReactNode;
}

/**
 * 两栏工作区：左侧主内容自适应，右侧设置栏固定宽度。
 * 同一应用里所有页面应使用相同的 aside 宽度，保证切换时右栏不跳动。
 *
 * @example
 * <Workspace
 *   aside={<Panel fill title="参数" className="min-h-0 flex-1"><SettingsScroll>…</SettingsScroll></Panel>}
 *   asideFooter={<><ProgressPanel progress={progress} /><Button type="primary" block>开始转换 · 5 张</Button></>}
 * >
 */
export function Workspace({
  className,
  aside,
  asideFooter,
  asideWidth = 300,
  asideRef,
  asideMoreHint = true,
  children,
}: WorkspaceProps) {
  return (
    <div
      className={cn("grid min-h-0 flex-1 gap-5", className)}
      // 右栏宽度是参数，只能用内联 style
      style={{ gridTemplateColumns: `minmax(0,1fr) ${asideWidth}px` }}
    >
      <div className="flex min-h-0 min-w-0 flex-col">{children}</div>
      <div className="flex min-h-0 flex-col gap-4">
        <ScrollArea ref={asideRef} moreHint={asideMoreHint} className="flex flex-col gap-4">
          {aside}
        </ScrollArea>
        {asideFooter !== undefined && <div className="flex shrink-0 flex-col gap-3">{asideFooter}</div>}
      </div>
    </div>
  );
}

/**
 * 卡片：antd Card，内容区纵向排布，标题右侧操作放 extra。毛玻璃开启时自动变成玻璃面。
 * fill：内容区撑满卡片剩余高度，里面的 ListWell / LogViewer 负责滚动。
 * 卡片本身多高由调用方决定：列表卡片加 className="flex-1"，日志卡片加 "h-[170px] shrink-0"。
 */
export function Panel({ fill, className, classNames, ...props }: CardProps & { fill?: boolean }) {
  const { glass } = useTheme();
  const semantic = typeof classNames === "function" ? undefined : classNames;
  return (
    <Card
      className={cn(fill && "flex min-h-0 flex-col", glass && "kit-glass", className)}
      classNames={{
        ...semantic,
        body: cn("flex flex-col gap-3", fill && "min-h-0 flex-1", semantic?.body),
      }}
      {...props}
    />
  );
}
