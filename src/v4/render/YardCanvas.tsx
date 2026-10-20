import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, AccessibilityInfo } from 'react-native'
import { Canvas, Group, Picture, Skia } from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { toScreen, toTile } from './iso'
import { YARD, B, SALES } from '../data/balance'
import { buildingDef } from '../data/buildings'
import { palette, productAccent } from './palette'
import { canPlace } from '../sim/systems/yard'
import type { GameState } from '../sim/types'
import { text } from '../i18n'
import { sprites } from './buildings'
import { drawCommands } from './draw'
import { poly, circle, rect } from './buildings/shapes'
import { truckSprite, workerSprite } from './life'
import { customers } from '../data/customers'
const bounds = { x: -1500, y: -500, width: 3000, height: 2000 }
// Tile just in front of a building's bottom corner, where its staff stand.
const frontTile = (b: { x: number; y: number; defId: string }) => ({
  x: b.x + buildingDef(b.defId).w + 0.3,
  y: b.y + buildingDef(b.defId).h - 0.5,
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
function landCenter(s: GameState) {
  // Frame the buildings when there are some, otherwise the owned land.
  const pts = s.yard.buildings.length
    ? s.yard.buildings.flatMap(b => {
        const d = buildingDef(b.defId)
        return [
          [b.x, b.y],
          [b.x + d.w, b.y + d.h],
        ]
      })
    : s.yard.ownedParcels.flatMap(p => {
        const [x, y] = p.split(',').map(Number)
        return [
          [x * YARD.parcel, y * YARD.parcel],
          [(x + 1) * YARD.parcel, (y + 1) * YARD.parcel],
        ]
      })
  if (!pts.length) return toScreen(YARD.parcel / 2, YARD.parcel / 2)
  const xs = pts.map(([x]) => x),
    ys = pts.map(([, y]) => y)
  return toScreen((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2)
}
export function YardCanvas({
  state: s,
  ghost,
  onTile,
}: {
  state: GameState
  ghost?: { id: string; x: number; y: number; uid?: string }
  onTile: (x: number, y: number) => void
}) {
  const [size, setSize] = useState({ w: 360, h: 500 }),
    [camera, setCamera] = useState({ x: 0, y: 60, zoom: YARD.defaultZoom }),
    [frame, setFrame] = useState(0),
    [reduced, setReduced] = useState(false)
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
        p = toTile((e.x - size.w / 2 - c.x) / c.zoom, (e.y - c.y) / c.zoom)
      onTile(p.x, p.y)
    })
  const gate = s.yard.buildings.find(b => b.defId === 'gate')
  const gateKey = gate ? `${gate.x},${gate.y}` : ''
  const staticPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds)
    for (const parcel of s.yard.ownedParcels) {
      const [px, py] = parcel.split(',').map(Number)
      for (let x = px * YARD.parcel; x < (px + 1) * YARD.parcel; x++)
        for (let y = py * YARD.parcel; y < (py + 1) * YARD.parcel; y++) {
          const p = toScreen(x, y)
          drawCommands(canvas, [
            poly(
              [
                [p.x, p.y],
                [p.x + 16, p.y + 8],
                [p.x, p.y + 16],
                [p.x - 16, p.y + 8],
              ],
              palette.ground[(x + y) % 2],
            ),
          ])
        }
    }
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
  }, [s.yard.ownedParcels, gateKey])
  const entries = [
    ...s.yard.buildings.map(b => ({
      depth: b.x + b.y + buildingDef(b.defId).w + buildingDef(b.defId).h,
      kind: 'building' as const,
      b,
    })),
    ...s.trucks.map(t => ({
      depth: (t.path[t.step]?.x ?? 0) + (t.path[t.step]?.y ?? 0) + 1,
      kind: 'truck' as const,
      t,
    })),
    ...s.staff
      .filter(p => p.assignedTo)
      .map(p => ({
        depth: frontDepth(s.yard.buildings.find(b => b.uid === p.assignedTo)) + 0.5,
        kind: 'worker' as const,
        p,
      })),
  ].sort((a, b) => a.depth - b.depth)
  const buildingPictures = useMemo(() => {
    return Object.fromEntries(
      s.yard.buildings.map(b => {
        const d = buildingDef(b.defId),
          p = toScreen(b.x, b.y),
          recorder = Skia.PictureRecorder(),
          canvas = recorder.beginRecording(bounds)
        canvas.translate(p.x + (d.w - d.h) * 8, p.y + (d.w + d.h) * 4)
        drawCommands(canvas, sprites[b.defId](b.level, d.accent, 0))
        return [b.uid, recorder.finishRecordingAsPicture()]
      }),
    )
  }, [s.yard.buildings])
  const ghostPath = useMemo(() => {
    if (!ghost) return null
    const d = buildingDef(ghost.id),
      p = toScreen(ghost.x, ghost.y),
      path = Skia.Path.Make()
    path.moveTo(p.x, p.y)
    path.lineTo(p.x + d.w * 16, p.y + d.w * 8)
    path.lineTo(p.x + (d.w - d.h) * 16, p.y + (d.w + d.h) * 8)
    path.lineTo(p.x - d.h * 16, p.y + d.h * 8)
    path.close()
    return path
  }, [ghost])
  const dynamicPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds)
    for (const entry of entries) {
      canvas.save()
      if (entry.kind === 'building') {
        canvas.drawPicture(buildingPictures[entry.b.uid])
        const b = entry.b,
          d = buildingDef(b.defId),
          p = toScreen(b.x, b.y)
        canvas.translate(p.x + (d.w - d.h) * 8, p.y + (d.w + d.h) * 4)
        if (!reduced && ['cdu', 'cracker', 'flare'].includes(b.defId)) {
          for (let i = 0; i < 3; i++) {
            const phase = (visualTime * 0.6 + i / 3) % 1
            const paint = Skia.Paint()
            paint.setAntiAlias(false)
            paint.setColor(Skia.Color('#FFFFFF'))
            paint.setAlphaf((1 - phase) * 0.55)
            canvas.drawCircle(5 + phase * 8, -d.height - 8 - phase * 18, 2 + phase * 4, paint)
          }
        }
        if (b.defId === 'blend' && s.baseStock[(b.recipe ?? s.blend).base] > 0)
          drawCommands(canvas, [
            rect(-5, -20, Math.abs(Math.sin(visualTime * 4)) * 12 + 1, 1, '#B5653A'),
          ])
        if (b.defId === 'gate' && s.trucks.some(t => Math.abs(t.step - SALES.approachTiles) <= 1))
          drawCommands(canvas, [rect(2, -24, 2, 18, '#F2C230')])
        if (b.level >= 5)
          drawCommands(canvas, [
            circle(-5, -30, 2, Math.floor(visualTime * 2) % 2 ? '#F2C230' : '#F08A24'),
          ])
      } else if (entry.kind === 'truck') {
        const t = entry.t,
          a = t.path[t.step],
          b = t.path[Math.min(t.step + 1, t.path.length - 1)]
        if (a) {
          const fraction =
              t.phase === 'dwell'
                ? 0
                : Math.min(1, Math.max(0, 1 - (t.nextTick - fractional) / SALES.roadTicks)),
            p = toScreen(a.x + 0.5 + (b.x - a.x) * fraction, a.y + 0.5 + (b.y - a.y) * fraction)
          canvas.translate(p.x, p.y)
          drawCommands(canvas, truckSprite(t.kind, truckAccent(t.customer), visualTime))
        }
      } else {
        const p = entry.p,
          building = s.yard.buildings.find(b => b.uid === p.assignedTo),
          canteen = s.yard.buildings.find(b => b.defId === 'canteen')
        if (building) {
          // Walk between the canteen and the work building, along their front edges;
          // without a canteen, pace in front of the building.
          const phase = (visualTime / 8 + staffOffset(p.uid)) % 2,
            f = phase < 1 ? phase : 2 - phase,
            work = frontTile(building),
            rest = canteen ? frontTile(canteen) : { x: work.x - 1.5, y: work.y },
            point = toScreen(rest.x + (work.x - rest.x) * f, rest.y + (work.y - rest.y) * f)
          canvas.translate(point.x, point.y)
          drawCommands(canvas, workerSprite(p.job, visualTime))
        }
      }
      canvas.restore()
    }
    // Placement preview, drawn in the same recording so it layers like everything else.
    if (ghost && ghostPath) {
      const paint = Skia.Paint()
      paint.setColor(
        Skia.Color(canPlace(s, ghost.id, ghost.x, ghost.y, ghost.uid) ? '#22C55E99' : '#EF444499'),
      )
      canvas.drawPath(ghostPath, paint)
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
          const c = landCenter(s)
          setCamera(cam => ({ ...cam, x: -c.x * cam.zoom, y: h / 2 - c.y * cam.zoom }))
        }
      }}
    >
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch, tap)}>
        <Canvas style={{ flex: 1, backgroundColor: '#B5DBEA' }}>
          <Group
            transform={[
              { translateX: Math.round(size.w / 2 + camera.x) },
              { translateY: Math.round(camera.y) },
              { scale: camera.zoom },
            ]}
          >
            <Picture picture={staticPicture} />
            <Picture picture={dynamicPicture} />
          </Group>
        </Canvas>
      </GestureDetector>
      {s.popups.map(p => {
        const a = toScreen(p.x, p.y)
        return (
          <Text
            pointerEvents="none"
            key={p.uid}
            style={{
              position: 'absolute',
              left: size.w / 2 + camera.x + a.x * camera.zoom,
              top: camera.y + a.y * camera.zoom - 60 - (fractional - p.tick) * 6,
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
