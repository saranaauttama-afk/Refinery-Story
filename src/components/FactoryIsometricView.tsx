import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Line, Polygon } from 'react-native-svg'
import {
  BUILDING_CATEGORY_ACCENT,
  BUILDING_CATEGORY_BY_TYPE,
  getTileStaffBadge,
  getTileStatusBadge,
} from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { DerivedStats, GameState, GridCell } from '../game/types'
import { colors, radii } from '../theme'

// Fixed tile dimensions -- not calculated from screen width so the map
// always looks right regardless of device. Canvas is larger than the
// screen; the player scrolls to explore. Tune these two constants to
// adjust the overall map scale.
const TILE_W = 112   // isometric tile width (ground diamond)
const TILE_H = 56    // = TILE_W / 2  (standard 2:1 isometric ratio)
const CANVAS_N = 9   // 9x9 = 81 cells total

// Building placeholder height above the ground diamond.
// Will be replaced with real art later -- for now just a flat-top
// isometric box shape drawn in SVG.
const BOX_H = 40

function isoX(row: number, col: number) {
  return (col - row) * (TILE_W / 2) + CANVAS_N * (TILE_W / 2)
}
function isoY(row: number, col: number) {
  return (col + row) * (TILE_H / 2) + BOX_H  // +BOX_H so the top tile's box fits
}

// Diamond (ground tile) polygon points, offset by (x, y)
function diamondPoints(x: number, y: number) {
  const hw = TILE_W / 2, hh = TILE_H / 2
  return `${x + hw},${y}  ${x + TILE_W},${y + hh}  ${x + hw},${y + TILE_H}  ${x},${y + hh}`
}

// Isometric box: top face (diamond) + left face + right face
function isoBoxPoints(x: number, y: number, h: number) {
  const hw = TILE_W / 2, hh = TILE_H / 2
  // Top face (diamond at y - h)
  const top = `${x + hw},${y - h}  ${x + TILE_W},${y - h + hh}  ${x + hw},${y - h + TILE_H}  ${x},${y - h + hh}`
  // Left face
  const left = `${x},${y - h + hh}  ${x + hw},${y - h + TILE_H}  ${x + hw},${y + TILE_H}  ${x},${y + hh}`
  // Right face
  const right = `${x + hw},${y - h + TILE_H}  ${x + TILE_W},${y - h + hh}  ${x + TILE_W},${y + hh}  ${x + hw},${y + TILE_H}`
  return { top, left, right }
}

type Props = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  onCellPress?: (index: number) => void
  isActive?: boolean
}

