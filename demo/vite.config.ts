import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const nodeModules = fileURLToPath(new URL("./node_modules", import.meta.url));

// 演示专用：ui-kit 源码在 demo 目录之外，第三方依赖统一从 demo/node_modules 解析。
// 复制到真实项目（放在 src/ 内）后不需要这些别名。
const shared = [
  "react",
  "react-dom",
  "clsx",
  "tailwind-merge",
  "antd",
  "@ant-design/colors",
  "@ant-design/cssinjs",
  "@ant-design/icons",
  "@tauri-apps/api",
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@kit", replacement: fileURLToPath(new URL("..", import.meta.url)) },
      ...shared.map((name) => ({
        find: new RegExp(`^${name.replace("/", "\\/")}(/.*)?$`),
        replacement: `${nodeModules}/${name}$1`,
      })),
    ],
    dedupe: ["react", "react-dom"],
  },
  server: { fs: { allow: [".."] } },
});
