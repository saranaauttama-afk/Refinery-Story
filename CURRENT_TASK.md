# CURRENT_TASK

## Branch

`feature/ui-skeleton-v1`

## Current State

UI Foundation is complete. Factory Scene experiments are in progress.
The screen architecture is now layered (not a dashboard stack), but the
refinery scene still does not fully resemble the intended Kairosoft-style
management game. Documentation consolidation pass is in progress.

---

## Completed Work

### UI Foundation Phase 1 — 5-Tab Navigation Skeleton
- Factory tab
- Production tab
- Staff tab
- Business tab
- HQ tab (placeholder)
- Stats tab hidden from nav (still in code)

### UI Foundation Phase 2A — Factory Cleanup / Grid-First Layout
- Compact header with inline time
- Primary resources only (Money / Crude / Gas)
- Goal card compressed
- Grid made more prominent

### UI Foundation Phase 2B — Production Extraction
- Production Overview moved out of Factory
- Non-gasoline inventory surfaced in Production tab
- Automation moved to Production tab
- Factory now focuses on grid, goal, and buy/sell core loop

### UI Foundation Phase 2C — Production Health & Bottlenecks
- Production Health card added to Production tab
- Bottlenecks card added to Production tab
- Production tab explains operational problems using derived state

### Visual Layer Phase 1 — Building Identity System
- Per-building icons via `BUILDING_TILE_ICONS`
- Category accent colors via `BUILDING_CATEGORY_ACCENT`
- Category surface colors via `BUILDING_CATEGORY_SURFACE`
- Level badges (L1/L2/L3) on occupied tiles
- Staff and status badge foundations

### Visual Layer Phase 2 — Silhouette & Scene Experiments
- `BuildingSilhouette` component added
- Abbreviation-first tiles replaced with silhouette-first tiles
- Factory tab converted from dashboard stack to layered scene composition:
  - `StyleSheet.absoluteFillObject` background (sky + horizon + yard)
  - Grid positioned absolute in lower ~70 % of scene
  - HUD floating (name, level, time, events button)
  - Resource strip floating at sky/yard boundary
  - Goal chip compact one-line pill
  - Buy/Sell floating above bottom nav

---

## Factory Map Visual Prototype (in progress, NOT YET REVIEWED)

This is a **visual-only prototype**, gated behind a feature flag so it
can be reverted instantly. Per the brief that produced it: do not change
gameplay logic, save format, or building placement data; do not remove
the current grid interactions; do not commit until screenshots are
reviewed.

### What this is

`src/components/FactoryMapView.tsx` is a new, alternate way to render
the SAME grid data (`game.grid` / `game.gridLevels`, same row/col index
math as before) -- instead of `BuildingGrid.tsx`'s equal white square
cards in a flexWrap table, cells are absolutely positioned "placed
objects on a yard" using a simple 2.5D offset (not true isometric
projection):

```
x = col * tileWidth + row * rowOffset   (rowOffset = 18)
y = row * tileHeight * 0.72
```

Lower rows sit slightly below AND overlap upward into the row above
(controlled ~28% overlap via the `* 0.72` vertical step, not full
isometric overlap, which is closer to 50% and was a real problem in an
earlier separate branch's isometric attempt -- documented there as a
cautionary reference, not reused here). Stacking order is `zIndex = row`
so closer-to-camera rows always draw on top.

- Empty cells render as a faint rounded "placement pad" (no dashed-card
  look).
