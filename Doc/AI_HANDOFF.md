# AI Handoff — Refinery Story

Branch: `feature/ui-skeleton-v1`
Last updated: 2026-06-18

This document is written for an AI agent or developer joining the project
with no prior context. Read this before making any changes.

---

## Project

**Refinery Story** — a mobile management simulation game about running an
oil refinery. Players buy crude, refine it into gasoline and specialty
products, manage staff, fulfill contracts, and upgrade their facility.

Think Kairosoft (Game Dev Story, Hot Springs Story) but industrial /
oil industry themed.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React Native via Expo (SDK 52+) |
| Language | TypeScript (strict-ish) |
| Routing | Expo Router (file-based) |
| State | React Context + custom game loop hooks |
| Persistence | AsyncStorage (JSON save format) |
| UI | React Native StyleSheet — no UI library |
| Icons | `lucide-react-native` |
| Animations | `react-native-reanimated` v4 |
| Safe area | `react-native-safe-area-context` |

---

## Repository Structure

```
app/
  game/
    (tabs)/
      _layout.tsx       ← floating pill tab bar (5 visible tabs)
      index.tsx         ← Factory screen (primary gameplay)
      production.tsx    ← Production / inventory / automation
      staff.tsx         ← Staff hiring and management
      business.tsx      ← Contracts and reputation
      hq.tsx            ← HQ (placeholder — not complete)
      stats.tsx         ← Hidden from nav, kept for future use

src/
  components/
    BuildingGrid.tsx       ← grid layout + tile iteration
    BuildingTile.tsx       ← individual tile with silhouette + badges
    BuildingSilhouette.tsx ← building-type visual shape component
    AnimatedPressable.tsx  ← spring-animated tap wrapper
    FloatingNumbers.tsx    ← +$500 / -$200 animations
    Sheet.tsx              ← bottom drawer modal
    ProgressBar.tsx        ← reusable bar
    StatBoxRow.tsx         ← stat chip row (used in other tabs)
    ResourceBar.tsx        ← resource display (used in other tabs)
    ListRow.tsx            ← modal list item with action button
    ...

  buildingIdentity.ts     ← building icon map, category colors, badge logic
  theme.ts                ← colors, spacing, radii, FLOATING_TAB_BAR_CLEARANCE

  game/
    data/
      buildings.ts        ← building definitions (name, cost, description)
      balance.ts          ← all numeric game balance constants
      workers.ts          ← worker type definitions
      contracts.ts        ← contract definitions
      hiddenEvents.ts     ← hidden event definitions
      recruitment.ts      ← worker recruitment pool
      milestones.ts       ← milestone / goal definitions

    types.ts              ← GameState, DerivedStats, GridCell, BuildingType, etc.

    utils/
      gameCalculations.ts ← all derived stat calculations (pure functions)

  hooks/
    GameContext.tsx        ← React Context provider, game actions
    useGameLoop.ts         ← tick-based game loop, all state mutations
    useFloatingNumbers.ts  ← floating number animation state
    useHaptics.ts          ← haptic feedback wrapper
```

---

## Critical Rules

### 1. Preserve Save Compatibility
`GameState` in `src/game/types.ts` defines the save format. Never add
non-optional fields to `GameState` without a migration in `useGameLoop.ts`.
Breaking saves breaks existing players. This is the highest-priority constraint.

### 2. Never Rewrite Working Systems
If the game loop works, leave it alone. If the build picker works, leave
the Sheet + ListRow structure alone. Incremental changes only.

### 3. Mobile-First
All layout decisions must work at 375 px screen width (iPhone SE).
Test on the narrowest target device, not just a wide simulator.

### 4. Layered Factory Composition — Do Not Revert
The Factory screen uses `position: 'absolute'` layers, not a vertical
`ScrollView` stack. Never convert it back to a dashboard. See `Doc/UI_VISION.md`.

The layer model is:
```
Layer 0 (z:0)  — absoluteFill background (sky + horizon + yard)
Layer 1 (z:10) — Grid (absolute, top=yardTop)
Layer 2 (z:20) — HUD (name/level, time/events)
Layer 3 (z:20) — Resource strip + goal chip
Layer 4 (z:20) — Buy/Sell action buttons
```

### 5. Typecheck Before Committing
Always run `npx tsc --noEmit` (or `cmd /c npm run typecheck` on Windows)
before committing. The project is TypeScript throughout. A failing typecheck
is a broken commit.

### 6. No Image Assets Yet
All visual work must use React Native `View` compositions, colors, and
borders. No PNG/SVG/Lottie assets until a dedicated art pipeline exists.

### 7. No Isometric Math Yet
The grid is top-down / orthographic. Isometric rendering is a future
phase. Do not add isometric transforms.

### 8. Do Not Over-Engineer
Do not add unnecessary abstractions. Do not create new components for
one-time uses. Do not add configuration layers. The codebase is deliberately
pragmatic.

---

## Current Branch Goal

Transition from dashboard UI to a scene-based refinery management UI.

Status: Architecture is correct (layered). Visual identity of the refinery
scene is still in progress.

See `Doc/UI_STATUS.md` for full current state.
See `Doc/UI_CONCERNS.md` for known problems.
See `Doc/NEXT_TASK.md` for the recommended next step.
See `Doc/UI_VISION.md` for the intended visual direction.

---

## Key Constants

```ts
// src/theme.ts
FLOATING_TAB_BAR_CLEARANCE = 100  // bottom padding for all tab screens

// app/game/(tabs)/index.tsx
SKY_RATIO    = 0.12   // sky is 12 % of scene height
HORIZON_H    = 14     // horizon strip height in px
RESOURCE_H   = 38     // resource strip height in px
GOAL_H       = 28     // goal chip height in px
```

---

## Common Gotchas

**Windows development:**
`npm run typecheck` may fail due to PowerShell execution policy.
Use `cmd /c npm run typecheck` or `npx tsc --noEmit` directly.

**Require cycle:**
`gameCalculations.ts → recruitment.ts → gameCalculations.ts` produces a
Metro bundler warning. It does not cause a runtime error currently.
Do not introduce more cycles.

**SafeAreaView edges:**
Factory uses `edges={['top']}` — bottom edge is NOT protected by SafeAreaView.
The tab bar is `position: 'absolute'` and floats over content.
All scrollable content needs `paddingBottom: FLOATING_TAB_BAR_CLEARANCE`.

**marginLeft: 'auto':**
React Native does not support `marginLeft: 'auto'` in all layout contexts.
Use `justifyContent: 'space-between'` or a `flex: 1` spacer View instead.

**zIndex stacking:**
React Native zIndex applies within a stacking context. If an element is
not appearing above another, check that both are in the same stacking
context or that the parent does not clip/isolate.

---

## Commit Message Convention

```
type: description

ui: convert factory to layered scene layout
docs: consolidate ui direction and handoff status
fix: correct resource strip layout on narrow screens
feat: add pipe connectors between building tiles
```

Types used in this branch: `ui`, `docs`, `fix`, `feat`, `chore`

---

*Last commit on branch at time of writing: `e253379`*
