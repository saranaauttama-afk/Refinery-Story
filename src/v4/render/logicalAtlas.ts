import { Skia, FilterMode, MipmapMode, type SkImage } from '@shopify/react-native-skia'
import { tdAtlas } from './tdAtlas'
// Keep moving sprites on the same 64 art px / tile grid as generated buildings and ground.
export const ATLAS_DENSITY = 2
export const logicalAtlas: Record<
  string,
  readonly [number, number, number, number, number, number]
> = {}
let x = 2,
  y = 2,
  row = 0
for (const [name, [, , w, h, ax, ay, k]] of Object.entries(tdAtlas)) {
  const width = Math.max(1, Math.round(w * k * ATLAS_DENSITY)),
    height = Math.max(1, Math.round(h * k * ATLAS_DENSITY))
  if (x + width + 2 > 2048) {
    x = 2
    y += row + 4
    row = 0
  }
  logicalAtlas[name] = [
    x,
    y,
    width,
    height,
    Math.round(ax * k * ATLAS_DENSITY),
    Math.round(ay * k * ATLAS_DENSITY),
  ]
  x += width + 4
  row = Math.max(row, height)
}
export function normalizeAtlas(source: SkImage): SkImage | null {
  const surface = Skia.Surface.Make(2048, y + row + 2)
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
