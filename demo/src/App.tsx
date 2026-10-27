import { useMemo, useRef, useState } from "react";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ContainerOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ScissorOutlined,
  SyncOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App as AntApp,
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Segmented,
  Select,
  Slider,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  AppShell,
  DEFAULTS,
  THEMES,
  ThemePicker,
  DropZone,
  FileRow,
  ListWell,
  LogViewer,
  Page,
  PageHeader,
  Panel,
  ProgressPanel,
  ThemeProvider,
  ThemeToggle,
  Workspace,
  useLogger,
  useTheme,
  type Accent,
  type BatchProgress,
  type NavItem,
  type SidebarStyle,
  type ThemeMode,
} from "@kit";
import { auditAll, auditTheme, type AuditRow } from "@kit/lib/audit";

type PageKey = "convert" | "crop" | "components" | "contrast";

const NAV: NavItem<PageKey>[] = [
  { key: "convert", label: "图片转换", icon: <SwapOutlined />, section: "图片处理" },
  { key: "crop", label: "图片裁切", icon: <ScissorOutlined /> },
  { key: "components", label: "组件一览", icon: <AppstoreOutlined />, section: "设计系统" },
  { key: "contrast", label: "对比度", icon: <EyeOutlined /> },
];

const SAMPLE_FILES = ["1299.PNG", "1300.PNG", "1303.PNG", "商品主图-正面.jpg", "详情页-尺码表.png"];

export function App() {
  const [accent, setAccent] = useState<Accent>(DEFAULTS.accent);
  const [sidebar, setSidebar] = useState<SidebarStyle>(DEFAULTS.sidebar);
  const [glass, setGlass] = useState<boolean>(DEFAULTS.glass);

  return (
    <ThemeProvider accent={accent} sidebar={sidebar} glass={glass}>
      <Shell
        accent={accent}
        setAccent={setAccent}
        sidebar={sidebar}
        setSidebar={setSidebar}
        glass={glass}
        setGlass={setGlass}
      />
    </ThemeProvider>
  );
}

interface ShellProps {
  accent: Accent;
  setAccent: (accent: Accent) => void;
  sidebar: SidebarStyle;
  setSidebar: (value: SidebarStyle) => void;
  glass: boolean;
  setGlass: (value: boolean) => void;
}

function Shell(props: ShellProps) {
  const [page, setPage] = useState<PageKey>("convert");

  return (
    <AppShell
      brand={{ mark: "P", name: "PigResize", subtitle: "图片批量处理" }}
      nav={NAV}
      active={page}
      onNavigate={setPage}
      sidebarFooter={
        <>
          <span>版本 V1.6.1</span>
          <ThemeToggle />
        </>
      }
    >
      {page === "convert" && <ConvertPage />}
      {page === "crop" && <CropPage />}
      {page === "components" && <ComponentsPage {...props} />}
      {page === "contrast" && <ContrastPage />}
    </AppShell>
  );
}

const SIZE_PRESETS = [
  { value: "1440", label: "1440 方图" },
  { value: "1440c", label: "1440 长图" },
  { value: "800", label: "800 方图" },
  { value: "product", label: "商品长图" },
];

