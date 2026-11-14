/**
 * 页面配方 · 设置页（拷到 src/pages/ 后把 "../index" 改成 "../ui-kit"，再按业务增删分区与字段）
 *
 * 何时用：应用级配置（接口 / 账号、网络、输出、默认参数、外观）。
 * 骨架：Page > Workspace（左：Panel fill + SettingsScroll > Form > SettingsSection；右：「关于」卡片，
 *       asideFooter「放弃修改」+ 主按钮「保存设置」）+ 底部日志。排版规范见 design.md「设置页」。
 * 状态：表单改的是草稿，点「保存设置」才写入；外观（明暗、主题）即时生效、不进草稿。
 * 数据层：load / save / test（invoke 读写 settings.json）。demo 用内存实现。
 */
import { useEffect, useMemo, useState } from "react";
import { ApiOutlined, KeyOutlined, RollbackOutlined } from "@ant-design/icons";
import { App as AntApp, Button, Checkbox, Descriptions, Form, Input, InputNumber, Radio, Segmented, Space, Typography } from "antd";
import {
  EmptyState,
  LogActions,
  LogViewer,
  Page,
  Panel,
  SettingsScroll,
  SettingsSection,
  ThemePicker,
  Workspace,
  useLogger,
  useTheme,
  type ThemeMode,
} from "../index";

export interface AppSettings {
  apiKey: string;
  node: "cn" | "global";
  proxy: "none" | "system" | "custom";
  proxyUrl: string;
  concurrency: number;
  outputDir: string;
  openWhenDone: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  node: "cn",
  proxy: "none",
  proxyUrl: "",
  concurrency: 2,
  outputDir: "",
  openWhenDone: true,
};

export interface SettingsApi {
  load: () => Promise<AppSettings>;
  save: (settings: AppSettings) => Promise<AppSettings>;
  /** 测试连接，返回给人看的结果文字；失败时 throw */
  test?: (settings: AppSettings) => Promise<string>;
  /** 选目录（dialog open({ directory: true })），取消返回 null */
  pickDir?: () => Promise<string | null>;
  /** 「关于」卡片的信息 */
  about?: { version: string; dataDir: string };
}

