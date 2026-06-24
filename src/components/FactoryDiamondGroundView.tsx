import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'

import { BUILDING_CATEGORY_ACCENT, BUILDING_CATEGORY_BY_TYPE, BUILDING_CATEGORY_SURFACE } from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { BuildingType, DerivedStats, GameState, GridCell } from '../game/types'
import { colors, radii } from '../theme'

const TILE_SCALE = 1.5
const TILE_WIDTH = 84 * TILE_SCALE
const TILE_HEIGHT = 42 * TILE_SCALE
const SIDE_PADDING = 18 * TILE_SCALE
const TOP_PADDING = 18 * TILE_SCALE
const MIN_VIEWPORT_HEIGHT = 220 * TILE_SCALE
const EMPTY_INSET_X = 14 * TILE_SCALE
const EMPTY_INSET_Y = 8 * TILE_SCALE
const OCCUPIED_INSET_X = 12 * TILE_SCALE
const OCCUPIED_INSET_Y = 7 * TILE_SCALE
const DISABLED_INSET_X = 14 * TILE_SCALE
const DISABLED_INSET_Y = 8 * TILE_SCALE
const PLUS_FONT_SIZE = 16 * TILE_SCALE
const CODE_FONT_SIZE = 12 * TILE_SCALE
const CODE_LETTER_SPACING = 0.4 * TILE_SCALE
const LEVEL_BADGE_TOP = -4 * TILE_SCALE
const LEVEL_BADGE_RIGHT = 6 * TILE_SCALE
const LEVEL_BADGE_MIN_WIDTH = 24 * TILE_SCALE
const LEVEL_BADGE_PADDING_X = 5 * TILE_SCALE
const LEVEL_BADGE_PADDING_Y = 2 * TILE_SCALE
const LEVEL_FONT_SIZE = 8 * TILE_SCALE
const DEBUG_FONT_SIZE = 7 * TILE_SCALE
const TOP_CUT_DIAGONALS = 4
const ACTIVE_ROW_BIAS = 0
const ACTIVE_COL_BIAS = 0
const PLANT_IMAGE_WIDTH = TILE_WIDTH

type PlantImageSpec = {
  source: ImageSourcePropType
  aspectRatio: number
}

const SQUARE_PLANT_ASPECT_RATIO = 1

