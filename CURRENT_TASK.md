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

## Current Status

| Area | Status |
|---|---|
| 5-tab navigation | ✅ complete |
| Factory scene architecture (layered) | ✅ complete |
| Factory visual identity (Kairosoft-like) | 🔄 in progress |
| Production health / bottlenecks | ✅ complete |
| Building silhouettes | 🔄 partial |
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
