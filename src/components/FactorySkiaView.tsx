import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import distillationUnitLv1 from '../assets/generated/distillationUnitLv1'
import distillationUnitLv2 from '../assets/generated/distillationUnitLv2'
import distillationUnitLv3 from '../assets/generated/distillationUnitLv3'
import crudeTankLv1 from '../assets/generated/crudeTankLv1'
import crudeTankLv2 from '../assets/generated/crudeTankLv2'
import crudeTankLv3 from '../assets/generated/crudeTankLv3'
import productTankLv1 from '../assets/generated/productTankLv1'
import productTankLv2 from '../assets/generated/productTankLv2'
import productTankLv3 from '../assets/generated/productTankLv3'

import {
  Canvas,
  FilterMode,
  Group,
  MipmapMode,
  Path,
  Rect,
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
import {
  BUILD_ZONE_CENTER_X,
  BUILD_ZONE_FOCUS_Y,
  BUILD_ZONE_TOP_Y,
  FACTORY_WORLD_VIEWPORT_SCALE,
  GRID_SPREAD,
} from '../config/factoryScene'
import { getPlantSpriteProfile, getPlantSpriteRect } from '../factoryPlantLayout'
import {
  FACTORY_INITIAL_SCALE,
  FACTORY_MAX_SCALE,
  FACTORY_MIN_SCALE,
  FACTORY_WORLD_BLEED,
  clampCameraValue,
  getMinimumWorldExtent,
  getWorldCameraAxisBounds,
  screenPointToWorld,
} from '../factoryCamera'

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
const EMPTY_INSET_X = 9 * TILE_SCALE
const EMPTY_INSET_Y = 5 * TILE_SCALE
const TOP_CUT_DIAGONALS = 4
const PLANT_IMAGE_WIDTH = TILE_WIDTH
const ROAD_EDGE = 16 * TILE_SCALE

const PIXEL_SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const

function isoX(row: number, col: number, rows: number) {
  return (col - row + rows - 1) * (TILE_WIDTH / 2) * GRID_SPREAD + SIDE_PADDING
}
function isoY(row: number, col: number) {
  return (row + col) * (TILE_HEIGHT / 2) * GRID_SPREAD + TOP_PADDING
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
  distillationUnit: { 1: distillationUnitLv1, 2: distillationUnitLv2, 3: distillationUnitLv3 },
  crudeTank: { 1: crudeTankLv1, 2: crudeTankLv2, 3: crudeTankLv3 },
  productTank: { 1: productTankLv1, 2: productTankLv2, 3: productTankLv3 },
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
type PlantVisual = { source: DataSourceParam }

function plantVisual(cell: BuildingType, level: number): PlantVisual | null {
  const byLevel = PLANT_IMAGE_BY_BUILDING[cell]
  if (!byLevel) return null
  const source = byLevel[level] ?? byLevel[1]
  if (!source) return null
  return { source }
}

// One building sprite — its own useImage so the source can vary per tile.
const PlantSprite = memo(function PlantSprite({
  source, x, y, size,
}: { source: DataSourceParam; x: number; y: number; size: number }) {
  const image = useImage(source)
  if (!image) return null
  return <SkiaImage image={image} x={x} y={y} width={size} height={size} fit="contain" sampling={PIXEL_SAMPLING} />
})

type Tile = { activeIndex: number | null; x: number; y: number; diagonal: number }

export type FactorySkiaViewProps = {
  grid: GridCell[]
  gridLevels: number[]
  backgroundSource: ImageSourcePropType
  containerWidth: number
  viewportHeight: number
  contentOffsetY?: number
  displayGridSize?: number
  anchorGridSize?: number
  onCellPress?: (index: number) => void
  selectedCellIndex?: number | null
  showPlacementGrid?: boolean
  panOutX?: SharedValue<number>
  panOutY?: SharedValue<number>
  zoomOut?: SharedValue<number>
  cameraResetKey?: number
}

function FactorySkiaView({
  grid,
  gridLevels,
  backgroundSource,
  containerWidth,
  viewportHeight,
  contentOffsetY = 0,
  displayGridSize,
  anchorGridSize,
  onCellPress,
  selectedCellIndex = null,
  showPlacementGrid = false,
  panOutX,
  panOutY,
  zoomOut,
  cameraResetKey = 0,
}: FactorySkiaViewProps) {
  const backgroundImage = useImage(backgroundSource as DataSourceParam)

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
    const vpWidth = containerWidth
    const vpHeight = viewportHeight
    const worldWidth = maxX - minX
    const worldHeight = maxY - minY

    // The backdrop, ground, sprites, and hit testing now share this one world
    // rectangle. It is large enough to cover the viewport at minimum zoom.
    const mapWidth = Math.max(
      getMinimumWorldExtent(vpWidth),
      vpWidth * FACTORY_WORLD_VIEWPORT_SCALE,
      worldWidth + SIDE_PADDING * 2 + FACTORY_WORLD_BLEED * 2,
    )
    const mapHeight = Math.max(
      getMinimumWorldExtent(vpHeight),
      vpHeight * FACTORY_WORLD_VIEWPORT_SCALE,
      MIN_VIEWPORT_HEIGHT,
      worldHeight + TOP_PADDING * 2 + FACTORY_WORLD_BLEED * 2,
    )
    const offsetX = mapWidth * BUILD_ZONE_CENTER_X - worldWidth / 2 - minX
    const offsetY = mapHeight * BUILD_ZONE_TOP_Y - minY
    // Absolute (offset-applied) tile positions used for both drawing and hit-test.
    const placed = activeTiles
      .map((t) => ({ activeIndex: t.activeIndex as number, x: t.x + offsetX, y: t.y + offsetY, diagonal: t.diagonal }))
      .sort((a, b) => a.diagonal - b.diagonal)
    return {
      placed,
      mapWidth,
      mapHeight,
      vpWidth,
      vpHeight,
      playableMinX: minX + offsetX,
      playableMaxX: maxX + offsetX,
      playableMinY: minY + offsetY,
      playableMaxY: maxY + offsetY,
    }
  }, [grid.length, displayGridSize, anchorGridSize, containerWidth, viewportHeight, contentOffsetY])

  const {
    placed,
    mapWidth,
    mapHeight,
    vpWidth,
    vpHeight,
    playableMinX,
    playableMaxX,
    playableMinY,
    playableMaxY,
  } = layout

  // Ground diamonds — rebuilt only when the grid contents change, not per tick.
  const ground = useMemo(() => {
    return placed.map((t) => {
      const cell = grid[t.activeIndex]
      const road = diamondPath(
        t.x - ROAD_EDGE,
        t.y - ROAD_EDGE / 2,
        TILE_WIDTH + ROAD_EDGE * 2,
        TILE_HEIGHT + ROAD_EDGE,
      )
      const outer = diamondPath(t.x, t.y, TILE_WIDTH, TILE_HEIGHT)
      const inner = diamondPath(
        t.x + EMPTY_INSET_X,
        t.y + EMPTY_INSET_Y,
        TILE_WIDTH - EMPTY_INSET_X * 2,
        TILE_HEIGHT - EMPTY_INSET_Y * 2,
      )
      const visual = cell ? plantVisual(cell, gridLevels[t.activeIndex] ?? 1) : null
      const spriteRect = cell && visual
        ? getPlantSpriteRect(
            t.x,
            t.y,
            TILE_WIDTH,
            TILE_HEIGHT,
            PLANT_IMAGE_WIDTH,
            getPlantSpriteProfile(cell, gridLevels[t.activeIndex] ?? 1),
          )
        : null
      return {
        key: t.activeIndex,
        road,
        outer,
        inner,
        x: t.x,
        y: t.y,
        cx: t.x + TILE_WIDTH / 2,
        cy: t.y + TILE_HEIGHT / 2,
        occupied: !!cell,
        sprite: visual && spriteRect ? {
          source: visual.source,
          x: spriteRect.x,
          y: spriteRect.y,
          size: spriteRect.size,
        } : null,
      }
    })
  }, [placed, grid, gridLevels])

  // ── Pan / zoom shared values (UI thread) ──────────────────────────────────
  const focusWorldX = (playableMinX + playableMaxX) / 2
  const focusWorldY = (playableMinY + playableMaxY) / 2
  const initialXBounds = getWorldCameraAxisBounds(vpWidth, mapWidth, FACTORY_INITIAL_SCALE)
  const initialYBounds = getWorldCameraAxisBounds(vpHeight, mapHeight, FACTORY_INITIAL_SCALE)
  const initialX = clampCameraValue(
    vpWidth / 2 - focusWorldX * FACTORY_INITIAL_SCALE,
    initialXBounds.min,
    initialXBounds.max,
  )
  const initialY = clampCameraValue(
    vpHeight * BUILD_ZONE_FOCUS_Y - focusWorldY * FACTORY_INITIAL_SCALE,
    initialYBounds.min,
    initialYBounds.max,
  )
  const tx = useSharedValue(initialX)
  const ty = useSharedValue(initialY)
  const scale = useSharedValue(FACTORY_INITIAL_SCALE)
  const savedX = useSharedValue(0)
  const savedY = useSharedValue(0)
  const savedScale = useSharedValue(FACTORY_INITIAL_SCALE)

  // Recenter deterministically when the viewport or playable grid changes.
  // Shared-value initializers only run on mount, so without this an expansion
  // or orientation change keeps offsets that belong to the previous layout.
  useEffect(() => {
    scale.value = FACTORY_INITIAL_SCALE
    savedScale.value = FACTORY_INITIAL_SCALE
    tx.value = initialX
    ty.value = initialY
    savedX.value = initialX
    savedY.value = initialY
  }, [cameraResetKey, initialX, initialY, savedScale, savedX, savedY, scale, tx, ty])

  const translateTransform = useDerivedValue(() => {
    if (panOutX) panOutX.value = tx.value - initialX
    if (panOutY) panOutY.value = ty.value - initialY
    if (zoomOut) zoomOut.value = scale.value
    return [{ translateX: tx.value }, { translateY: ty.value }]
  })
  const zoomTransform = useDerivedValue(() => [{ scale: scale.value }])

  const boundX = (v: number, s: number) => {
    'worklet'
    const bounds = getWorldCameraAxisBounds(vpWidth, mapWidth, s)
    return clampCameraValue(v, bounds.min, bounds.max)
  }
  const boundY = (v: number, s: number) => {
    'worklet'
    const bounds = getWorldCameraAxisBounds(vpHeight, mapHeight, s)
    return clampCameraValue(v, bounds.min, bounds.max)
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
      const next = clampCameraValue(savedScale.value * e.scale, FACTORY_MIN_SCALE, FACTORY_MAX_SCALE)
      const ratio = next / savedScale.value
      // Keep the pinch focal point pinned under the fingers.
      tx.value = boundX(e.focalX - (e.focalX - savedX.value) * ratio, next)
      ty.value = boundY(e.focalY - (e.focalY - savedY.value) * ratio, next)
      scale.value = next
    })

  const pickCell = (
    px: number,
    py: number,
    cameraX: number,
    cameraY: number,
    cameraScale: number,
  ) => {
    const worldPoint = screenPointToWorld(px, py, cameraX, cameraY, cameraScale)
    const hw = TILE_WIDTH / 2
    const hh = TILE_HEIGHT / 2
    // Front-most first (reverse diagonal order) so overlapping picks the top tile.
    for (let i = ground.length - 1; i >= 0; i--) {
      const g = ground[i]
      if (!showPlacementGrid && !g.occupied) continue
      if (Math.abs(worldPoint.x - g.cx) / hw + Math.abs(worldPoint.y - g.cy) / hh <= 1) {
        onCellPress?.(g.key)
        return
      }
    }
  }

  const tap = Gesture.Tap()
    .maxDistance(14)
    .onEnd((e) => {
      'worklet'
      runOnJS(pickCell)(e.x, e.y, tx.value, ty.value, scale.value)
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
              {backgroundImage ? (
                <SkiaImage
                  image={backgroundImage}
                  x={0}
                  y={0}
                  width={mapWidth}
                  height={mapHeight}
                  fit="cover"
                  sampling={PIXEL_SAMPLING}
                />
              ) : null}
              {/* ground: outer + inset diamonds */}
              {ground.map((g) => (showPlacementGrid ? (
                <Group key={`gnd-${g.key}`}>
                  <Path path={g.road} color="#334148" />
                  <Path path={g.road} color="#1B262C" style="stroke" strokeWidth={2} />
                  <Path path={g.outer} color={g.occupied ? '#56636B' : '#495760'} />
                  <Path
                    path={g.outer}
                    color={g.key === selectedCellIndex ? '#63DF79' : '#172A38'}
                    style="stroke"
                    strokeWidth={g.key === selectedCellIndex ? 3.6 : 2.4}
                  />
                  <Path path={g.inner} color={g.occupied ? '#A89470' : '#BDAA82'} />
                  <Path path={g.inner} color={g.occupied ? '#D7B83C' : '#7B6A50'} style="stroke" strokeWidth={1.4} />
                  {!g.occupied ? (
                    <>
                      <Rect x={g.cx - 10} y={g.cy - 2} width={20} height={4} color="#746248" />
                      <Rect x={g.cx - 2} y={g.cy - 10} width={4} height={20} color="#746248" />
                      <Rect x={g.cx - 8} y={g.y + 6} width={16} height={3} color="#F0B936" />
                      <Rect x={g.cx - 8} y={g.y + TILE_HEIGHT - 9} width={16} height={3} color="#F0B936" />
                    </>
                  ) : null}
                </Group>
              ) : null))}
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
