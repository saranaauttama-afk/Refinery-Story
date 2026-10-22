import { Skia, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia'
import { tdAtlas } from './tdAtlas'
// Normalize legacy 2x sources once, onto an integer world-pixel grid. Source files stay intact.
export const logicalAtlas: Record<
  string,
  readonly [number, number, number, number, number, number]
> = {}
let x = 2,
  y = 2,
  row = 0
for (const [name, [, , w, h, ax, ay, k]] of Object.entries(tdAtlas)) {
  const width = Math.max(1, Math.round(w * k)),
    height = Math.max(1, Math.round(h * k))
  if (x + width + 2 > 1024) {
    x = 2
    y += row + 4
    row = 0
  }
  logicalAtlas[name] = [x, y, width, height, Math.round(ax * k), Math.round(ay * k)]
  x += width + 4
  row = Math.max(row, height)
}
export function normalizeAtlas(source: SkImage): SkImage | null {
  const surface = Skia.Surface.Make(1024, y + row + 2)
  if (!surface) return null
  const canvas = surface.getCanvas(),
    paint = Skia.Paint()
  paint.setAntiAlias(false)
  canvas.clear(Skia.Color('transparent'))
  for (const [name, [sx, sy, w, h]] of Object.entries(tdAtlas)) {
    const [dx, dy, dw, dh] = logicalAtlas[name]
    canvas.drawImageRectOptions(
      source,
      Skia.XYWHRect(sx, sy, w, h),
      Skia.XYWHRect(dx, dy, dw, dh),
      FilterMode.Nearest,
      MipmapMode.None,
      paint,
    )
  }
  surface.flush()
  const image = surface.makeImageSnapshot()
  surface.dispose()
  paint.dispose()
  return image
}
