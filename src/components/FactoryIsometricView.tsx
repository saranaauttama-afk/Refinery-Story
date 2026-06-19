import { Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Line } from 'react-native-svg'
import {
  BUILDING_CATEGORY_ACCENT,
  BUILDING_CATEGORY_BY_TYPE,
  BUILDING_CATEGORY_SURFACE,
  BUILDING_TILE_ICONS,
  getTileStaffBadge,
  getTileStatusBadge,
} from '../buildingIdentity'
import { BUILDINGS } from '../game/data/buildings'
import type { BuildingType, DerivedStats, GameState, GridCell } from '../game/types'
import { colors, radii } from '../theme'
import BuildingSilhouette from './BuildingSilhouette'

const PRODUCTION_BUILDING_TYPES = new Set<BuildingType>([
  'crudeTank', 'distillationUnit', 'lubricantPlant', 'jetFuelPlant', 'petrochemicalPlant',
])

// Visual canvas is always 4x4 (16 cells) regardless of game.grid.length.
// Cells beyond game.grid.length show as locked pads (non-interactive,
// dimmed 🔒). Save format unchanged -- game.grid stays the same.
const CANVAS_COLS = 9

type FactoryIsometricViewProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  onCellPress?: (index: number) => void
  isActive?: boolean
}

// Converts grid (row, col) to isometric screen position.
// footprintWidth = tile width on ground; footprintHeight = footprintWidth/2 (2:1 ratio).
// offsetX centers the diamond within the canvas.
function isoXY(row: number, col: number, fw: number, fh: number, offsetX: number) {
  const x = (col - row) * (fw / 2) + offsetX
  const y = (col + row) * (fh / 2)
  return { x, y }
}

