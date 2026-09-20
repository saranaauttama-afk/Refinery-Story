import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import {
  Canvas,
  Group,
  Path,
  Image as SkiaImage,
  Skia,
  useImage,
} from '@shopify/react-native-skia'
import type { SkPath, DataSourceParam } from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import {
  useSharedValue,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

import type { BuildingType, GridCell } from '../game/types'
import { GRID_SPREAD, PLANT_IMAGE_SCALE } from '../config/factoryScene'

// GPU scene renderer (Direction C). Draws the whole isometric yard on a single
// Skia canvas so pan + pinch-zoom are a matrix transform driven by Reanimated
// shared values on the UI thread — no per-tile View tree, no re-render on the
// 200ms game tick, so scrolling stays buttery no matter how full the yard gets.
// Native only (Skia needs CanvasKit on web); index.tsx keeps the old
// FactoryDiamondGroundView for web. Phase 1: ground tiles + building sprites +
// pan/zoom/tap. (Smoke, worker/level/synergy badges come next.)

// ── Layout constants (mirrors FactoryDiamondGroundView so positions match) ──
const TILE_SCALE = 1.5
const TILE_WIDTH = 84 * TILE_SCALE
const TILE_HEIGHT = 42 * TILE_SCALE
const SIDE_PADDING = 18 * TILE_SCALE
const TOP_PADDING = 18 * TILE_SCALE
const MIN_VIEWPORT_HEIGHT = 220 * TILE_SCALE
const EMPTY_INSET_X = 14 * TILE_SCALE
const EMPTY_INSET_Y = 8 * TILE_SCALE
const TOP_CUT_DIAGONALS = 4
const PLANT_IMAGE_WIDTH = TILE_WIDTH

// Mobile camera v2: keep enough of the yard visible that it can never be
// pinched into a tiny, apparently-lost speck.  The old 0.55 floor combined
// with overscroll made it possible to move the whole playable grid offscreen.
const MIN_SCALE = 0.72
const MAX_SCALE = 2.4
const CAMERA_MARGIN = 56

function isoX(row: number, col: number, rows: number) {
  return (col - row + rows - 1) * (TILE_WIDTH / 2) * GRID_SPREAD + SIDE_PADDING
}
function isoY(row: number, col: number) {
  return (row + col) * (TILE_HEIGHT / 2) * GRID_SPREAD + TOP_PADDING
}
function clampW(v: number, min: number, max: number) {
  'worklet'
  return Math.min(max, Math.max(min, v))
}
function axisBounds(viewportSize: number, contentSize: number, scale: number) {
  'worklet'
  const scaledSize = contentSize * scale
  if (scaledSize <= viewportSize) {
    const centered = (viewportSize - scaledSize) / 2
    // A small, deterministic travel range makes the camera feel draggable even
    // when an early-game 3x3 yard is smaller than the phone viewport.
    return { min: centered - CAMERA_MARGIN, max: centered + CAMERA_MARGIN }
  }
  // Keep at least CAMERA_MARGIN of world content visible on either edge.
  return {
    min: viewportSize - scaledSize - CAMERA_MARGIN,
    max: CAMERA_MARGIN,
  }
}

// Absolute-coord diamond path (Skia). x,y = tile top-left in scene space.
function diamondPath(x: number, y: number, w: number, h: number): SkPath {
  const p = Skia.Path.Make()
  const hw = w / 2
  const hh = h / 2
  p.moveTo(x + hw, y)
  p.lineTo(x + w, y + hh)
  p.lineTo(x + hw, y + h)
  p.lineTo(x, y + hh)
  p.close()
  return p
}

const PLANT_IMAGE_BY_BUILDING: Partial<Record<BuildingType, Record<number, DataSourceParam>>> = {
  distillationUnit: { 1: require('../../assets/plants/distillation_unit_lv1.png'), 2: require('../../assets/plants/distillation_unit_lv2.png'), 3: require('../../assets/plants/distillation_unit_lv3.png') },
  crudeTank: { 1: require('../../assets/plants/crude_tank_lv1.png'), 2: require('../../assets/plants/crude_tank_lv2.png'), 3: require('../../assets/plants/crude_tank_lv3.png') },
  productTank: { 1: require('../../assets/plants/product_tank_lv1.png'), 2: require('../../assets/plants/product_tank_lv2.png'), 3: require('../../assets/plants/product_tank_lv3.png') },
  laboratory: { 1: require('../../assets/plants/laboratory_lv1.png'), 2: require('../../assets/plants/laboratory_lv2.png'), 3: require('../../assets/plants/laboratory_lv3.png') },
  maintenanceWorkshop: { 1: require('../../assets/plants/maintenance_workshop_lv1.png'), 2: require('../../assets/plants/maintenance_workshop_lv2.png'), 3: require('../../assets/plants/maintenance_workshop_lv3.png') },
  salesOffice: { 1: require('../../assets/plants/sales_office_lv1.png'), 2: require('../../assets/plants/sales_office_lv2.png'), 3: require('../../assets/plants/sales_office_lv3.png') },
  lubricantPlant: { 1: require('../../assets/plants/lubricant_plant_lv1.png'), 2: require('../../assets/plants/lubricant_plant_lv2.png'), 3: require('../../assets/plants/lubricant_plant_lv3.png') },
  jetFuelPlant: { 1: require('../../assets/plants/jet_fuel_plant_lv1.png'), 2: require('../../assets/plants/jet_fuel_plant_lv2.png'), 3: require('../../assets/plants/jet_fuel_plant_lv3.png') },
  petrochemicalPlant: { 1: require('../../assets/plants/petrochemical_plant_lv1.png'), 2: require('../../assets/plants/petrochemical_plant_lv2.png'), 3: require('../../assets/plants/petrochemical_plant_lv3.png') },
  powerPlant: { 1: require('../../assets/plants/power_plant_lv1.png'), 2: require('../../assets/plants/power_plant_lv2.png'), 3: require('../../assets/plants/power_plant_lv3.png') },
  wasteTreatmentPlant: { 1: require('../../assets/plants/waste_treatment_plant_lv1.png'), 2: require('../../assets/plants/waste_treatment_plant_lv2.png'), 3: require('../../assets/plants/waste_treatment_plant_lv3.png') },
  polymerPlant: { 1: require('../../assets/plants/polymer_plant_lv1.png'), 2: require('../../assets/plants/polymer_plant_lv2.png'), 3: require('../../assets/plants/polymer_plant_lv3.png') },
  lubricantTank: { 1: require('../../assets/plants/lubricant_tank_lv1.png'), 2: require('../../assets/plants/lubricant_tank_lv2.png'), 3: require('../../assets/plants/lubricant_tank_lv3.png') },
  jetFuelTank: { 1: require('../../assets/plants/jet_fuel_tank_lv1.png'), 2: require('../../assets/plants/jet_fuel_tank_lv2.png'), 3: require('../../assets/plants/jet_fuel_tank_lv3.png') },
  petrochemicalTank: { 1: require('../../assets/plants/petrochemical_tank_lv1.png'), 2: require('../../assets/plants/petrochemical_tank_lv2.png'), 3: require('../../assets/plants/petrochemical_tank_lv3.png') },
  recyclingBunker: { 1: require('../../assets/plants/recycling_bunker_lv1.png'), 2: require('../../assets/plants/recycling_bunker_lv2.png'), 3: require('../../assets/plants/recycling_bunker_lv3.png') },
  pelletSilo: { 1: require('../../assets/plants/pellet_silo_lv1.png'), 2: require('../../assets/plants/pellet_silo_lv2.png'), 3: require('../../assets/plants/pellet_silo_lv3.png') },
}
function plantSource(cell: BuildingType, level: number): DataSourceParam | null {
  const byLevel = PLANT_IMAGE_BY_BUILDING[cell]
  if (!byLevel) return null
  return byLevel[level] ?? byLevel[1] ?? null
}

// One building sprite — its own useImage so the source can vary per tile.
const PlantSprite = memo(function PlantSprite({
  source, x, y, size,
}: { source: DataSourceParam; x: number; y: number; size: number }) {
  const image = useImage(source)
  if (!image) return null
  return <SkiaImage image={image} x={x} y={y} width={size} height={size} fit="contain" />
})

type Tile = { activeIndex: number | null; x: number; y: number; diagonal: number }

export type FactorySkiaViewProps = {
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  viewportHeight: number
  contentOffsetY?: number
  displayGridSize?: number
  anchorGridSize?: number
  onCellPress?: (index: number) => void
  panOutX?: SharedValue<number>
  panOutY?: SharedValue<number>
  zoomOut?: SharedValue<number>
  cameraResetKey?: number
}

function FactorySkiaView({
  grid,
  gridLevels,
  containerWidth,
  viewportHeight,
  contentOffsetY = 0,
  displayGridSize,
  anchorGridSize,
  onCellPress,
  panOutX,
  panOutY,
  zoomOut,
  cameraResetKey = 0,
}: FactorySkiaViewProps) {
  // Same geometry as the View renderer — memoised so it never churns on a tick.
  const layout = useMemo(() => {
    const activeCols = Math.round(Math.sqrt(grid.length))
    const activeRows = activeCols
    const displayCols = Math.max(displayGridSize ?? activeCols, activeCols)
    const displayRows = displayCols
    const anchorCols = Math.min(anchorGridSize ?? activeCols, displayCols)
    const anchoredRowOffset = Math.floor((displayRows - anchorCols) / 2)
    const activeRowOffset = Math.max(0, anchoredRowOffset)
    const anchoredColOffset = Math.floor((displayCols - anchorCols) / 2)
    const activeColOffset = Math.max(0, anchoredColOffset)

    const tiles: Tile[] = []
    for (let displayIndex = 0; displayIndex < displayCols * displayRows; displayIndex++) {
      const row = Math.floor(displayIndex / displayCols)
      const col = displayIndex % displayCols
      const diagonal = row + col
      if (diagonal < TOP_CUT_DIAGONALS) continue
      const x = isoX(row, col, displayRows)
      const y = isoY(row, col)
      const withinRows = row >= activeRowOffset && row < activeRowOffset + activeRows
      const withinCols = col >= activeColOffset && col < activeColOffset + activeCols
      const activeIndex =
        withinRows && withinCols
          ? (row - activeRowOffset) * activeCols + (col - activeColOffset)
          : null
      tiles.push({ activeIndex, x, y, diagonal })
    }

    // Camera bounds must follow the world that is actually drawn. The old
    // implementation measured the full invisible 11x11 shell while rendering
    // only active cells, which left large blank pan regions around the yard.
    const activeTiles = tiles.filter((t) => t.activeIndex !== null)
    const minX = Math.min(...activeTiles.map((t) => t.x))
    const maxX = Math.max(...activeTiles.map((t) => t.x + TILE_WIDTH))
    const minY = Math.min(...activeTiles.map((t) => t.y))
    const maxY = Math.max(...activeTiles.map((t) => t.y + TILE_HEIGHT))
    const worldWidth = maxX - minX
    const worldHeight = maxY - minY
    const mapWidth = Math.max(containerWidth, worldWidth + SIDE_PADDING * 2)
    const baseMapHeight = Math.max(MIN_VIEWPORT_HEIGHT, worldHeight + TOP_PADDING * 2)
    const mapHeight = baseMapHeight + contentOffsetY
    const offsetX = (mapWidth - worldWidth) / 2 - minX
    const offsetY = (baseMapHeight - worldHeight) / 2 - minY + contentOffsetY
    const vpWidth = containerWidth
    const vpHeight = viewportHeight
    // Absolute (offset-applied) tile positions used for both drawing and hit-test.
    const placed = activeTiles
      .map((t) => ({ activeIndex: t.activeIndex as number, x: t.x + offsetX, y: t.y + offsetY, diagonal: t.diagonal }))
      .sort((a, b) => a.diagonal - b.diagonal)
    return { placed, mapWidth, mapHeight, vpWidth, vpHeight, offsetX, offsetY }
  }, [grid.length, displayGridSize, anchorGridSize, containerWidth, viewportHeight, contentOffsetY])

  const { placed, mapWidth, mapHeight, vpWidth, vpHeight } = layout

  // Ground diamonds — rebuilt only when the grid contents change, not per tick.
  const ground = useMemo(() => {
    const imgSize = PLANT_IMAGE_WIDTH * PLANT_IMAGE_SCALE
    const imgLeft = (TILE_WIDTH - imgSize) / 2
    return placed.map((t) => {
      const cell = grid[t.activeIndex]
      const outer = diamondPath(t.x, t.y, TILE_WIDTH, TILE_HEIGHT)
      const inner = diamondPath(
        t.x + EMPTY_INSET_X,
        t.y + EMPTY_INSET_Y,
        TILE_WIDTH - EMPTY_INSET_X * 2,
        TILE_HEIGHT - EMPTY_INSET_Y * 2,
      )
      const src = cell ? plantSource(cell, gridLevels[t.activeIndex] ?? 1) : null
      return {
        key: t.activeIndex,
        outer,
        inner,
        cx: t.x + TILE_WIDTH / 2,
        cy: t.y + TILE_HEIGHT / 2,
        occupied: !!cell,
        sprite: src ? { source: src, x: t.x + imgLeft, y: t.y + TILE_HEIGHT - imgSize + EMPTY_INSET_Y, size: imgSize } : null,
      }
    })
  }, [placed, grid, gridLevels])

  // ── Pan / zoom shared values (UI thread) ──────────────────────────────────
  const tx = useSharedValue((Math.min(0, vpWidth - mapWidth)) / 2)
  const ty = useSharedValue((Math.min(0, vpHeight - mapHeight)) / 2)
  const scale = useSharedValue(1)
  const savedX = useSharedValue(0)
  const savedY = useSharedValue(0)
  const savedScale = useSharedValue(1)

  const centeredX = (Math.min(0, vpWidth - mapWidth)) / 2
  const centeredY = (Math.min(0, vpHeight - mapHeight)) / 2

  // Recenter deterministically when the viewport or playable grid changes.
  // Shared-value initializers only run on mount, so without this an expansion
  // or orientation change keeps offsets that belong to the previous layout.
  useEffect(() => {
    scale.value = 1
    savedScale.value = 1
    tx.value = centeredX
    ty.value = centeredY
    savedX.value = centeredX
    savedY.value = centeredY
  }, [cameraResetKey, centeredX, centeredY, savedScale, savedX, savedY, scale, tx, ty])

  const translateTransform = useDerivedValue(() => {
    // Expose movement relative to the centered camera. Consumers such as the
    // background should not inherit the map's private initial centering offset.
    if (panOutX) panOutX.value = tx.value - centeredX
    if (panOutY) panOutY.value = ty.value - centeredY
    if (zoomOut) zoomOut.value = scale.value
    return [{ translateX: tx.value }, { translateY: ty.value }]
  })
  const zoomTransform = useDerivedValue(() => [{ scale: scale.value }])

  const boundX = (v: number, s: number) => {
    'worklet'
    const bounds = axisBounds(vpWidth, mapWidth, s)
    return clampW(v, bounds.min, bounds.max)
  }
  const boundY = (v: number, s: number) => {
    'worklet'
    const bounds = axisBounds(vpHeight, mapHeight, s)
    return clampW(v, bounds.min, bounds.max)
  }

  const pan = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-14, 14])
    .activeOffsetY([-14, 14])
    .onStart(() => {
      'worklet'
      savedX.value = tx.value
      savedY.value = ty.value
    })
    .onUpdate((e) => {
      'worklet'
      tx.value = boundX(savedX.value + e.translationX, scale.value)
      ty.value = boundY(savedY.value + e.translationY, scale.value)
    })

  const pinch = Gesture.Pinch()
    .onStart((e) => {
      'worklet'
      savedScale.value = scale.value
      savedX.value = tx.value
      savedY.value = ty.value
    })
    .onUpdate((e) => {
      'worklet'
      const next = clampW(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE)
      const ratio = next / savedScale.value
      // Keep the pinch focal point pinned under the fingers.
      tx.value = boundX(e.focalX - (e.focalX - savedX.value) * ratio, next)
      ty.value = boundY(e.focalY - (e.focalY - savedY.value) * ratio, next)
      scale.value = next
    })

  const pickCell = (px: number, py: number) => {
    const sx = (px - tx.value) / scale.value
    const sy = (py - ty.value) / scale.value
    const hw = TILE_WIDTH / 2
    const hh = TILE_HEIGHT / 2
    // Front-most first (reverse diagonal order) so overlapping picks the top tile.
    for (let i = ground.length - 1; i >= 0; i--) {
      const g = ground[i]
      if (Math.abs(sx - g.cx) / hw + Math.abs(sy - g.cy) / hh <= 1) {
        onCellPress?.(g.key)
        return
      }
    }
  }

  const tap = Gesture.Tap()
    .maxDistance(14)
    .onEnd((e) => {
      'worklet'
      runOnJS(pickCell)(e.x, e.y)
    })

  // Movement gestures get priority after crossing their activation threshold;
  // a short stationary contact remains a tap. Limiting pan to one pointer
  // prevents its translation from fighting a two-finger pinch.
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), tap)

  return (
    <View style={[styles.viewport, { width: vpWidth, height: vpHeight }]}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width: vpWidth, height: vpHeight }}>
          {/* Deliberately nested: screen = world * scale + translation.  A
              single mixed transform array was interpreted differently by
              Skia than the hit-test/pinch maths and caused zoom jumps. */}
          <Group transform={translateTransform}>
            <Group transform={zoomTransform}>
              {/* ground: outer + inset diamonds */}
              {ground.map((g) => (
                <Group key={`gnd-${g.key}`}>
                  <Path path={g.outer} color={g.occupied ? '#D4C19F' : '#D9CCB1'} />
                  <Path path={g.outer} color={g.occupied ? '#8E7855' : '#9C8764'} style="stroke" strokeWidth={1.2} />
                  <Path path={g.inner} color={g.occupied ? 'rgba(238,229,211,0.18)' : '#EEE5D3'} />
                </Group>
              ))}
              {/* building sprites, back-to-front */}
              {ground.map((g) => (g.sprite ? (
                <PlantSprite key={`spr-${g.key}`} source={g.sprite.source} x={g.sprite.x} y={g.sprite.y} size={g.sprite.size} />
              ) : null))}
            </Group>
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden' },
})

export default memo(FactorySkiaView)
