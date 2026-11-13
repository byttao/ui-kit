// ui-kit · 校验图标透明：逐个文件、逐个尺寸读四角与中心像素的 alpha（macOS，用 AppKit）
//
// 用法：swift check-alpha.swift src-tauri/icons/*.png src-tauri/icons/icon.ico src-tauri/icons/icon.icns
//
// 通过条件：有 alpha 通道、四角 alpha = 0（留边区透明）、中心 alpha = 255（底板不透明）。
// .icns / .ico 里的每个尺寸都会单独检查；任何一项不通过，退出码为 1。
import AppKit

var bad = 0
for path in CommandLine.arguments.dropFirst() {
  guard let data = try? Data(contentsOf: URL(fileURLWithPath: path)) else {
    print("BAD \(path) 读取失败")
    bad += 1
    continue
  }
  var reps = NSBitmapImageRep.imageReps(with: data).compactMap { $0 as? NSBitmapImageRep }
  if reps.isEmpty, let image = NSImage(data: data) {
    reps = image.representations.compactMap { $0 as? NSBitmapImageRep }
  }
  if reps.isEmpty {
    print("BAD \(path) 没有可读的位图")
    bad += 1
  }
  for rep in reps {
    let w = rep.pixelsWide, h = rep.pixelsHigh
    func alpha(_ x: Int, _ y: Int) -> Int { Int((rep.colorAt(x: x, y: y)?.alphaComponent ?? -1) * 255) }
    let corners = [alpha(0, 0), alpha(w - 1, 0), alpha(0, h - 1), alpha(w - 1, h - 1)]
    let center = alpha(w / 2, h / 2)
    let ok = rep.hasAlpha && corners.allSatisfy { $0 == 0 } && center == 255
    if !ok { bad += 1 }
    print("\(ok ? "OK " : "BAD") \((path as NSString).lastPathComponent) \(w)x\(h) alpha通道=\(rep.hasAlpha) 四角=\(corners) 中心=\(center)")
  }
}
print(bad == 0 ? "全部通过" : "\(bad) 项不通过：四角应透明（0）、中心应不透明（255）")
exit(bad == 0 ? 0 : 1)
