// 「组件一览」里的 1.3.0 / 1.4.0 新组件示例。页面模板见 ui-kit/recipes/。
import { useState } from "react";
import { BranchesOutlined, BugOutlined, EyeOutlined, KeyOutlined, MoreOutlined, PictureOutlined, RedoOutlined } from "@ant-design/icons";
import { Button, Form, Progress, Segmented, Space, Tag, Typography } from "antd";
import {
  AdvancedSection,
  EmptyState,
  LogActions,
  LogViewer,
  ScrollArea,
  ErrorBoundary,
  FieldHint,
  ImageBadge,
  ImageGrid,
  LinkTag,
  ListRow,
  ListWell,
  NavBadge,
  Panel,
  RatioPreview,
  RatioSelect,
  StatusTag,
  Thumb,
  ThumbStrip,
  useRowFlash,
} from "@kit";
import { SAMPLE_IMAGES } from "@kit/recipes/mock";

const RATIOS = [
  { value: "auto" },
  { value: "1:1", size: "1024 × 1024" },
  { value: "3:4", size: "896 × 1200" },
  { value: "16:9", size: "1365 × 768" },
];

const LONG_LOGS = [
  { id: "l1", time: "09:07:53", level: "info" as const, message: "已加入队列 #12：「清晨的湖面，薄雾，远处的山，胶片质感，远景，低饱和，柔和光线，35mm」，比例 16:9，4 合 1，背景自动，输出 PNG" },
  { id: "l2", time: "09:08:10", level: "success" as const, message: "已下载 #12：/Users/demo/Pictures/输出/2026-11-14/湖面-薄雾-远山-胶片质感-16x9-4合1-0001.png（拆成 4 张）" },
  { id: "l3", time: "09:08:12", level: "error" as const, message: "#13 失败：接口返回 429 Too Many Requests，请求过于频繁，已按设置排队等待 30 秒后自动重试第 2 次" },
];

/** 渲染时抛错，演示 ErrorBoundary */
function Boom(): never {
  throw new Error("演示：组件渲染时抛出的错误");
}

