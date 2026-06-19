import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Line, Polygon } from 'react-native-svg'

import { BUILDING_CATEGORY_ACCENT, BUILDING_CATEGORY_BY_TYPE, BUILDING_CATEGORY_SURFACE } from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { DerivedStats, GameState, GridCell } from '../game/types'
import { colors, radii } from '../theme'

const TILE_WIDTH = 84
const TILE_HEIGHT = 42
const SIDE_PADDING = 18
const TOP_PADDING = 18
const FOOTER_SPACE = 18

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

function getWorldMetrics(rows: number, cols: number) {
  return {
    mapWidth: (rows + cols) * (TILE_WIDTH / 2) + SIDE_PADDING * 2,
    mapHeight: TOP_PADDING + (rows + cols - 2) * (TILE_HEIGHT / 2) + TILE_HEIGHT + FOOTER_SPACE,
  }
}

function FactoryDiamondGroundView({
  grid,
  gridLevels,
  onCellPress,
}: FactoryDiamondGroundViewProps) {
  const cols = Math.round(Math.sqrt(grid.length))
  const rows = cols
  const { mapWidth, mapHeight } = getWorldMetrics(rows, cols)
  const planeTopX = isoX(0, 0, rows) + TILE_WIDTH / 2
  const planeTopY = TOP_PADDING
  const planeRightX = isoX(0, cols - 1, rows) + TILE_WIDTH
  const planeRightY = isoY(0, cols - 1) + TILE_HEIGHT / 2
  const planeBottomX = isoX(rows - 1, cols - 1, rows) + TILE_WIDTH / 2
  const planeBottomY = isoY(rows - 1, cols - 1) + TILE_HEIGHT
  const planeLeftX = isoX(rows - 1, 0, rows)
  const planeLeftY = isoY(rows - 1, 0) + TILE_HEIGHT / 2

  const guideLines: { x1: number; y1: number; x2: number; y2: number }[] = []
  for (let row = 0; row <= rows; row += 1) {
    guideLines.push({
      x1: isoX(row, 0, rows),
      y1: isoY(row, 0),
      x2: isoX(row, cols, rows),
      y2: isoY(row, cols),
    })
  }
  for (let col = 0; col <= cols; col += 1) {
    guideLines.push({
      x1: isoX(0, col, rows),
      y1: isoY(0, col),
      x2: isoX(rows, col, rows),
      y2: isoY(rows, col),
    })
  }

  return (
    <View style={[styles.map, { width: mapWidth, height: mapHeight }]}>
      <Svg width={mapWidth} height={mapHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Polygon
          points={`${planeTopX},${planeTopY} ${planeRightX},${planeRightY} ${planeBottomX},${planeBottomY} ${planeLeftX},${planeLeftY}`}
          fill="#D7C39D"
          stroke="#A48A62"
          strokeWidth={1.8}
        />
        {guideLines.map((line, index) => (
          <Line
            key={`guide-${index}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(120, 102, 74, 0.16)"
            strokeWidth={1}
          />
        ))}
      </Svg>

      {grid.map((cell, index) => {
        const row = Math.floor(index / cols)
        const col = index % cols
        const x = isoX(row, col, rows)
        const y = isoY(row, col)
        const zIndex = 10 + row + col

        if (!cell) {
          return (
            <Pressable
              key={index}
              onPress={() => onCellPress?.(index)}
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
            key={index}
            onPress={() => onCellPress?.(index)}
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
              <Text style={styles.levelText}>L{gridLevels[index] ?? 1}</Text>
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
