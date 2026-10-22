import { useMemo } from 'react'
import { useImage, type SkImage } from '@shopify/react-native-skia'
// Each generated ground tile is 64 art px, displayed across 32 world units.
export function usePixelTerrain(): Record<string, SkImage> | null {
  const concrete = useImage(require('../../../assets/v5/pixel/concrete.png'))
  const asphalt = useImage(require('../../../assets/v5/pixel/asphalt.png'))
  const quay = useImage(require('../../../assets/v5/pixel/quay.png'))
  const grass = useImage(require('../../../assets/v5/pixel/grass.png'))
  const soil = useImage(require('../../../assets/v5/pixel/soil.png'))
  const sea = useImage(require('../../../assets/v5/pixel/sea.png'))
  return useMemo(
    () =>
      concrete && asphalt && quay && grass && soil && sea
        ? {
            '#C8C8BA': concrete,
            '#51575A': asphalt,
            '#D8C7A1': quay,
            '#D0CDB9': concrete,
            '#8DB957': grass,
            '#B0BD88': soil,
            '#3D92B2': sea,
          }
        : null,
    [concrete, asphalt, quay, grass, soil, sea],
  )
}
