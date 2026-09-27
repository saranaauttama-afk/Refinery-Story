# UI Status - Master Handoff Document

Branch: `feature/ui-skeleton-v1`  
Last updated: 2026-06-19

---

## A. Current Architecture

### Factory (`app/game/(tabs)/index.tsx`)

The primary gameplay screen. Responsible for:

- live grid/build/inspect loop
- layered scene background (sky + horizon + yard)
- floating HUD (refinery name, level, time)
- visible Events entry
- floating resource strip
- compact goal chip
- floating trade pill and trade modal
- Build / Info / More Info / Events sheets

Important live-state note:

- the reviewed live renderer is currently `BuildingGrid`
- `FactoryMapView` and `FactoryIsometricView` remain available as prototype renderers behind `FACTORY_VIEW_MODE`

Factory does NOT currently own:

- production health
- bottleneck summaries
- durable awards/rankings history
- research UI

### Production (`app/game/(tabs)/production.tsx`)

Responsible for:

- Production Health
- Bottlenecks
- Production Overview
- inventory visibility for secondary products
- sell-all actions for secondary products
- automation settings
- feedstock priority

### Staff (`app/game/(tabs)/staff.tsx`)

Responsible for:

- recruitment
- training
- employee roster
- specialist assignment

### Business (`app/game/(tabs)/business.tsx`)

Responsible for:

- contracts
- research unlocks
- perks
- crude shipments
- standing orders

### HQ (`app/game/(tabs)/hq.tsx`)

HQ is now the visible progression and company-tools hub. It owns player
access to:

- achievements entry
- research/business entry
- awards / era summary
- refinery growth / expansion
- rename refinery
- manual save
- settings access
- main menu access
- reset save access behind confirmation

### Stats (`app/game/(tabs)/stats.tsx`)

Still exists in code, but hidden from the tab bar via `href: null`.

Current role:

- legacy hidden route
- no longer the intended visible owner of expansion, save tools, or settings access

---

## B. Current Navigation Ownership

Visible bottom tabs:

- Factory
- Production
- Staff
- Business
- HQ

Hidden route still present:

- Stats

Top-level ownership summary:

| Area | Visible owner now |
| --- | --- |
| Core play / build / inspect | Factory |
| Production status / automation | Production |
| Staff management | Staff |
| Contracts / research / shipments | Business |
| Progression hub / growth / company tools | HQ |
| Legacy utility route | hidden Stats |

This means the 5-tab navigation is now functionally honest for the main
player path, even though the hidden Stats route still exists in code.

---

## C. Current Factory Layout

The Factory screen still uses layered composition rather than a dashboard
stack.

### Layer 0 - Background

- sky
- horizon strip
- yard ground
- decorative road bands
- optional night overlay

### Layer 1 - Grid

- `ScrollView`
- live renderer currently `BuildingGrid`
- build/inspect hint text

### Layer 2 - HUD

- refinery name + level pill
- time chip
- Events button

### Layer 3 - Resource + Goal

- money / crude / gas strip
- `...` More Info affordance
- compact goal chip

### Layer 4 - Trade

- floating trade pill
- expanded trade modal for crude/gas actions and auto-trade controls

---

## D. What Is Stable Now

### Navigation ownership

- Refinery Expansion is visible again through HQ
- Settings and save tools are visible again through HQ
- HQ is no longer placeholder-only

### Renderer state

- Live Factory default is back on the safest reviewed renderer: `grid`
- Prototype renderers are still preserved for later review
- Isometric prototype no longer forces a fixed `9x9` world when used

### Events affordance

- Factory Events no longer uses a gear icon that reads as Settings

---

## E. What Remains Deferred

- Factory still does not fully communicate "living refinery"
- 2.5D/isometric direction still needs user approval before going live
- Boost UI has no strong visible owner right now
- Rankings / award history still have summary-level visibility only
- hidden Stats route still exists as legacy code
- renderer split remains a maintenance risk

---

## F. Authoritative Renderer Notes

For current live work on this branch:

- `BuildingGrid` + `BuildingTile` + `BuildingSilhouette` are the authoritative shipped Factory renderer stack
- `FactoryMapView` is a prototype
- `FactoryIsometricView` is a prototype

If future work changes live Factory visuals, update the authoritative live
stack first unless the renderer decision has explicitly changed.

---

## G. Known Technical Warnings

- Require cycle remains:
  `gameCalculations.ts -> recruitment.ts -> gameCalculations.ts`
- Expo linking `scheme` warning remains
- Device/simulator visual verification is still missing for prototype renderers

---

*For active concerns and their priority, see `Doc/UI_CONCERNS.md`.*
*For the next recommended task, see `Doc/NEXT_TASK.md`.*
