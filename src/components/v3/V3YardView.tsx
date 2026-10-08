import { memo, useEffect, useMemo, useRef } from 'react'
import { Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'
import {
  Atlas,
  Canvas,
  DashPathEffect,
  FilterMode,
  MipmapMode,
  Group,
  Image as SkiaImage,
  ImageSVG,
  Path,
  Skia,
  Text as SkiaText,
  matchFont,
  useImage,
  type DataSourceParam,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { runOnJS, useAnimatedReaction, useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated'

import { clampCameraValue } from '../../factoryCamera'
import type { V3GameState } from '../../game/v3/types'
import {
  V3_ISO,
  deriveV3RoadNetwork,
  getV3IsoBounds,
  getV3ParcelViews,
  getV3SpritePlacements,
  v3IsoPoint,
  v3IsoRect,
  type V3PlacementPreview,
} from '../../game/v3/yardView'
import { V3_YARD_BACKDROP } from '../../game/v3/yardBackdrop'
import { getV3BuildingArt, getV3BuildingAnchor, isV3CodeArt } from './v3Art'
import { getV3DecorFootprint, type V3Decoration } from '../../game/v3/decorData'
import { getV3DecorSvg } from '../../art/decorArt'
import { planV3TruckTrip, sampleV3TruckTrip, type V3TruckRequest, type V3TruckTrip } from '../../game/v3/traffic'
import { TRUCK_ANCHOR_FROM_BOTTOM, TRUCK_ART, TRUCK_MASTER_WIDTH } from './v3Vehicles'
import { V3_GROUND_CELL, V3_GROUND_DECOR, getV3DecorGroundTiles, getV3GroundModel, type V3GroundTile } from '../../game/v3/groundView'
import { GROUND_ATLAS } from './v3Ground'

const MIN_SCALE = 0.35
const MAX_SCALE = 2.2
const PIXEL = { filter: FilterMode.Nearest, mipmap: MipmapMode.None } as const // nearest-neighbour, same as the legacy map

export type V3Floater = { id: string; x: number; y: number; text: string; color: string; age: number }

type Props = {
  state: V3GameState
  width: number
  height: number
  selectedId: string | null
  highlightParcelId: string | null
  placement: V3PlacementPreview | null
  upgradeGrowth: { cells: Array<{ x: number; y: number }>; ok: boolean } | null
  floaters: V3Floater[]
  /** Building IDs that need attention (idle/blocked line…). */
  alerts: Record<string, string>
  onTapTile: (x: number, y: number) => void
  /** Visual-only truck trips (deliveries / pickups); see game/v3/traffic.ts. */
  trucks: V3TruckRequest[]
  /** Effective game speed (0 = paused); trucks move in simulated time like the economy. */
  speed: number
  onTruckDone: (id: string) => void
}

const PREVIEW_FILL: Record<string, string> = {
  valid: 'rgba(106,205,180,0.6)',
  locked_land: 'rgba(255,173,138,0.6)',
}

/** Island-edge soil depth in world px (scale 1). */
const EDGE_DEPTH = 7

/** Atlas sprites/transforms for ground tiles: each 64×32 cell drawn at tile size with its top corner on the tile. */
function groundAtlas(tiles: V3GroundTile[]) {
  const scale = V3_ISO.tw / V3_GROUND_CELL.w
  return {
    sprites: tiles.map((tile) => Skia.XYWHRect(tile.cell * V3_GROUND_CELL.w, 0, V3_GROUND_CELL.w, V3_GROUND_CELL.h)),
    transforms: tiles.map((tile) => {
      const top = v3IsoPoint(tile.x, tile.y)
      return Skia.RSXform(scale, 0, top.sx - V3_ISO.tw / 2, top.sy)
    }),
  }
}

function diamond(points: Array<{ sx: number; sy: number }>) {
  const path = Skia.Path.Make()
  path.moveTo(points[0].sx, points[0].sy)
  for (const point of points.slice(1)) path.lineTo(point.sx, point.sy)
  path.close()
  return path
}

/**
 * Draws a building's art at its real aspect ratio (Doc/ART_ASSET_LIST_V3.md §2):
 * width is fixed to the footprint's diamond width, height follows from the
 * source image's own aspect ratio, and the art's bottom edge sits flush on the
 * footprint's bottom corner. Alert badge (if any) floats above the art's top.
 */
// World-space backdrop (sea/coast/harbour): drawn inside the pan/zoom group so it
// moves with the buildings.
const BACKDROP_ART = require('../../../assets/bg/yard_backdrop.png')
const Backdrop = memo(function Backdrop() {
  const image = useImage(BACKDROP_ART as DataSourceParam)
  if (!image) return null
  const b = V3_YARD_BACKDROP
  return <SkiaImage image={image} x={b.x} y={b.y} width={b.width} height={b.height} fit="fill" sampling={PIXEL} />
})

const DecorSprite = memo(function DecorSprite({ decoration, mask }: { decoration: V3Decoration; mask: number }) {
  const svg = useMemo(() => Skia.SVG.MakeFromString(getV3DecorSvg(decoration.kind, decoration.rotated, mask)), [decoration.kind, decoration.rotated, mask])
  if (!svg) return null
  const footprint = getV3DecorFootprint(decoration.kind, decoration.rotated)
  const [, right, bottom, left] = v3IsoRect({ ...decoration, ...footprint })
  const width = right.sx - left.sx
  const height = width * svg.height() / svg.width()
  return <ImageSVG svg={svg} x={left.sx} y={bottom.sy - height} width={width} height={height} />
})

const Sprite = memo(function Sprite({
  source, bottomX, bottomY, footprintWidth, padAnchor, anchor, alert, font,
}: {
  source: ImageSourcePropType
  bottomX: number
  bottomY: number
  footprintWidth: number
  padAnchor: number
  anchor: number
  alert?: string
  font: ReturnType<typeof matchFont> | null
}) {
  const image = useImage(source as DataSourceParam)
  if (!image) return null
  // Fit BOTH image edges inside the real lot even if generated pads have a
  // slightly different aspect/handedness. The ground tip remains registered.
  // Code-drawn art matches the lot exactly (anchor === padAnchor); generated art is shrunk 2% to stay inside.
  const exact = Math.abs(anchor - padAnchor) < 1e-6
  const width = exact ? footprintWidth : Math.min(footprintWidth, footprintWidth * padAnchor / anchor,
    footprintWidth * (1 - padAnchor) / (1 - anchor)) * 0.98
  const height = width * (image.height() / image.width())
  const x = bottomX - width * anchor
  const y = bottomY - height
  return (
    <>
      <SkiaImage image={image} x={x} y={y} width={width} height={height} fit="fill" sampling={PIXEL} />
      {alert && font && <SkiaText x={x + width / 2 - 4} y={y - 6} text="!" font={font} color="#FFD447" />}
    </>
  )
})

/**
 * One tanker on its round trip. Position and facing are sampled on the UI
 * thread from simulated time, so a paused game freezes traffic too.
 */
const Truck = memo(function Truck({ trip, startMs, simMs, onDone }: {
  trip: V3TruckTrip
  startMs: number
  simMs: SharedValue<number>
  onDone: (id: string) => void
}) {
  const art = TRUCK_ART[trip.line]
  const se = useImage(art.se as DataSourceParam)
  const sw = useImage(art.sw as DataSourceParam)
  const nw = useImage(art.nw as DataSourceParam)
  const ne = useImage(art.ne as DataSourceParam)
  const { xs, ys, cum, driveMs, dwellMs, id } = trip
  const sample = useDerivedValue(() => sampleV3TruckTrip(xs, ys, cum, driveMs, dwellMs, simMs.value - startMs))
  useAnimatedReaction(() => sample.value.done, (done, previous) => {
    if (done && !previous) runOnJS(onDone)(id)
  })
  const transform = useDerivedValue(() => {
    const { x, y } = sample.value
    return [{ translateX: (x - y) * V3_ISO.tw / 2 }, { translateY: (x + y) * V3_ISO.th / 2 }]
  })
  const opacitySe = useDerivedValue(() => (sample.value.done ? 0 : sample.value.dir === 0 ? 1 : 0))
  const opacitySw = useDerivedValue(() => (sample.value.done ? 0 : sample.value.dir === 1 ? 1 : 0))
  const opacityNw = useDerivedValue(() => (sample.value.done ? 0 : sample.value.dir === 2 ? 1 : 0))
  const opacityNe = useDerivedValue(() => (sample.value.done ? 0 : sample.value.dir === 3 ? 1 : 0))
  if (!se || !sw || !nw || !ne) return null
  const scale = V3_ISO.tw / TRUCK_MASTER_WIDTH
  const width = V3_ISO.tw
  const height = se.height() * scale
  const x = -width / 2
  const y = -(height - TRUCK_ANCHOR_FROM_BOTTOM * scale)
  return (
    <Group transform={transform}>
      <SkiaImage image={se} x={x} y={y} width={width} height={height} opacity={opacitySe} sampling={PIXEL} />
      <SkiaImage image={sw} x={x} y={y} width={width} height={height} opacity={opacitySw} sampling={PIXEL} />
      <SkiaImage image={nw} x={x} y={y} width={width} height={height} opacity={opacityNw} sampling={PIXEL} />
      <SkiaImage image={ne} x={x} y={y} width={width} height={height} opacity={opacityNe} sampling={PIXEL} />
    </Group>
  )
})

/**
 * Full-screen isometric refinery. Draws only owned land plus adjacent ring
 * parcels; buildings use the existing pixel art placed on their real footprint.
 */
function V3YardView({ state, width, height, selectedId, highlightParcelId, placement, upgradeGrowth, floaters, alerts, onTapTile, trucks, speed, onTruckDone }: Props) {
  const landKey = `${state.world.unlockedParcelIds.join(',')}|${state.campaignProgress.chapter}`
  const parcels = useMemo(() => getV3ParcelViews(state), [landKey])
  const sprites = useMemo(() => getV3SpritePlacements(state), [state.world.buildingsById])
  const roads = useMemo(() => deriveV3RoadNetwork(state), [landKey])
  const groundImage = useImage(GROUND_ATLAS as DataSourceParam)
  const ground = useMemo(() => {
    const model = getV3GroundModel(state)
    const south = Skia.Path.Make()
    const east = Skia.Path.Make()
    for (const tile of model.edges.south) {
      const a = v3IsoPoint(tile.x, tile.y + 1); const b = v3IsoPoint(tile.x + 1, tile.y + 1)
      south.moveTo(a.sx, a.sy); south.lineTo(b.sx, b.sy); south.lineTo(b.sx, b.sy + EDGE_DEPTH); south.lineTo(a.sx, a.sy + EDGE_DEPTH); south.close()
    }
    for (const tile of model.edges.east) {
      const a = v3IsoPoint(tile.x + 1, tile.y); const b = v3IsoPoint(tile.x + 1, tile.y + 1)
      east.moveTo(a.sx, a.sy); east.lineTo(b.sx, b.sy); east.lineTo(b.sx, b.sy + EDGE_DEPTH); east.lineTo(a.sx, a.sy + EDGE_DEPTH); east.close()
    }
    return { atlas: groundAtlas(model.land), south, east }
  }, [landKey])
  // Simulated clock for traffic: advances only while the game runs, scaled by speed.
  const simMs = useSharedValue(0)
  const speedValue = useSharedValue(speed)
  useEffect(() => { speedValue.value = speed }, [speed])
  const clock = useFrameCallback((frame) => {
    'worklet'
    simMs.value += (frame.timeSincePreviousFrame ?? 0) * speedValue.value
  }, false)
  // Plan each truck once, when first seen; its start is pinned to the sim clock then.
  const tripsRef = useRef(new Map<string, { trip: V3TruckTrip; startMs: number }>())
  const trips: Array<{ trip: V3TruckTrip; startMs: number }> = []
  const unroutable: string[] = []
  for (const request of trucks) {
    let entry = tripsRef.current.get(request.id)
    if (!entry) {
      const trip = planV3TruckTrip(state, roads, request)
      if (!trip) { unroutable.push(request.id); continue }
      entry = { trip, startMs: simMs.value }
      tripsRef.current.set(request.id, entry)
    }
    trips.push(entry)
  }
  for (const id of [...tripsRef.current.keys()]) if (!trucks.some((request) => request.id === id)) tripsRef.current.delete(id)
  const unroutableKey = unroutable.join(',')
  useEffect(() => { for (const id of unroutable) onTruckDone(id) }, [unroutableKey])
  useEffect(() => { clock.setActive(trips.length > 0) }, [trips.length > 0])
  // Ground detail is built once per land change as ONE path each (grid, roads),
  // never per tile per frame: keeps a 48×48 yard smooth on phones.
  const gridPath = useMemo(() => {
    const path = Skia.Path.Make()
    for (const parcel of parcels) {
      if (parcel.state !== 'owned') continue
      for (let index = 0; index <= parcel.w; index++) {
        const a = v3IsoPoint(parcel.x + index, parcel.y); const b = v3IsoPoint(parcel.x + index, parcel.y + parcel.h)
        path.moveTo(a.sx, a.sy); path.lineTo(b.sx, b.sy)
      }
      for (let index = 0; index <= parcel.h; index++) {
        const a = v3IsoPoint(parcel.x, parcel.y + index); const b = v3IsoPoint(parcel.x + parcel.w, parcel.y + index)
        path.moveTo(a.sx, a.sy); path.lineTo(b.sx, b.sy)
      }
    }
    return path
  }, [parcels])
  const roadPath = useMemo(() => {
    const path = Skia.Path.Make()
    for (const node of roads) {
      const from = v3IsoPoint(node.x, node.y)
      if (node.links.e) { const to = v3IsoPoint(node.x + 1, node.y); path.moveTo(from.sx, from.sy); path.lineTo(to.sx, to.sy) }
      if (node.links.s) { const to = v3IsoPoint(node.x, node.y + 1); path.moveTo(from.sx, from.sy); path.lineTo(to.sx, to.sy) }
    }
    return path
  }, [roads])
  const decorations = state.world.decorations
  // Ground decorations (road/parking/sidewalk) are atlas tiles; props (trees, lamps…) are SVG sprites.
  const decorGround = useMemo(() => groundAtlas(getV3DecorGroundTiles(state)), [decorations])
  const scene = useMemo(() => {
    const items = Object.values(decorations ?? {}).filter((item) => !V3_GROUND_DECOR.has(item.kind))
    const neighbours = new Set(items.map(item => `${item.kind}:${item.x},${item.y}`))
    const props = items.map(decoration => {
      const { w, h } = getV3DecorFootprint(decoration.kind, decoration.rotated)
      const mask = [[0,-1],[1,0],[0,1],[-1,0]].reduce((bits, [dx,dy], index) =>
        neighbours.has(`${decoration.kind}:${decoration.x+dx},${decoration.y+dy}`) ? bits | (1 << index) : bits, 0)
      return { kind: 'decor' as const, decoration, mask, depth: decoration.x + w + decoration.y + h, id: decoration.id }
    })
    return [...sprites.map(sprite => ({ kind: 'building' as const, sprite, depth: sprite.depth, id: sprite.id })), ...props]
      .sort((a,b) => a.depth-b.depth || a.id.localeCompare(b.id))
  }, [decorations, sprites])
  const selectedDecor = selectedId ? decorations?.[selectedId] ?? null : null
  const parcelPaths = useMemo(() => parcels.map((parcel) => ({ parcel, path: diamond(v3IsoRect(parcel)) })), [parcels])
  const bounds = useMemo(() => getV3IsoBounds(state), [landKey])
  const font = useMemo(() => (Platform.OS === 'web'
    ? null
    : matchFont({ fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }), fontSize: 16, fontWeight: 'bold' })), [])

  const worldW = bounds.maxX - bounds.minX
  const worldH = bounds.maxY - bounds.minY
  const backdrop = V3_YARD_BACKDROP
  // Always cover the viewport, including tall phones at minimum zoom.
  const minScale = Math.max(MIN_SCALE, width / backdrop.width, height / backdrop.height)
  const initialScale = clampCameraValue(Math.min(width / worldW, height / worldH) * 1.3, minScale, MAX_SCALE)
  const initialX = clampCameraValue(width / 2 - (bounds.minX + worldW / 2) * initialScale,
    width - (backdrop.x + backdrop.width) * initialScale, -backdrop.x * initialScale)
  const initialY = clampCameraValue(height / 2 - (bounds.minY + worldH / 2) * initialScale,
    height - (backdrop.y + backdrop.height) * initialScale, -backdrop.y * initialScale)

  const tx = useSharedValue(initialX)
  const ty = useSharedValue(initialY)
  const scale = useSharedValue(initialScale)
  const savedX = useSharedValue(initialX)
  const savedY = useSharedValue(initialY)
  const savedScale = useSharedValue(initialScale)
  const transform = useDerivedValue(() => [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }])

  const clampX = (value: number, s: number) => {
    'worklet'
    return clampCameraValue(value,
      Math.max(width * 0.3 - bounds.maxX * s, width - (backdrop.x + backdrop.width) * s),
      Math.min(width * 0.7 - bounds.minX * s, -backdrop.x * s))
  }
  const clampY = (value: number, s: number) => {
    'worklet'
    return clampCameraValue(value,
      Math.max(height * 0.3 - bounds.maxY * s, height - (backdrop.y + backdrop.height) * s),
      Math.min(height * 0.7 - bounds.minY * s, -backdrop.y * s))
  }
  const pan = Gesture.Pan().maxPointers(1).activeOffsetX([-10, 10]).activeOffsetY([-10, 10])
    .onStart(() => { 'worklet'; savedX.value = tx.value; savedY.value = ty.value })
    .onUpdate((event) => {
      'worklet'
      tx.value = clampX(savedX.value + event.translationX, scale.value)
      ty.value = clampY(savedY.value + event.translationY, scale.value)
    })
  const pinch = Gesture.Pinch()
    .onStart(() => { 'worklet'; savedScale.value = scale.value; savedX.value = tx.value; savedY.value = ty.value })
    .onUpdate((event) => {
      'worklet'
      const next = clampCameraValue(savedScale.value * event.scale, minScale, MAX_SCALE)
      const ratio = next / savedScale.value
      tx.value = clampX(event.focalX - (event.focalX - savedX.value) * ratio, next)
      ty.value = clampY(event.focalY - (event.focalY - savedY.value) * ratio, next)
      scale.value = next
    })
  const halfW = V3_ISO.tw / 2
  const halfH = V3_ISO.th / 2
  const tap = Gesture.Tap().maxDistance(12).onEnd((event) => {
    'worklet'
    const a = (event.x - tx.value) / scale.value / halfW
    const b = (event.y - ty.value) / scale.value / halfH
    runOnJS(onTapTile)(Math.floor((a + b) / 2), Math.floor((b - a) / 2))
  })
  const gesture = Gesture.Exclusive(Gesture.Simultaneous(pan, pinch), tap)

  if (Platform.OS === 'web') {
    return <View style={[styles.viewport, { width, height }]}><Text style={styles.webNote}>The refinery map runs in the Android/iOS build.</Text></View>
  }

  return (
    <View style={[styles.viewport, { width, height }]}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          <Group transform={transform}>
            <Backdrop />
            {/* No soil 'island' edge here: the harbour backdrop already provides the ground plate around the land. */}
            {parcelPaths.map(({ parcel, path }) => (
              <Path
                key={parcel.id}
                path={path}
                color={parcel.state === 'locked' ? 'rgba(70,80,66,0.55)' : '#7EB24A'}
              />
            ))}
            {groundImage && <Atlas image={groundImage} sprites={ground.atlas.sprites} transforms={ground.atlas.transforms} sampling={PIXEL} />}
            {parcelPaths.filter(({ parcel }) => parcel.state === 'available').map(({ parcel, path }) => (
              <Path key={`dim-${parcel.id}`} path={path} color="rgba(30,45,40,0.42)" />
            ))}
            <Path path={gridPath} color="rgba(0,0,0,0.06)" style="stroke" strokeWidth={1} />
            {parcelPaths.filter(({ parcel }) => parcel.id === highlightParcelId).map(({ parcel, path }) => (
              <Path key={`hl-${parcel.id}`} path={path} color="#FFD447" style="stroke" strokeWidth={3} />
            ))}
            <Path path={roadPath} color="#585C64" style="stroke" strokeWidth={5} strokeCap="round" />
            <Path path={roadPath} color="rgba(246,206,72,0.85)" style="stroke" strokeWidth={0.8}>
              <DashPathEffect intervals={[3, 4]} />
            </Path>
            {groundImage && decorGround.sprites.length > 0 && (
              <Atlas image={groundImage} sprites={decorGround.sprites} transforms={decorGround.transforms} sampling={PIXEL} />
            )}
            {selectedDecor && (() => {
              const { w, h } = getV3DecorFootprint(selectedDecor.kind, selectedDecor.rotated)
              return <Path path={diamond(v3IsoRect({ x: selectedDecor.x, y: selectedDecor.y, w, h }))} color="#FFFFFF" style="stroke" strokeWidth={2} />
            })()}
            {upgradeGrowth?.cells.map((cell) => (
              <Path key={`g${cell.x},${cell.y}`} path={diamond(v3IsoRect({ ...cell, w: 1, h: 1 }))} color={upgradeGrowth.ok ? 'rgba(106,205,180,0.6)' : 'rgba(255,99,99,0.6)'} />
            ))}
            {scene.map((item) => {
              if (item.kind === 'decor') return <DecorSprite key={item.id} decoration={item.decoration} mask={item.mask} />
              const sprite = item.sprite
              const art = getV3BuildingArt(sprite.type, sprite.level)
              return (
                <Group key={sprite.id}>
                  {!isV3CodeArt(sprite.type) && <Path path={diamond(v3IsoRect(sprite))} color="#7D8585" />}
                  {!isV3CodeArt(sprite.type) && <Path path={diamond(v3IsoRect(sprite))} color="#485458" style="stroke" strokeWidth={1} />}
                  {sprite.id === selectedId && <Path path={diamond(v3IsoRect(sprite))} color="rgba(255,255,255,0.45)" />}
                  {art
                    ? (
                      <Sprite
                        source={art}
                        bottomX={v3IsoPoint(sprite.x + sprite.w, sprite.y + sprite.h).sx}
                        bottomY={sprite.bottomY}
                        footprintWidth={sprite.footprintWidth}
                        padAnchor={sprite.w / (sprite.w + sprite.h)}
                        anchor={getV3BuildingAnchor(sprite.type, sprite.level)}
                        alert={alerts[sprite.id]}
                        font={font}
                      />
                    )
                    : <Path path={diamond(v3IsoRect(sprite))} color="#888" />}
                </Group>
              )
            })}
            {trips.map(({ trip, startMs }) => <Truck key={trip.id} trip={trip} startMs={startMs} simMs={simMs} onDone={onTruckDone} />)}
            {placement?.cells.map((cell) => (
              <Path key={`p${cell.x},${cell.y}`} path={diamond(v3IsoRect({ ...cell, w: 1, h: 1 }))} color={PREVIEW_FILL[placement.status] ?? 'rgba(255,99,99,0.6)'} />
            ))}
            {font && floaters.map((floater) => {
              const point = v3IsoPoint(floater.x + 0.5, floater.y + 0.5)
              return (
                <SkiaText
                  key={floater.id}
                  x={point.sx - 14}
                  y={point.sy - 28 - floater.age * 28}
                  text={floater.text}
                  font={font}
                  color={floater.color}
                  opacity={Math.max(0, 1 - floater.age)}
                />
              )
            })}
          </Group>
        </Canvas>
      </GestureDetector>
    </View>
  )
}

export default memo(V3YardView)

const styles = StyleSheet.create({
  viewport: { overflow: 'hidden', backgroundColor: V3_YARD_BACKDROP.seaColor },
  webNote: { color: '#D5E2E9', padding: 16 },
})
