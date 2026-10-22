import {
  useImage,
  FilterMode,
  MipmapMode,
  Skia,
  rect,
  type SkCanvas,
  type SkImage,
} from '@shopify/react-native-skia'
import { allSpriteImages, spriteImageFor, spriteTierFor } from './spriteImages'
import { boxCommands } from './box'
import { drawCommands } from './draw'

export type LoadedSprites = Record<string, SkImage | null>

/** Load every PixelLab sprite once; the list is fixed, so the hook count never changes. */
export function useSpriteImages(): LoadedSprites {
  const out: LoadedSprites = {}
  for (const { key, img } of allSpriteImages) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    out[key] = useImage(img.src)
  }
  return out
}

/** Draw a building with its slab's bottom centre at the canvas origin: art if loaded, else a box. */
export function drawBuilding(
  canvas: SkCanvas,
  loaded: LoadedSprites,
  id: string,
  level: number,
  accent: string,
) {
  const tier = spriteTierFor(id, level)
  const img = spriteImageFor(id, level)
  const sk = tier ? loaded[`${id}:${tier}`] : null
  if (img && sk) {
    const k = img.scale
    canvas.drawImageRectOptions(
      sk,
      rect(0, 0, img.w, img.h),
      rect(-img.ax * k, -img.ay * k, img.w * k, img.h * k),
      FilterMode.Nearest,
      MipmapMode.None,
      Skia.Paint(),
    )
    return
  }
  void accent
  drawCommands(canvas, boxCommands(id === 'gate_w' ? 'gate' : id, level, id === 'gate_w'), false)
}
