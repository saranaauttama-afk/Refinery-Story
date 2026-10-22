import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Pressable, AccessibilityInfo, PixelRatio, AppState } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  Canvas,
  Group,
  Picture,
  Skia,
  useImage,
  FilterMode,
  MipmapMode,
} from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { toScreen, toTile, TILE } from './iso'
import { yardGround, yardColors } from './yardGround'
import { B, SALES } from '../data/balance'
import { buildingDef } from '../data/buildings'
import { productAccent } from './palette'
import { canPlace } from '../sim/systems/yard'
import type { GameState } from '../sim/types'
import { text } from '../i18n'
import { drawCommands } from './draw'
import { useSpriteImages, drawBuilding } from './useSpriteImages'
import { spriteImageFor, spriteTierFor } from './spriteImages'
import { circle, rect } from './buildings/shapes'
import { truckSprite, workerSprite } from './life'
import { Minus, Plus, Scan } from 'lucide-react-native'
import { tdAtlas, tdAtlasSrc } from './tdAtlas'
import { GRAPHICS, buildingSocket } from './graphics'
import {
  clampCamera,
  playCamera,
  overviewCamera,
  zoomAt,
  pinchAt,
  focusCamera,
  validCamera,
  type Camera,
} from './camera'
import { groundCommands, fenceSections, scenicProps } from './scenery'
import { normalizeAtlas } from './logicalAtlas'
import { artDefinition } from './topdownArt'
import { usePixelTerrain } from './pixelTerrain'
import { buildingAt } from '../sim/systems/yard'
const seaColor = GRAPHICS.sea
import {
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
const bounds = GRAPHICS.world
const CAMERA_KEY = 'refinery-v5-play-camera'
export const ZOOMS = GRAPHICS.playZooms
const MIN_ZOOM = ZOOMS[0],
  MAX_ZOOM = ZOOMS[ZOOMS.length - 1]
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
export function YardCanvas({
  state: s,
  ready = true,
  bottomInset = 0,
  ghost,
  onTile,
  lift = 0,
  selectedUid,
  landMode = false,
}: {
  state: GameState
  ready?: boolean
  bottomInset?: number
  ghost?: { id: string; x: number; y: number; uid?: string }
  onTile: (x: number, y: number) => void
  /** Share of the view covered by a sheet from below; the yard slides up by half of it. */
  lift?: number
  selectedUid?: string
  landMode?: boolean
}) {
  const [size, setSize] = useState({ w: 360, h: 500 }),
    [camera, setCameraRaw] = useState<Camera>({ x: 0, y: 60, zoom: GRAPHICS.defaultZoom }),
    [frame, setFrame] = useState(0),
    [reduced, setReduced] = useState(false)
  type Cam = Camera
  const [overview, setOverview] = useState(false)
  const overviewRef = useRef(false)
  overviewRef.current = overview
  const interacted = useRef(false)
  const lastPlay = useRef<Camera | null>(null)
  const lastPlayHeight = useRef(500)
  const pinchFocal = useRef({ x: 0, y: 0 })
  const pinchStart = useRef({ x: 0, y: 0 })
  const view = { w: size.w, h: Math.max(120, size.h * (1 - lift) - bottomInset) }
  const sizeRef = useRef(size)
  sizeRef.current = view
  const setCamera = (next: Cam | ((c: Cam) => Cam)) =>
    setCameraRaw(c => clampCamera(typeof next === 'function' ? next(c) : next, sizeRef.current))
  const liftY = 0
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
  useEffect(() => {
    if (!ready || centered.current) return
    centered.current = true
    setCamera(playCamera(sizeRef.current, s.yard.buildings))
  }, [ready])
  const previousView = useRef(view)
  useEffect(() => {
    const before = previousView.current
    setCamera(c => ({ ...c, y: c.y + (view.h - before.h) / 2 }))
    previousView.current = view
  }, [view.w, view.h])
  useEffect(() => {
    if (!ready) return
    let alive = true
    AsyncStorage.getItem(CAMERA_KEY)
      .then(raw => {
        if (!alive || !raw || interacted.current || s.tick === 0) return
        try {
          const saved = JSON.parse(raw)
          if (
            validCamera(saved.camera) &&
            saved.seed === s.seed &&
            Number.isFinite(saved.height) &&
            saved.height > 0
          ) {
            setCamera({
              ...saved.camera,
              y: saved.camera.y + (sizeRef.current.h - saved.height) / 2,
            })
          }
        } catch {
          /* Ignore a malformed presentation preference, never the game save. */
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [ready])
  useEffect(() => {
    if (!centered.current || overview) return
    lastPlay.current = camera
    lastPlayHeight.current = view.h
    const timer = setTimeout(() => {
      AsyncStorage.setItem(
        CAMERA_KEY,
        JSON.stringify({ camera, seed: s.seed, height: view.h }),
      ).catch(() => {})
    }, 400)
    return () => clearTimeout(timer)
  }, [camera, overview, s.seed, view.h])
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      const c = overviewRef.current ? lastPlay.current : cameraRef.current
      if (state !== 'active' && c)
        AsyncStorage.setItem(
          CAMERA_KEY,
          JSON.stringify({
            camera: c,
            seed: s.seed,
            height: overviewRef.current ? lastPlayHeight.current : sizeRef.current.h,
          }),
        ).catch(() => {})
    })
    return () => sub.remove()
  }, [s.seed])
  const enterPlay = (c: Camera) => {
    if (overviewRef.current) {
      overviewRef.current = false
      setOverview(false)
    }
    return c
  }
  const pan = Gesture.Pan()
    .maxPointers(1)
    .minDistance(8)
    .runOnJS(true)
    .onStart(() => {
      interacted.current = true
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
    .onStart(e => {
      pinchFocal.current = { x: e.focalX, y: e.focalY }
      pinchStart.current = pinchFocal.current
      interacted.current = true
      origin.current = cameraRef.current
    })
    .onUpdate(e => {
      pinchFocal.current = { x: e.focalX, y: e.focalY }
      const z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.max(1, origin.current.zoom) * e.scale))
      setCamera(
        enterPlay(
          pinchAt(
            origin.current,
            z,
            pinchStart.current,
            { x: e.focalX, y: e.focalY },
            sizeRef.current,
          ),
        ),
      )
    })
    .onEnd(() =>
      setCamera(c =>
        zoomAt(
          c,
          ZOOMS.reduce((a, z) => (Math.abs(z - c.zoom) < Math.abs(a - c.zoom) ? z : a), ZOOMS[0]),
          pinchFocal.current.x,
          pinchFocal.current.y,
          sizeRef.current,
        ),
      ),
    )
  const tap = Gesture.Tap()
    .maxDistance(8)
    .runOnJS(true)
    .onEnd(e => {
      interacted.current = true
      const c = cameraRef.current,
        p = toTile((e.x - size.w / 2 - c.x) / c.zoom, (e.y - c.y) / c.zoom)
      if (overviewRef.current && !landMode) {
        const b = buildingAt(s, p.x, p.y)
        if (b) {
          const d = buildingDef(b.defId)
          setCamera(
            enterPlay(
              focusCamera(
                { ...c, zoom: GRAPHICS.defaultZoom },
                b.x + d.w / 2,
                b.y + d.h / 2,
                sizeRef.current,
              ),
            ),
          )
        } else {
          setCamera(
            enterPlay(
              focusCamera(
                { ...c, zoom: GRAPHICS.defaultZoom },
                p.x + 0.5,
                p.y + 0.5,
                sizeRef.current,
              ),
            ),
          )
          return
        }
      }
      onTile(p.x, p.y)
    })
  const ghostKey = ghost ? `${ghost.id}:${ghost.uid ?? ''}` : ''
  useEffect(() => {
    if (!ghost) return
    interacted.current = true
    const d = buildingDef(ghost.id)
    setOverview(false)
    overviewRef.current = false
    setCamera(c =>
      focusCamera(
        { ...c, zoom: Math.max(GRAPHICS.defaultZoom, c.zoom) },
        ghost.x + d.w / 2,
        ghost.y + d.h / 2,
        sizeRef.current,
      ),
    )
  }, [ghostKey])
  const showOverview = () => {
    interacted.current = true
    if (overviewRef.current) {
      setOverview(false)
      overviewRef.current = false
      const previous = lastPlay.current
      setCamera(
        previous
          ? { ...previous, y: previous.y + (sizeRef.current.h - lastPlayHeight.current) / 2 }
          : playCamera(sizeRef.current, s.yard.buildings),
      )
      return
    }
    lastPlay.current = cameraRef.current
    lastPlayHeight.current = sizeRef.current.h
    setOverview(true)
    overviewRef.current = true
    const top = Math.min(
      -32,
      ...s.yard.buildings.map(b => {
        const d = buildingDef(b.defId)
        const im = spriteImageFor(b.defId, b.level)
        return (b.y + d.h) * TILE - (im ? im.ay * im.scale : d.h * TILE) - 16
      }),
    )
    setCamera(overviewCamera(sizeRef.current, s.yard.ownedParcels, top))
  }
  useEffect(() => {
    if (!landMode) return
    lastPlay.current = cameraRef.current
    lastPlayHeight.current = sizeRef.current.h
    setOverview(true)
    overviewRef.current = true
    const all = Array.from({ length: 12 }, (_, i) => `${i % 4},${Math.floor(i / 4)}`)
    setCamera(overviewCamera(sizeRef.current, all))
  }, [landMode])
  const gate = s.yard.buildings.find(b => b.defId === 'gate')
  const worldRaw = useImage(tdAtlasSrc)
  const terrain = usePixelTerrain()
  const world = useMemo(() => (worldRaw ? normalizeAtlas(worldRaw) : null), [worldRaw])
  useEffect(() => () => world?.dispose(), [world])
  const ambient = !reduced && s.settings.ambient !== false
  const gates = s.yard.buildings.filter(b => b.defId === 'gate')
  const gateKey = gates.map(g => `${g.x},${g.y}`).join(';')
  const fences = useMemo(
    () => fenceSections(s.yard.ownedParcels, gates),
    [s.yard.ownedParcels, gateKey],
  )
  const groundChunks = useMemo(() => {
    const commands = groundCommands(s.yard.ownedParcels, gates),
      chunks = []
    for (let y = bounds.y; y < bounds.y + bounds.height; y += GRAPHICS.chunk)
      for (let x = bounds.x; x < bounds.x + bounds.width; x += GRAPHICS.chunk) {
        const surface = Skia.Surface.Make(
          GRAPHICS.chunk * GRAPHICS.artDensity,
          GRAPHICS.chunk * GRAPHICS.artDensity,
        )
        if (!surface) continue
        const c = surface.getCanvas()
        c.scale(GRAPHICS.artDensity, GRAPHICS.artDensity)
        c.translate(-x, -y)
        const paint = Skia.Paint()
        paint.setAntiAlias(false)
        for (const a of commands.filter(
          a =>
            a.kind === 'rect' &&
            a.x < x + GRAPHICS.chunk &&
            a.x + a.w > x &&
            a.y < y + GRAPHICS.chunk &&
            a.y + a.h > y,
        )) {
          const tile = a.kind === 'rect' && a.w === TILE && a.h === TILE && terrain?.[a.color]
          if (tile && a.kind === 'rect')
            c.drawImageRectOptions(
              tile,
              Skia.XYWHRect(0, 0, 64, 64),
              Skia.XYWHRect(a.x, a.y, TILE, TILE),
              FilterMode.Nearest,
              MipmapMode.None,
              paint,
            )
          else drawCommands(c, [a], false)
        }
        paint.dispose()
        surface.flush()
        chunks.push({ x, y, image: surface.makeImageSnapshot() })
        surface.dispose()
      }
    return chunks
  }, [s.yard.ownedParcels, gateKey, terrain])
  useEffect(() => () => groundChunks.forEach(c => c.image.dispose()), [groundChunks])
  const staticPicture = useMemo(() => {
    const recorder = Skia.PictureRecorder(),
      canvas = recorder.beginRecording(bounds),
      paint = Skia.Paint()
    for (const c of groundChunks)
      canvas.drawImageRectOptions(
        c.image,
        Skia.XYWHRect(
          0,
          0,
          GRAPHICS.chunk * GRAPHICS.artDensity,
          GRAPHICS.chunk * GRAPHICS.artDensity,
        ),
        Skia.XYWHRect(c.x, c.y, GRAPHICS.chunk, GRAPHICS.chunk),
        FilterMode.Nearest,
        MipmapMode.None,
        paint,
      )
    drawCommands(canvas, yardGround(s.yard.ownedParcels, !!ghost, true), false)
    for (const b of s.yard.buildings) {
      const d = buildingDef(b.defId)
      if (d.category === 'deco' || b.defId === 'road') continue
      drawCommands(
        canvas,
        [
          rect(b.x * TILE + 2, b.y * TILE + 2, d.w * TILE, d.h * TILE, '#22313D25'),
          rect(b.x * TILE, b.y * TILE, d.w * TILE, d.h * TILE, '#8E9B91'),
          rect(b.x * TILE + 1, b.y * TILE + 1, d.w * TILE - 2, d.h * TILE - 2, '#D0D3BF'),
        ],
        false,
      )
    }
    if (landMode) {
      paint.setStyle(1)
      paint.setStrokeWidth(2)
      for (let y = 0; y < 3; y++)
        for (let x = 0; x < 4; x++) {
          paint.setColor(
            Skia.Color(s.yard.ownedParcels.includes(`${x},${y}`) ? '#55844F' : '#D9A541'),
          )
          canvas.drawRect(Skia.XYWHRect(x * 256 + 2, y * 256 + 2, 252, 252), paint)
        }
    }
    paint.dispose()
    return recorder.finishRecordingAsPicture()
  }, [groundChunks, s.yard.ownedParcels, s.yard.buildings, !!ghost, landMode])
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
    ...scenicProps.map(p => ({
      depth: p.y + artDefinition(p.id).h,
      kind: 'scenery' as const,
      p,
    })),
    ...fences.map(f => ({ depth: f.depth, kind: 'fence' as const, f })),
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
        drawBuilding(
          canvas,
          loaded,
          b.defId === 'gate' && b.x === 0 && b.y > 0 ? 'gate_w' : b.defId,
          b.level,
          d.accent,
        )
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
      if (entry.kind === 'scenery') {
        const p = entry.p,
          d = artDefinition(p.id)
        canvas.translate((p.x + d.w / 2) * TILE, (p.y + d.h) * TILE)
        drawBuilding(canvas, loaded, p.id, p.level, '')
      } else if (entry.kind === 'fence') drawCommands(canvas, entry.f.commands, false)
      else if (entry.kind === 'building') {
        const target = ghost ?? s.yard.buildings.find(b => b.uid === selectedUid)
        let faded = false
        if (target) {
          const td = buildingDef('id' in target ? target.id : target.defId),
            b = entry.b,
            d = buildingDef(b.defId),
            img = spriteImageFor(b.defId, b.level)
          const tx = (target.x + td.w / 2) * TILE,
            ty = (target.y + td.h / 2) * TILE
          const left = (b.x + d.w / 2) * TILE - (img?.ax ?? (d.w * TILE) / 2)
          const bottom = (b.y + d.h) * TILE,
            top = bottom - (img?.ay ?? d.h * TILE)
          faded =
            b.uid !== selectedUid &&
            frontDepth(b) > target.y + td.h &&
            tx >= left &&
            tx < left + (img?.w ?? d.w * TILE) &&
            ty > top &&
            ty < bottom
        }
        if (faded) {
          const paint = Skia.Paint()
          paint.setAlphaf(0.3)
          canvas.saveLayer(paint)
          paint.dispose()
        }
        canvas.drawPicture(buildingPictures[entry.b.uid])
        if (faded) canvas.restore()
        const b = entry.b,
          d = buildingDef(b.defId),
          p = toScreen(b.x, b.y)
        canvas.translate(p.x + (d.w * TILE) / 2, p.y + d.h * TILE)
        // Height of the art (or box) above the slab's bottom, for smoke, sparkles and lights.
        const img = spriteImageFor(b.defId, b.level)
        const top = img ? img.ay * img.scale : d.h * TILE + 20
        const emitter = img?.emitter ?? buildingSocket(b.defId)
        if (world && ambient && ['cdu', 'cracker'].includes(b.defId))
          drawSmoke(canvas, world, visualTime, emitter.x, emitter.y)
        else if (!reduced && ['cdu', 'cracker'].includes(b.defId)) {
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
        if (b.defId === 'flare') {
          const flicker = ambient ? Math.floor(visualTime * 8) % 4 : 1,
            yy = emitter.y
          drawCommands(
            canvas,
            [
              rect(-3, yy - 11 - flicker, 6, 12 + flicker, '#E88239'),
              rect(-1, yy - 8 - flicker, 3, 10 + flicker, '#FFC94A'),
              rect(0, yy - 4, 2, 4, '#F3E5BE'),
            ],
            false,
          )
        }
        if (b.defId === 'gate') {
          const west = b.x === 0 && b.y > 0,
            open = truckNearGate
          drawCommands(
            canvas,
            west
              ? [
                  rect(0, -44, 3, open ? 8 : 32, '#22313D'),
                  rect(1, -43, 1, open ? 6 : 29, '#D35348'),
                ]
              : [
                  rect(-12, -24, open ? 3 : 24, 3, '#22313D'),
                  rect(-11, -23, open ? 1 : 22, 1, '#D35348'),
                ],
            false,
          )
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
        if (b.level >= 5 && spriteTierFor(b.defId, b.level) !== 5)
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
        drawBuilding(
          canvas,
          loaded,
          g.id === 'gate' && g.x === 0 && g.y > 0 ? 'gate_w' : g.id,
          level,
          d.accent,
        )
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
    fences,
    selectedUid,
    truckNearGate,
  ])
  return (
    <View
      style={{ flex: 1 }}
      onLayout={e => {
        const w = e.nativeEvent.layout.width,
          h = e.nativeEvent.layout.height
        setSize({ w, h })
        sizeRef.current = { w, h: Math.max(120, h * (1 - lift) - bottomInset) }
        if (ready && !centered.current && h > 0) {
          // Open with the owned land in the middle of the view instead of empty sky.
          centered.current = true
          setCamera(
            playCamera({ w, h: Math.max(120, h * (1 - lift) - bottomInset) }, s.yard.buildings),
          )
        }
      }}
    >
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch, tap)}>
        <Canvas style={{ flex: 1, backgroundColor: world ? seaColor : yardColors.backdrop }}>
          <Group
            transform={[
              { translateX: PixelRatio.roundToNearestPixel(size.w / 2 + camera.x) },
              { translateY: PixelRatio.roundToNearestPixel(camera.y + liftY) },
              { scale: camera.zoom },
            ]}
          >
            <Picture picture={staticPicture} />
            <Picture picture={dynamicPicture} />
          </Group>
        </Canvas>
      </GestureDetector>
      {overview && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 10,
            top: 10,
            backgroundColor: '#FFF6E3',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#22313D',
          }}
        >
          <Text style={{ fontFamily: 'Kanit_400Regular', fontSize: 12 }}>
            {text({
              en: landMode ? 'Land overview' : 'Overview · tap to return to play',
              th: landMode ? 'ภาพรวมที่ดิน' : 'ภาพรวม · แตะเพื่อกลับมุมเล่น',
            })}
          </Text>
        </View>
      )}
      <View style={{ position: 'absolute', right: 10, bottom: 10, gap: 6 }}>
        {[
          {
            id: 'out',
            label: text({ en: 'Zoom out', th: 'ย่อ' }),
            icon: <Minus size={18} />,
            act: () => {
              interacted.current = true
              setCamera(c =>
                enterPlay(
                  zoomAt(
                    c,
                    [...ZOOMS].reverse().find(z => z < c.zoom - 0.01) ?? MIN_ZOOM,
                    view.w / 2,
                    view.h / 2,
                    view,
                  ),
                ),
              )
            },
          },
          {
            id: 'in',
            label: text({ en: 'Zoom in', th: 'ขยาย' }),
            icon: <Plus size={18} />,
            act: () => {
              interacted.current = true
              setCamera(c =>
                enterPlay(
                  zoomAt(
                    c,
                    ZOOMS.find(z => z > c.zoom + 0.01) ?? MAX_ZOOM,
                    view.w / 2,
                    view.h / 2,
                    view,
                  ),
                ),
              )
            },
          },
          {
            id: 'center',
            label: text(
              overview
                ? { en: 'Return to play', th: 'กลับมุมเล่น' }
                : { en: 'Yard overview', th: 'ดูภาพรวมลาน' },
            ),
            icon: <Scan size={18} />,
            act: showOverview,
          },
        ].map(b => (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            accessibilityLabel={b.label}
            onPress={b.act}
            style={{
              width: 44,
              height: 44,
              borderWidth: 2,
              borderRadius: 5,
              backgroundColor: b.id === 'center' && overview ? '#FFE1A3' : '#FFF6E3',
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
