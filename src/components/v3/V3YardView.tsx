import { memo, useMemo } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { Canvas, Group, Line, Rect, vec } from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useDerivedValue, useSharedValue } from 'react-native-reanimated'

import { BUILDING_COLORS } from '../../buildingColors'
import { clampCameraValue } from '../../factoryCamera'
import type { V3GameState } from '../../game/v3/types'
import {
  V3_TILE_PX,
  deriveV3RoadNetwork,
  getV3BuildingViews,
  getV3ParcelViews,
  getV3YardBounds,
  type V3PlacementPreview,
} from '../../game/v3/yardView'

const MIN_SCALE = 0.5
const MAX_SCALE = 2.6
const PREVIEW_COLOR: Record<string, string> = {
  valid: 'rgba(106,205,180,0.55)',
  overlap: 'rgba(255,99,99,0.55)',
  locked_land: 'rgba(255,173,138,0.55)',
  out_of_bounds: 'rgba(255,99,99,0.55)',
  no_footprint: 'rgba(255,99,99,0.55)',
}

type Props = {
  state: V3GameState
  width: number
  height: number
  selectedId: string | null
  highlightParcelId: string | null
  /** Footprint preview for build/move mode. */
  placement: V3PlacementPreview | null
  /** Extra cells an upgrade needs, coloured by whether they are free. */
  upgradeGrowth: { cells: Array<{ x: number; y: number }>; ok: boolean } | null
  onTapTile: (x: number, y: number) => void
}

/**
 * Draws only owned land plus the adjacent purchasable ring pieces (never the
 * full 100×100 world). Buildings are footprint rectangles from the shared
 * yard model; art can replace these later using the same anchor/footprint.
 */
