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

// Second prototype, per explicit correction: the first attempt
// (FactoryMapView.tsx) used a shallow 2.5D offset, not true isometric
// projection. This one uses the actual isometric formula:
//   x = (col - row) * (footprintWidth / 2)
//   y = (col + row) * (footprintHeight / 2)
// producing a real diamond-shaped board, same as Kairosoft / RollerCoaster
// Tycoon / Transport Tycoon style maps -- not a square grid nudged
// sideways.
//
// Why an EARLIER true-isometric attempt (on a different branch) looked
// like a broken pile of overlapping tiles, and why this one should not:
// that attempt used one square size for BOTH the ground footprint AND
// the rendered tile content, so adjacent depth levels (row+col differing
// by 1) were only footprintHeight/2 apart vertically while the tile
// content was footprintHeight tall -- guaranteed ~50% overlap between
// every tile and its diagonal neighbor, with no visual hierarchy to make
// that overlap read as "in front of" vs "behind" (just two identical
// squares stacked).
//
// Real isometric games don't avoid overlap -- they rely on it (a tall
// building's sprite always visually overlaps the tile behind it; that's
// what creates the sense of depth). What they DO have, which the earlier
// attempt didn't, is a clear separation between:
//   1. the GROUND FOOTPRINT -- a small flat diamond at the actual
//      isometric coordinate, sized so adjacent footprints tile together
//      cleanly with the correct 2:1 width:height ratio
//   2. the BUILDING SPRITE -- taller than the footprint, anchored so its
//      base sits on the footprint, allowed to visually extend upward
//      into the row "behind" it on screen
// zIndex by depth (row + col) ensures a building correctly draws over
// anything further back, so the expected overlap reads as depth, not mess.
const PRODUCTION_BUILDING_TYPES = new Set<BuildingType>([
  'crudeTank',
  'distillationUnit',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
])

type FactoryIsometricViewProps = {
  game: GameState
  derived: DerivedStats
  grid: GridCell[]
  gridLevels: number[]
  containerWidth: number
  onCellPress?: (index: number) => void
  isActive?: boolean
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
  const cols = Math.round(Math.sqrt(grid.length))
  const rows = cols

  // footprintWidth/footprintHeight describe the GROUND DIAMOND only (not
  // the building sprite drawn on top of it) -- standard 2:1 isometric
  // tile ratio. The diamond shape fans out sideways by footprintWidth/2
  // per row in EACH direction, so the total width needed is
  // cols*footprintWidth (not just cols*footprintWidth/2) to fit the full
  // diamond without clipping at the edges.
  const footprintWidth = containerWidth / (cols + rows / 2)
  const footprintHeight = footprintWidth / 2

  // The building sprite (BuildingSilhouette's fixed ~44-46px content) needs
  // more vertical room than the footprint -- it sits ABOVE the footprint
  // and is allowed to overlap upward into the row behind it on screen,
  // same as any isometric game's tall-building-in-front-of-short-tile
  // case. spriteHeight is generous headroom, not a tight fit.
  //
  // KNOWN LIMITATION (explicitly not fixed here -- BuildingSilhouette's
  // internal wraps are hardcoded sizes, ~44-46px, not actually scaled by
  // the `size` prop passed to it; only the platform/icon details inside
  // scale). At small grid sizes (3x3, large footprintWidth) the
  // silhouette will look small/lost on its pad; at large grid sizes
  // (6x6, small footprintWidth) it will overflow its pad slightly.
  // Out of scope per the brief ("do not spend effort on new icons/
  // badges/card styling" -- reworking BuildingSilhouette to scale
  // properly would be exactly that). Reusing it as-is to keep this
  // prototype focused on projection/positioning/depth/layering only.
  const spriteHeight = footprintWidth * 1.1

  const minX = -(rows - 1) * (footprintWidth / 2)
  const maxX = (cols - 1) * (footprintWidth / 2) + footprintWidth
  const maxY = (cols - 1 + (rows - 1)) * (footprintHeight / 2) + footprintHeight
  const mapWidth = maxX - minX
  const mapHeight = maxY + spriteHeight - footprintHeight

  return (
    <View style={[styles.yard, { width: mapWidth, height: mapHeight }]}>
      {grid.map((cell, i) => {
        const row = Math.floor(i / cols)
        const col = i % cols
        const depth = row + col
        const footprintX = (col - row) * (footprintWidth / 2) - minX
        const footprintY = depth * (footprintHeight / 2)

        if (!cell) {
          return (
            <Pressable
              key={i}
              onPress={() => onCellPress?.(i)}
              style={[
                styles.footprintPad,
                {
                  left: footprintX,
                  top: footprintY,
                  width: footprintWidth,
                  height: footprintHeight,
                  zIndex: depth,
                },
              ]}
            />
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
            style={[
              styles.footprintPad,
              {
                left: footprintX,
                top: footprintY,
                width: footprintWidth,
                height: footprintHeight,
                zIndex: depth,
              },
            ]}
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
  footprintPad: {
    position: 'absolute',
    alignItems: 'center',
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
    letterSpacing: 0.3,
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
  levelText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
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

export default FactoryIsometricView