- Occupied cells reuse the existing `BuildingSilhouette` component
  (already gives every one of the 17 building types a distinct shape --
  tanks/distillation towers/factories/lab/workshop/power/waste -- via
  `lucide-react-native` icons, not waiting on any new art) sitting on a
  small "concrete pad," with a small deterministic per-cell pixel jitter
  (based on cell index, not random, so it's stable across re-renders)
  so buildings don't look perfectly grid-snapped.
- Level badge, staff badge, and status (warning/blocked/idle) badge are
  unchanged -- reused via the existing `getTileStaffBadge` /
  `getTileStatusBadge` helpers from `buildingIdentity.ts`.
- Tap an empty pad -> same `onCellPress` callback as before -> opens
  Build. Tap an occupied object -> same callback -> opens Inspect. Used
  `Pressable` (not a raw `onTouchEnd` handler, which was tried first and
  reverted -- `Pressable` is the standard, safer choice for reliable tap
  detection without accidentally swallowing/missing taps).

### Feature flag

`USE_FACTORY_MAP_PROTOTYPE` in `app/game/(tabs)/index.tsx` (currently
`true`). Set to `false` to instantly revert to `BuildingGrid` -- no
other code needs to change. `BuildingGrid.tsx` itself was not touched.

### Current concern

The main risk to watch for is the same class of bug a separate branch's
isometric prototype ran into: tiles overlapping enough to make tapping
inaccurate, or the build/inspect flow breaking because a touch lands on
the wrong cell or gets eaten by something else. This prototype's overlap
is much smaller (~28%, not ~50%) specifically to avoid that, and uses
`Pressable` rather than a manual touch handler, but it has NOT been
visually verified on a device or simulator yet -- this needs screenshot
review (and ideally a real tap-through pass) before it's trusted, and
before any of this is committed.

### Not done / explicitly out of scope for this pass

- The 8 building types without a distinct shape match yet just inherit
  whatever `BuildingSilhouette` already does for them (it covers all 17,
  but some of the newer ones -- Power Plant, Waste Treatment, Polymer
  Plant, the 5 Tank Farm buildings -- may look more generic than the
  original 9). Not a regression from `BuildingGrid` (same silhouettes,
  same coverage), just worth a second look in review.
- No pan/zoom, no true isometric math -- explicitly deferred per the
  brief ("It does not need real isometric math yet").
- No roads/pipes/yard decoration between buildings -- that's the
  separately-tracked Visual Layer Phase 3A (see Next Recommended Task
  below), independent of this prototype.

---

## Factory Isometric Prototype (second attempt, in progress, NOT YET REVIEWED)

A second, separate prototype, per explicit correction after reviewing
the first one: the first prototype (`FactoryMapView.tsx` above) used a
shallow 2.5D offset, not a true isometric projection, and the request
was specifically for the real thing -- the classic diamond-shaped board
projection used by Kairosoft / RollerCoaster Tycoon / Transport Tycoon
style games.

### What this is

`src/components/FactoryIsometricView.tsx` -- same grid data, same
interactions, same badges as `FactoryMapView.tsx` (see that section
above for everything that didn't change), but with the actual isometric
formula instead of a shallow offset:

```
x = (col - row) * (footprintWidth / 2)
y = (col + row) * (footprintHeight / 2)
```

### Why a true-isometric attempt didn't go badly THIS time

A true isometric formula like this one was actually tried once before,
on a separate branch (`feature/pannable-zoomable-grid-overlay-hud`), and
produced a visibly broken result -- tiles overlapping into an
unreadable mess. That earlier attempt is a useful cautionary reference
for what NOT to repeat: it used one square size for both the ground
footprint AND the rendered tile content, so adjacent depth levels
(`row+col` differing by 1) were only `footprintHeight/2` apart vertically
while the tile content was a full `footprintHeight` tall -- guaranteed
~50% overlap between every tile and its diagonal neighbor, with no
visual hierarchy (just two identical squares stacking), so the overlap
read as noise rather than depth.

The actual fix isn't to eliminate overlap -- real isometric rendering
*depends* on overlap (a tall building's sprite is supposed to visually
extend in front of/above the tile behind it; that's literally how depth
is communicated without true 3D). The fix is separating two things that
got conflated before:

1. **Ground footprint** -- a small flat diamond at the exact isometric
   coordinate, using the correct 2:1 width:height tile ratio so adjacent
   footprints tile together cleanly with no gaps or excess overlap
   between the *ground* itself.
2. **Building sprite** -- drawn on top of the footprint, taller than it,
   anchored so its base sits on the footprint and explicitly ALLOWED to
   extend upward past the footprint's edge into the row "behind" it on
   screen. `zIndex = row + col` (depth) ensures a building always draws
   over anything further back, so that expected overlap reads as "this
   building is in front of that tile," not "these two things are
   stacked randomly."

Reused the existing `BuildingSilhouette` component for the sprite (same
as the first prototype) -- still gives all 17 building types a distinct
shape without needing new art.

### Feature flag

Both prototypes now share one switch, `FACTORY_VIEW_MODE` in
`app/game/(tabs)/index.tsx`, a 3-way string union instead of a boolean:
`'grid'` (original `BuildingGrid`, default), `'map2_5d'`
(`FactoryMapView`, first prototype), `'isometric'` (`FactoryIsometricView`,
this one). Currently set to `'grid'` -- per the brief for this prototype
("do not replace the current Factory implementation yet"), the live
Factory screen is untouched until this is explicitly reviewed and the
flag flipped.

### Known limitation (explicitly not fixed, out of scope per the brief)

`BuildingSilhouette`'s internal containers are hardcoded sizes (~44-46px)
-- the `size` prop only scales the platform/icon details inside, not the
container itself. At small grid sizes (3x3, where the computed
footprint is large) the silhouette will look small/lost relative to its
pad; at large grid sizes (6x6, small footprint) it may overflow its pad
slightly. Reworking `BuildingSilhouette` to scale properly would cross
into "new card styling," which the brief explicitly says not to spend
effort on for this pass (focus is projection/positioning/depth/layering
only) -- noted here for whoever picks this up next rather than fixed
silently or fixed against the brief's explicit instruction.

### Current concern

Same class of risk as the first prototype: tap accuracy for build/
inspect, given buildings are now deliberately overlapping their
neighbors on screen (by design, see above) -- needs visual/hands-on
verification that taps still land on the intended cell even where
sprites visually overlap, since this environment has no device/simulator
to verify that directly. Not committed -- pending screenshot review,
per the brief.

---

## Current Status

| Area | Status |
|---|---|
| 5-tab navigation | ✅ complete |
| Factory scene architecture (layered) | ✅ complete |
| Factory visual identity (Kairosoft-like) | 🔄 in progress |
| Production health / bottlenecks | ✅ complete |
| Building silhouettes | 🔄 partial |
| Factory Map visual prototype (non-card layout) | 🔄 prototype, pending screenshot review |
| Factory Isometric prototype (true projection) | 🔄 prototype, pending screenshot review |
| Roads / pipes / yard detail | ❌ not started |
| HQ progression hub | ❌ not started |
| Day/night visual impact | 🔄 minimal |
| Workers / trucks / logistics | ❌ future |
| Era visual progression | ❌ future |

---

## Known Issues

- Require cycle: `gameCalculations.ts → recruitment.ts → gameCalculations.ts`
- Expo Linking scheme warning (build-time config, not app code)
- Android emulator instability — emulator-level, not app code
- `Stats` screen hidden from tabs intentionally
- Windows: use `cmd /c npm run typecheck` or `npx tsc --noEmit` directly

---

## Files Changed on This Branch

- `CURRENT_TASK.md`
- `app/game/(tabs)/_layout.tsx`
- `app/game/(tabs)/index.tsx`
- `app/game/(tabs)/production.tsx`
- `app/game/(tabs)/hq.tsx`
- `src/components/BuildingGrid.tsx`
- `src/components/FactoryMapView.tsx` (new -- prototype, see above)
- `src/components/FactoryIsometricView.tsx` (new -- second prototype, see above)
- `src/components/BuildingTile.tsx`
- `src/components/BuildingSilhouette.tsx`
- `src/buildingIdentity.ts`
- `src/theme.ts`
- `app.json`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `eas.json`
- `Doc/` (multiple docs added/updated)
- `PROJECT_UI_AUDIT.md`

---

## Next Recommended Task

See `Doc/NEXT_TASK.md` for the full recommendation.

**Short version:** Visual Layer Phase 3A — Road & Yard Foundation.
Add pipe/road connectors between building tiles as decorative non-interactive
elements. No assets, no animation. Builds on the current layered composition.
