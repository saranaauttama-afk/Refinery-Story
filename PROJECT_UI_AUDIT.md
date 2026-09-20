# Project UI Audit

Scope: this audit is based on the `devMobile` branch snapshot, not the current working branch in the live workspace.

## 1. Current screen structure

### Entry point

- `package.json` uses `expo-router/entry` as the app entry.
- `app/_layout.tsx` is the root shell. It mounts `SettingsProvider`, `GameProvider`, the root `Stack`, and all global overlays.
- The first route is `app/index.tsx`, which contains the splash state and main menu.

### Routes and screens

| Route | File | Screen | Purpose |
| --- | --- | --- | --- |
| `/` | `app/index.tsx` | Main Menu + Splash | Launch flow, continue/new game, settings, store |
| `/settings` | `app/settings.tsx` | Settings | Language, audio toggles, reset save, store link |
| `/store` | `app/store.tsx` | Store | Mock IAP, remove ads, demo boosts |
| `/achievements` | `app/achievements.tsx` | Achievements | Milestones, hidden combo discovery progress, win banner |
| `/game` | `app/game/(tabs)/index.tsx` via tab layout | Refinery tab | Core play screen, grid, build/inspect, buy/sell, boost |
| `/game/staff` | `app/game/(tabs)/staff.tsx` | Staff tab | Recruitment, training, assignment |
| `/game/business` | `app/game/(tabs)/business.tsx` | Business tab | Contracts, research, perks, shipments, standing orders |
| `/game/stats` | `app/game/(tabs)/stats.tsx` | Stats tab | Era, ESG, milestones, asphalt, rename, save/reset, app links |

### Navigation flow

- App launch -> `RootLayout` -> `/`
- `/` shows a timed splash, then the main menu
- Main menu:
  - `Continue` or `New Game` -> `/game`
  - `Settings` -> `/settings`
  - `Store` -> `/store`
- `/game` uses `app/game/(tabs)/_layout.tsx` and opens the Refinery tab by default
- Bottom tabs inside `/game`:
  - Refinery
  - Staff
  - Business
  - Stats
- Deep links from inside tabs:
  - Refinery -> Achievements
  - Business -> no route changes, everything stays inline
  - Stats -> Achievements, Main Menu, Settings, Store
- Global overlays can appear over the game from any tab:
  - `ChoiceEventModal`
  - `AwardModal`
  - `WinCelebrationModal`
  - `EraBanner`
  - `ComboDiscoveryBanner`
  - `HiddenEventBanner`

### Refinery tab local flows

- Tap empty grid cell -> Build sheet
- Tap occupied grid cell -> Building Info sheet
- Tap gear in header -> Automation sheet
- Tap current goal -> Achievements
- Tap current contract -> Business tab

## 2. Existing UI components

### Reusable/shared components

| Component | Role |
| --- | --- |
| `AnimatedPressable` | Shared press animation wrapper |
| `ProgressBar` | Shared progress meter |
| `ListRow` | Shared list row with right-side CTA button |
| `Sheet` | Shared slide-up modal sheet |
| `ResourceBar` | Shared resource-chip strip |
| `StatBoxRow` | Shared dashboard stat boxes |
| `CollapsibleCard` | Shared expandable card shell |
| `FloatingNumbers` | Shared income/expense feedback overlay |
| `BuildingGrid` | Shared tile-grid renderer |
| `BuildingTile` | Shared single-grid-cell renderer |
| `ProductionOverview` | Shared production stock list |

### Panels and card patterns already in use

- Main menu save summary card
- Achievements milestone card
- Achievements combo summary card
- Store product cards
- Stats section cards
- Staff candidate cards
- Staff employee cards
- Refinery next-goal card
- Refinery current-contract card
- Refinery boost card
- Refinery auto-trade card
- Refinery feedstock-priority card
- Production Overview collapsible card

There is no shared `Card` base component. Most cards are screen-local `View` + style combinations.

### Modals

| Component | Type | Trigger |
| --- | --- | --- |
| `ChoiceEventModal` | Center modal | Milestones or fallback choice events |
| `AwardModal` | Center modal | Business year close |
| `WinCelebrationModal` | Center modal | Prototype win condition |

### Bottom sheets

All bottom sheets are implemented by the shared `Sheet` component.

| Sheet | Host screen | Purpose |
| --- | --- | --- |
| Automation | Refinery | Auto-trade and feedstock priority |
| Build | Refinery | Building picker and hidden building-event claim rows |
| Building Info | Refinery | Upgrade, assignment, move, swap, demolish |

### Banners / toast-like overlays

| Component | Purpose |
| --- | --- |
| `EraBanner` | New era announcement |
| `ComboDiscoveryBanner` | Hidden combo discovery |
| `HiddenEventBanner` | Mystery-event nudge |

