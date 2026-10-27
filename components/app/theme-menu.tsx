import { BgColorsOutlined } from "@ant-design/icons";
import { Button, Dropdown, Tooltip, type MenuProps } from "antd";
import { THEMES, type Accent } from "../../antd-theme";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

/**
 * 侧栏底部的主题切换：点开是主题列表（配色色块 + 名称），选中项打勾高亮。
 * 选择由 ThemeProvider 记住，下次打开沿用。完整的主题卡片（含区分度提示）用 ThemePicker。
 */
export function ThemeMenu({ className }: { className?: string }) {
  const { accent, setAccent } = useTheme();

  const items: MenuProps["items"] = (Object.keys(THEMES) as Accent[]).map((key) => ({
    key,
    label: (
      <span className="flex items-center gap-2">
        <span className="flex gap-0.5" aria-hidden>
          {THEMES[key].swatches.map((color) => (
            // 色块要原样显示配色，只有这里用内联色值
            <span key={color} className="size-3 rounded-full border" style={{ background: color }} />
          ))}
        </span>
        <span>{THEMES[key].label}</span>
      </span>
    ),
  }));

  return (
    <Dropdown
      trigger={["click"]}
      placement="topLeft"
      menu={{
        items,
        selectable: true,
        selectedKeys: [accent],
        onClick: ({ key }) => setAccent(key as Accent),
      }}
    >
      <Tooltip title="切换主题">
        <Button
          type="text"
          size="small"
          aria-label="切换主题"
          icon={<BgColorsOutlined />}
          // 与 ThemeToggle 一致：用侧栏自己的悬停色，深色侧栏上也看得见
          className={cn("text-sidebar-icon hover:bg-sidebar-hover hover:text-sidebar-active-text", className)}
        />
      </Tooltip>
    </Dropdown>
  );
}