export default function FactoryIsometricView({ game, derived, grid, gridLevels, onCellPress }: Props) {
  const N = CANVAS_N
  // paddingTop reserves room for the tallest building at row=0,col=0
  // whose box extends BOX_H pixels above y=0
  const paddingTop = BOX_H
  const mapWidth  = N * TILE_W + TILE_W
  const mapHeight = N * TILE_H + BOX_H + TILE_H + paddingTop

  // Grid lines: (N+1) row-lines + (N+1) col-lines
  const lines: { x1:number; y1:number; x2:number; y2:number }[] = []
  for (let r = 0; r <= N; r++) {
    lines.push({ x1: isoX(r,0), y1: isoY(r,0), x2: isoX(r,N), y2: isoY(r,N) })
  }
  for (let c = 0; c <= N; c++) {
    lines.push({ x1: isoX(0,c), y1: isoY(0,c), x2: isoX(N,c), y2: isoY(N,c) })
  }

  // Render order: sort cells by depth (row+col) so closer ones draw on top
  const cells = Array.from({ length: N * N }, (_, i) => {
    const row = Math.floor(i / N)
    const col = i % N
    return { i, row, col, depth: row + col }
  }).sort((a, b) => a.depth - b.depth)

  return (
    <View style={[styles.yard, { width: mapWidth, height: mapHeight }]}>

      {/* Grid lines */}
      <Svg width={mapWidth} height={mapHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
        {lines.map((l, i) => (
          <Line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="#8B7355" strokeWidth={1} opacity={0.45} />
        ))}
      </Svg>

      {/* Tiles */}
      {cells.map(({ i, row, col, depth }) => {
        const x = isoX(row, col)
        const y = isoY(row, col)
        const isLocked = i >= grid.length
        const cell: GridCell = grid[i] ?? null

        if (isLocked) {
          return (
            <View key={i} style={[styles.tile, { left: x, top: y, zIndex: depth }]} pointerEvents="none">
              <Svg width={TILE_W} height={TILE_H}>
                <Polygon points={diamondPoints(0, 0)} fill="#C4B49A" opacity={0.35} />
              </Svg>
              <Text style={styles.lockIcon}>🔒</Text>
            </View>
          )
        }

        if (!cell) {
          return (
            <Pressable key={i} onPress={() => onCellPress?.(i)}
              style={[styles.tile, { left: x, top: y, zIndex: depth }]}>
              <Svg width={TILE_W} height={TILE_H}>
                <Polygon points={diamondPoints(0, 0)} fill={colors.cream} opacity={0.6} />
              </Svg>
              <Text style={styles.plusLabel}>+</Text>
            </Pressable>
          )
        }

        const category = BUILDING_CATEGORY_BY_TYPE[cell]
        const accent = BUILDING_CATEGORY_ACCENT[category]
        const config = BUILDINGS[cell]
        const staffBadge = getTileStaffBadge(game, i)
        const statusBadge = getTileStatusBadge(cell, i, game, derived)
        const box = isoBoxPoints(0, TILE_H, BOX_H)
        // Lighten/darken accent for faces
        const topFill = accent
        const leftFill = accent + 'BB'   // slightly dimmer
        const rightFill = accent + '88'  // even dimmer = shadow side

        return (
          <Pressable key={i} onPress={() => onCellPress?.(i)}
            style={[styles.tile, { left: x, top: y - BOX_H, zIndex: depth }]}>
            <Svg width={TILE_W} height={TILE_H + BOX_H}>
              {/* Right face (shadow) */}
              <Polygon points={box.right} fill={rightFill} />
              {/* Left face */}
              <Polygon points={box.left} fill={leftFill} />
              {/* Top face */}
              <Polygon points={box.top} fill={topFill} />
            </Svg>

            {/* Labels/badges overlaid on the SVG */}
            <Text style={styles.buildingLabel} numberOfLines={1}>
              {config.shortName}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>L{gridLevels[i] ?? 1}</Text>
            </View>
            {staffBadge && (
              <View style={styles.staffBadge}>
                <Text style={styles.staffBadgeText}>{staffBadge}</Text>
              </View>
            )}
            {statusBadge && (
              <View style={[styles.statusBadge,
                statusBadge.tone === 'blocked' ? styles.statusBlocked
                : statusBadge.tone === 'idle' ? styles.statusIdle
                : styles.statusWarning]}>
                <Text style={styles.statusText}>{statusBadge.label}</Text>
              </View>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  yard: {
    position: 'relative',
    backgroundColor: '#D4C4A0',
  },
  tile: {
    position: 'absolute',
    width: TILE_W,
  },
  lockIcon: {
    position: 'absolute',
    left: TILE_W / 2 - 7,
    top: TILE_H / 2 - 9,
    fontSize: 10,
    opacity: 0.4,
  },
  plusLabel: {
    position: 'absolute',
    left: TILE_W / 2 - 5,
    top: TILE_H / 2 - 9,
    fontSize: 14,
    color: '#00000030',
    fontWeight: '600',
  },
  buildingLabel: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    opacity: 0.9,
  },
  levelBadge: {
    position: 'absolute',
    top: 2,
    right: 4,
    backgroundColor: '#000000AA',
    borderRadius: radii.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  levelText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  staffBadge: {
    position: 'absolute',
    top: 2,
    left: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  staffBadgeText: { fontSize: 9 },
  statusBadge: {
    position: 'absolute',
    bottom: 18,
    left: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  statusWarning: { backgroundColor: colors.orangeDark },
  statusBlocked: { backgroundColor: colors.red },
  statusIdle: { backgroundColor: colors.steelMid },
  statusText: { color: '#fff', fontSize: 7, fontWeight: '800' },
})
