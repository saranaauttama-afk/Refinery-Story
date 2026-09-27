import { memo, useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import type { ImageSourcePropType } from 'react-native'

import {
  Canvas,
  FilterMode,
  Group,
  MipmapMode,
  Oval,
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
  BUILD_ZONE_FOCUS_Y,
} from '../config/factoryScene'
import {
  FACTORY_MAP_SLOTS,
  FACTORY_MAX_GRID_SIZE,
  FACTORY_MICRO_TILE_HEIGHT,
  FACTORY_MICRO_TILE_WIDTH,
  FACTORY_PLANNED_GRID_SIZE,
  FACTORY_WORLD_HEIGHT,
  FACTORY_WORLD_WIDTH,
  getActiveGridIndex,
  getFactoryTerrainTiles,
  pointIsInsideFactorySlot,
} from '../factoryMap'
import { getPlantSpriteProfile, getPlantSpriteRect } from '../factoryPlantLayout'
import { STARTER_PLANT_ART_BY_LEVEL } from '../starterPlantArt'
import {
  FACTORY_INITIAL_SCALE,
  FACTORY_MAX_SCALE,
  FACTORY_MIN_SCALE,
  clampCameraValue,
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

const PLANT_IMAGE_WIDTH = FACTORY_MICRO_TILE_WIDTH * 2

const PIXEL_SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const

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

function segmentPath(x1: number, y1: number, x2: number, y2: number): SkPath {
  const p = Skia.Path.Make()
  p.moveTo(x1, y1)
  p.lineTo(x2, y2)
  return p
}

type RoadEdge = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft'

function roadEdgePath(x: number, y: number, edge: RoadEdge): SkPath {
  const w = FACTORY_MICRO_TILE_WIDTH
  const h = FACTORY_MICRO_TILE_HEIGHT
  const points: Record<RoadEdge, [number, number, number, number]> = {
    topLeft: [x + w / 2, y, x, y + h / 2],
    topRight: [x + w / 2, y, x + w, y + h / 2],
    bottomRight: [x + w, y + h / 2, x + w / 2, y + h],
    bottomLeft: [x + w / 2, y + h, x, y + h / 2],
  }
  return segmentPath(...points[edge])
}

function roadDashPath(
  x: number,
  y: number,
  axis: 'row' | 'col',
): SkPath {
  const cx = x + FACTORY_MICRO_TILE_WIDTH / 2
  const cy = y + FACTORY_MICRO_TILE_HEIGHT / 2
  const dx = 9
  const dy = 4.5
  return axis === 'row'
    ? segmentPath(cx - dx, cy - dy, cx + dx, cy + dy)
    : segmentPath(cx + dx, cy - dy, cx - dx, cy + dy)
}

const PLANT_IMAGE_BY_BUILDING: Partial<Record<BuildingType, Record<number, DataSourceParam>>> = {
  distillationUnit: STARTER_PLANT_ART_BY_LEVEL.distillationUnit as Record<number, DataSourceParam>,
  crudeTank: STARTER_PLANT_ART_BY_LEVEL.crudeTank as Record<number, DataSourceParam>,
  gasolineTank: STARTER_PLANT_ART_BY_LEVEL.gasolineTank as Record<number, DataSourceParam>,
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
  contentOffsetY: _contentOffsetY = 0,
  displayGridSize: _displayGridSize,
  anchorGridSize: _anchorGridSize,
  onCellPress,
  selectedCellIndex = null,
  showPlacementGrid = false,
  panOutX,
  panOutY,
  zoomOut,
  cameraResetKey = 0,
}: FactorySkiaViewProps) {
  const backgroundImage = useImage(backgroundSource as DataSourceParam)

  // The yard owns one permanent 5x5 set of world-space slots. Expansion only
  // changes which slots map to the compact gameplay array; it never moves the
  // road, pad, building contact point, or camera world beneath them.
  const layout = useMemo(() => {
    const activeGridSize = Math.min(
      FACTORY_MAX_GRID_SIZE,
      Math.round(Math.sqrt(grid.length)),
    )
    const displayGridSize = Math.max(FACTORY_PLANNED_GRID_SIZE, activeGridSize)
    const slots = FACTORY_MAP_SLOTS
      .filter((slot) => slot.row < displayGridSize && slot.col < displayGridSize)
      .map((slot) => ({
        ...slot,
        activeIndex: getActiveGridIndex(slot, activeGridSize),
      }))
    const activeSlots = slots.filter((slot) => slot.activeIndex !== null)
    const activeMinX = Math.min(...activeSlots.map((slot) => slot.centerX - slot.width / 2))
    const activeMaxX = Math.max(...activeSlots.map((slot) => slot.centerX + slot.width / 2))
    const activeMinY = Math.min(...activeSlots.map((slot) => slot.topY))
    const activeMaxY = Math.max(...activeSlots.map((slot) => slot.topY + slot.height))
    const vpWidth = containerWidth
    const vpHeight = viewportHeight
    return {
      slots,
      displayGridSize,
      mapWidth: FACTORY_WORLD_WIDTH,
      mapHeight: FACTORY_WORLD_HEIGHT,
      vpWidth,
      vpHeight,
      playableMinX: activeMinX,
      playableMaxX: activeMaxX,
      playableMinY: activeMinY,
      playableMaxY: activeMaxY,
    }
  }, [grid.length, containerWidth, viewportHeight])

  const {
    slots,
    displayGridSize,
    mapWidth,
    mapHeight,
    vpWidth,
    vpHeight,
    playableMinX,
    playableMaxX,
    playableMinY,
    playableMaxY,
  } = layout

  const terrain = useMemo(() => {
    const tiles = getFactoryTerrainTiles(displayGridSize)
    const byPosition = new Map(tiles.map((tile) => [`${tile.row}:${tile.col}`, tile]))
    return tiles.map((tile) => {
      const curbs: SkPath[] = []
      if (tile.kind === 'road') {
        const neighbours: Array<[number, number, RoadEdge]> = [
          [tile.row, tile.col - 1, 'topLeft'],
          [tile.row - 1, tile.col, 'topRight'],
          [tile.row, tile.col + 1, 'bottomRight'],
          [tile.row + 1, tile.col, 'bottomLeft'],
        ]
        for (const [row, col, edge] of neighbours) {
          if (byPosition.get(`${row}:${col}`)?.kind === 'lot') {
            curbs.push(roadEdgePath(tile.x, tile.y, edge))
          }
        }
      }
      const isIntersection = tile.roadAlongRow && tile.roadAlongCol
      return {
        ...tile,
        path: diamondPath(
          tile.x,
          tile.y,
          FACTORY_MICRO_TILE_WIDTH,
          FACTORY_MICRO_TILE_HEIGHT,
        ),
        curbs,
        dash: isIntersection || tile.kind !== 'road'
          ? null
          : roadDashPath(tile.x, tile.y, tile.roadAlongRow ? 'row' : 'col'),
      }
    })
  }, [displayGridSize])

  // Dynamic plant/socket layer. Terrain and service roads above are immutable.
  const ground = useMemo(() => {
    return slots.map((slot) => {
      const activeIndex = slot.activeIndex
      const cell = activeIndex === null ? null : grid[activeIndex]
      const lotX = slot.centerX - slot.width / 2
      const lotY = slot.topY
      const outer = diamondPath(lotX, lotY, slot.width, slot.height)
      const visual = cell && activeIndex !== null
        ? plantVisual(cell, gridLevels[activeIndex] ?? 1)
        : null
      const spriteRect = cell && visual
        ? getPlantSpriteRect(
            lotX,
            lotY,
            slot.width,
            slot.height,
            PLANT_IMAGE_WIDTH,
            getPlantSpriteProfile(cell, gridLevels[activeIndex as number] ?? 1),
          )
        : null
      return {
        key: slot.id,
        slot,
        activeIndex,
        outer,
        x: lotX,
        y: lotY,
        cx: slot.centerX,
        cy: slot.centerY,
        occupied: !!cell,
        locked: activeIndex === null,
        sprite: visual && spriteRect ? {
          source: visual.source,
          x: spriteRect.x,
          y: spriteRect.y,
          size: spriteRect.size,
          footX: spriteRect.footX,
          footY: spriteRect.footY,
        } : null,
      }
    })
  }, [slots, grid, gridLevels])

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
    // A plant is much taller than its ground diamond. Test visible sprite bounds
    // first so tapping the tank/tower opens that plant instead of the empty lot
    // geometrically behind it.
    for (let i = ground.length - 1; i >= 0; i--) {
      const g = ground[i]
      if (!g.occupied || !g.sprite) continue
      if (
        worldPoint.x >= g.sprite.x &&
        worldPoint.x <= g.sprite.x + g.sprite.size &&
        worldPoint.y >= g.sprite.y &&
        worldPoint.y <= g.sprite.y + g.sprite.size
      ) {
        if (g.activeIndex !== null) onCellPress?.(g.activeIndex)
        return
      }
    }
    // Then test the build lots, front-most first (reverse diagonal order).
    for (let i = ground.length - 1; i >= 0; i--) {
      const g = ground[i]
      if (g.locked || g.activeIndex === null) continue
      if (!showPlacementGrid && !g.occupied) continue
      if (pointIsInsideFactorySlot(worldPoint.x, worldPoint.y, g.slot)) {
        onCellPress?.(g.activeIndex)
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
              {/* Continuous yard: warm concrete lots are separated by actual
                  asphalt service roads. Curbs are drawn only where asphalt
                  meets a plant lot; dashed centre lines skip intersections. */}
              {terrain.map((tile) => (
                <Group key={`terrain-${tile.row}-${tile.col}`}>
                  <Path
                    path={tile.path}
                    color={tile.kind === 'road' ? '#555A5C' : 'rgba(214, 190, 150, 0.82)'}
                  />
                  <Path
                    path={tile.path}
                    color={tile.kind === 'road' ? 'rgba(40, 44, 46, 0.42)' : 'rgba(112, 91, 62, 0.20)'}
                    style="stroke"
                    strokeWidth={tile.kind === 'road' ? 0.8 : 0.65}
                  />
                </Group>
              ))}
              {/* Road furniture must render after every ground tile; drawing
                  it inside the terrain loop lets a later concrete tile cover
                  half of the shared curb. */}
              {terrain.map((tile) => (
                <Group key={`road-detail-${tile.row}-${tile.col}`}>
                  {tile.curbs.map((curb, index) => (
                    <Group key={`curb-${index}`}>
                      <Path path={curb} color="#373D40" style="stroke" strokeWidth={4.4} />
                      <Path path={curb} color="#D2C39F" style="stroke" strokeWidth={2.2} />
                    </Group>
                  ))}
                  {tile.dash ? (
                    <Path
                      path={tile.dash}
                      color="#E9D8A6"
                      style="stroke"
                      strokeWidth={1.8}
                    />
                  ) : null}
                </Group>
              ))}
              {/* Build guides exist only while the hammer mode is active. The
                  normal factory view uses the painted concrete yard directly. */}
              {ground.map((g) => (showPlacementGrid ? (
                <Group key={`gnd-${g.key}`}>
                  <Path
                    path={g.outer}
                    color={g.locked
                      ? 'rgba(72, 68, 59, 0.24)'
                      : g.occupied
                        ? 'rgba(43, 76, 82, 0.12)'
                        : 'rgba(255, 221, 105, 0.16)'}
                  />
                  <Path
                    path={g.outer}
                    color={g.locked
                      ? 'rgba(86, 82, 72, 0.46)'
                      : g.activeIndex === selectedCellIndex
                        ? '#63DF79'
                        : 'rgba(232, 192, 67, 0.78)'}
                    style="stroke"
                    strokeWidth={g.activeIndex === selectedCellIndex ? 3.6 : 2.4}
                  />
                  {!g.locked && !g.occupied ? (
                    <>
                      <Rect x={g.cx - 10} y={g.cy - 2} width={20} height={4} color="#756A55" />
                      <Rect x={g.cx - 2} y={g.cy - 10} width={4} height={20} color="#756A55" />
                    </>
                  ) : null}
                </Group>
              ) : null))}
              {/* A soft contact shadow anchors each sprite to the painted
                  concrete. Its centre uses the same foot point as the sprite. */}
              {ground.map((g) => (g.sprite ? (
                <Oval
                  key={`shadow-${g.key}`}
                  x={g.sprite.footX - g.slot.width * 0.24}
                  y={g.sprite.footY - g.slot.height * 0.10}
                  width={g.slot.width * 0.48}
                  height={g.slot.height * 0.20}
                  color="rgba(20, 28, 31, 0.30)"
                />
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