/** 列表页模板：左侧列表 + 右侧设置栏 + 底部日志，对应 PigResize「图片转换」。 */
function ConvertPage() {
  const [files, setFiles] = useState<string[]>(SAMPLE_FILES);
  const [preset, setPreset] = useState("1440");
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const { logs, log } = useLogger();
  const { message } = AntApp.useApp();

  // 演示部分失败：1303.PNG 失败，成功的移出列表，失败的留下并标红，便于重试
  const run = () => {
    log(`开始处理 ${files.length} 张图片。`, "processing");
    let index = 0;
    const tick = () => {
      index += 1;
      const done = index > files.length;
      setProgress({
        current: Math.min(index, files.length),
        total: files.length,
        percent: done ? 100 : (index / files.length) * 100,
        stage: done ? "完成" : "缩放",
        file_name: done ? "" : files[index - 1],
      });
      if (done) {
        const failedNow = files.filter((name) => name === "1303.PNG");
        failedNow.forEach((name) => log(`[!] 处理失败 - ${name}`, "error"));
        log(`已输出 ${files.length - failedNow.length} 张图片，${failedNow.length} 张失败，已留在列表中。`, "warning");
        message.warning(`${failedNow.length} 张处理失败，已留在列表中`);
        setFiles(failedNow);
        setFailed(new Set(failedNow));
        window.setTimeout(() => setProgress(null), 1500);
        return;
      }
      log(`[*] 正在处理: ${files[index - 1]}`, "info");
      window.setTimeout(tick, 400);
    };
    tick();
  };

  return (
    <Page>
      <Workspace
        aside={
          <>
            <Panel title="转换样式">
              <Radio.Group
                orientation="vertical"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                options={SIZE_PRESETS}
              />
            </Panel>
            <div className="mt-auto flex flex-col gap-3">
              <ProgressPanel progress={progress} />
              <Button type="primary" block disabled={!files.length || !!progress} onClick={run}>
                {progress ? "处理中…" : `开始转换 · ${files.length} 张`}
              </Button>
            </div>
          </>
        }
      >
        <Panel
          fill
          className="flex-1"
          title="待转换图片"
          extra={
            <Space size="small">
              <Typography.Text type="secondary">{files.length} 张</Typography.Text>
              <Button
                type="link"
                size="small"
                disabled={!files.length}
                onClick={() => {
                  setFiles([]);
                  setFailed(new Set());
                }}
              >
                清空列表
              </Button>
            </Space>
          }
        >
          <DropZone
            active={false}
            compact={files.length > 0}
            onBrowse={() => {
              setFiles(SAMPLE_FILES);
              setFailed(new Set());
            }}
            hint="JPG、PNG、BMP、GIF · 可批量添加"
          />
          <ListWell>
            {files.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="添加图片后会显示在这里" className="py-9" />
            ) : (
              <ul className="m-0 list-none p-0">
                {files.map((name, index) => (
                  <FileRow key={name} index={index + 1} status={failed.has(name) ? "error" : undefined}>
                    {name}
                  </FileRow>
                ))}
              </ul>
            )}
          </ListWell>
        </Panel>
      </Workspace>

      <Panel title="处理日志" size="small" className="h-[170px] shrink-0" fill>
        <LogViewer logs={logs} />
      </Panel>
    </Page>
  );
}

const CROP_MODES = [
  { value: "auto", label: "自动识别" },
  { value: "corners", label: "四角乱切" },
  { value: "grid2", label: "四宫格拆分" },
  { value: "grid3", label: "九宫格拆分" },
];

