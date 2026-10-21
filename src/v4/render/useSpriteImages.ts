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
import { sprites } from './buildings'
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

/** Draw a building at the canvas origin (its footprint centre): image if loaded, else code. */
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
    canvas.drawImageRectOptions(
      sk,
      rect(0, 0, img.w, img.h),
      rect(-img.ax / 2, -img.ay / 2, img.w / 2, img.h / 2),
      FilterMode.Nearest,
      MipmapMode.None,
      Skia.Paint(),
    )
    return
  }
  drawCommands(canvas, sprites[id](level, accent, 0))
}
