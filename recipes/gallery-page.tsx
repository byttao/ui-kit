/**
 * 页面配方 · 图库页（拷到 src/pages/ 后把 "../index" 改成 "../ui-kit"）
 *
 * 何时用：按「每张图」浏览已产出的结果，选中看详情、双击看大图、对单张做后续操作（继续修改、打开文件夹、删除）。
 * 骨架：Page > Workspace（左：筛选 + ImageGrid；右：详情卡片 fill 内部滚动，asideFooter 主按钮「继续修改 · 这张」）+ 底部日志。
 * 数据层：items（由任务列表派生，见 recipes/mock.ts 的 tasksToGallery）+ 回调。选中项受控时，外部改 selectedKey
 *        就能「定位到这张」（ImageGrid 自动滚到可见）。
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CopyOutlined, DeleteOutlined, EyeOutlined, FolderOpenOutlined, OrderedListOutlined, PictureOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Descriptions, Segmented, Typography } from "antd";
import {
  EmptyState,
  ImageBadge,
  ImageGrid,
  ListWell,
  LogActions,
  LogViewer,
  Page,
  Panel,
  Thumb,
  Workspace,
  fileName,
  useLogger,
} from "../index";

export interface GalleryItem {
  /** 唯一键（同一文件出现多次时要区分） */
  key: string;
  /** 本地路径 */
  path: string;
  /** 角标文字，如「#12」「#12-3」 */
  label: string;
  /** 详情里的正文（提示词、文件说明） */
  title: string;
  /** 筛选分组（模型、来源…） */
  group: string;
  createdAt: number;
  /** 详情里的键值对 */
  details: { label: string; value: ReactNode }[];
  /** 来源任务，用于「定位到任务」「继续修改」 */
  taskId?: string;
}

export interface GalleryPageProps {
  items: GalleryItem[];
  /** 受控选中（外部定位用）；不传则组件自己管 */
  selectedKey?: string | null;
  onSelectedKeyChange?: (key: string | null) => void;
  onEdit?: (item: GalleryItem) => void;
  onReveal?: (item: GalleryItem) => Promise<void>;
  onRemove?: (item: GalleryItem) => Promise<void>;
  /** 「定位到任务」 */
  onLocateTask?: (item: GalleryItem) => void;
}

