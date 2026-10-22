import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, AccessibilityInfo } from 'react-native'
import {
  Canvas,
  Group,
  Picture,
  Skia,
  useImage,
  Rect as SkRect,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { toScreen, toTile, TILE } from './iso'
import { yardGround, yardColors } from './yardGround'
import { YARD, B, SALES } from '../data/balance'
import { buildingDef } from '../data/buildings'
import { palette, productAccent } from './palette'
import { canPlace } from '../sim/systems/yard'
import type { GameState } from '../sim/types'
import { text } from '../i18n'
import { sprites } from './buildings'
import { drawCommands } from './draw'
import { useSpriteImages, drawBuilding } from './useSpriteImages'
import { spriteImageFor, spriteTierFor } from './spriteImages'
import { poly, circle, rect } from './buildings/shapes'
import { truckSprite, workerSprite } from './life'
import { Minus, Plus, Scan } from 'lucide-react-native'
import { tdAtlas, tdAtlasSrc } from './tdAtlas'
import { tdMap, tdMapSrc } from './tdMap'
const seaColor = '#007CE2'
import {
  drawWorld,
  drawSeaLife,
  drawTraffic,
  drawSky,
  drawSmoke,
  drawSparkle,
  sprite,
  truckName,
  approachTile,
} from './world'
import { customers } from '../data/customers'
const bounds = { x: tdMap.x - 400, y: tdMap.y - 400, width: tdMap.w + 800, height: tdMap.h + 800 }
// Tile just in front of a building's bottom corner, where its staff stand.
/** Atlas sprite standing in for a building (decorations, the animated flare, the gate). */
function atlasArt(b: { defId: string }, t: number, gateOpen: boolean) {
  if (b.defId === 'flare') return `flare${Math.floor(t * 8) % 4}`
  if (b.defId === 'gate') return gateOpen ? 'barrier_up' : 'barrier_down'
  return tdAtlas[`deco_${b.defId}`] ? `deco_${b.defId}` : undefined
}
const frontTile = (b: { x: number; y: number; defId: string }) => ({
  x: b.x + buildingDef(b.defId).w / 2,
  y: b.y + buildingDef(b.defId).h + 0.3,
})
// Draw order on a square grid: whatever stands lower on the screen is in front.
const frontDepth = (b?: { x: number; y: number; defId: string }) =>
  b ? b.y + buildingDef(b.defId).h + b.x * 0.001 : 0
// Spread workers out so they do not walk in lockstep.
const staffOffset = (uid: string) => (uid.charCodeAt(uid.length - 1) % 7) / 7
// Product trucks wear the colour of the product line they buy.
const truckAccent = (customerId: string | null) => {
  const base = customers.find(c => c.id === customerId)?.base
  return (base && productAccent[base]) || '#E2483D'
}
// Zoom steps for the square top-down grid (1 = 32 pt per tile, about the mockup's scale).
export const ZOOMS = [0.35, 0.5, 0.75, 1, 1.5, 2, 3]
const MIN_ZOOM = ZOOMS[0],
  MAX_ZOOM = ZOOMS[ZOOMS.length - 1]
// Frame the owned yard plus the road above it, and the tops of tall buildings.
function yardFrame(s: GameState, width: number, height: number) {
  const xs: number[] = [],
    ys: number[] = []
  for (const parcel of s.yard.ownedParcels) {
    const [x, y] = parcel.split(',').map(Number)
    xs.push(x * YARD.parcel * TILE, (x + 1) * YARD.parcel * TILE)
    ys.push(y * YARD.parcel * TILE, (y + 1) * YARD.parcel * TILE)
  }
  ys.push(-2 * TILE)
  for (const b of s.yard.buildings) {
    const image = spriteImageFor(b.defId, b.level)
    if (image) ys.push((b.y + buildingDef(b.defId).h) * TILE - (image.h * image.scale) / 2)
  }
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys)
  const fit = Math.min(
    (width - 12) / Math.max(1, maxX - minX),
    (height - 24) / Math.max(1, maxY - minY),
  )
  const zoom = Math.max(MIN_ZOOM, Math.min(2, fit))
  return { x: (-(minX + maxX) / 2) * zoom, y: height / 2 - ((minY + maxY) / 2) * zoom, zoom }
}
/** Keep the view inside the world map (centred on it when zoomed out past its size). */
function clampCamera(c: { x: number; y: number; zoom: number }, w: number, h: number) {
  const fit = (pos: number, view: number, start: number, len: number, offset: number) => {
    const lo = view - offset - (start + len) * c.zoom,
      hi = -offset - start * c.zoom
    return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, pos))
  }
  return {
    ...c,
    x: fit(c.x, w, tdMap.x, tdMap.w, w / 2),
    y: fit(c.y, h, tdMap.y, tdMap.h, 0),
  }
}
export function YardCanvas({
  state: s,
  ghost,
  onTile,
  lift = 0,
}: {
  state: GameState
  ghost?: { id: string; x: number; y: number; uid?: string }
  onTile: (x: number, y: number) => void
  /** Share of the view covered by a sheet from below; the yard slides up by half of it. */
  lift?: number
}) {
  const [size, setSize] = useState({ w: 360, h: 500 }),
    [camera, setCameraRaw] = useState({ x: 0, y: 60, zoom: 1 }),
    [frame, setFrame] = useState(0),
    [reduced, setReduced] = useState(false)
  type Cam = { x: number; y: number; zoom: number }
  const sizeRef = useRef(size)
  sizeRef.current = size
  const setCamera = (next: Cam | ((c: Cam) => Cam)) =>
    setCameraRaw(c =>
      clampCamera(
        typeof next === 'function' ? next(c) : next,
        sizeRef.current.w,
        sizeRef.current.h,
      ),
    )
  const liftY = -Math.round((lift * size.h) / 2)
  const centered = useRef(false)
  const cameraRef = useRef(camera),
    origin = useRef(camera),
    tickAt = useRef(0),
    time = useRef(0)
  cameraRef.current = camera
  useEffect(() => {
    let id = 0
    const update = (ms: number) => {
      time.current = ms
      setFrame(ms)
      id = requestAnimationFrame(update)
    }
    id = requestAnimationFrame(update)
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced)
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced)
    return () => {
      cancelAnimationFrame(id)
      sub.remove()
    }
  }, [])
  useEffect(() => {
    tickAt.current = time.current
  }, [s.tick])
  const fractional =
      reduced || s.speed === 0
        ? s.tick
        : s.tick + Math.min(1, (frame - tickAt.current) / (B.tickMs / s.speed)),
    visualTime = reduced ? 0 : (fractional * B.tickMs) / 1000
  const pan = Gesture.Pan()
    .minDistance(8)
    .runOnJS(true)
    .onStart(() => {
      origin.current = cameraRef.current
    })
    .onUpdate(e =>
      setCamera(c => ({
        ...c,
        x: origin.current.x + e.translationX,
        y: origin.current.y + e.translationY,
      })),
    )
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => {
      origin.current = cameraRef.current
    })
    .onUpdate(e =>
      setCamera(c => ({
        ...c,
        zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, origin.current.zoom * e.scale)),
      })),
    )
  const tap = Gesture.Tap()
    .maxDistance(8)
    .runOnJS(true)
    .onEnd(e => {
      const c = cameraRef.current,
        p = toTile((e.x - size.w / 2 - c.x) / c.zoom, (e.y - c.y - liftY) / c.zoom)
      onTile(p.x, p.y)
    })
  const ghostKey = ghost ? `${ghost.id}:${ghost.uid ?? ''}` : ''
  useEffect(() => {
    if (!ghost) return
    const d = buildingDef(ghost.id),
      p = toScreen(ghost.x + d.w / 2, ghost.y + d.h / 2)
    setCamera(c => ({ ...c, x: -p.x * c.zoom, y: size.h / 2 - p.y * c.zoom }))
  }, [ghostKey, size.h])
  const gate = s.yard.buildings.find(b => b.defId === 'gate')
  const world = useImage(tdAtlasSrc),
    map = useImage(tdMapSrc)
  const ambient = !reduced && s.settings.ambient !== false
  const staticPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds)
    if (map) drawWorld(canvas, map, s.yard.ownedParcels)
    drawCommands(canvas, yardGround(s.yard.ownedParcels, !!ghost, !!map), false)
    return recorder.finishRecordingAsPicture()
  }, [s.yard.ownedParcels, !!ghost, map])
  const truckPositions = new Map(
    s.trucks.map(t => {
      const g = gate ?? undefined
      const a = t.path[t.step] && approachTile(t.path[t.step], g),
        b = approachTile(t.path[Math.min(t.step + 1, t.path.length - 1)], g)
      const f =
        t.phase === 'dwell'
          ? 0
          : Math.min(1, Math.max(0, 1 - (t.nextTick - fractional) / SALES.roadTicks))
      return [
        t.uid,
        a ? { x: a.x + 0.5 + (b.x - a.x) * f, y: a.y + 0.5 + (b.y - a.y) * f } : { x: 0, y: 0 },
      ]
    }),
  )
  const truckNearGate =
    !!gate &&
    [...truckPositions.values()].some(
      p => Math.abs(p.x - (gate.x + 0.5)) < 2.5 && Math.abs(p.y - (gate.y + 0.5)) < 3,
    )
  const workerPositions = new Map(
    s.staff.map(p => {
      const building = s.yard.buildings.find(b => b.uid === p.assignedTo)
      if (!building) return [p.uid, { x: 0, y: 0, dir: 's' }]
      const canteen = s.yard.buildings.find(b => b.defId === 'canteen')
      const phase = (visualTime / 8 + staffOffset(p.uid)) % 2,
        f = phase < 1 ? phase : 2 - phase
      const work = frontTile(building),
        rest = canteen ? frontTile(canteen) : { x: work.x - 1.5, y: work.y }
      const sign = phase < 1 ? 1 : -1,
        dx = (work.x - rest.x) * sign,
        dy = (work.y - rest.y) * sign
      const dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'e' : 'w') : dy >= 0 ? 's' : 'n'
      return [p.uid, { x: rest.x + (work.x - rest.x) * f, y: rest.y + (work.y - rest.y) * f, dir }]
    }),
  )
  const entries = [
    ...s.yard.buildings
      .filter(b => b.uid !== ghost?.uid)
      .map(b => ({
        depth: frontDepth(b),
        kind: 'building' as const,
        b,
      })),
    ...s.trucks.map(t => ({
      depth: truckPositions.get(t.uid)!.y + 0.5,
      kind: 'truck' as const,
      t,
    })),
    ...s.staff
      .filter(p => p.assignedTo)
      .map(p => ({
        depth: workerPositions.get(p.uid)!.y,
        kind: 'worker' as const,
        p,
      })),
    ...(ghost
      ? [
          {
            depth: ghost.y + buildingDef(ghost.id).h + 0.5,
            kind: 'ghost' as const,
            g: ghost,
          },
        ]
      : []),
  ].sort((a, b) => a.depth - b.depth)
  // Remember when each building last went up a level, for a short sparkle.
  const levels = useRef(new Map<string, number>()),
    sparkAt = useRef(new Map<string, number>())
  useEffect(() => {
    for (const b of s.yard.buildings) {
      const before = levels.current.get(b.uid)
      if (before !== undefined && b.level > before) sparkAt.current.set(b.uid, time.current)
      levels.current.set(b.uid, b.level)
    }
  }, [s.yard.buildings])
  const loadedRaw = useSpriteImages()
  const loadedKey = Object.values(loadedRaw)
    .map(v => (v ? 1 : 0))
    .join('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loaded = useMemo(() => loadedRaw, [loadedKey])
  const buildingPictures = useMemo(() => {
    return Object.fromEntries(
      s.yard.buildings.map(b => {
        const d = buildingDef(b.defId),
          p = toScreen(b.x, b.y),
          recorder = Skia.PictureRecorder(),
          canvas = recorder.beginRecording(bounds)
        canvas.translate(p.x + (d.w * TILE) / 2, p.y + d.h * TILE)
        drawBuilding(canvas, loaded, b.defId, b.level, d.accent)
        return [b.uid, recorder.finishRecordingAsPicture()]
      }),
    )
  }, [s.yard.buildings, loaded])
  const ghostPath = useMemo(() => {
    if (!ghost) return null
    const d = buildingDef(ghost.id),
      p = toScreen(ghost.x, ghost.y),
      path = Skia.PathBuilder.Make()
    path.addRect(Skia.XYWHRect(p.x, p.y, d.w * TILE, d.h * TILE))
    path.close()
    return path.detach()
  }, [ghost])
  const dynamicPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds)
    if (world && ambient) {
      drawSeaLife(canvas, world, visualTime)
      drawTraffic(canvas, world, visualTime)
    }
    if (ghost && ghostPath) {
      const paint = Skia.Paint()
      paint.setAntiAlias(false)
      paint.setColor(
        Skia.Color(canPlace(s, ghost.id, ghost.x, ghost.y, ghost.uid) ? '#2FB38E88' : '#E2483D88'),
      )
      canvas.drawPath(ghostPath, paint)
      paint.setStyle(1)
      paint.setStrokeWidth(2)
      canvas.drawPath(ghostPath, paint)
    }
    for (const entry of entries) {
      canvas.save()
      if (entry.kind === 'building') {
        if (world && !atlasArt(entry.b, 0, false)) {
          // Soft shadow of the footprint, shifted to the lower right.
          const b0 = entry.b,
            d0 = buildingDef(b0.defId),
            q = toScreen(b0.x, b0.y)
          const sh = Skia.Paint()
          sh.setColor(Skia.Color('#0B2A33'))
          sh.setAlphaf(0.16)
          const path = Skia.PathBuilder.Make()
          path.addRect(Skia.XYWHRect(q.x + 6, q.y + 6, d0.w * TILE, d0.h * TILE))
          path.close()
          canvas.drawPath(path.detach(), sh)
        }
        const art = world && atlasArt(entry.b, visualTime, s.trucks.length > 0 && truckNearGate)
        if (art && world) {
          const d1 = buildingDef(entry.b.defId),
            q1 = toScreen(entry.b.x + d1.w / 2, entry.b.y + d1.h)
          sprite(canvas, world, art, q1.x, q1.y - 3)
        } else canvas.drawPicture(buildingPictures[entry.b.uid])
        const b = entry.b,
          d = buildingDef(b.defId),
          p = toScreen(b.x, b.y)
        canvas.translate(p.x + (d.w * TILE) / 2, p.y + d.h * TILE)
        // Height of the art (or box) above the slab's bottom, for smoke, sparkles and lights.
        const img = spriteImageFor(b.defId, b.level)
        const top = img ? (img.ay * img.scale) / 2 : d.h * TILE + 20
        if (world && ambient && ['cdu', 'cracker'].includes(b.defId))
          drawSmoke(canvas, world, visualTime, -6, -top + 6)
        else if (!reduced && ['cdu', 'cracker', 'flare'].includes(b.defId)) {
          for (let i = 0; i < 3; i++) {
            const phase = (visualTime * 0.6 + i / 3) % 1
            const paint = Skia.Paint()
            paint.setAntiAlias(false)
            paint.setColor(Skia.Color('#FFFFFF'))
            paint.setAlphaf((1 - phase) * 0.55)
            canvas.drawRect(
              {
                x: Math.round(5 + phase * 8),
                y: Math.round(-top - phase * 18),
                width: 4 + Math.floor(phase * 2) * 2,
                height: 4 + Math.floor(phase * 2) * 2,
              },
              paint,
            )
          }
        }
        if (b.defId === 'blend' && s.baseStock[(b.recipe ?? s.blend).base] > 0)
          drawCommands(canvas, [
            rect(
              -8,
              -top + 8,
              Math.floor(Math.abs(Math.sin(visualTime * 4)) * 4) * 3 + 1,
              3,
              '#B5653A',
            ),
          ])
        const sparked = sparkAt.current.get(b.uid)
        if (world && sparked !== undefined && time.current - sparked < 900)
          drawSparkle(canvas, world, (time.current - sparked) / 900, 0, -top / 2)
        if (b.level >= 5 && spriteTierFor(b.defId, b.level) !== 5 && !atlasArt(b, 0, false))
          drawCommands(canvas, [
            circle(0, -top - 4, 3, Math.floor(visualTime * 2) % 2 ? '#F2C230' : '#F08A24'),
          ])
      } else if (entry.kind === 'ghost') {
        const g = entry.g,
          d = buildingDef(g.id),
          p = toScreen(g.x, g.y)
        const level = s.yard.buildings.find(b => b.uid === g.uid)?.level ?? 1
        canvas.translate(p.x + (d.w * TILE) / 2, p.y + d.h * TILE)
        const paint = Skia.Paint()
        paint.setAlphaf(0.62)
        canvas.saveLayer(paint)
        drawBuilding(canvas, loaded, g.id, level, d.accent)
        canvas.restore()
      } else if (entry.kind === 'truck') {
        const p = truckPositions.get(entry.t.uid)!,
          point = toScreen(p.x, p.y)
        canvas.translate(point.x, point.y)
        if (world) {
          const t = entry.t,
            g = gate ?? undefined,
            a = t.path[t.step] && approachTile(t.path[t.step], g),
            n = approachTile(t.path[Math.min(t.step + 1, t.path.length - 1)], g),
            back = approachTile(t.path[Math.max(0, t.step - 1)], g)
          const dx =
              a && n && (n.x !== a.x || n.y !== a.y) ? n.x - a.x : a && back ? a.x - back.x : 1,
            dy = a && n && (n.x !== a.x || n.y !== a.y) ? n.y - a.y : a && back ? a.y - back.y : 0
          sprite(canvas, world, truckName(t.kind, dx, dy), 0, 6, 1, 1, true)
        } else
          drawCommands(canvas, truckSprite(entry.t.kind, truckAccent(entry.t.customer), visualTime))
      } else {
        const p = workerPositions.get(entry.p.uid)!,
          point = toScreen(p.x, p.y)
        canvas.translate(point.x, point.y)
        if (world && tdAtlas[`${entry.p.job}_s0`])
          sprite(
            canvas,
            world,
            `${entry.p.job}_${p.dir}${Math.floor(visualTime * 4) % 2}`,
            0,
            4,
            1,
            1,
            true,
          )
        else drawCommands(canvas, workerSprite(entry.p.job, visualTime))
      }
      canvas.restore()
    }
    if (world && ambient) drawSky(canvas, world, visualTime)
    return recorder.finishRecordingAsPicture()
  }, [
    s.yard.buildings,
    s.staff,
    s.trucks,
    visualTime,
    buildingPictures,
    s.baseStock,
    s.blend,
    reduced,
    ghost,
    ghostPath,
    world,
    ambient,
  ])
  return (
    <View
      style={{ flex: 1 }}
      onLayout={e => {
        const w = e.nativeEvent.layout.width,
          h = e.nativeEvent.layout.height
        setSize({ w, h })
        sizeRef.current = { w, h }
        if (!centered.current && h > 0) {
          // Open with the owned land in the middle of the view instead of empty sky.
          centered.current = true
          setCamera(yardFrame(s, w, h))
        }
      }}
    >
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch, tap)}>
        <Canvas style={{ flex: 1, backgroundColor: world ? seaColor : yardColors.backdrop }}>
          <Group
            transform={[
              { translateX: Math.round(size.w / 2 + camera.x) },
              { translateY: Math.round(camera.y + liftY) },
              { scale: camera.zoom },
            ]}
          >
            <Picture picture={staticPicture} />
            <Picture picture={dynamicPicture} />
          </Group>
          {world && (
            <>
              {/* One warm grade over everything so art from different sources reads as one scene. */}
              <SkRect
                x={0}
                y={0}
                width={size.w}
                height={size.h}
                color="#FFC56B"
                opacity={0.07}
                blendMode="softLight"
              />
              <SkRect x={0} y={0} width={size.w} height={size.h}>
                <RadialGradient
                  c={vec(size.w / 2, size.h / 2)}
                  r={Math.max(size.w, size.h) * 0.75}
                  colors={['#00000000', '#00000000', '#0B2A3340']}
                  positions={[0, 0.6, 1]}
                />
              </SkRect>
            </>
          )}
        </Canvas>
      </GestureDetector>
      <View style={{ position: 'absolute', right: 10, bottom: 10, gap: 6 }}>
        {[
          {
            id: 'out',
            label: text({ en: 'Zoom out', th: 'ย่อ' }),
            icon: <Minus size={18} />,
            act: () =>
              setCamera(c => ({
                ...c,
                zoom: [...ZOOMS].reverse().find(z => z < c.zoom - 0.01) ?? MIN_ZOOM,
              })),
          },
          {
            id: 'in',
            label: text({ en: 'Zoom in', th: 'ขยาย' }),
            icon: <Plus size={18} />,
            act: () =>
              setCamera(c => ({ ...c, zoom: ZOOMS.find(z => z > c.zoom + 0.01) ?? MAX_ZOOM })),
          },
          {
            id: 'center',
            label: text({ en: 'Centre yard', th: 'จัดลานกลางจอ' }),
            icon: <Scan size={18} />,
            act: () => setCamera(yardFrame(s, size.w, size.h)),
          },
        ].map(b => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.label}
            onPress={b.act}
            style={{
              width: 40,
              height: 40,
              borderWidth: 2,
              borderRadius: 5,
              backgroundColor: '#FFF6E3',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {b.icon}
          </Pressable>
        ))}
      </View>
      {s.popups.map(p => {
        const a = toScreen(p.x, p.y)
        return (
          <Text
            pointerEvents="none"
            key={p.uid}
            style={{
              position: 'absolute',
              left: size.w / 2 + camera.x + a.x * camera.zoom,
              top: camera.y + liftY + a.y * camera.zoom - 60 - (fractional - p.tick) * 6,
              color: '#FFD84D',
              fontFamily: 'PixelifySans_700Bold',
              fontSize: 22,
              textShadowColor: '#14110F',
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 0,
            }}
          >
            {text(p)}
          </Text>
        )
      })}
    </View>
  )
}
