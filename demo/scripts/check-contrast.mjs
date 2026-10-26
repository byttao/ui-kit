// 主题审计：npm run check:contrast（对比度不达标退出码为 1；区分度不足只警告）
// Node 24 原生执行 ui-kit 的 TS 源码（类型擦除）。ui-kit 在 demo 目录之外，
// 用 resolve 钩子把第三方包指到 demo/node_modules，并补上省略的 .ts 后缀。
import { existsSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(new URL("../package.json", import.meta.url));

registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith(".") && !specifier.startsWith("node:") && !specifier.includes(":")) {
      try {
        return { url: pathToFileURL(require.resolve(specifier)).href, shortCircuit: true };
      } catch {
        return next(specifier, context);
      }
    }
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) return { url: candidate.href, shortCircuit: true };
    }
    return next(specifier, context);
  },
});

const { auditAll } = await import("../../lib/audit.ts");

let failed = 0;
let warned = 0;
for (const c of auditAll()) {
  const contrastRows = c.rows.filter((r) => r.kind === "contrast");
  const bad = contrastRows.filter((r) => !r.pass);
  const weak = c.rows.filter((r) => r.kind === "distance" && !r.pass);
  const min = Math.min(...contrastRows.map((r) => r.ratio));
  const name = `${c.accent.padEnd(8)} ${c.resolved.padEnd(5)} 侧栏:${c.sidebar.padEnd(5)} ${c.glass ? "玻璃" : "    "}`;
  console.log(`${bad.length ? "✗" : weak.length ? "⚠" : "✓"} ${name} 对比度 ${contrastRows.length} 组，最低 ${min.toFixed(2)}`);
  for (const r of bad) {
    console.log(`    ✗ ${r.group} / ${r.label}: ${r.ratio.toFixed(2)} < ${r.min}  (${r.fg} on ${r.bg})`);
  }
  for (const r of weak) {
    console.log(`    ⚠ ${r.label}: ΔE ${r.ratio.toFixed(1)} < ${r.min}  (${r.fg} / ${r.bg})`);
  }
  failed += bad.length;
  warned += weak.length;
}
if (failed) console.log(`\n${failed} 组对比度未达标`);
if (warned) console.log(`${warned} 组区分度不足（只警告：见 design.md「Colors」的区分度说明）`);
process.exitCode = failed ? 1 : 0;