export function GalleryPage({
  items,
  selectedKey: selectedProp,
  onSelectedKeyChange,
  onEdit,
  onReveal,
  onRemove,
  onLocateTask,
}: GalleryPageProps) {
  const { message, modal } = AntApp.useApp();
  const { logs, log, clear } = useLogger();
  const [filter, setFilter] = useState("all");
  const [innerSelected, setInnerSelected] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // 长条图、比例差异大的一组图用「完整」，否则看不出形状
  const [fit, setFit] = useState<"cover" | "contain">("cover");
  const selectedKey = selectedProp !== undefined ? selectedProp : innerSelected;
  const select = (key: string | null) => {
    if (selectedProp === undefined) setInnerSelected(key);
    onSelectedKeyChange?.(key);
  };

  const groups = useMemo(() => [...new Set(items.map((i) => i.group))], [items]);
  const shown = useMemo(() => items.filter((i) => filter === "all" || i.group === filter), [items, filter]);
  const selected = shown.find((i) => i.key === selectedKey) ?? null;

  // 外部定位到被筛掉的图：切回「全部」
  useEffect(() => {
    if (selectedKey && !shown.some((i) => i.key === selectedKey) && items.some((i) => i.key === selectedKey)) setFilter("all");
  }, [selectedKey, shown, items]);

  const copy = async (item: GalleryItem) => {
    try {
      await navigator.clipboard.writeText(item.title);
      message.success("已复制");
      log(`已复制 ${item.label} 的提示词`, "success");
    } catch (err) {
      message.error(`复制失败：${String(err)}`);
    }
  };
  const reveal = async (item: GalleryItem) => {
    try {
      await onReveal?.(item);
      log(`已在文件管理器中显示 ${fileName(item.path)}`);
    } catch (err) {
      message.error(String(err));
      log(`打开文件夹失败：${String(err)}`, "error");
    }
  };
  const remove = (item: GalleryItem) =>
    modal.confirm({
      title: `从图库删除 ${item.label}？`,
      content: "只删除记录，图片文件仍保留在输出目录。",
      okText: "删除",
      okButtonProps: { danger: true },
      onOk: async () => {
        await onRemove?.(item);
        log(`已删除 ${item.label}`, "warning");
        select(null);
      },
    });

  return (
    <Page>
      <Workspace
        aside={
          <Panel fill title="图片信息" className="min-h-0 flex-1">
            {selected ? (
              <div className="-mr-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-2">
                <Thumb path={selected.path} size="fill" ratio={4 / 3} fit="contain" preview={false} alt={selected.title} />
                <Typography.Paragraph ellipsis={{ rows: 4, expandable: "collapsible" }} className="m-0">
                  {selected.title}
                </Typography.Paragraph>
                <Descriptions
                  size="small"
                  column={1}
                  items={[
                    { key: "label", label: "编号", children: selected.label },
                    ...selected.details.map((d) => ({ key: d.label, label: d.label, children: d.value })),
                    {
                      key: "file",
                      label: "文件",
                      children: (
                        <Typography.Text ellipsis={{ tooltip: selected.path }} className="max-w-[180px]">
                          {fileName(selected.path)}
                        </Typography.Text>
                      ),
                    },
                  ]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button icon={<EyeOutlined />} onClick={() => setPreviewIndex(shown.indexOf(selected))}>
                    大图预览
                  </Button>
                  <Button icon={<CopyOutlined />} onClick={() => copy(selected)}>
                    复制提示词
                  </Button>
                  {onReveal && (
                    <Button icon={<FolderOpenOutlined />} onClick={() => reveal(selected)}>
                      打开文件夹
                    </Button>
                  )}
                  {onLocateTask && selected.taskId && (
                    <Button icon={<OrderedListOutlined />} onClick={() => onLocateTask(selected)}>
                      定位到任务
                    </Button>
                  )}
                  {onRemove && (
                    <Button danger icon={<DeleteOutlined />} onClick={() => remove(selected)}>
                      删除记录…
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState size="small" icon={<PictureOutlined />} title="选择一张图片查看详情" />
            )}
          </Panel>
        }
        asideFooter={
          // 非批处理页的主按钮：动词 + 对象
          <Button type="primary" block disabled={!selected || !onEdit} onClick={() => selected && onEdit?.(selected)}>
            继续修改 · 这张
          </Button>
        }
      >
        <Panel
          fill
          className="flex-1"
          title={`图库 · ${shown.length} 张`}
          extra={
            <span className="flex items-center gap-2">
            <Segmented
              size="small"
              value={fit}
              onChange={(v) => setFit(v as "cover" | "contain")}
              options={[
                { value: "cover", label: "裁切" },
                { value: "contain", label: "完整" },
              ]}
            />
            <Segmented
              size="small"
              value={filter}
              onChange={(v) => setFilter(String(v))}
              options={[{ value: "all", label: "全部" }, ...groups.map((g) => ({ value: g, label: g }))]}
            />
            </span>
          }
        >
          <ListWell className="p-3">
            {shown.length === 0 ? (
              <EmptyState
                icon={<PictureOutlined />}
                title={filter === "all" ? "还没有图片" : "这个分组还没有图片"}
                description="任务完成后，每张图都会出现在这里"
              />
            ) : (
              <ImageGrid
                items={shown.map((i) => ({ key: i.key, path: i.path, alt: i.title, badge: <ImageBadge>{i.label}</ImageBadge> }))}
                badgePlacement="top-left"
                fit={fit}
                selectedKey={selected?.key ?? null}
                onSelect={select}
                previewIndex={previewIndex}
                onPreviewIndexChange={setPreviewIndex}
              />
            )}
          </ListWell>
        </Panel>
      </Workspace>

      <Panel
        fill
        title="图库日志"
        size="small"
        className="h-[170px] shrink-0"
        extra={<LogActions logs={logs} onClear={clear} />}
      >
        <LogViewer logs={logs} emptyText="复制、打开文件夹、删除等操作记录会显示在这里" />
      </Panel>
    </Page>
  );
}