/** 表格页模板：逐行模式下拉 + 设置栏，对应 PigResize「图片裁切」。 */
function CropPage() {
  const [modes, setModes] = useState<Record<string, string>>(
    Object.fromEntries(SAMPLE_FILES.map((name, i) => [name, i % 3 === 0 ? "grid2" : "auto"]))
  );
  const [mode, setMode] = useState("auto");
  const [quick, setQuick] = useState(false);
  const well = useRef<HTMLDivElement>(null);

  return (
    <Page>
      <Workspace
        aside={
          <>
            <Panel title="裁切模式">
              <Radio.Group
                orientation="vertical"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                options={CROP_MODES}
              />
              <Checkbox checked={quick} onChange={(e) => setQuick(e.target.checked)}>
                快速模式：拖入后立即开始
              </Checkbox>
            </Panel>
            <Panel title="保存设置">
              <Form layout="vertical">
                <Form.Item label="输出位置" extra="默认保存到各原图所在目录" className="mb-0">
                  <Select
                    defaultValue="source"
                    options={[
                      { value: "source", label: "原图目录" },
                      { value: "custom", label: "自定义目录…" },
                    ]}
                  />
                </Form.Item>
              </Form>
            </Panel>
            <Button type="primary" block className="mt-auto">
              开始裁切 · {SAMPLE_FILES.length} 张
            </Button>
          </>
        }
      >
        <Panel
          fill
          className="flex-1"
          title="待裁切图片"
          extra={
            <Button type="link" size="small">
              清空列表
            </Button>
          }
        >
          <DropZone active={false} compact onBrowse={() => {}} />
          <ListWell ref={well}>
            <Table
              size="small"
              pagination={false}
              rowKey="name"
              sticky={{ getContainer: () => well.current ?? document.body }}
              dataSource={SAMPLE_FILES.map((name) => ({ name }))}
              columns={[
                { title: "图片文件", dataIndex: "name", ellipsis: true },
                {
                  title: "识别模式",
                  width: 140,
                  render: (_, row) => (
                    <Select
                      size="small"
                      className="w-full"
                      value={modes[row.name]}
                      onChange={(value) => setModes((prev) => ({ ...prev, [row.name]: value }))}
                      options={CROP_MODES}
                    />
                  ),
                },
              ]}
            />
          </ListWell>
        </Panel>
      </Workspace>
    </Page>
  );
}

