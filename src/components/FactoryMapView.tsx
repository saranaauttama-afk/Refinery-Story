import { Pressable, StyleSheet, Text, View } from 'react-native'
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

// Buildings that are part of the core crude -> gasoline / feedstock ->
// product chain -- these get the "actively producing" pulse glow when the
// refinery has crude to process. Storage/support buildings (product tank,
// laboratory, maintenance workshop, sales office) don't pulse. Duplicated
// from BuildingGrid.tsx rather than shared -- this is a throwaway
// prototype per the brief (feature-flagged, may be deleted), not worth
// the extra indirection of extracting a shared constant for one boolean.
const PRODUCTION_BUILDING_TYPES = new Set<BuildingType>([
  'crudeTank',
  'distillationUnit',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
])

type FactoryMapViewProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  onCellPress?: (index: number) => void
  isActive?: boolean
}

// Visual-only alternative to BuildingGrid -- same grid data model
// (grid/gridLevels arrays, row = index / cols, col = index % cols), same
// interactions (tap empty pad -> build, tap occupied object -> inspect),
// same level/staff/status badges. The only thing that changes is HOW
// each cell is projected onto the screen: instead of a flexWrap grid of
// equal white square cards, cells are absolutely positioned "placed
// objects on a yard" using a simple 2.5D offset (not true isometric
// math -- see the brief). Toggle via USE_FACTORY_MAP_PROTOTYPE in
// app/game/(tabs)/index.tsx; BuildingGrid.tsx is untouched and still the
// default.
function FactoryMapView({
  game,
  derived,
  grid,
  gridLevels,
  containerWidth,
  onCellPress,
  isActive,
}: FactoryMapViewProps) {
  const cols = Math.round(Math.sqrt(grid.length))
  const rows = cols

  // Tile footprint sized to fit containerWidth the same way BuildingGrid
  // does, but a bit smaller than a pure division would give -- the
  // row-based horizontal offset (rowOffset below) needs some slack on
  // both sides so the bottom row doesn't run past the right edge.
  const padding = 24
  const rowOffset = 18
  const tileWidth = (containerWidth - padding - rowOffset * (rows - 1)) / cols
  const tileHeight = tileWidth
  const verticalStep = tileHeight * 0.72

  const mapWidth = cols * tileWidth + rowOffset * (rows - 1) + padding
  const mapHeight = rows * verticalStep + tileHeight * 0.4

  return (
    <View style={[styles.yard, { width: mapWidth, height: mapHeight }]}>
      {grid.map((cell, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const x = col * tileWidth + row * rowOffset
        const y = row * verticalStep

        if (!cell) {
          // Empty cells: a faint placement pad, not a dashed card --
          // just a soft rounded patch of "concrete" sitting on the yard,
          // per "Empty cells should be faint placement pads."
          return (
            <Pressable
              key={i}
              onPress={() => onCellPress?.(i)}
              style={[
                styles.padWrap,
                { left: x, top: y, width: tileWidth, height: tileHeight, zIndex: row },
              ]}
            >
              <View style={[styles.placementPad, { width: tileWidth * 0.7, height: tileHeight * 0.32 }]}>
                <Text style={styles.padPlus}>+</Text>
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

        // Slight per-cell offset (deterministic, based on the cell
        // index rather than random, so it doesn't jitter on re-render)
        // so occupied buildings don't all sit dead-center in their
        // pad -- "Buildings may be slightly offset within each cell."
        const jitterX = ((i * 7) % 5) - 2 // -2..2
        const jitterY = ((i * 11) % 5) - 2

        return (
          <View
            key={i}
            style={[
              styles.objectWrap,
              { left: x, top: y, width: tileWidth, height: tileHeight, zIndex: row },
            ]}
          >
            {/* Concrete pad underneath the building -- "Occupied
                buildings should appear as objects on concrete pads." */}
            <View style={[styles.concretePad, { width: tileWidth * 0.74, height: tileHeight * 0.3 }]} />
            <Pressable
              onPress={() => onCellPress?.(i)}
              style={[styles.objectTapTarget, { transform: [{ translateX: jitterX }, { translateY: jitterY }] }]}
            >
              {isProducing && <View style={styles.producingGlow} pointerEvents="none" />}
              <BuildingSilhouette
                type={cell}
                size={tileWidth}
                accentColor={accentColor}
                surfaceColor={surfaceColor}
                Icon={Icon}
              />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>L{gridLevels[i] ?? 1}</Text>
              </View>
              {statusBadge ? (
                <View
                  style={[
                    styles.statusBadge,
                    statusBadge.tone === 'blocked'
                      ? styles.statusBadgeBlocked
                      : statusBadge.tone === 'idle'
                        ? styles.statusBadgeIdle
                        : styles.statusBadgeWarning,
                  ]}
                >
                  <Text style={styles.statusBadgeText}>{statusBadge.label}</Text>
                </View>
              ) : null}
              {staffBadge ? (
                <View style={styles.staffBadge}>
                  <Text style={styles.staffBadgeText}>{staffBadge}</Text>
                </View>
              ) : null}
              <Text style={styles.objectLabel} numberOfLines={1}>
                {config.shortName}
              </Text>
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
  padWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placementPad: {
    backgroundColor: '#00000010',
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padPlus: {
    color: '#00000040',
    fontSize: 16,
    fontWeight: '600',
  },
  objectWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectTapTarget: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  concretePad: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: '#00000018',
    borderRadius: radii.pill,
  },
  producingGlow: {
    position: 'absolute',
    width: '70%',
    height: '70%',
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
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  levelBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    backgroundColor: colors.ink,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  levelText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  staffBadge: {
    position: 'absolute',
    left: 2,
    top: 0,
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
  staffBadgeText: {
    fontSize: 10,
  },
  statusBadge: {
    position: 'absolute',
    left: 2,
    bottom: 18,
    borderRadius: radii.pill,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusBadgeWarning: {
    backgroundColor: colors.orangeDark,
  },
  statusBadgeBlocked: {
    backgroundColor: colors.red,
  },
  statusBadgeIdle: {
    backgroundColor: colors.steelMid,
  },
  statusBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
})

export default FactoryMapView
