import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'

import { BUILDING_CATEGORY_ACCENT, BUILDING_CATEGORY_BY_TYPE, BUILDING_CATEGORY_SURFACE } from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { DerivedStats, GameState, GridCell } from '../game/types'
import { colors, radii } from '../theme'

const TILE_SCALE = 2
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

type FactoryDiamondGroundViewProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  displayGridSize?: number
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
  onCellPress,
}: FactoryDiamondGroundViewProps) {
  const activeCols = Math.round(Math.sqrt(grid.length))
  const activeRows = activeCols
  const displayCols = Math.max(displayGridSize ?? activeCols, activeCols)
  const displayRows = displayCols
  const activeRowOffset = Math.floor((displayRows - activeRows) / 2)
  const activeColOffset = Math.floor((displayCols - activeCols) / 2)
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
      x,
      y,
      right: x + TILE_WIDTH,
      bottom: y + TILE_HEIGHT,
      activeIndex,
    }
  })
  const minX = Math.min(...tileLayouts.map((tile) => tile.x))
  const maxX = Math.max(...tileLayouts.map((tile) => tile.right))
  const minY = Math.min(...tileLayouts.map((tile) => tile.y))
  const maxY = Math.max(...tileLayouts.map((tile) => tile.bottom))
  const worldWidth = maxX - minX
  const worldHeight = maxY - minY
  const mapWidth = Math.max(containerWidth, worldWidth + SIDE_PADDING * 2)
  const mapHeight = Math.max(MIN_VIEWPORT_HEIGHT, worldHeight + TOP_PADDING * 2)
  const offsetX = (mapWidth - worldWidth) / 2 - minX
  const offsetY = (mapHeight - worldHeight) / 2 - minY

  return (
    <View style={[styles.map, { width: mapWidth, height: mapHeight }]}>
      {tileLayouts.map((tile) => {
        const activeIndex = tile.activeIndex
        const isDisabled = activeIndex === null
        const cell = activeIndex === null ? null : grid[activeIndex]
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
            </Pressable>
          )
        }

        const category = BUILDING_CATEGORY_BY_TYPE[cell]
        const accentColor = BUILDING_CATEGORY_ACCENT[category]
        const surfaceColor = BUILDING_CATEGORY_SURFACE[category]
        const code = BUILDINGS[cell].shortName

        return (
          <Pressable
            key={activeIndex}
            onPress={() => onCellPress?.(activeIndex)}
            style={[styles.cell, { left: x, top: y, zIndex }]}
          >
            <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
              <Polygon points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)} fill="#D4C19F" stroke="#8E7855" strokeWidth={1.25} />
              <Polygon
                points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, OCCUPIED_INSET_X, OCCUPIED_INSET_Y)}
                fill={surfaceColor}
                stroke={accentColor}
                strokeWidth={1.1}
              />
            </Svg>
            <Text style={[styles.codeLabel, { color: accentColor }]}>{code}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>L{gridLevels[activeIndex] ?? 1}</Text>
            </View>
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