/** 组件与主题一览：切换明暗、主题预设与侧栏，检查 antd 组件在各组合下的表现。 */
function ComponentsPage({ accent, setAccent, sidebar, setSidebar, glass, setGlass }: ShellProps) {
  const { mode, setMode } = useTheme();
  const { message, modal } = AntApp.useApp();
  const [open, setOpen] = useState(false);

  // 实心危险按钮只出现在确认弹窗里，并且取代主按钮，不与橙色主按钮并排
  const confirmDelete = () =>
    modal.confirm({
      title: "删除 5 张已输出图片？",
      content: "文件会移到废纸篓，可以从那里恢复。",
      okText: "删除",
      okButtonProps: { danger: true },
      cancelText: "取消",
      onOk: () => message.success("已删除 5 张图片"),
    });

  return (
    <Page fill={false}>
      <PageHeader
        eyebrow="Design System"
        title="组件一览"
        description="antd v6 组件 + ui-kit 主题。切换明暗、主题预设与侧栏，检查每个组件的表现。"
        actions={
          <Button type="primary" onClick={() => message.success("这是一条轻提示")}>
            显示提示
          </Button>
        }
      />

      <Panel title="主题" extra={<Typography.Text type="secondary">{THEMES[accent].note}</Typography.Text>}>
        <ThemePicker value={accent} onChange={setAccent} />
        <Form layout="vertical" className="mt-2 grid grid-cols-3 gap-6">
          <Form.Item label="明暗" className="mb-0">
            <Segmented<ThemeMode>
              value={mode}
              onChange={setMode}
              options={[
                { value: "system", label: "跟随系统" },
                { value: "light", label: "浅色" },
                { value: "dark", label: "深色" },
              ]}
            />
          </Form.Item>
          <Form.Item label="浅色模式侧栏" extra="深色模式下始终是主题色侧栏" className="mb-0">
            <Segmented<SidebarStyle>
              value={sidebar}
              onChange={setSidebar}
              options={[
                { value: "theme", label: "主题色" },
                { value: "light", label: "浅色" },
              ]}
            />
          </Form.Item>
          <Form.Item label="毛玻璃" extra="卡片变成半透明玻璃面，背景换成主题配色渐变" className="mb-0">
            <Switch checked={glass} onChange={setGlass} />
          </Form.Item>
        </Form>
      </Panel>

      <Panel title="按钮">
        <Space wrap>
          <Button type="primary">主要操作</Button>
          <Button>次要操作</Button>
          <Button type="dashed">虚线</Button>
          <Button type="text">文字按钮</Button>
          <Button type="link">链接按钮</Button>
          <Button danger icon={<DeleteOutlined />} onClick={confirmDelete}>
            删除…
          </Button>
          <Button danger type="text" icon={<ClearOutlined />}>
            清空
          </Button>
          <Button type="primary" disabled>
            不可用
          </Button>
          <Button type="primary" loading>
            处理中
          </Button>
          <Button size="small">小按钮</Button>
          <Tooltip title="Tooltip 是反色面：浅色下墨色底，深色下浅底">
            <Button icon={<ContainerOutlined />}>悬停看提示</Button>
          </Tooltip>
        </Space>
      </Panel>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="状态">
          <Space wrap size="small">
            {/* 状态一律带图标：颜色不是唯一信息来源，森翠 / 金韵 / 马卡龙下主色与功能色相近 */}
            <Tag icon={<ClockCircleOutlined />}>待处理</Tag>
            <Tag icon={<SyncOutlined spin />} color="processing">
              处理中
            </Tag>
            <Tag icon={<CheckCircleOutlined />} color="success">
              已完成
            </Tag>
            <Tag icon={<ExclamationCircleOutlined />} color="warning">
              部分完成
            </Tag>
            <Tag icon={<CloseCircleOutlined />} color="error">
              失败
            </Tag>
          </Space>
          <Alert showIcon title="四角裁切截取原图四角 85% 范围，按 3:4 输出。" />
          <Alert showIcon type="warning" title="输出目录已有同名文件，继续将覆盖。" />
          <Alert showIcon type="success" title="已输出 5 张图片。" />
          <Alert showIcon type="error" title="1304.PNG 处理失败：文件已损坏。" />
        </Panel>

        <Panel title="表单">
          <Form layout="vertical" initialValues={{ prefix: "京东详情", quality: 85, width: 1440, open: true }}>
            <Form.Item label="文件名前缀" name="prefix" extra="输出文件名为 前缀-序号.jpg">
              <Input />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="输出宽度" name="width">
                <InputNumber className="w-full" min={100} max={4000} suffix="px" />
              </Form.Item>
              <Form.Item label="JPG 质量" name="quality">
                <Slider min={50} max={100} />
              </Form.Item>
            </div>
            <Form.Item label="完成后打开输出目录" name="open" valuePropName="checked" className="mb-0">
              <Switch />
            </Form.Item>
          </Form>
        </Panel>
      </div>

      <Panel title="浮层与标签页">
        <Tabs
          items={[
            {
              key: "modal",
              label: "弹窗",
              children: (
                <Button onClick={() => setOpen(true)}>打开弹窗</Button>
              ),
            },
            { key: "tab2", label: "第二页", children: <Typography.Text>标签页内容</Typography.Text> },
            { key: "tab3", label: "第三页", disabled: true },
          ]}
        />
        <Modal title="确认覆盖" open={open} onOk={() => setOpen(false)} onCancel={() => setOpen(false)}>
          输出目录已有 3 个同名文件，继续将覆盖它们。
        </Modal>
      </Panel>

      <Panel title="日志配色">
        <LogViewer
          className="h-[120px] flex-none"
          logs={[
            { id: "1", time: "09:07:53", level: "info", message: "当前列表共有 5 张图片。" },
            { id: "2", time: "09:07:57", level: "processing", message: "[*] 正在处理: 1299.PNG" },
            { id: "3", time: "09:08:00", level: "success", message: "-> 已保存 1299_1440f.jpg" },
            { id: "4", time: "09:08:03", level: "warning", message: "输出目录已存在同名文件。" },
            { id: "5", time: "09:08:06", level: "error", message: "[!] 处理失败 - 1304.PNG" },
          ]}
        />
      </Panel>
    </Page>
  );
}