## 3. Current game systems found

### Resources

- Money
- Research points
- Reputation
- Crude oil
- Gasoline
- Feedstock
- Electricity
- Waste
- ESG score
- Product inventory:
  - Asphalt
  - Jet fuel
  - Lubricants
  - Petrochemicals
  - Recycled material
  - Plastic pellets
- Demand modifiers:
  - Seasonal gasoline multiplier
  - Era-based gasoline demand shift
  - Era-based petrochemicals demand shift
- In-game calendar clock:
  - Hour of day
  - Day of week
  - Day of month
  - Day/night state

### Buildings

Implemented building types: 17 total.

- Core/storage/support:
  - `crudeTank`
  - `distillationUnit`
  - `productTank`
  - `laboratory`
  - `maintenanceWorkshop`
  - `salesOffice`
- Production:
  - `lubricantPlant`
  - `jetFuelPlant`
  - `petrochemicalPlant`
  - `powerPlant`
  - `wasteTreatmentPlant`
  - `polymerPlant`
- Tank farm:
  - `lubricantTank`
  - `jetFuelTank`
  - `petrochemicalTank`
  - `recyclingBunker`
  - `pelletSilo`

Grid expansion tiers:

- 3x3
- 4x4
- 5x5
- 6x6

Upgradeable buildings: 10 total.

- `crudeTank`
- `distillationUnit`
- `productTank`
- `laboratory`
- `maintenanceWorkshop`
- `salesOffice`
- `lubricantPlant`
- `jetFuelPlant`
- `petrochemicalPlant`
- `polymerPlant`

### Products

Primary flow:

- Crude -> gasoline

Intermediate/secondary flow:

- Crude -> feedstock via distillation
- Feedstock -> lubricants
- Feedstock -> jet fuel
- Feedstock -> petrochemicals
- Waste -> recycled material
- Petrochemicals -> plastic pellets
- Crude -> asphalt via manual production

Sell behavior:

- Direct sell UI exists for:
  - Lubricants
  - Jet fuel
  - Petrochemicals
  - Recycled material
  - Plastic pellets
- Asphalt is not directly sold; it is used for contracts and standing orders.

### Contracts

- 24 base contracts in `CONTRACT_BALANCE`
- 1 hidden-event contract currently defined
- Mixed contract types:
  - Gasoline
  - Asphalt
  - Jet fuel
  - Lubricants
  - Petrochemicals
- Reward scaling uses:
  - Reputation tier
  - Research bonuses
  - Sales office bonuses
  - ESG premium threshold

### Research

- 10 research items
- Prerequisite chain supported
- Research affects production, storage, sell price, contract rewards, RP rewards, and safety penalty reduction

### Workforce

- 10 worker types
- Individual employee records, not pooled levels
- Level range: 1 to 5
- XP progression
- Veteran trait
- Recruitment pool system:
  - 3 candidates at a time
  - auto-refresh
  - paid refresh
- Per-cell assignment system for specialists:
  - `aviationSpecialist` -> jet fuel plant
  - `chemicalEngineer` -> petrochemical plant
  - `polymerEngineer` -> polymer plant

### Events

- 16 random events
- 12 choice events
- 5 hidden combos
- 5 hidden calendar-based hidden events
- Era advancement banner system
- Annual awards system with 3 rival refineries
- Prototype completion celebration

### Logistics

- Auto-trade crude/gasoline thresholds
- Feedstock priority weighting for downstream plants
- 5 crude shipment options with real-time arrival delays
- 4 standing orders with cooldowns
- Move/swap/demolish building rearrangement system

### Save system

- Main game save stored in AsyncStorage key: `refinery-story-save`
- Autosave every 5 seconds
- Manual save action exists in Stats
- Reset save clears storage and recreates a fresh state
- Separate persisted stores:
  - `refinery-story-settings`
  - `refinery-story-autotrade`
- Save loading sanitizes and migrates older save shapes, including:
  - old worker-level format -> employee records
  - old assignment pool format -> per-cell assignments
  - older product inventory fields
  - hidden-event state
  - cooldowns
  - grid and grid levels

## 4. UI problems

### High-priority issues

| Area | Problem | Why it matters |
| --- | --- | --- |
| Refinery tab | Too many actions live on one screen | Core play, economy, sell UI, contract context, boost, automation access, and grid editing all compete for attention |
| Business tab | Too many systems grouped into one long list | Contracts, research, perks, shipments, and standing orders are distinct mental models but share one scroll |
| Stats tab | Mixed role and weak identity | Stats, progression, asphalt actions, rename, save/reset, settings/store links all live together |
| Grid interaction | 6x6 grid shrinks tap targets significantly | Building placement and inspection become harder on mobile as the grid expands |
| Hidden Events | Reward discovery path is inconsistent | Contract rewards are claimed in Business, staff rewards in Staff, building rewards only inside Build sheet |

