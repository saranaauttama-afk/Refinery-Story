import { yardRoadCommands } from './roads'
import { useMemo } from 'react'
import { boxCommands } from './box'
import { SpriteThumbnail } from './SpriteThumbnail'
import { Image } from 'react-native'
import { spriteImageFor } from './spriteImages'
export function BuildingSprite({
  id,
  level = 1,
  size = 80,
}: {
  id: string
  level?: number
  size?: number
}) {
  const commands = useMemo(
    () => (id === 'road' ? yardRoadCommands(-0.5, -1, 15) : boxCommands(id, level)),
    [id, level],
  )
  const img = id === 'road' ? undefined : spriteImageFor(id, level)
  if (img)
    return (
      <Image
        accessible={false}
        source={img.src}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    )
  return <SpriteThumbnail commands={commands} cacheKey={`building:${id}:${level}`} size={size} />
}
