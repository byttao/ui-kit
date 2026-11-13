// ui-kit · 把 SVG 渲染成透明底 PNG（macOS，用 AppKit）
//
// 用法：swift render-svg.swift <输入.svg> <输出.png> [边长=1024]
//
// 为什么不用 qlmanage：`qlmanage -t` 生成缩略图时会垫一层白底，
// 图标四角（macOS 留边区）变成不透明白色，打包后 Dock 里是一块白方块。
// 这里先把画布清成透明，再把 SVG 画上去。
import AppKit

let args = CommandLine.arguments
guard args.count >= 3 else {
  FileHandle.standardError.write("用法：swift render-svg.swift <输入.svg> <输出.png> [边长=1024]\n".data(using: .utf8)!)
  exit(2)
}
let size = args.count >= 4 ? (Int(args[3]) ?? 1024) : 1024
guard let image = NSImage(contentsOf: URL(fileURLWithPath: args[1])) else {
  FileHandle.standardError.write("读不了 SVG：\(args[1])\n".data(using: .utf8)!)
  exit(1)
}
guard let rep = NSBitmapImageRep(
  bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8, samplesPerPixel: 4,
  hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0
) else { exit(1) }
rep.size = NSSize(width: size, height: size)
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
NSColor.clear.set()
NSRect(x: 0, y: 0, width: size, height: size).fill()
image.draw(in: NSRect(x: 0, y: 0, width: size, height: size), from: .zero, operation: .sourceOver, fraction: 1)
NSGraphicsContext.restoreGraphicsState()
guard let png = rep.representation(using: .png, properties: [:]) else { exit(1) }
try png.write(to: URL(fileURLWithPath: args[2]))
print("已渲染 \(args[2])（\(size)×\(size)，透明底）")