export function SettingsPage({ api }: { api: SettingsApi }) {
  const { message } = AntApp.useApp();
  const { logs, log, clear } = useLogger();
  const { accent, setAccent, mode, setMode } = useTheme();
  const [saved, setSaved] = useState<AppSettings | null>(null);
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api
      .load()
      .then((s) => {
        setSaved(s);
        setDraft(s);
      })
      .catch((err) => {
        log(`读取设置失败：${String(err)}`, "error");
        setSaved(DEFAULT_SETTINGS);
        setDraft(DEFAULT_SETTINGS);
      });
  }, [api, log]);

  const dirty = useMemo(() => !!saved && !!draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft]);
  if (!saved || !draft) return <Page />;

  const patch = (p: Partial<AppSettings>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const save = async () => {
    setSaving(true);
    try {
      const next = await api.save(draft);
      setSaved(next);
      setDraft(next);
      log("设置已保存。", "success");
      message.success("设置已保存");
    } catch (err) {
      log(`保存失败：${String(err)}`, "error");
      message.error(String(err));
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    if (!api.test) return;
    setTesting(true);
    log("正在测试连接…", "processing");
    try {
      const text = await api.test(draft);
      log(text, "success");
      message.success(text);
    } catch (err) {
      log(`测试失败：${String(err)}`, "error");
      message.error(String(err));
    } finally {
      setTesting(false);
    }
  };

  const proxyUrlInvalid = draft.proxy === "custom" && !!draft.proxyUrl && !/^(https?|socks5h?):\/\//.test(draft.proxyUrl);

  return (
    <Page>
      <Workspace
        aside={
          <Panel title="关于">
            <Descriptions
              size="small"
              column={1}
              items={[
                { key: "v", label: "版本", children: api.about?.version ?? "—" },
                {
                  key: "d",
                  label: "数据目录",
                  children: (
                    <Typography.Text
                      copyable={api.about ? { text: api.about.dataDir } : false}
                      ellipsis={{ tooltip: api.about?.dataDir }}
                      className="max-w-[170px]"
                    >
                      {api.about?.dataDir ?? "—"}
                    </Typography.Text>
                  ),
                },
              ]}
            />
          </Panel>
        }
        asideFooter={
          <>
            {dirty && (
              <Button type="link" size="small" icon={<RollbackOutlined />} onClick={() => setDraft(saved)}>
                放弃修改
              </Button>
            )}
            <Button type="primary" block loading={saving} disabled={!dirty || proxyUrlInvalid} onClick={save}>
              保存设置
            </Button>
          </>
        }
      >
        <Panel
          fill
          className="flex-1"
          title="设置"
          extra={<span className="text-sm text-text-tertiary">外观即时生效，其余点右下角「保存设置」</span>}
        >
          <SettingsScroll>
            <Form layout="vertical" component="div" className="contents">
              {!saved.apiKey && (
                <EmptyState size="small" icon={<KeyOutlined />} title="还没有填写 API Key" description="填好并保存后就可以开始使用" />
              )}
              <SettingsSection title="接口" description="「测试连接」不会扣费">
                <Form.Item label="API Key">
                  <Space.Compact block>
                    <Input.Password value={draft.apiKey} onChange={(e) => patch({ apiKey: e.target.value })} placeholder="sk-…" autoComplete="off" />
                    {api.test && (
                      <Button icon={<ApiOutlined />} loading={testing} disabled={!draft.apiKey.trim()} onClick={test}>
                        测试连接
                      </Button>
                    )}
                  </Space.Compact>
                </Form.Item>
                <Form.Item label="节点">
                  <Radio.Group
                    orientation="vertical"
                    value={draft.node}
                    onChange={(e) => patch({ node: e.target.value })}
                    options={[
                      { value: "cn", label: "国内节点" },
                      { value: "global", label: "全球节点" },
                    ]}
                  />
                </Form.Item>
              </SettingsSection>

              <SettingsSection title="网络代理">
                <Form.Item label="代理">
                  <Segmented
                    value={draft.proxy}
                    onChange={(v) => patch({ proxy: v as AppSettings["proxy"] })}
                    options={[
                      { value: "none", label: "不使用" },
                      { value: "system", label: "跟随系统" },
                      { value: "custom", label: "自定义" },
                    ]}
                  />
                </Form.Item>
                {draft.proxy === "custom" && (
                  <Form.Item
                    label="代理地址"
                    validateStatus={proxyUrlInvalid ? "error" : undefined}
                    help={proxyUrlInvalid ? "以 http://、https:// 或 socks5:// 开头" : undefined}
                  >
                    <Input value={draft.proxyUrl} onChange={(e) => patch({ proxyUrl: e.target.value })} placeholder="http://127.0.0.1:7890" />
                  </Form.Item>
                )}
              </SettingsSection>

              <SettingsSection
                title="输出"
                extra={
                  <Button type="link" size="small" disabled={!draft.outputDir} onClick={() => patch({ outputDir: "" })}>
                    恢复默认
                  </Button>
                }
              >
                <Form.Item label="输出目录" extra={draft.outputDir ? undefined : "默认：图片 / 应用名"}>
                  <Space.Compact block>
                    <Input value={draft.outputDir} readOnly placeholder="默认目录" />
                    <Button
                      disabled={!api.pickDir}
                      onClick={async () => {
                        const dir = await api.pickDir?.();
                        if (dir) patch({ outputDir: dir });
                      }}
                    >
                      选择…
                    </Button>
                  </Space.Compact>
                </Form.Item>
                <div className="grid grid-cols-2 gap-3">
                  <Form.Item label="同时进行" extra="超出的任务排队等待，1–5">
                    <InputNumber min={1} max={5} precision={0} value={draft.concurrency} onChange={(v) => patch({ concurrency: v ?? 2 })} suffix="个" />
                  </Form.Item>
                  <Form.Item label="完成后">
                    <Checkbox checked={draft.openWhenDone} onChange={(e) => patch({ openWhenDone: e.target.checked })}>
                      打开输出目录
                    </Checkbox>
                  </Form.Item>
                </div>
              </SettingsSection>

              <SettingsSection title="外观" description="即时生效，不需要保存">
                <Form.Item label="明暗">
                  <Segmented<ThemeMode>
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: "light", label: "浅色" },
                      { value: "dark", label: "深色" },
                      { value: "system", label: "跟随系统" },
                    ]}
                  />
                </Form.Item>
                <Form.Item label="主题">
                  <ThemePicker value={accent} onChange={setAccent} />
                </Form.Item>
              </SettingsSection>
            </Form>
          </SettingsScroll>
        </Panel>
      </Workspace>

      <Panel
        fill
        title="设置日志"
        size="small"
        className="h-[170px] shrink-0"
        extra={<LogActions logs={logs} onClear={clear} />}
      >
        <LogViewer logs={logs} emptyText="测试连接、保存设置的结果会显示在这里" />
      </Panel>
    </Page>
  );
}