### Duplicate or overlapping screens/functions

There are no exact duplicate routes, but there is overlapping responsibility:

| Overlap | Current state | Audit note |
| --- | --- | --- |
| Settings vs Stats/App section | Both expose app-level management paths | Stats is partly acting like a secondary settings hub |
| Main Menu vs Stats | Both provide navigation to Settings and Store; Stats also links back to menu | Useful, but increases route overlap |
| Achievements info | Full Achievements screen plus Next Goal card plus milestone summary in Stats | Good context surfaces, but progression info is spread across multiple locations |

### Mobile UX issues

| Problem | Evidence |
| --- | --- |
| Small tap targets | Product sell chips, feedstock steppers, close text links, assignment options |
| Dense sheet content | Building Info sheet combines stats, upgrade, assignment, move, swap, demolish |
| Long vertical lists | Business and Stats tabs can become long before reaching the last action |
| Floating bar dependence | All tabs rely on manual bottom padding to avoid overlap |
| Text-heavy lists | `ListRow` rows often carry long subtitles plus a right-side button in a narrow mobile layout |

### Information overload

Most overloaded screen: Refinery.

Why:

- Title/upgrading
- season
- automation entry
- stat box row
- resource bar
- grid
- buy crude / sell gas
- production overview
- current contract
- five product sell chips
- boost state
- three additional sheet flows

Second-most overloaded: Business.

Why:

- Contracts
- hidden event contract reveal rows
- Research
- Perks
- Shipments
- Standing orders

### Components or patterns that should be merged

| Candidate | Current duplication | Recommended direction |
| --- | --- | --- |
| `Section` helpers | Separate local `Section` components in Settings, Staff, Business | Create one shared `SectionCard` / `SectionBlock` |
| Modal card shells | `AwardModal`, `ChoiceEventModal`, `WinCelebrationModal` all hand-roll similar centered modal cards | Create one shared modal frame |
| Banner shells | `EraBanner`, `ComboDiscoveryBanner`, `HiddenEventBanner` share the same toast layout pattern | Create one shared banner/toast primitive |
| Stats summary components | `ResourceBar` and `StatBoxRow` are two separate stat-summary systems on the same screen | Merge into one configurable HUD card system |
| Screen-local cards | Candidate cards, employee cards, store cards, stats cards all repeat card chrome styles | Introduce one shared card style wrapper if UI cleanup is planned later |

## 5. Complete component inventory

React components found in the branch snapshot:

