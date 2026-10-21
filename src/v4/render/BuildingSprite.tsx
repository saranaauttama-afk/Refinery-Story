import { useMemo } from 'react'
import { buildingDef } from '../data/buildings'
import { sprites } from './buildings'
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
  const commands = useMemo(() => sprites[id](level, buildingDef(id).accent, 0), [id, level])
  const img = spriteImageFor(id, level)
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
