import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, AccessibilityInfo } from 'react-native'
import { Canvas, Group, Picture, Skia } from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { toScreen, toTile } from './iso'
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
import { poly, circle, rect } from './buildings/shapes'
import { truckSprite, workerSprite } from './life'
import { Minus, Plus, Scan } from 'lucide-react-native'
import { customers } from '../data/customers'
const bounds = { x: -1500, y: -500, width: 3000, height: 2000 }
// Tile just in front of a building's bottom corner, where its staff stand.
const frontTile = (b: { x: number; y: number; defId: string }) => ({
  x: b.x + buildingDef(b.defId).w + 0.3,
  y: b.y + buildingDef(b.defId).h + 0.2,
})
const frontDepth = (b?: { x: number; y: number; defId: string }) =>
  b ? b.x + b.y + buildingDef(b.defId).w + buildingDef(b.defId).h : 0
// Spread workers out so they do not walk in lockstep.
const staffOffset = (uid: string) => (uid.charCodeAt(uid.length - 1) % 7) / 7
// Product trucks wear the colour of the product line they buy.
const truckAccent = (customerId: string | null) => {
  const base = customers.find(c => c.id === customerId)?.base
  return (base && productAccent[base]) || '#E2483D'
}
// Frame projected sprite bounds, not the diagonal of a tile-space bounding box.
// An L-shaped starter layout otherwise crops its western tank on a narrow phone.
function yardFrame(s: GameState, width: number, height: number) {
  const points: number[][] = []
  for (const b of s.yard.buildings) {
    const d = buildingDef(b.defId),
      p = toScreen(b.x, b.y)
    const ox = p.x + (d.w - d.h) * 8,
      oy = p.y + (d.w + d.h) * 4
    for (const c of sprites[b.defId](b.level, d.accent, 0)) {
      const pts =
        c.kind === 'polygon'
          ? c.points
          : c.kind === 'circle'
            ? [
                [c.x - c.r, c.y - c.r],
                [c.x + c.r, c.y + c.r],
              ]
            : [
                [c.x, c.y],
                [c.x + c.w, c.y + c.h],
              ]
      points.push(...pts.map(([x, y]) => [x + ox, y + oy]))
    }
  }
  if (!points.length)
    for (const parcel of s.yard.ownedParcels) {
      const [x, y] = parcel.split(',').map(Number)
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ]) {
        const p = toScreen((x + dx) * YARD.parcel, (y + dy) * YARD.parcel)
        points.push([p.x, p.y])
      }
    }
  const xs = points.map(p => p[0]),
    ys = points.map(p => p[1])
  const minX = Math.min(...xs),
    maxX = Math.max(...xs),
    minY = Math.min(...ys),
    maxY = Math.max(...ys)
  const zoom = Math.max(
    // Never open smaller than 2×: buildings must read on a phone; the edges may crop.
    YARD.defaultZoom,
    Math.min(
      // Frame the buildings as large as fits (up to 3×) so they read on a phone.
      YARD.maxZoom - 1,
      Math.floor(
        Math.min((width - 12) / Math.max(1, maxX - minX), (height - 24) / Math.max(1, maxY - minY)),
      ),
    ),
  )
  return { x: (-(minX + maxX) / 2) * zoom, y: height / 2 - ((minY + maxY) / 2) * zoom, zoom }
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
    [camera, setCamera] = useState({ x: 0, y: 60, zoom: YARD.defaultZoom }),
    [frame, setFrame] = useState(0),
    [reduced, setReduced] = useState(false)
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
        zoom: Math.round(
          Math.min(YARD.maxZoom, Math.max(YARD.minZoom, origin.current.zoom * e.scale)),
        ),
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
  const gateKey = gate ? `${gate.x},${gate.y}` : ''
  const staticPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds)
    drawCommands(canvas, yardGround(s.yard.ownedParcels, !!ghost), false)
    // Public road outside the fence that trucks use to reach the gate.
    if (gate) {
      for (let i = 1; i <= SALES.approachTiles; i++) {
        const tile = gate.x === 0 ? { x: -i, y: gate.y } : { x: gate.x, y: -i }
        const p = toScreen(tile.x, tile.y)
        drawCommands(canvas, [
          poly(
            [
              [p.x, p.y],
              [p.x + 16, p.y + 8],
              [p.x, p.y + 16],
              [p.x - 16, p.y + 8],
            ],
            palette.asphalt,
          ),
          rect(p.x - 1, p.y + 7, 3, 2, palette.hazard),
        ])
      }
    }
    return recorder.finishRecordingAsPicture()
  }, [s.yard.ownedParcels, gateKey, !!ghost])
  const truckPositions = new Map(
    s.trucks.map(t => {
      const a = t.path[t.step],
        b = t.path[Math.min(t.step + 1, t.path.length - 1)]
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
  const workerPositions = new Map(
    s.staff.map(p => {
      const building = s.yard.buildings.find(b => b.uid === p.assignedTo)
      if (!building) return [p.uid, { x: 0, y: 0 }]
      const canteen = s.yard.buildings.find(b => b.defId === 'canteen')
      const phase = (visualTime / 8 + staffOffset(p.uid)) % 2,
        f = phase < 1 ? phase : 2 - phase
      const work = frontTile(building),
        rest = canteen ? frontTile(canteen) : { x: work.x - 1.5, y: work.y }
      return [p.uid, { x: rest.x + (work.x - rest.x) * f, y: rest.y + (work.y - rest.y) * f }]
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
      depth: truckPositions.get(t.uid)!.x + truckPositions.get(t.uid)!.y,
      kind: 'truck' as const,
      t,
    })),
    ...s.staff
      .filter(p => p.assignedTo)
      .map(p => ({
        depth: workerPositions.get(p.uid)!.x + workerPositions.get(p.uid)!.y,
        kind: 'worker' as const,
        p,
      })),
    ...(ghost
      ? [
          {
            depth: ghost.x + ghost.y + buildingDef(ghost.id).w + buildingDef(ghost.id).h,
            kind: 'ghost' as const,
            g: ghost,
          },
        ]
      : []),
  ].sort((a, b) => a.depth - b.depth)
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
        canvas.translate(p.x + (d.w - d.h) * 8, p.y + (d.w + d.h) * 4)
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
    path.moveTo(p.x, p.y)
    path.lineTo(p.x + d.w * 16, p.y + d.w * 8)
    path.lineTo(p.x + (d.w - d.h) * 16, p.y + (d.w + d.h) * 8)
    path.lineTo(p.x - d.h * 16, p.y + d.h * 8)
    path.close()
    return path.detach()
  }, [ghost])
  const dynamicPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds)
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
        if (!['gate', 'flare'].includes(entry.b.defId))
          canvas.drawPicture(buildingPictures[entry.b.uid])
        const b = entry.b,
          d = buildingDef(b.defId),
          p = toScreen(b.x, b.y)
        canvas.translate(p.x + (d.w - d.h) * 8, p.y + (d.w + d.h) * 4)
        if (b.defId === 'flare') drawCommands(canvas, sprites.flare(b.level, d.accent, visualTime))
        if (b.defId === 'gate')
          drawCommands(
            canvas,
            sprites.gate(
              b.level,
              d.accent,
              s.trucks.some(t => Math.abs(t.step - SALES.approachTiles) <= 1) ? 1 : 0,
            ),
          )
        if (!reduced && ['cdu', 'cracker', 'flare'].includes(b.defId)) {
          for (let i = 0; i < 3; i++) {
            const phase = (visualTime * 0.6 + i / 3) % 1
            const paint = Skia.Paint()
            paint.setAntiAlias(false)
            paint.setColor(Skia.Color('#FFFFFF'))
            paint.setAlphaf((1 - phase) * 0.55)
            canvas.drawRect(
              {
                x: Math.round(5 + phase * 8),
                y: Math.round(-d.height - 8 - phase * 18),
                width: 4 + Math.floor(phase * 2) * 2,
                height: 4 + Math.floor(phase * 2) * 2,
              },
              paint,
            )
          }
        }
        if (b.defId === 'blend' && s.baseStock[(b.recipe ?? s.blend).base] > 0)
          drawCommands(canvas, [
            rect(-5, -25, Math.floor(Math.abs(Math.sin(visualTime * 4)) * 4) * 3 + 1, 2, '#B5653A'),
          ])
        if (b.level >= 5)
          drawCommands(canvas, [
            circle(-5, -30, 2, Math.floor(visualTime * 2) % 2 ? '#F2C230' : '#F08A24'),
          ])
      } else if (entry.kind === 'ghost') {
        const g = entry.g,
          d = buildingDef(g.id),
          p = toScreen(g.x, g.y)
        const level = s.yard.buildings.find(b => b.uid === g.uid)?.level ?? 1
        canvas.translate(p.x + (d.w - d.h) * 8, p.y + (d.w + d.h) * 4)
        const paint = Skia.Paint()
        paint.setAlphaf(0.62)
        canvas.saveLayer(paint)
        drawBuilding(canvas, loaded, g.id, level, d.accent)
        canvas.restore()
      } else if (entry.kind === 'truck') {
        const p = truckPositions.get(entry.t.uid)!,
          point = toScreen(p.x, p.y)
        canvas.translate(point.x, point.y)
        drawCommands(canvas, truckSprite(entry.t.kind, truckAccent(entry.t.customer), visualTime))
      } else {
        const p = workerPositions.get(entry.p.uid)!,
          point = toScreen(p.x, p.y)
        canvas.translate(point.x, point.y)
        drawCommands(canvas, workerSprite(entry.p.job, visualTime))
      }
      canvas.restore()
    }
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
  ])
  return (
    <View
      style={{ flex: 1 }}
      onLayout={e => {
        const w = e.nativeEvent.layout.width,
          h = e.nativeEvent.layout.height
        setSize({ w, h })
        if (!centered.current && h > 0) {
          // Open with the owned land in the middle of the view instead of empty sky.
          centered.current = true
          setCamera(yardFrame(s, w, h))
        }
      }}
    >
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch, tap)}>
        <Canvas style={{ flex: 1, backgroundColor: yardColors.backdrop }}>
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
        </Canvas>
      </GestureDetector>
      <View style={{ position: 'absolute', right: 10, bottom: 10, gap: 6 }}>
        {[
          {
            id: 'out',
            label: text({ en: 'Zoom out', th: 'ย่อ' }),
            icon: <Minus size={18} />,
            act: () => setCamera(c => ({ ...c, zoom: Math.max(YARD.minZoom, c.zoom - 1) })),
          },
          {
            id: 'in',
            label: text({ en: 'Zoom in', th: 'ขยาย' }),
            icon: <Plus size={18} />,
            act: () => setCamera(c => ({ ...c, zoom: Math.min(YARD.maxZoom, c.zoom + 1) })),
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
              color: '#B5653A',
              fontFamily: 'PixelifySans_700Bold',
              fontSize: 22,
            }}
          >
            {text(p)}
          </Text>
        )
      })}
    </View>
  )
}
