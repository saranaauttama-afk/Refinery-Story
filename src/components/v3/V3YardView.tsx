import { memo, useMemo } from 'react'
import { Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'
import {
  Canvas,
  Group,
  Image as SkiaImage,
  Path,
  Skia,
  Text as SkiaText,
  matchFont,
  useImage,
  type DataSourceParam,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useDerivedValue, useSharedValue } from 'react-native-reanimated'

import { clampCameraValue } from '../../factoryCamera'
import type { V3GameState } from '../../game/v3/types'
import {
  V3_ISO,
  deriveV3RoadNetwork,
  getV3IsoBounds,
  getV3ParcelViews,
  getV3SpritePlacements,
  v3IsoPoint,
  v3IsoRect,
  type V3PlacementPreview,
} from '../../game/v3/yardView'
import { getV3BuildingArt } from './v3Art'

const MIN_SCALE = 0.35
const MAX_SCALE = 2.2
const PIXEL = { filter: 0, mipmap: 0 } as const // nearest-neighbour for pixel art

export type V3Floater = { id: string; x: number; y: number; text: string; color: string; age: number }

type Props = {
  state: V3GameState
  width: number
  height: number
  selectedId: string | null
  highlightParcelId: string | null
  placement: V3PlacementPreview | null
  upgradeGrowth: { cells: Array<{ x: number; y: number }>; ok: boolean } | null
  floaters: V3Floater[]
  /** Building IDs that need attention (idle/blocked line…). */
  alerts: Record<string, string>
  onTapTile: (x: number, y: number) => void
}

const PREVIEW_FILL: Record<string, string> = {
  valid: 'rgba(106,205,180,0.6)',
  locked_land: 'rgba(255,173,138,0.6)',
}

function diamond(points: Array<{ sx: number; sy: number }>) {
  const path = Skia.Path.Make()
  path.moveTo(points[0].sx, points[0].sy)
  for (const point of points.slice(1)) path.lineTo(point.sx, point.sy)
  path.close()
  return path
}

function line(a: { sx: number; sy: number }, b: { sx: number; sy: number }) {
  const path = Skia.Path.Make()
  path.moveTo(a.sx, a.sy)
  path.lineTo(b.sx, b.sy)
  return path
}

const Sprite = memo(function Sprite({ source, x, y, size }: { source: ImageSourcePropType; x: number; y: number; size: number }) {
  const image = useImage(source as DataSourceParam)
  if (!image) return null
  return <SkiaImage image={image} x={x} y={y} width={size} height={size} fit="contain" sampling={PIXEL} />
})

/**
 * Full-screen isometric refinery. Draws only owned land plus adjacent ring
 * parcels; buildings use the existing pixel art placed on their real footprint.
 */
function V3YardView({ state, width, height, selectedId, highlightParcelId, placement, upgradeGrowth, floaters, alerts, onTapTile }: Props) {
  const landKey = `${state.world.unlockedParcelIds.join(',')}|${state.campaignProgress.chapter}`
  const parcels = useMemo(() => getV3ParcelViews(state), [landKey])
  const sprites = useMemo(() => getV3SpritePlacements(state), [state.world.buildingsById])
  const roads = useMemo(() => deriveV3RoadNetwork(state), [landKey])
  const bounds = useMemo(() => getV3IsoBounds(state), [landKey])
  const font = useMemo(() => (Platform.OS === 'web'
    ? null
    : matchFont({ fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }), fontSize: 16, fontWeight: 'bold' })), [])

  const worldW = bounds.maxX - bounds.minX
  const worldH = bounds.maxY - bounds.minY
  const initialScale = clampCameraValue(Math.min(width / worldW, height / worldH) * 1.3, MIN_SCALE, MAX_SCALE)
  const initialX = width / 2 - (bounds.minX + worldW / 2) * initialScale
  const initialY = height / 2 - (bounds.minY + worldH / 2) * initialScale

  const tx = useSharedValue(initialX)
  const ty = useSharedValue(initialY)
  const scale = useSharedValue(initialScale)
  const savedX = useSharedValue(initialX)
  const savedY = useSharedValue(initialY)
  const savedScale = useSharedValue(initialScale)
  const transform = useDerivedValue(() => [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }])

  const clampX = (value: number, s: number) => {
    'worklet'
    return clampCameraValue(value, width * 0.3 - bounds.maxX * s, width * 0.7 - bounds.minX * s)
  }
  const clampY = (value: number, s: number) => {
    'worklet'
    return clampCameraValue(value, height * 0.3 - bounds.maxY * s, height * 0.7 - bounds.minY * s)
  }
  const pan = Gesture.Pan().maxPointers(1).activeOffsetX([-10, 10]).activeOffsetY([-10, 10])
    .onStart(() => { 'worklet'; savedX.value = tx.value; savedY.value = ty.value })
    .onUpdate((event) => {
      'worklet'
      tx.value = clampX(savedX.value + event.translationX, scale.value)
      ty.value = clampY(savedY.value + event.translationY, scale.value)
    })
  const pinch = Gesture.Pinch()
    .onStart(() => { 'worklet'; savedScale.value = scale.value; savedX.value = tx.value; savedY.value = ty.value })
    .onUpdate((event) => {
      'worklet'
      const next = clampCameraValue(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE)
      const ratio = next / savedScale.value
      tx.value = clampX(event.focalX - (event.focalX - savedX.value) * ratio, next)
      ty.value = clampY(event.focalY - (event.focalY - savedY.value) * ratio, next)
      scale.value = next
    })
  const halfW = V3_ISO.tw / 2
  const halfH = V3_ISO.th / 2
  const tap = Gesture.Tap().maxDistance(12).onEnd((event) => {
    'worklet'
    const a = (event.x - tx.value) / scale.value / halfW
    const b = (event.y - ty.value) / scale.value / halfH
    runOnJS(onTapTile)(Math.floor((a + b) / 2), Math.floor((b - a) / 2))
  })
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), tap)

  if (Platform.OS === 'web') {
    return <View style={[styles.viewport, { width, height }]}><Text style={styles.webNote}>The refinery map runs in the Android/iOS build.</Text></View>
  }

  return (
    <View style={[styles.viewport, { width, height }]}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          <Group transform={transform}>
            {parcels.map((parcel) => (
              <Group key={parcel.id}>
                <Path
                  path={diamond(v3IsoRect(parcel))}
                  color={parcel.state === 'owned' ? '#7C9A56' : parcel.state === 'available' ? 'rgba(124,154,86,0.45)' : 'rgba(70,80,66,0.55)'}
                />
                {parcel.state === 'owned' && Array.from({ length: parcel.w + 1 }, (_, index) => (
                  <Path key={`c${index}`} path={line(v3IsoPoint(parcel.x + index, parcel.y), v3IsoPoint(parcel.x + index, parcel.y + parcel.h))} color="rgba(0,0,0,0.10)" style="stroke" strokeWidth={1} />
                ))}
                {parcel.state === 'owned' && Array.from({ length: parcel.h + 1 }, (_, index) => (
                  <Path key={`r${index}`} path={line(v3IsoPoint(parcel.x, parcel.y + index), v3IsoPoint(parcel.x + parcel.w, parcel.y + index))} color="rgba(0,0,0,0.10)" style="stroke" strokeWidth={1} />
                ))}
                {parcel.id === highlightParcelId && (
                  <Path path={diamond(v3IsoRect(parcel))} color="#FFD447" style="stroke" strokeWidth={4} />
                )}
              </Group>
            ))}
            {roads.map((node) => (
              <Group key={`road-${node.x}-${node.y}`}>
                {node.links.e && <Path path={line(v3IsoPoint(node.x, node.y), v3IsoPoint(node.x + 1, node.y))} color="#9A9386" style="stroke" strokeWidth={6} />}
                {node.links.s && <Path path={line(v3IsoPoint(node.x, node.y), v3IsoPoint(node.x, node.y + 1))} color="#9A9386" style="stroke" strokeWidth={6} />}
              </Group>
            ))}
            {upgradeGrowth?.cells.map((cell) => (
              <Path key={`g${cell.x},${cell.y}`} path={diamond(v3IsoRect({ ...cell, w: 1, h: 1 }))} color={upgradeGrowth.ok ? 'rgba(106,205,180,0.6)' : 'rgba(255,99,99,0.6)'} />
            ))}
            {sprites.map((sprite) => {
              const art = getV3BuildingArt(sprite.type, sprite.level)
              return (
                <Group key={sprite.id}>
                  {sprite.id === selectedId && <Path path={diamond(v3IsoRect(sprite))} color="rgba(255,255,255,0.45)" />}
                  {art
                    ? <Sprite source={art} x={sprite.px} y={sprite.py} size={sprite.size} />
                    : <Path path={diamond(v3IsoRect(sprite))} color="#888" />}
                  {alerts[sprite.id] && font && (
                    <SkiaText x={sprite.px + sprite.size / 2 - 4} y={sprite.py + 10} text="!" font={font} color="#FFD447" />
                  )}
                </Group>
              )
            })}
            {placement?.cells.map((cell) => (
              <Path key={`p${cell.x},${cell.y}`} path={diamond(v3IsoRect({ ...cell, w: 1, h: 1 }))} color={PREVIEW_FILL[placement.status] ?? 'rgba(255,99,99,0.6)'} />
            ))}
            {font && floaters.map((floater) => {
              const point = v3IsoPoint(floater.x + 0.5, floater.y + 0.5)
              return (
                <SkiaText
                  key={floater.id}
                  x={point.sx - 18}
                  y={point.sy - 44 - floater.age * 36}
                  text={floater.text}
                  font={font}
                  color={floater.color}
                  opacity={Math.max(0, 1 - floater.age)}
                />
              )
            })}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  )
}

export default memo(V3YardView)

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden', backgroundColor: '#4A6B3F' },
  webNote: { color: '#D5E2E9', padding: 16 },
})
