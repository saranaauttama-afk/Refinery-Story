import { useMemo } from 'react'
import { buildingDef } from '../data/buildings'
import { sprites } from './buildings'
import { SpriteThumbnail } from './SpriteThumbnail'
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
  return <SpriteThumbnail commands={commands} cacheKey={`building:${id}:${level}`} size={size} />
}