function V3YardView({ state, width, height, selectedId, highlightParcelId, placement, upgradeGrowth, onTapTile }: Props) {
  const bounds = useMemo(() => getV3YardBounds(state), [state])
  const parcels = useMemo(() => getV3ParcelViews(state), [state])
  const buildings = useMemo(() => getV3BuildingViews(state), [state])
  const roads = useMemo(() => deriveV3RoadNetwork(state), [state])

  const origin = { x: bounds.x * V3_TILE_PX, y: bounds.y * V3_TILE_PX }
  const worldW = bounds.w * V3_TILE_PX
  const worldH = bounds.h * V3_TILE_PX
  const fit = Math.min(width / worldW, height / worldH, 1.4)
  const initialScale = clampCameraValue(fit, MIN_SCALE, MAX_SCALE)
  const initialX = (width - worldW * initialScale) / 2 - origin.x * initialScale
  const initialY = (height - worldH * initialScale) / 2 - origin.y * initialScale

  const tx = useSharedValue(initialX)
  const ty = useSharedValue(initialY)
  const scale = useSharedValue(initialScale)
  const savedX = useSharedValue(initialX)
  const savedY = useSharedValue(initialY)
  const savedScale = useSharedValue(initialScale)

  const transform = useDerivedValue(() => [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }])

  const clampX = (value: number, s: number) => {
    'worklet'
    // Keep at least a quarter of the drawn land on screen.
    const min = width * 0.25 - (origin.x + worldW) * s
    const max = width * 0.75 - origin.x * s
    return clampCameraValue(value, min, max)
  }
  const clampY = (value: number, s: number) => {
    'worklet'
    const min = height * 0.25 - (origin.y + worldH) * s
    const max = height * 0.75 - origin.y * s
    return clampCameraValue(value, min, max)
  }

  const pan = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onStart(() => {
      'worklet'
      savedX.value = tx.value
      savedY.value = ty.value
    })
    .onUpdate((event) => {
      'worklet'
      tx.value = clampX(savedX.value + event.translationX, scale.value)
      ty.value = clampY(savedY.value + event.translationY, scale.value)
    })
  const pinch = Gesture.Pinch()
    .onStart(() => {
      'worklet'
      savedScale.value = scale.value
      savedX.value = tx.value
      savedY.value = ty.value
    })
    .onUpdate((event) => {
      'worklet'
      const next = clampCameraValue(savedScale.value * event.scale, MIN_SCALE, MAX_SCALE)
      const ratio = next / savedScale.value
      tx.value = clampX(event.focalX - (event.focalX - savedX.value) * ratio, next)
      ty.value = clampY(event.focalY - (event.focalY - savedY.value) * ratio, next)
      scale.value = next
    })
  const tap = Gesture.Tap()
    .maxDistance(12)
    .onEnd((event) => {
      'worklet'
      const worldX = (event.x - tx.value) / scale.value / V3_TILE_PX
      const worldY = (event.y - ty.value) / scale.value / V3_TILE_PX
      runOnJS(onTapTile)(Math.floor(worldX), Math.floor(worldY))
    })
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), tap)

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.viewport, { width, height }]}>
        <Text style={styles.webNote}>Yard map runs in the Android/iOS build.</Text>
      </View>
    )
  }

  const T = V3_TILE_PX
  return (
    <View style={[styles.viewport, { width, height }]}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          <Group transform={transform}>
            {parcels.map((parcel) => (
              <Group key={parcel.id}>
                <Rect
                  x={parcel.x * T}
                  y={parcel.y * T}
                  width={parcel.w * T}
                  height={parcel.h * T}
                  color={parcel.state === 'owned' ? '#3C4A3A' : parcel.state === 'available' ? 'rgba(90,110,90,0.35)' : 'rgba(40,45,50,0.6)'}
                />
                {parcel.id === highlightParcelId && (
                  <Rect x={parcel.x * T} y={parcel.y * T} width={parcel.w * T} height={parcel.h * T} color="#FFD447" style="stroke" strokeWidth={3} />
                )}
                {parcel.state === 'owned' && Array.from({ length: parcel.w + 1 }, (_, index) => (
                  <Line key={`v${index}`} p1={vec((parcel.x + index) * T, parcel.y * T)} p2={vec((parcel.x + index) * T, (parcel.y + parcel.h) * T)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
                ))}
                {parcel.state === 'owned' && Array.from({ length: parcel.h + 1 }, (_, index) => (
                  <Line key={`h${index}`} p1={vec(parcel.x * T, (parcel.y + index) * T)} p2={vec((parcel.x + parcel.w) * T, (parcel.y + index) * T)} color="rgba(255,255,255,0.08)" strokeWidth={1} />
                ))}
              </Group>
            ))}
            {roads.map((node) => (
              <Group key={`road-${node.x}-${node.y}`}>
                {node.links.e && <Line p1={vec(node.x * T, node.y * T)} p2={vec((node.x + 1) * T, node.y * T)} color="#8E8A80" strokeWidth={4} />}
                {node.links.s && <Line p1={vec(node.x * T, node.y * T)} p2={vec(node.x * T, (node.y + 1) * T)} color="#8E8A80" strokeWidth={4} />}
              </Group>
            ))}
            {buildings.map((building) => (
              <Group key={building.id}>
                <Rect x={building.x * T + 2} y={building.y * T + 2} width={building.w * T - 4} height={building.h * T - 4} color={BUILDING_COLORS[building.type] ?? '#888'} />
                {Array.from({ length: building.level }, (_, index) => (
                  <Rect key={index} x={building.x * T + 5 + index * 6} y={building.y * T + 5} width={4} height={4} color="#FFD447" />
                ))}
                {building.id === selectedId && (
                  <Rect x={building.x * T + 1} y={building.y * T + 1} width={building.w * T - 2} height={building.h * T - 2} color="#FFFFFF" style="stroke" strokeWidth={3} />
                )}
              </Group>
            ))}
            {upgradeGrowth?.cells.map((cell) => (
              <Rect key={`g${cell.x},${cell.y}`} x={cell.x * T + 1} y={cell.y * T + 1} width={T - 2} height={T - 2} color={upgradeGrowth.ok ? 'rgba(106,205,180,0.55)' : 'rgba(255,99,99,0.55)'} />
            ))}
            {placement?.cells.map((cell) => (
              <Rect key={`p${cell.x},${cell.y}`} x={cell.x * T + 1} y={cell.y * T + 1} width={T - 2} height={T - 2} color={PREVIEW_COLOR[placement.status] ?? PREVIEW_COLOR.overlap} />
            ))}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  )
}

export default memo(V3YardView)

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden', backgroundColor: '#1A2126', borderRadius: 10 },
  webNote: { color: '#D5E2E9', padding: 16 },
})
