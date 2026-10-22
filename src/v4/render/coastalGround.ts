import {
  Skia,
  FilterMode,
  MipmapMode,
  ClipOp,
  type SkCanvas,
  type SkImage,
} from '@shopify/react-native-skia'
import { coastalShoreY } from './environmentLayout'
// Compose existing generated textures under pixel-stepped coastline masks.
// This runs only while recording cached terrain chunks, never in the animation loop.
export function drawCoastalTile(
  c: SkCanvas,
  textures: Record<string, SkImage>,
  x: number,
  y: number,
) {
  const px = x * 32,
    py = y * 32,
    paint = Skia.Paint()
  paint.setAntiAlias(false)
  const fill = (color: string) =>
    c.drawImageRectOptions(
      textures[color],
      Skia.XYWHRect(0, 0, 64, 64),
      Skia.XYWHRect(px, py, 32, 32),
      FilterMode.Nearest,
      MipmapMode.None,
      paint,
    )
  const below = (offset: number) => {
    const path = Skia.PathBuilder.Make()
    path.moveTo(px, py + 32)
    for (let i = 0; i <= 32; i++) {
      const xx = x + i / 32,
        edge = Math.round((coastalShoreY(xx) + offset) * 32)
      path.lineTo(px + i, Math.max(py, Math.min(py + 32, edge)))
    }
    path.lineTo(px + 32, py + 32)
    path.close()
    return path.detach()
  }
  fill('#3D92B2')
  c.save()
  const shallow = below(-0.32)
  c.clipPath(shallow, ClipOp.Intersect, false)
  paint.setColor(Skia.Color('#27C7C1'))
  paint.setAlphaf(0.4)
  c.drawRect(Skia.XYWHRect(px, py, 32, 32), paint)
  c.restore()
  shallow.dispose()
  paint.setAlphaf(1)
  for (const [offset, color] of [
    [0, '#B0BD88'],
    [0.6, '#8DB957'],
  ] as const) {
    c.save()
    const mask = below(offset)
    c.clipPath(mask, ClipOp.Intersect, false)
    fill(color)
    c.restore()
    mask.dispose()
  }
  // Small bright shore fragments follow the curve, with quiet gaps between them.
  paint.setColor(Skia.Color('#C9F5DB'))
  for (let i = 0; i < 32; i += 2) {
    const edge = Math.round(coastalShoreY(x + i / 32) * 32)
    if (edge >= py && edge < py + 32 && ((x * 16 + i / 2) & 3) !== 0)
      c.drawRect(Skia.XYWHRect(px + i, edge, 2, 0.5), paint)
  }
  paint.dispose()
}