export function NewComponents() {
  const [selected, setSelected] = useState<string | null>(SAMPLE_IMAGES[0]);
  const [ratio, setRatio] = useState("16:9");
  const [crash, setCrash] = useState(false);
  const { flashKey, flash } = useRowFlash();
  const [fit, setFit] = useState<"cover" | "contain">("contain");
  const [format, setFormat] = useState("png");
  const gallery = [...SAMPLE_IMAGES, "/samples/strip.svg"].map((path, i) => ({
    key: path,
    path,
    alt: `样图 ${i + 1}`,
    badge: <ImageBadge>#{i + 1}</ImageBadge>,
  }));

  return (
    <>
      <Panel title="列表行 ListRow · useRowFlash · LinkTag" extra={<Typography.Text type="secondary">FileRow 仍可用：纯文件名长列表</Typography.Text>}>
        <ListWell className="flex-none">
          <ul className="m-0 list-none p-0">
            <ListRow
              index={1}
              highlight={flashKey === "r1"}
              leading={<Thumb path={SAMPLE_IMAGES[0]} size="md" />}
              title="清晨的湖面，薄雾，远处的山"
              meta={
                <>
                  <StatusTag status="success" />
                  <Tag variant="filled">GPT</Tag>
                  <span>1024 × 1024 · 09:12</span>
                </>
              }
              trailing={<Button type="text" size="small" icon={<EyeOutlined />} aria-label="预览" />}
            />
            <ListRow
              index={2}
              selected
              leading={<Thumb size="md" loading />}
              title="雪山与星空（选中）"
              meta={
                <>
                  <StatusTag status="processing">生成中 40%</StatusTag>
                  {/* 可点击标签：跳到 #1 并闪一下 */}
                  <LinkTag icon={<BranchesOutlined />} onClick={() => flash("r1")}>
                    改自 #1
                  </LinkTag>
                  <LinkTag icon={<BranchesOutlined />} disabled>
                    改自已删除的任务
                  </LinkTag>
                </>
              }
              extra={<Progress percent={40} size="small" showInfo={false} status="active" className="m-0 max-w-[320px]" />}
            />
            <ListRow
              index={3}
              status="error"
              leading={<Thumb size="md" />}
              title={<Typography.Text strong>森林小木屋（失败行：antd 文字、中性 Tag 继承红字）</Typography.Text>}
              meta={
                <>
                  <StatusTag status="error" />
                  <Tag variant="filled">Nano</Tag>
                  <Typography.Text type="secondary">3:4 · 10:05</Typography.Text>
                </>
              }
              extra={<span className="text-sm">接口返回 429：请求过于频繁。</span>}
              trailing={<Button type="text" size="small" icon={<RedoOutlined />} aria-label="重试" />}
            />
            <ListRow
              index={4}
              highlight
              align="center"
              title="定位高亮（highlight 常驻）"
              meta={<StatusTag status="queued" />}
              trailing={<Button type="text" size="small" icon={<MoreOutlined />} aria-label="更多" />}
            />
          </ul>
        </ListWell>
      </Panel>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="缩略图 Thumb / ThumbStrip">
          <div className="flex flex-wrap items-end gap-3">
            <Thumb path={SAMPLE_IMAGES[1]} size="xs" />
            <Thumb path={SAMPLE_IMAGES[1]} size="sm" />
            <Thumb path={SAMPLE_IMAGES[1]} size="md" />
            <Thumb path={SAMPLE_IMAGES[1]} size="lg" />
            <Thumb size="md" loading />
            <Thumb path="/samples/不存在.png" size="md" />
          </div>
          <Typography.Text type="secondary">缩略图条 + 常显编号（caption）：</Typography.Text>
          <ThumbStrip items={SAMPLE_IMAGES.slice(0, 4).map((path, i) => ({ path, caption: `#12-${i + 1}` }))} />
          <Typography.Text type="secondary">参考图墙（4 列 + 移除角标 + 左上角标）：</Typography.Text>
          <ThumbStrip
            items={SAMPLE_IMAGES.slice(0, 5).map((path, i) => ({ path, badge: <ImageBadge>{i + 1}</ImageBadge> }))}
            columns={4}
            onRemove={() => {}}
            showName
          />
        </Panel>

        <Panel
          title="图片网格 ImageGrid"
          extra={
            <Segmented
              size="small"
              value={fit}
              onChange={(v) => setFit(v as "cover" | "contain")}
              options={[
                { value: "cover", label: "裁切 cover" },
                { value: "contain", label: "完整 contain" },
              ]}
            />
          }
        >
          <Space size="small" wrap>
            {[0, 5].map((i) => (
              <Button key={i} size="small" onClick={() => setSelected(SAMPLE_IMAGES[i])}>
                定位到 #{i + 1}
              </Button>
            ))}
          </Space>
          <ListWell className="h-[260px] flex-none p-3">
            <ImageGrid items={gallery} selectedKey={selected} onSelect={setSelected} minTileWidth={110} badgePlacement="top-left" fit={fit} />
          </ListWell>
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel title="比例 RatioSelect / RatioPreview">
          <RatioSelect value={ratio} onChange={setRatio} options={RATIOS} />
          <div className="grid grid-cols-2 gap-3">
            <RatioPreview ratio={ratio} caption={`单张 · ${ratio === "auto" ? "自动" : ratio}`} />
            <RatioPreview ratio="16:9" cols={2} rows={2} caption="整张 16:9 · 2 × 2 等分，每张 16:9" />
          </div>
          <RatioPreview ratio="16:9" cols={2} rows={2} cellRatio="1:1" height={80} caption="合成后每格居中裁成 1:1（cellRatio）" />
        </Panel>

        <Panel title="状态 / 提示 / 徽标 / 错误边界">
          <Space wrap size="small">
            <StatusTag status="queued" />
            <StatusTag status="processing" />
            <StatusTag status="success" />
            <StatusTag status="error" />
            <StatusTag status="warning" />
            <StatusTag status="cancelled" />
          </Space>
          <FieldHint>合图使用更高一档分辨率，单价可能更高</FieldHint>
          <FieldHint type="warning">比例为「自动」时不能多合一</FieldHint>
          <span className="flex w-fit items-center gap-2 rounded-lg bg-sidebar px-3 py-2 text-sidebar-text">
            出图 <NavBadge count={3} /> 图库 <NavBadge count={18} tone="muted" /> 溢出 <NavBadge count={120} />
          </span>
          <div className="rounded border">
            <ErrorBoundary size="page" key={String(crash)}>
              {crash ? (
                <Boom />
              ) : (
                <div className="flex items-center justify-between gap-3 p-3">
                  <Typography.Text type="secondary">ErrorBoundary：包住的内容渲染出错时显示兜底界面</Typography.Text>
                  <Button size="small" icon={<BugOutlined />} onClick={() => setCrash(true)}>
                    制造一个错误
                  </Button>
                </div>
              )}
            </ErrorBoundary>
          </div>
          {crash && (
            <Button size="small" type="link" className="self-start" onClick={() => setCrash(false)}>
              恢复演示
            </Button>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel
          fill
          title="日志 · LogActions 放标题栏（推荐）"
          className="h-[170px]"
          extra={<LogActions logs={LONG_LOGS} onClear={() => {}} />}
        >
          <LogViewer logs={LONG_LOGS} />
        </Panel>
        <Panel fill title="日志 · onClear 侧边工具条（不遮挡长行）" className="h-[170px]">
          <LogViewer logs={LONG_LOGS} onClear={() => {}} />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Panel fill title="ScrollArea · 下面还有" className="h-[220px]">
          <ScrollArea>
            {Array.from({ length: 14 }, (_, i) => (
              <p key={i} className="m-0 py-1">
                第 {i + 1} 行参数
              </p>
            ))}
          </ScrollArea>
        </Panel>
        <Panel title="AdvancedSection · 高级折叠">
          <Form layout="vertical" component="div" className="flex flex-col gap-3 [&_.ant-form-item]:mb-0">
            <Form.Item label="常用参数（对齐参照）">
              <Segmented block options={["1 张", "2 合 1", "4 合 1"]} />
            </Form.Item>
            <AdvancedSection
              changedCount={format !== "png" ? 1 : 0}
              extra={
                <Button type="link" size="small" disabled={format === "png"} onClick={() => setFormat("png")}>
                  恢复默认
                </Button>
              }
            >
              <Form.Item label="输出格式">
                <Segmented block value={format} onChange={(v) => setFormat(String(v))} options={["png", "jpeg", "webp"]} />
              </Form.Item>
            </AdvancedSection>
          </Form>
        </Panel>
      </div>

      <Panel title="空状态 EmptyState">
        <div className="grid grid-cols-2 gap-5">
          <ListWell className="flex-none">
            <EmptyState
              icon={<KeyOutlined />}
              title="还没有填写 API Key"
              description="填好后就可以开始出图；Key 只保存在本机"
              action={<Button>去设置</Button>}
            />
          </ListWell>
          <ListWell className="flex-none">
            <EmptyState size="small" icon={<PictureOutlined />} title="还没有图片" description="出图完成后会出现在这里" />
          </ListWell>
        </div>
      </Panel>
    </>
  );
}