| Component | File | Kind | Category | Used by / notes |
| --- | --- | --- | --- | --- |
| `GlobalOverlays` | `app/_layout.tsx` | Route helper | Overlay shell | Mounts global banners and modals |
| `RootLayout` | `app/_layout.tsx` | Route layout | Navigation shell | Root providers + stack |
| `Splash` | `app/index.tsx` | Route helper | Launch screen | Internal timed splash state |
| `MenuScreen` | `app/index.tsx` | Route screen | Menu | Main menu |
| `MilestoneRow` | `app/achievements.tsx` | Route helper | Row/card | Milestone item renderer |
| `AchievementsScreen` | `app/achievements.tsx` | Route screen | Progress | Achievements page |
| `Row` | `app/settings.tsx` | Route helper | Settings control | Toggle row |
| `Section` | `app/settings.tsx` | Route helper | Layout block | Local section wrapper |
| `SettingsScreen` | `app/settings.tsx` | Route screen | Settings | App preferences |
| `StoreScreen` | `app/store.tsx` | Route screen | Store | Mock purchase screen |
| `TabIcon` | `app/game/(tabs)/_layout.tsx` | Route helper | Navigation | Active-tab icon wrapper |
| `TabsLayout` | `app/game/(tabs)/_layout.tsx` | Route layout | Navigation shell | Bottom tab navigator |
| `RefineryScreen` | `app/game/(tabs)/index.tsx` | Route screen | Core gameplay | Main tycoon screen |
| `Section` | `app/game/(tabs)/staff.tsx` | Route helper | Layout block | Local section wrapper |
| `StaffScreen` | `app/game/(tabs)/staff.tsx` | Route screen | Workforce | Recruitment/training/assignment |
| `Section` | `app/game/(tabs)/business.tsx` | Route helper | Layout block | Local section wrapper |
| `BusinessScreen` | `app/game/(tabs)/business.tsx` | Route screen | Economy | Contracts/research/perks/logistics |
| `Stat` | `app/game/(tabs)/stats.tsx` | Route helper | Stat row | Local stat pair renderer |
| `StatsScreen` | `app/game/(tabs)/stats.tsx` | Route screen | Meta/progression | Stats, rename, save, settings links |
| `AnimatedPressable` | `src/components/AnimatedPressable.tsx` | Shared | Interaction | Press-scale wrapper |
| `AwardModal` | `src/components/AwardModal.tsx` | Shared | Modal | Annual results modal |
| `BuildingGrid` | `src/components/BuildingGrid.tsx` | Shared | Grid | Grid layout renderer |
| `BuildingTile` | `src/components/BuildingTile.tsx` | Shared | Grid cell | Single building tile |
| `ChoiceEventModal` | `src/components/ChoiceEventModal.tsx` | Shared | Modal | Two-choice event modal |
| `CollapsibleCard` | `src/components/CollapsibleCard.tsx` | Shared | Card shell | Expand/collapse wrapper |
| `ComboDiscoveryBanner` | `src/components/ComboDiscoveryBanner.tsx` | Shared | Banner | Hidden combo toast |
| `EraBanner` | `src/components/EraBanner.tsx` | Shared | Banner | Era unlock toast |
| `FloatingNumberItem` | `src/components/FloatingNumbers.tsx` | Internal | Feedback | Internal animated label |
| `FloatingNumbers` | `src/components/FloatingNumbers.tsx` | Shared | Feedback | Income/expense overlay |
| `HiddenEventBanner` | `src/components/HiddenEventBanner.tsx` | Shared | Banner | Mystery-event nudge |
| `ListRow` | `src/components/ListRow.tsx` | Shared | List row | Primary shared management row |
| `ProductionOverview` | `src/components/ProductionOverview.tsx` | Shared | Panel body | Product stock list |
| `ProgressBar` | `src/components/ProgressBar.tsx` | Shared | Progress | Animated bar |
| `ResourceBar` | `src/components/ResourceBar.tsx` | Shared | HUD | Resource chip grid |
| `Sheet` | `src/components/Sheet.tsx` | Shared | Bottom sheet | Build/info/automation sheets |
| `StatBoxRow` | `src/components/StatBoxRow.tsx` | Shared | HUD | Dashboard stat cards |
| `WinCelebrationModal` | `src/components/WinCelebrationModal.tsx` | Shared | Modal | Prototype-complete modal |

## 6. Recommended screen map for a mobile tycoon game

### Goal

Reduce overload on the Refinery and Business tabs, centralize hidden-event discovery, and give each top-level screen one clear job.

### Recommended top-level map

| Recommended route | Purpose | What should live here |
| --- | --- | --- |
| `/` | Main Menu | Continue, New Game, Settings, Store |
| `/game/refinery` | Core play | Grid, build/inspect, top HUD, boost, current goal |
| `/game/operations` | Production and logistics | Product inventory, storage, auto-trade, feedstock priority, electricity/feedstock bottlenecks, direct product selling |
| `/game/staff` | Workforce | Recruitment, roster, training, assignment |
| `/game/business` | Revenue layer | Contracts, standing orders, shipments, market/demand surfaces |
| `/game/hq` | Long-term progression | Research, perks, eras, achievements, awards, rename, save tools |

### Recommended secondary routes / overlays

| Route or overlay | Purpose |
| --- | --- |
| `/game/achievements` | Full achievement list |
| `/game/events` | Unified inbox for hidden events and notable discoveries |
| `/game/annual-report` | Award history and rival history |
| Build sheet | Build only |
| Building Info sheet | Inspect, upgrade, move/swap/demolish |
| Choice modal | Keep as global blocking event |
| Award modal | Keep as global blocking event |

### Recommended navigation flow

- Launch -> Main Menu
- Continue/New Game -> Refinery
- Refinery remains the only place for build/inspect actions
- Operations becomes the home for:
  - product selling
  - automation
  - storage overview
  - bottleneck diagnostics
- Business becomes the home for:
  - contracts
  - standing orders
  - crude shipments
- HQ becomes the home for:
  - research
  - perks
  - achievements
  - historical stats
  - rename/save/reset
- Hidden events should route to a single inbox or notification center instead of forcing the player to guess which tab or sheet contains the claim

### Practical screen consolidation recommendation

If the project wants to keep four tabs instead of adding a fifth, the cleanest four-tab version is:

| Tab | Keep / move |
| --- | --- |
| Refinery | Grid, build, inspect, boost, top HUD |
| Operations | Production Overview, direct product selling, automation, storage, electricity/feedstock |
| Staff | Recruitment, training, assignment |
| Business | Contracts, research, perks, shipments, standing orders, milestones, stats entry |

In that version, the current Stats tab becomes a secondary route reached from Business or a top-right HQ button, not a permanent tab.
