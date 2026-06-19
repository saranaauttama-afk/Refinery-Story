import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Polygon } from 'react-native-svg'

import { BUILDING_CATEGORY_ACCENT, BUILDING_CATEGORY_BY_TYPE, BUILDING_CATEGORY_SURFACE } from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { DerivedStats, GameState, GridCell } from '../game/types'
import { colors, radii } from '../theme'

const TILE_WIDTH = 84
const TILE_HEIGHT = 42
const SIDE_PADDING = 18
const TOP_PADDING = 18
const MIN_VIEWPORT_HEIGHT = 220

type FactoryDiamondGroundViewProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
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
  onCellPress,
}: FactoryDiamondGroundViewProps) {
  const cols = Math.round(Math.sqrt(grid.length))
  const rows = cols
  const tileLayouts = grid.map((_, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = isoX(row, col, rows)
    const y = isoY(row, col)

    return {
      index,
      row,
      col,
      x,
      y,
      right: x + TILE_WIDTH,
      bottom: y + TILE_HEIGHT,
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
        const cell = grid[tile.index]
        const x = tile.x + offsetX
        const y = tile.y + offsetY
        const zIndex = 10 + tile.row + tile.col

        if (!cell) {
          return (
            <Pressable
              key={tile.index}
              onPress={() => onCellPress?.(tile.index)}
              style={[styles.cell, { left: x, top: y, zIndex }]}
            >
              <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
                <Polygon points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)} fill="#D9CCB1" stroke="#9C8764" strokeWidth={1.2} />
                <Polygon
                  points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, 14, 8)}
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
            key={tile.index}
            onPress={() => onCellPress?.(tile.index)}
            style={[styles.cell, { left: x, top: y, zIndex }]}
          >
            <Svg width={TILE_WIDTH} height={TILE_HEIGHT}>
              <Polygon points={diamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT)} fill="#D4C19F" stroke="#8E7855" strokeWidth={1.25} />
              <Polygon
                points={insetDiamondPoints(0, 0, TILE_WIDTH, TILE_HEIGHT, 12, 7)}
                fill={surfaceColor}
                stroke={accentColor}
                strokeWidth={1.1}
              />
            </Svg>
            <Text style={[styles.codeLabel, { color: accentColor }]}>{code}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>L{gridLevels[tile.index] ?? 1}</Text>
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
    fontSize: 16,
    fontWeight: '700',
  },
  codeLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  levelBadge: {
    position: 'absolute',
    top: -4,
    right: 6,
    minWidth: 24,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: colors.ink,
    alignItems: 'center',
  },
  levelText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
})

export default FactoryDiamondGroundView
