/**
 * ui-kit · Tailwind v3 preset
 *
 * tailwind.config.cjs:
 *   module.exports = {
 *     presets: [require("./src/ui-kit/tailwind.preset.cjs")],
 *     content: ["./index.html", "./src/**\/*.{ts,tsx}"],
 *   };
 *
 * 所有值都指向 ThemeProvider 写在 :root 上的 antd token 变量（--ant-*）与扩展色（--kit-*），
 * 类名 = antd token 去掉 color / colorBg 前缀：
 *   colorPrimaryBg → bg-primary-bg      colorTextSecondary → text-text-secondary
 *   colorBgContainer → bg-container     colorBorderSecondary → border-border-secondary
 * 变量是完整颜色，不支持 bg-primary/10 这类透明度写法；要浅色用 antd 推导好的档位。
 * Tailwind 只负责布局（flex / grid / 间距 / 尺寸）和少量自写元素的颜色，控件一律用 antd。
 */

/** @param {string} name */
const v = (name) => `var(--ant-${name})`;
/** @param {string} name */
const kit = (name) => `var(--kit-${name})`;

/** antd 的一组语义色：DEFAULT / hover / active / bg / bg-hover / border / border-hover / text */
const family = (name) => ({
  DEFAULT: v(`color-${name}`),
  hover: v(`color-${name}-hover`),
  active: v(`color-${name}-active`),
  bg: v(`color-${name}-bg`),
  "bg-hover": v(`color-${name}-bg-hover`),
  border: v(`color-${name}-border`),
  "border-hover": v(`color-${name}-border-hover`),
  text: v(`color-${name}-text`),
  "text-hover": v(`color-${name}-text-hover`),
});

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: family("primary"),
        success: family("success"),
        warning: family("warning"),
        error: family("error"),
        info: family("info"),
        link: { DEFAULT: v("color-link"), hover: v("color-link-hover"), active: v("color-link-active") },

        text: {
          DEFAULT: v("color-text"),
          secondary: v("color-text-secondary"),
          tertiary: v("color-text-tertiary"),
          quaternary: v("color-text-quaternary"),
          disabled: v("color-text-disabled"),
          "light-solid": v("color-text-light-solid"),
        },

        /* 三层表面 */
        layout: v("color-bg-layout"),
        container: v("color-bg-container"),
        elevated: v("color-bg-elevated"),
        spotlight: v("color-bg-spotlight"),
        mask: v("color-bg-mask"),

        fill: {
          DEFAULT: v("color-fill"),
          secondary: v("color-fill-secondary"),
          tertiary: v("color-fill-tertiary"),
          quaternary: v("color-fill-quaternary"),
          alter: v("color-fill-alter"),
        },
        border: { DEFAULT: v("color-border"), secondary: v("color-border-secondary") },
        split: v("color-split"),
        "item-active": v("control-item-bg-active"),
        "item-hover": v("control-item-bg-hover"),

        /* ui-kit 扩展色 */
        sidebar: {
          DEFAULT: kit("sidebar-bg"),
          text: kit("sidebar-text"),
          muted: kit("sidebar-muted"),
          hover: kit("sidebar-hover-bg"),
          active: kit("sidebar-active-bg"),
          "active-text": kit("sidebar-active-text"),
          icon: kit("sidebar-icon"),
          border: kit("sidebar-border"),
        },
        log: {
          info: kit("log-info"),
          success: kit("log-success"),
          warning: kit("log-warning"),
          error: kit("log-error"),
          processing: kit("log-processing"),
        },
      },

      /* 未写颜色的 border 用卡片那一级描边 */
      borderColor: { DEFAULT: v("color-border-secondary") },

      /* 字号与 antd 档位一一对应：sm = fontSizeSM 11，base = fontSize 12 … */
      fontSize: {
        sm: [v("font-size-sm"), { lineHeight: v("line-height-sm") }],
        base: [v("font-size"), { lineHeight: v("line-height") }],
        lg: [v("font-size-lg"), { lineHeight: v("line-height-lg") }],
        xl: [v("font-size-xl"), { lineHeight: v("line-height-lg") }],
        h5: [v("font-size-heading-5"), { lineHeight: v("line-height-heading-5") }],
        h4: [v("font-size-heading-4"), { lineHeight: v("line-height-heading-4") }],
        h3: [v("font-size-heading-3"), { lineHeight: v("line-height-heading-3") }],
        h2: [v("font-size-heading-2"), { lineHeight: v("line-height-heading-2") }],
        h1: [v("font-size-heading-1"), { lineHeight: v("line-height-heading-1") }],
      },
      fontWeight: { strong: v("font-weight-strong") },
      fontFamily: {
        sans: v("font-family"),
        mono: v("font-family-code"),
      },

      /* 圆角：控件 6 / 卡片 8 / 标签 4 */
      borderRadius: {
        xs: v("border-radius-xs"),
        sm: v("border-radius-sm"),
        DEFAULT: v("border-radius"),
        lg: v("border-radius-lg"),
      },

      boxShadow: {
        DEFAULT: v("box-shadow"),
        secondary: v("box-shadow-secondary"),
        tertiary: v("box-shadow-tertiary"),
        card: v("box-shadow-card"),
      },

      /* 动效三档，与 antd 组件一致 */
      transitionDuration: {
        DEFAULT: v("motion-duration-mid"),
        fast: v("motion-duration-fast"),
        mid: v("motion-duration-mid"),
        slow: v("motion-duration-slow"),
      },
      transitionTimingFunction: {
        DEFAULT: v("motion-ease-in-out"),
        "in-out": v("motion-ease-in-out"),
        out: v("motion-ease-out"),
        in: v("motion-ease-in"),
      },

      height: {
        control: v("control-height"),
        "control-sm": v("control-height-sm"),
        "control-lg": v("control-height-lg"),
      },
      width: { sidebar: "224px", "sidebar-compact": "195px" },
      maxWidth: { page: "1650px" },
      screens: { compact: { max: "1180px" } },
    },
  },
};
