#!/usr/bin/env bash
# ui-kit · 应用图标一条龙（macOS）：SVG → 1024 透明 PNG → tauri icon 生成各尺寸 → 逐尺寸校验透明
#
# 用法（在 Tauri 项目根目录执行）：
#   bash src/ui-kit/scripts/icon/make-icons.sh [src-tauri/app-icon.svg]
#
# 图标规范见 ui-kit 的 design.md「应用图标」：1024 画布，底板 824×824 居中（四周各留 100px 透明），
# 圆角约 185px；留边区必须透明，所以不要用 qlmanage 渲染（会垫白底）。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SVG="${1:-src-tauri/app-icon.svg}"
PNG="${SVG%.svg}.png"

if [[ "$(uname)" != "Darwin" ]]; then
  echo "需要 macOS（用 AppKit 渲染 SVG）。其他系统请用能保留透明的工具（如 Inkscape / rsvg-convert）导出 1024 PNG，再执行 npx tauri icon。" >&2
  exit 2
fi

swift "$HERE/render-svg.swift" "$SVG" "$PNG" 1024
npx tauri icon "$PNG"
# 桌面应用用不到移动端图标
rm -rf src-tauri/icons/android src-tauri/icons/ios
swift "$HERE/check-alpha.swift" src-tauri/icons/*.png src-tauri/icons/icon.ico src-tauri/icons/icon.icns