const PLANT_IMAGE_BY_BUILDING: Partial<Record<BuildingType, Record<number, PlantImageSpec>>> = {
  distillationUnit: {
    1: { source: require('../../assets/plants/distillation_unit_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/distillation_unit_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/distillation_unit_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  crudeTank: {
    1: { source: require('../../assets/plants/crude_tank_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/crude_tank_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/crude_tank_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  productTank: {
    1: { source: require('../../assets/plants/product_tank_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/product_tank_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/product_tank_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  laboratory: {
    1: { source: require('../../assets/plants/laboratory_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/laboratory_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/laboratory_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  maintenanceWorkshop: {
    1: { source: require('../../assets/plants/maintenance_workshop_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/maintenance_workshop_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/maintenance_workshop_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  salesOffice: {
    1: { source: require('../../assets/plants/sales_office_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/sales_office_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/sales_office_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  lubricantPlant: {
    1: { source: require('../../assets/plants/lubricant_plant_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/lubricant_plant_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/lubricant_plant_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  jetFuelPlant: {
    1: { source: require('../../assets/plants/jet_fuel_plant_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/jet_fuel_plant_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/jet_fuel_plant_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  petrochemicalPlant: {
    1: { source: require('../../assets/plants/petrochemical_plant_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/petrochemical_plant_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/petrochemical_plant_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  powerPlant: {
    1: { source: require('../../assets/plants/power_plant_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/power_plant_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/power_plant_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  wasteTreatmentPlant: {
    1: { source: require('../../assets/plants/waste_treatment_plant_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/waste_treatment_plant_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/waste_treatment_plant_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  polymerPlant: {
    1: { source: require('../../assets/plants/polymer_plant_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/polymer_plant_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/polymer_plant_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  lubricantTank: {
    1: { source: require('../../assets/plants/lubricant_tank_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/lubricant_tank_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/lubricant_tank_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  jetFuelTank: {
    1: { source: require('../../assets/plants/jet_fuel_tank_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/jet_fuel_tank_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/jet_fuel_tank_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  petrochemicalTank: {
    1: { source: require('../../assets/plants/petrochemical_tank_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/petrochemical_tank_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/petrochemical_tank_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  recyclingBunker: {
    1: { source: require('../../assets/plants/recycling_bunker_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/recycling_bunker_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/recycling_bunker_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
  pelletSilo: {
    1: { source: require('../../assets/plants/pellet_silo_lv1.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    2: { source: require('../../assets/plants/pellet_silo_lv2.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
    3: { source: require('../../assets/plants/pellet_silo_lv3.png'), aspectRatio: SQUARE_PLANT_ASPECT_RATIO },
  },
}

function getPlantImageSpec(cell: GridCell, level: number): PlantImageSpec | null {
  if (!cell) return null
  const imagesByLevel = PLANT_IMAGE_BY_BUILDING[cell]
  if (!imagesByLevel) return null
  return imagesByLevel[Math.max(1, Math.min(3, level))] ?? null
}

type FactoryDiamondGroundViewProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  displayGridSize?: number
  anchorGridSize?: number
  onCellPress?: (index: number) => void
  isActive?: boolean
}

function diamondPoints(x: number, y: number, width: number, height: number) {
  const halfWidth = width / 2
  const halfHeight = height / 2
  return `${x + halfWidth},${y} ${x + width},${y + halfHeight} ${x + halfWidth},${y + height} ${x},${y + halfHeight}`
}

function insetDiamondPoints(x: number, y: number, width: number, height: number, insetX: number, insetY: number) {
  return diamondPoints(
    x + insetX,
    y + insetY,
    Math.max(12, width - insetX * 2),
    Math.max(8, height - insetY * 2),
  )
}

function isoX(row: number, col: number, rows: number) {
  return (col - row + rows - 1) * (TILE_WIDTH / 2) + SIDE_PADDING
}

function isoY(row: number, col: number) {
  return (row + col) * (TILE_HEIGHT / 2) + TOP_PADDING
}

function FactoryDiamondGroundView({
  grid,
  gridLevels,
  containerWidth,
  displayGridSize,
  anchorGridSize,
  onCellPress,
}: FactoryDiamondGroundViewProps) {
  const activeCols = Math.round(Math.sqrt(grid.length))
  const activeRows = activeCols
  const displayCols = Math.max(displayGridSize ?? activeCols, activeCols)
  const displayRows = displayCols
  const anchorCols = Math.min(anchorGridSize ?? activeCols, displayCols)
  const anchorRows = anchorCols
  const anchoredRowOffset = Math.floor((displayRows - anchorRows) / 2)
  const activeRowOffset = Math.max(0, anchoredRowOffset - ACTIVE_ROW_BIAS)
  const anchoredColOffset = Math.floor((displayCols - anchorCols) / 2)
  const activeColOffset = Math.max(0, anchoredColOffset - ACTIVE_COL_BIAS)
  const tileLayouts = Array.from({ length: displayCols * displayRows }, (_, displayIndex) => {
    const row = Math.floor(displayIndex / displayCols)
    const col = displayIndex % displayCols
    const x = isoX(row, col, displayRows)
    const y = isoY(row, col)
    const withinActiveRows = row >= activeRowOffset && row < activeRowOffset + activeRows
    const withinActiveCols = col >= activeColOffset && col < activeColOffset + activeCols
    const activeIndex =
      withinActiveRows && withinActiveCols
        ? (row - activeRowOffset) * activeCols + (col - activeColOffset)
        : null

    return {
      displayIndex,
      row,
      col,
      diagonal: row + col,
      x,
      y,
      right: x + TILE_WIDTH,
      bottom: y + TILE_HEIGHT,
      activeIndex,
    }
  })
  const visibleTiles = tileLayouts.filter((tile) => tile.diagonal >= TOP_CUT_DIAGONALS)
  const minX = Math.min(...visibleTiles.map((tile) => tile.x))
  const maxX = Math.max(...visibleTiles.map((tile) => tile.right))
  const minY = Math.min(...visibleTiles.map((tile) => tile.y))
  const maxY = Math.max(...visibleTiles.map((tile) => tile.bottom))
  const worldWidth = maxX - minX
  const worldHeight = maxY - minY
  const mapWidth = Math.max(containerWidth, worldWidth + SIDE_PADDING * 2)
  const mapHeight = Math.max(MIN_VIEWPORT_HEIGHT, worldHeight + TOP_PADDING * 2)
  const offsetX = (mapWidth - worldWidth) / 2 - minX
  const offsetY = (mapHeight - worldHeight) / 2 - minY

  return (
    <View style={[styles.map, { width: mapWidth, height: mapHeight }]}>
      {visibleTiles.map((tile) => {
        const activeIndex = tile.activeIndex
        const isDisabled = activeIndex === null
        const cell = activeIndex === null ? null : grid[activeIndex]
        const debugLabel = `${tile.row + 1},${tile.col + 1}`
        const x = tile.x + offsetX
        const y = tile.y + offsetY
        const zIndex = 10 + tile.row + tile.col

        if (isDisabled) {
          return (
            <View key={`disabled-${tile.displayIndex}`} style={[styles.cell, { left: x, top: y, zIndex }]}>
              <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
                <Polygon
                  points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)}
                  fill="rgba(225, 215, 192, 0.36)"
                  stroke="rgba(145, 126, 93, 0.18)"
                  strokeWidth={1}
                />
                <Polygon
                  points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, DISABLED_INSET_X, DISABLED_INSET_Y)}
                  fill="rgba(245, 239, 227, 0.22)"
                  stroke="rgba(148, 128, 95, 0.12)"
                  strokeWidth={0.8}
                />
              </Svg>
              <Text style={styles.debugLabelDisabled}>{debugLabel}</Text>
            </View>
          )
        }

        if (!cell) {
          return (
            <Pressable
              key={activeIndex}
              onPress={() => onCellPress?.(activeIndex)}
              style={[styles.cell, { left: x, top: y, zIndex }]}
            >
              <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
                <Polygon points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)} fill="#D9CCB1" stroke="#9C8764" strokeWidth={1.2} />
                <Polygon
                  points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, EMPTY_INSET_X, EMPTY_INSET_Y)}
                  fill="#EEE5D3"
                  stroke="rgba(148, 128, 95, 0.24)"
                  strokeWidth={1}
                />
              </Svg>
              <Text style={styles.plusLabel}>+</Text>
              <Text style={styles.debugLabel}>{debugLabel}</Text>
            </Pressable>
          )
        }

        const category = BUILDING_CATEGORY_BY_TYPE[cell]
        const accentColor = BUILDING_CATEGORY_ACCENT[category]
        const surfaceColor = BUILDING_CATEGORY_SURFACE[category]
        const code = BUILDINGS[cell].shortName
        const level = gridLevels[activeIndex] ?? 1
        const plantImage = getPlantImageSpec(cell, level)
        const plantImageHeight = plantImage ? PLANT_IMAGE_WIDTH / plantImage.aspectRatio : 0

        return (
          <Pressable
            key={activeIndex}
            onPress={() => onCellPress?.(activeIndex)}
            style={[styles.cell, { left: x, top: y, zIndex }]}
          >
            {plantImage ? (
              <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
                <Polygon points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)} fill="#D9CCB1" stroke="#9C8764" strokeWidth={1.2} />
                <Polygon
                  points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, EMPTY_INSET_X, EMPTY_INSET_Y)}
                  fill="rgba(238, 229, 211, 0.18)"
                  stroke="rgba(148, 128, 95, 0.16)"
                  strokeWidth={1}
                />
              </Svg>
            ) : (
              <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
                <Polygon points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)} fill="#D4C19F" stroke="#8E7855" strokeWidth={1.25} />
                <Polygon
                  points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, OCCUPIED_INSET_X, OCCUPIED_INSET_Y)}
                  fill={surfaceColor}
                  stroke={accentColor}
                  strokeWidth={1.1}
                />
              </Svg>
            )}
            {plantImage ? (
              <Image source={plantImage.source} style={[styles.plantImage, { height: plantImageHeight }]} resizeMode="contain" />
            ) : (
              <Text style={[styles.codeLabel, { color: accentColor }]}>{code}</Text>
            )}
            {!plantImage ? <Text style={styles.debugLabel}>{debugLabel}</Text> : null}
            {!plantImage ? (
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>L{level}</Text>
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  map: {
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLabel: {
    position: 'absolute',
    color: 'rgba(86, 71, 50, 0.62)',
    fontSize: PLUS_FONT_SIZE,
    fontWeight: '700',
  },
  codeLabel: {
    position: 'absolute',
    fontSize: CODE_FONT_SIZE,
    fontWeight: '900',
    letterSpacing: CODE_LETTER_SPACING,
  },
  debugLabel: {
    position: 'absolute',
    bottom: 8 * TILE_SCALE,
    left: 10 * TILE_SCALE,
    color: 'rgba(86, 71, 50, 0.72)',
    fontSize: DEBUG_FONT_SIZE,
    fontWeight: '700',
  },
  debugLabelDisabled: {
    position: 'absolute',
    bottom: 8 * TILE_SCALE,
    left: 10 * TILE_SCALE,
    color: 'rgba(110, 95, 72, 0.34)',
    fontSize: DEBUG_FONT_SIZE,
    fontWeight: '700',
  },
  plantImage: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: PLANT_IMAGE_WIDTH,
  },
  levelBadge: {
    position: 'absolute',
    top: LEVEL_BADGE_TOP,
    right: LEVEL_BADGE_RIGHT,
    minWidth: LEVEL_BADGE_MIN_WIDTH,
    borderRadius: radii.pill,
    paddingHorizontal: LEVEL_BADGE_PADDING_X,
    paddingVertical: LEVEL_BADGE_PADDING_Y,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  levelText: {
    color: colors.white,
    fontSize: LEVEL_FONT_SIZE,
    fontWeight: '800',
  },
})

export default FactoryDiamondGroundView
