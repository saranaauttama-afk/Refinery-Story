# CURRENT_TASK

## Branch

`feature/ui-skeleton-v1`

## Current State

UI Foundation is complete. The branch has now finished a stabilization
milestone before any further visual direction work.

This branch is no longer focused on "make it prettier first." The current
goal was to restore visible access to hidden systems, clarify screen
ownership, and put the Factory renderer back onto the safest reviewed live
path.

---

## Completed Work

### UI Foundation Phase 1 - 5-Tab Navigation Skeleton
- Factory tab
- Production tab
- Staff tab
- Business tab
- HQ tab
- Stats tab hidden from nav (still in code)

### UI Foundation Phase 2A - Factory Cleanup / Grid-First Layout
- Compact header with inline time
- Primary resources only (Money / Crude / Gas)
- Goal card compressed
- Grid made more prominent

### UI Foundation Phase 2B - Production Extraction
- Production Overview moved out of Factory
- Non-gasoline inventory surfaced in Production tab
- Automation moved to Production tab
- Factory now focuses on grid, goal, and buy/sell core loop

### UI Foundation Phase 2C - Production Health & Bottlenecks
- Production Health card added to Production tab
- Bottlenecks card added to Production tab
- Production tab explains operational problems using derived state

### Visual Layer Phase 1 - Building Identity Experiments
- Per-building icons via `BUILDING_TILE_ICONS`
- Category accent colors via `BUILDING_CATEGORY_ACCENT`
- Category surface colors via `BUILDING_CATEGORY_SURFACE`
- Level badges on occupied tiles
- Staff and status badge foundations

### Visual Layer Phase 2 - Layered Scene Experiments
- `BuildingSilhouette` component added
- Abbreviation-first tiles replaced with silhouette-first tiles
- Factory tab converted from dashboard stack to layered scene composition
- 2.5D and isometric renderer prototypes added behind constants

### Stabilized In This Task
- HQ now exposes visible Refinery Growth / Expansion access
- HQ now exposes visible save tools, rename, settings access, and main menu access
- HQ now owns visible progression summaries:
  - Achievements entry
  - Research/business entry
  - Awards / Era summary
  - Expansion / Growth
  - Save tools
  - Settings access
- Factory renderer default was reset to the safest reviewed live renderer:
  `grid`
- Prototype renderers remain available through `FACTORY_VIEW_MODE`
- Factory Events button no longer uses a gear icon or looks like Settings

---

## Current Live UI State

### Factory
- Layered scene composition remains active
- Live default renderer is `BuildingGrid`
- `FactoryMapView` and `FactoryIsometricView` remain available as prototypes only
- Top-right button is explicitly Events, not Settings
- Trade remains the floating collapsible pill + modal panel

### Production
- Owns Production Health
- Owns Bottlenecks
- Owns Production Overview
- Owns inventory management for non-gasoline products
- Owns automation settings and feedstock priority

### HQ
- No longer placeholder-only
- Owns visible player access to growth, milestone/progression summaries, and company tools

### Stats
- Still exists in code as a hidden legacy route
- No longer the intended visible owner of expansion/save/settings access

---

## Deferred / Lost Surfaces To Remember

- Boost UI still exists in logic, but there is no strong visible Factory surface for it right now
- Current Contract context is no longer surfaced on Factory
- Rankings/history still lack a durable visible home:
  year-end ranking appears in `AwardModal`, HQ only summarizes
- Stats route still exists as hidden legacy ownership

---

## Current Concerns

- Factory still does not fully feel like a living refinery
- 2.5D / isometric direction still needs screenshot or device review before becoming live
- Building renderer split remains a risk:
  `BuildingGrid/BuildingTile/BuildingSilhouette` vs `FactoryIsometricView`
- Boost UI may need restoration or a clearer owner
- Rankings / award history still need stronger visible ownership
- Require cycle warning remains:
  `gameCalculations.ts -> recruitment.ts -> gameCalculations.ts`
- Expo linking `scheme` warning remains

---

## Files Changed In Stabilization

- `app/game/(tabs)/hq.tsx`
- `app/game/(tabs)/index.tsx`
- `src/components/FactoryIsometricView.tsx`
- `CURRENT_TASK.md`
- `Doc/UI_STATUS.md`
- `Doc/UI_CONCERNS.md`
- `Doc/NEXT_TASK.md`

---

## Next Recommended Task

See `Doc/NEXT_TASK.md` for the full recommendation.

**Short version:** `Factory Map Projection Prototype Review`

The next task should review the existing Factory renderer options (`grid`,
`map2_5d`, `isometric`) with the user before any new visual pass. Do not
start roads/pipes/animations or a new isometric pass until that review is
done.
