import { memo, useMemo } from 'react'
import { Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'
import {
  Canvas,
  FilterMode,
  MipmapMode,
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
import { V3_YARD_BACKDROP } from '../../game/v3/yardBackdrop'
import { getV3BuildingArt } from './v3Art'
import { V3_DECOR_PLACEHOLDER_COLOR, getV3DecorFootprint } from '../../game/v3/decorData'

const MIN_SCALE = 0.35
const MAX_SCALE = 2.2
const PIXEL = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const // nearest-neighbour, same as the legacy map

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

/**
 * Draws a building's art at its real aspect ratio (Doc/ART_ASSET_LIST_V3.md §2):
 * width is fixed to the footprint's diamond width, height follows from the
 * source image's own aspect ratio, and the art's bottom edge sits flush on the
 * footprint's bottom corner. Alert badge (if any) floats above the art's top.
 */
// World-space backdrop (sea/coast/harbour): drawn inside the pan/zoom group so it
// moves with the buildings. Art slot: assets/bg/yard_backdrop.png (see yardBackdrop.ts).
const BACKDROP_ART = require('../../../assets/bg/yard_backdrop.png')
const Backdrop = memo(function Backdrop() {
  const image = useImage(BACKDROP_ART as DataSourceParam)
  if (!image) return null
  const b = V3_YARD_BACKDROP
  return <SkiaImage image={image} x={b.x} y={b.y} width={b.width} height={b.height} fit="fill" sampling={PIXEL} />
})

const Sprite = memo(function Sprite({
  source, centerX, bottomY, footprintWidth, alert, font,
}: {
  source: ImageSourcePropType
  centerX: number
  bottomY: number
  footprintWidth: number
  alert?: string
  font: ReturnType<typeof matchFont> | null
}) {
  const image = useImage(source as DataSourceParam)
  if (!image) return null
  const width = footprintWidth
  const height = width * (image.height() / image.width())
  const x = centerX - width / 2
  const y = bottomY - height
  return (
    <>
      <SkiaImage image={image} x={x} y={y} width={width} height={height} fit="fill" sampling={PIXEL} />
      {alert && font && <SkiaText x={centerX - 4} y={y - 6} text="!" font={font} color="#FFD447" />}
    </>
  )
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
  // Ground detail is built once per land change as ONE path each (grid, roads),
  // never per tile per frame: keeps a 48×48 yard smooth on phones.
  const gridPath = useMemo(() => {
    const path = Skia.Path.Make()
    for (const parcel of parcels) {
      if (parcel.state !== 'owned') continue
      for (let index = 0; index <= parcel.w; index++) {
        const a = v3IsoPoint(parcel.x + index, parcel.y); const b = v3IsoPoint(parcel.x + index, parcel.y + parcel.h)
        path.moveTo(a.sx, a.sy); path.lineTo(b.sx, b.sy)
      }
      for (let index = 0; index <= parcel.h; index++) {
        const a = v3IsoPoint(parcel.x, parcel.y + index); const b = v3IsoPoint(parcel.x + parcel.w, parcel.y + index)
        path.moveTo(a.sx, a.sy); path.lineTo(b.sx, b.sy)
      }
    }
    return path
  }, [parcels])
  const roadPath = useMemo(() => {
    const path = Skia.Path.Make()
    for (const node of roads) {
      const from = v3IsoPoint(node.x, node.y)
      if (node.links.e) { const to = v3IsoPoint(node.x + 1, node.y); path.moveTo(from.sx, from.sy); path.lineTo(to.sx, to.sy) }
      if (node.links.s) { const to = v3IsoPoint(node.x, node.y + 1); path.moveTo(from.sx, from.sy); path.lineTo(to.sx, to.sy) }
    }
    return path
  }, [roads])
  // Decorations: one path per placeholder colour (≤15 draw calls for ≤150 items).
  const decorations = state.world.decorations
  const decorPaths = useMemo(() => {
    const byColor = new Map<string, ReturnType<typeof Skia.Path.Make>>()
    for (const decoration of Object.values(decorations ?? {})) {
      const color = V3_DECOR_PLACEHOLDER_COLOR[decoration.kind]
      if (!byColor.has(color)) byColor.set(color, Skia.Path.Make())
      const { w, h } = getV3DecorFootprint(decoration.kind, decoration.rotated)
      const inset = 0.12
      const [a, b, c, d] = v3IsoRect({ x: decoration.x + inset, y: decoration.y + inset, w: w - inset * 2, h: h - inset * 2 })
      const path = byColor.get(color)!
      path.moveTo(a.sx, a.sy); path.lineTo(b.sx, b.sy); path.lineTo(c.sx, c.sy); path.lineTo(d.sx, d.sy); path.close()
    }
    return [...byColor.entries()]
  }, [decorations])
  const selectedDecor = selectedId ? decorations?.[selectedId] ?? null : null
  const parcelPaths = useMemo(() => parcels.map((parcel) => ({ parcel, path: diamond(v3IsoRect(parcel)) })), [parcels])
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
            <Backdrop />
            {parcelPaths.map(({ parcel, path }) => (
              <Path
                key={parcel.id}
                path={path}
                color={parcel.state === 'owned' ? '#7C9A56' : parcel.state === 'available' ? 'rgba(124,154,86,0.45)' : 'rgba(70,80,66,0.55)'}
              />
            ))}
            <Path path={gridPath} color="rgba(0,0,0,0.10)" style="stroke" strokeWidth={1} />
            {parcelPaths.filter(({ parcel }) => parcel.id === highlightParcelId).map(({ parcel, path }) => (
              <Path key={`hl-${parcel.id}`} path={path} color="#FFD447" style="stroke" strokeWidth={3} />
            ))}
            <Path path={roadPath} color="#9A9386" style="stroke" strokeWidth={4} />
            {decorPaths.map(([color, path]) => <Path key={`decor-${color}`} path={path} color={color} />)}
            {selectedDecor && (() => {
              const { w, h } = getV3DecorFootprint(selectedDecor.kind, selectedDecor.rotated)
              return <Path path={diamond(v3IsoRect({ x: selectedDecor.x, y: selectedDecor.y, w, h }))} color="#FFFFFF" style="stroke" strokeWidth={2} />
            })()}
            {upgradeGrowth?.cells.map((cell) => (
              <Path key={`g${cell.x},${cell.y}`} path={diamond(v3IsoRect({ ...cell, w: 1, h: 1 }))} color={upgradeGrowth.ok ? 'rgba(106,205,180,0.6)' : 'rgba(255,99,99,0.6)'} />
            ))}
            {sprites.map((sprite) => {
              const art = getV3BuildingArt(sprite.type, sprite.level)
              return (
                <Group key={sprite.id}>
                  {sprite.id === selectedId && <Path path={diamond(v3IsoRect(sprite))} color="rgba(255,255,255,0.45)" />}
                  {art
                    ? (
                      <Sprite
                        source={art}
                        centerX={sprite.centerX}
                        bottomY={sprite.bottomY}
                        footprintWidth={sprite.footprintWidth}
                        alert={alerts[sprite.id]}
                        font={font}
                      />
                    )
                    : <Path path={diamond(v3IsoRect(sprite))} color="#888" />}
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
                  x={point.sx - 14}
                  y={point.sy - 28 - floater.age * 28}
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
  viewport: { overflow: 'hidden', backgroundColor: V3_YARD_BACKDROP.seaColor },
  webNote: { color: '#D5E2E9', padding: 16 },
})
