import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Tag, Tooltip } from "antd";
import { DISTANCE_MIN, THEMES, themeDistances, type Accent, type ThemeDef } from "../../antd-theme";
import { cn } from "../../lib/cn";

const FN_LABEL = { Error: "危险", Warning: "警告", Success: "成功" } as const;

/** 与功能色区分度不足的项，用于卡片上的提示。 */
function weakDistances(accent: Accent) {
  return Object.entries(themeDistances(accent))
    .filter(([, value]) => value < DISTANCE_MIN)
    .map(([key, value]) => `与「${FN_LABEL[key as keyof typeof FN_LABEL]}」ΔE ${value.toFixed(1)}`);
}

interface ThemePickerProps {
  value: Accent;
  onChange: (accent: Accent) => void;
  className?: string;
}

/**
 * 主题选择：每个主题一张卡片，显示配色色块、来源和区分度提示。
 * 用 radiogroup 语义，方向键之外的键盘操作交给浏览器的按钮行为（Tab + 空格 / 回车）。
 */
export function ThemePicker({ value, onChange, className }: ThemePickerProps) {
  return (
    <div role="radiogroup" aria-label="主题" className={cn("grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2", className)}>
      {(Object.keys(THEMES) as Accent[]).map((key) => {
        const theme: ThemeDef = THEMES[key];
        const weak = weakDistances(key);
        const selected = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(key)}
            className={cn(
              "flex flex-col gap-2 rounded-lg border bg-container p-3 text-left transition-colors duration-fast",
              selected ? "border-primary bg-primary-bg" : "border-border hover:border-primary-border-hover"
            )}
          >
            <span className="flex gap-1" aria-hidden>
              {theme.swatches.map((color) => (
                // 色块要原样显示配色，只有这里用内联色值
                <span key={color} className="size-5 rounded-sm border" style={{ background: color }} />
              ))}
            </span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("whitespace-nowrap font-strong", selected ? "text-primary-text" : "text-text")}>
                {theme.label}
              </span>
              <Tag className="m-0" variant="filled">
                {theme.source === "antd" ? "antd 色板" : "自定义"}
              </Tag>
              {weak.length > 0 && (
                <Tooltip title={`${weak.join("，")}。${theme.note}`}>
                  <Tag className="m-0" color="warning" variant="filled" icon={<ExclamationCircleOutlined />}>
                    区分度
                  </Tag>
                </Tooltip>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
