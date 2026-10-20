import { useMemo } from 'react'
import { Image } from 'react-native'
import { Skia } from '@shopify/react-native-skia'
import type { Command } from './buildings/shapes'
import { drawCommands } from './draw'
const cache = new Map<string, string>()
// CPU Skia snapshots share the yard's commands without allocating a WebGL
// context for every catalogue card or worker portrait.
export function SpriteThumbnail({
  commands,
  cacheKey,
  size,
}: {
  commands: Command[]
  cacheKey: string
  size: number
}) {
  const uri = useMemo(() => {
    const key = `${cacheKey}:${size}`
    const saved = cache.get(key)
    if (saved) return saved
    const points = commands.flatMap(c =>
      c.kind === 'polygon'
        ? c.points
        : c.kind === 'circle'
          ? [
              [c.x - c.r, c.y - c.r],
              [c.x + c.r, c.y + c.r],
            ]
          : [
              [c.x, c.y],
              [c.x + c.w, c.y + c.h],
            ],
    )
    const minX = Math.min(...points.map(p => p[0])),
      maxX = Math.max(...points.map(p => p[0]))
    const minY = Math.min(...points.map(p => p[1])),
      maxY = Math.max(...points.map(p => p[1]))
    const output = size * 2,
      scale = Math.min(4, (output - 16) / (maxX - minX + 2), (output - 16) / (maxY - minY + 2))
    const surface = Skia.Surface.Make(output, output)
    if (!surface) return undefined
    const canvas = surface.getCanvas()
    canvas.clear(Skia.Color('transparent'))
    canvas.translate(
      Math.round(output / 2 - ((minX + maxX) / 2) * scale),
      Math.round(output / 2 - ((minY + maxY) / 2) * scale),
    )
    canvas.scale(scale, scale)
    drawCommands(canvas, commands)
    surface.flush()
    const snapshot = surface.makeImageSnapshot(),
      value = `data:image/png;base64,${snapshot.encodeToBase64()}`
    snapshot.dispose()
    surface.dispose()
    cache.set(key, value)
    return value
  }, [cacheKey, size, commands])
  return (
    <Image
      accessible={false}
      source={uri ? { uri } : undefined}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  )
}
