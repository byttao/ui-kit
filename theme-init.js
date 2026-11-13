/*
 * 首帧主题：在 React 挂载前就写好 <html> 的 class，避免浅色用户先看到一闪深色。
 * 用法：index.html 的 <head> 里 <script src="/theme-init.js"></script>
 *      （放进 public/ 目录；若 CSP 禁止外链脚本，改成 <script> 内联这段即可）
 * 存储键与 ThemeProvider 保持一致。
 * ThemeProvider 的 mode 受控（主题存在应用自己的设置文件）时，localStorage 里可能没有值，
 * 首帧按默认浅色画；应用可以在加载设置后再渲染 ThemeProvider，或自己在这里读设置。
 */
(function () {
  var root = document.documentElement;
  var stored;
  try {
    stored = localStorage.getItem("ui-kit:theme");
  } catch (e) {
    stored = null;
  }
  // 没有存储时用默认的浅色（与 antd-theme.ts 的 DEFAULTS.mode 一致）
  var mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "light";
  var dark =
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
  // 上次的画布色（ThemeProvider 写入）：深色画布随主题色相变化，首帧就用对的颜色
  try {
    var canvas = JSON.parse(localStorage.getItem("ui-kit:canvas") || "null");
    if (canvas && canvas.resolved === (dark ? "dark" : "light") && /^#[0-9a-f]{6}$/i.test(canvas.color)) {
      root.style.backgroundColor = canvas.color;
    }
  } catch (e) {
    // 读不到就用 base.css 的默认画布色
  }
  root.dataset.platform = /Mac/.test(navigator.platform) ? "mac" : "other";
})();
