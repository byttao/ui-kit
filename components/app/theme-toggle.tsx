import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

/**
 * 侧栏底部的明暗切换按钮。
 * 图标表示“点击后会切到的模式”，Tooltip 与 aria-label 写清楚动作。
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const label = resolved === "light" ? "切换到深色模式" : "切换到浅色模式";

  return (
    <Tooltip title={label}>
      <Button
        type="text"
        size="small"
        aria-label={label}
        icon={resolved === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggle}
        // antd 文字按钮的悬停底是半透明黑，压在深色侧栏上看不见，换成侧栏自己的悬停色
        className={cn("text-sidebar-icon hover:bg-sidebar-hover hover:text-sidebar-active-text", className)}
      />
    </Tooltip>
  );
}