function FactoryIsometricView({
  game,
  derived,
  grid,
  gridLevels,
  containerWidth,
  onCellPress,
  isActive,
}: FactoryIsometricViewProps) {
  const N = CANVAS_COLS
  // Size tiles so 3 fit across the visible screen -- canvas is larger
  // than the screen; the player scrolls/pans to see the rest.
  const VISIBLE_COLS = 3
  const footprintWidth = containerWidth / (VISIBLE_COLS + VISIBLE_COLS / 2)
  const footprintHeight = footprintWidth / 2
  const spriteHeight = footprintWidth * 1.1

  // Offset to shift the whole diamond so the leftmost tile (row=N-1, col=0)
  // sits at x=0 within the canvas. Must be N*(fw/2) not (N-1)*(fw/2) --
  // the leftmost tip of an N×N diamond is at (col-row)*fw/2 = (0-N)*fw/2,
  // so we add N*fw/2 to bring it to zero.
  const offsetX = N * (footprintWidth / 2)

  // Full canvas width: the diamond spans from x=0 (left tip) to x=N*fw
  // (right tip at col=N, row=0), plus one tile width for the rightmost
  // footprint itself.
  const mapWidth = N * footprintWidth + footprintWidth / 2
  const maxY = (N - 1 + N - 1) * (footprintHeight / 2) + footprintHeight
  const mapHeight = maxY + spriteHeight - footprintHeight

  // Build SVG grid lines -- draw the (N+1) columns and (N+1) rows of the
  // isometric diamond grid as lines connecting tile corner points.
  // Each "row line" goes from the leftmost tile edge of that row to the
  // rightmost, and each "col line" goes top to bottom of its column.
  const gridLines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

  // Row lines: for each row index r (0..N), draw a horizontal line in
  // isometric space from (r, 0) to (r, N) corner points.
  for (let r = 0; r <= N; r++) {
    // Left end of this row line: corner at col=0, row=r
    const left = isoXY(r, 0, footprintWidth, footprintHeight, offsetX)
    // Right end: corner at col=N, row=r
    const right = isoXY(r, N, footprintWidth, footprintHeight, offsetX)
    gridLines.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y })
  }

  // Col lines: for each col index c (0..N), from (0, c) to (N, c).
  for (let c = 0; c <= N; c++) {
    const top = isoXY(0, c, footprintWidth, footprintHeight, offsetX)
    const bottom = isoXY(N, c, footprintWidth, footprintHeight, offsetX)
    gridLines.push({ x1: top.x, y1: top.y, x2: bottom.x, y2: bottom.y })
  }

  return (
    <View style={[styles.yard, { width: mapWidth, height: mapHeight }]}>

      {/* SVG grid lines -- drawn first so buildings render on top */}
      <Svg
        width={mapWidth}
        height={mapHeight}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {gridLines.map((l, i) => (
          <Line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={colors.creamBorder}
            strokeWidth={1}
            opacity={0.6}
          />
        ))}
      </Svg>

      {/* Building tiles (N*N total, some locked) */}
      {Array.from({ length: N * N }, (_, i) => {
        const row = Math.floor(i / N)
        const col = i % N
        const depth = row + col
        const { x: fx, y: fy } = isoXY(row, col, footprintWidth, footprintHeight, offsetX)

        const isLocked = i >= grid.length

        if (isLocked) {
          return (
            <View
              key={i}
              pointerEvents="none"
              style={[styles.footprintPad, { left: fx, top: fy, width: footprintWidth, height: footprintHeight, zIndex: depth }]}
            >
              <View style={[styles.lockedPad, { width: footprintWidth * 0.88, height: footprintHeight * 0.8 }]}>
                <Text style={styles.lockedIcon}>🔒</Text>
              </View>
            </View>
          )
        }

        const cell: GridCell = grid[i]

        if (!cell) {
          return (
            <Pressable
              key={i}
              onPress={() => onCellPress?.(i)}
              style={[styles.footprintPad, { left: fx, top: fy, width: footprintWidth, height: footprintHeight, zIndex: depth }]}
            >
              <View style={[styles.emptyPad, { width: footprintWidth * 0.8, height: footprintHeight * 0.72 }]}>
                <Text style={styles.emptyPlus}>+</Text>
              </View>
            </Pressable>
          )
        }

        const category = BUILDING_CATEGORY_BY_TYPE[cell]
        const accentColor = BUILDING_CATEGORY_ACCENT[category]
        const surfaceColor = BUILDING_CATEGORY_SURFACE[category]
        const Icon = BUILDING_TILE_ICONS[cell]
        const config = BUILDINGS[cell]
        const isProducing = Boolean(isActive && PRODUCTION_BUILDING_TYPES.has(cell))
        const staffBadge = getTileStaffBadge(game, i)
        const statusBadge = getTileStatusBadge(cell, i, game, derived)

        return (
          <View
            key={i}
            style={[styles.footprintPad, { left: fx, top: fy, width: footprintWidth, height: footprintHeight, zIndex: depth }]}
          >
            <View style={[styles.groundShadow, { width: footprintWidth * 0.8, height: footprintHeight * 0.7 }]} />
            <Pressable
              onPress={() => onCellPress?.(i)}
              style={[styles.spriteWrap, { width: footprintWidth, height: spriteHeight, bottom: 0 }]}
            >
              {isProducing && <View style={styles.producingGlow} pointerEvents="none" />}
              <BuildingSilhouette
                type={cell}
                size={footprintWidth}
                accentColor={accentColor}
                surfaceColor={surfaceColor}
                Icon={Icon}
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>L{gridLevels[i] ?? 1}</Text>
              </View>
              {statusBadge ? (
                <View style={[styles.statusBadge,
                  statusBadge.tone === 'blocked' ? styles.statusBadgeBlocked
                  : statusBadge.tone === 'idle' ? styles.statusBadgeIdle
                  : styles.statusBadgeWarning]}
                >
                  <Text style={styles.statusBadgeText}>{statusBadge.label}</Text>
                </View>
              ) : null}
              {staffBadge ? (
                <View style={styles.staffBadge}>
                  <Text style={styles.staffBadgeText}>{staffBadge}</Text>
                </View>
              ) : null}
              <Text style={styles.objectLabel} numberOfLines={1}>{config.shortName}</Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  yard: {
    position: 'relative',
    backgroundColor: colors.ground,
  },
  footprintPad: {
    position: 'absolute',
    alignItems: 'center',
  },
  emptyPad: {
    backgroundColor: '#00000010',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPlus: {
    color: '#00000035',
    fontSize: 14,
    fontWeight: '600',
  },
  lockedPad: {
    backgroundColor: '#00000018',
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedIcon: {
    fontSize: 9,
    opacity: 0.45,
  },
  groundShadow: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
    backgroundColor: '#00000016',
    borderRadius: radii.pill,
  },
  spriteWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  producingGlow: {
    position: 'absolute',
    bottom: '15%',
    width: '70%',
    height: '40%',
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    opacity: 0.18,
  },
  objectLabel: {
    position: 'absolute',
    bottom: 2,
    color: colors.inkMuted,
    fontWeight: '700',
    fontSize: 7,
    opacity: 0.7,
  },
  levelBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  levelText: { color: colors.white, fontSize: 9, fontWeight: '700' },
  staffBadge: {
    position: 'absolute',
    left: 2,
    top: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  staffBadgeText: { fontSize: 10 },
  statusBadge: {
    position: 'absolute',
    left: 2,
    bottom: 18,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusBadgeWarning: { backgroundColor: colors.orangeDark },
  statusBadgeBlocked: { backgroundColor: colors.red },
  statusBadgeIdle: { backgroundColor: colors.steelMid },
  statusBadgeText: { color: colors.white, fontSize: 8, fontWeight: '800' },
})

export default FactoryIsometricView