/** 对比度审计：9 种主题组合总览 + 当前组合逐组明细。数据来自 lib/audit.ts。 */
function ContrastPage() {
  const { accent, resolved, sidebar, glass } = useTheme();
  const cases = useMemo(() => auditAll(), []);
  const rows = useMemo(() => auditTheme({ accent, resolved, sidebar, glass }), [accent, resolved, sidebar, glass]);
  const failed = rows.filter((r) => r.kind === "contrast" && !r.pass).length;
  const weak = rows.filter((r) => r.kind === "distance" && !r.pass).length;

  return (
    <Page fill={false}>
      <PageHeader
        eyebrow="Design System"
        title="对比度"
        description="文字 ≥ 4.5:1、图标 ≥ 3:1（WCAG AA）。改 antd-theme.ts 后在 demo 目录运行 npm run check:contrast。"
      />

      <Panel title="全部组合">
        <Table
          size="small"
          pagination={false}
          rowKey={(c) => `${c.accent}-${c.resolved}-${c.sidebar}-${c.glass}`}
          dataSource={cases}
          columns={[
            { title: "主题", render: (_, c) => THEMES[c.accent].label },
            { title: "明暗", render: (_, c) => (c.resolved === "light" ? "浅色" : "深色") },
            { title: "侧栏", render: (_, c) => (c.sidebar === "light" ? "浅色" : "主题色") },
            { title: "毛玻璃", render: (_, c) => (c.glass ? "开" : "关") },
            { title: "组数", render: (_, c) => c.rows.length },
            {
              title: "最低对比度",
              render: (_, c) =>
                Math.min(...c.rows.filter((r) => r.kind === "contrast").map((r) => r.ratio)).toFixed(2),
            },
            {
              title: "结果",
              render: (_, c) => {
                const bad = c.rows.filter((r) => r.kind === "contrast" && !r.pass).length;
                const low = c.rows.filter((r) => r.kind === "distance" && !r.pass).length;
                return (
                  <Space size={4}>
                    {bad ? (
                      <Tag icon={<CloseCircleOutlined />} color="error">
                        {bad} 组未达标
                      </Tag>
                    ) : (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        对比度达标
                      </Tag>
                    )}
                    {low > 0 && (
                      <Tag icon={<ExclamationCircleOutlined />} color="warning">
                        区分度 {low} 项
                      </Tag>
                    )}
                  </Space>
                );
              },
            },
          ]}
        />
      </Panel>

      <Panel
        title="当前组合明细"
        extra={
          <Space size={4}>
            {failed ? (
              <Tag icon={<CloseCircleOutlined />} color="error">
                {failed} 组未达标
              </Tag>
            ) : (
              <Tag icon={<CheckCircleOutlined />} color="success">
                对比度达标
              </Tag>
            )}
            {weak > 0 && (
              <Tag icon={<ExclamationCircleOutlined />} color="warning">
                区分度 {weak} 项
              </Tag>
            )}
          </Space>
        }
      >
        <Table<AuditRow>
          size="small"
          pagination={false}
          rowKey={(r) => `${r.group}-${r.label}`}
          dataSource={rows}
          columns={[
            { title: "分组", dataIndex: "group", width: 80 },
            { title: "组合", dataIndex: "label" },
            {
              title: "样张",
              width: 120,
              // 审计页要原样展示任意 token 颜色，只有这里用内联色值
              render: (_, r) => (
                <span className="inline-block rounded px-2 py-0.5" style={{ background: r.bg, color: r.fg }}>
                  示例 Aa
                </span>
              ),
            },
            { title: "前景", dataIndex: "fg", render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
            { title: "背景", dataIndex: "bg", render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
            {
              title: "对比度 / ΔE",
              width: 120,
              align: "right",
              render: (_, r) => (
                <Typography.Text
                  type={r.pass ? undefined : r.kind === "distance" ? "warning" : "danger"}
                  strong={!r.pass}
                >
                  {r.kind === "distance" ? "ΔE " : ""}
                  {r.ratio.toFixed(r.kind === "distance" ? 1 : 2)} / {r.min}
                </Typography.Text>
              ),
            },
          ]}
        />
      </Panel>
    </Page>
  );
}
