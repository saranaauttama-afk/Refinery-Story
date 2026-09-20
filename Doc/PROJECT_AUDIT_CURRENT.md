# Project Audit: Current Branch

Audit date: 2026-06-19  
Branch: `feature/ui-skeleton-v1`  
HEAD: `f73f42b`  
TypeScript check: `npx tsc --noEmit` passes  
Workspace note: local working tree is not fully clean because `.claude/settings.json` is modified, but no app code was changed for this audit.

Historical note:
This document captures the branch state immediately before the later
UI stabilization milestone on the same branch. For post-stabilization
source-of-truth status, use `CURRENT_TASK.md`, `Doc/UI_STATUS.md`,
`Doc/UI_CONCERNS.md`, and `Doc/NEXT_TASK.md`.

## 1. Current Factory implementation

### Current layout

The Factory screen is no longer a stacked dashboard. It is now a full-screen layered scene in `app/game/(tabs)/index.tsx` with:

- a scene background that fills the screen
- an absolutely-positioned grid layer
- floating HUD blocks
- a floating resource strip
- a compact one-line goal chip
- a floating trade pill above the tab bar
- bottom sheets for More Info, Events, Build, and Building Info

The live Factory screen is currently using `FACTORY_VIEW_MODE = 'isometric'`, not the old `BuildingGrid`, and not the 2.5D prototype.

### Current layers

Layer order in code:

1. Background layer:
   sky, horizon strip, yard, faint road bands, optional night veil
2. Grid layer:
   vertically scrollable play area starting inside the yard
3. HUD layer:
   refinery name/level at top-left, time and events button at top-right
4. Resource and goal layer:
   money/crude/gas strip plus compact goal chip
5. Trade layer:
   floating trade pill and modal panel for buy/sell/auto-trade
6. Overlay sheets:
   More Info, Events, Build, Building Info

### Current scene composition

The current live scene is a true-isometric prototype rendered by `src/components/FactoryIsometricView.tsx`.

What it does now:

- uses fixed isometric tiles at `112x56`
- uses a fixed `9x9` canvas (`81` cells) regardless of actual unlocked grid size
- renders extra cells beyond the real grid as locked placeholders
- renders occupied cells as flat SVG isometric boxes colored by building category
- shows short text labels, level badges, staff badges, and status badges
- keeps build/inspect interaction through tap on cell

What it no longer does in the live renderer:

- it does not use the older square `BuildingGrid` layout
- it does not use `BuildingSilhouette` or per-building icon silhouettes in the active Factory view
- it does not show the older Production Overview card or Current Contract panel on Factory
- it appears to no longer expose a visible Boost UI even though boost state/actions still exist in code

## 2. Current Production implementation

### Sections

The Production screen currently has five main sections:

1. `Production Health`
2. `Bottlenecks`
3. `Production Overview`
4. `Inventory`
5. `Automation`

`Feedstock Priority` appears under Automation when relevant downstream plants exist.

### Features

Current Production features:

- derived-state health rows for feedstock, electricity, storage, and output flow
- bottleneck callouts that explain why production is blocked or weakening
- collapsible production overview bars for gasoline and secondary products
- inventory list covering gasoline, asphalt, and all secondary products
- sell-all actions for secondary products from the Production screen
- auto-trade toggle
- crude buy threshold and gasoline sell threshold controls
- per-product auto-sell thresholds for built downstream plants
- feedstock priority controls for lubricant, jet fuel, and petrochemical plants

### Remaining issues

- The screen is useful, but still reads like a management panel rather than a playful production scene.
- Gasoline selling remains on Factory while secondary-product selling lives on Production, so the trade loop is split across screens.
- Automation is split conceptually:
  Factory owns the floating trade pill and crude/gas actions, while Production owns the full threshold controls and feedstock priority.
- There is no strong visual link from a bottleneck message back to the exact building or tile causing the issue.

## 3. Current Navigation structure

### Tabs

Visible bottom tabs:

- Factory
- Production
- Staff
- Business
- HQ

Hidden but still present in code:

- Stats

### Screen ownership

Current top-level route ownership:

| Route / screen | Current ownership |
| --- | --- |
| Main Menu (`/`) | launch, continue/new game, settings, store |
| Factory tab | core loop, scene, build/inspect, trade pill, hidden-event entry |
| Production tab | production status, inventory, automation, feedstock priority |
| Staff tab | recruitment, training, specialist assignment |
| Business tab | contracts, research, perks, shipments, standing orders |
| HQ tab | placeholder only, no real system ownership yet |
| Stats route | hidden utility screen holding expansion, asphalt tools, save tools, app links |
| Achievements route | milestones and hidden combo progress |
| Settings route | app settings and reset |
| Store route | mock IAP / boost demo |

Net result:

- the visible tab structure says there are 5 gameplay destinations
- the actual system ownership is split across 6 gameplay screens because `Stats` still owns several live features even though it is hidden
- `HQ` is visible, but is not yet the real owner of the systems it previews

## 4. Current visual systems

### Building identity

There are currently two overlapping visual systems:

1. `BuildingTile` / `BuildingSilhouette` / `buildingIdentity.ts`
2. `FactoryIsometricView`

The older identity system provides:

- per-building icon selection
- category accent colors
- category surface colors
- silhouette-first tiles for all building families
- abbreviation as a secondary label

The live Factory renderer currently bypasses most of that and instead uses:

- category color only
- generic isometric SVG box placeholders
- short name text labels

### Badges

Badge foundations are still active and reused:

- level badge
- staff badge
- tile status badge

Status badge meanings currently include warning, blocked, and idle states such as `FULL`, `OIL`, `FEED`, `PWR`, `CHEM`, and `IDLE`.

### Overlays

Current overlays in the app shell:

- Era banner
- Hidden combo discovery banner
- Hidden event banner
- Choice event modal
- Award modal
- Win celebration modal

Factory-specific overlays:

- More Info sheet
- Events sheet
- Build sheet
- Building Info sheet
- floating trade modal

### Scene backgrounds

The current Factory background system includes:

- sky block
- horizon strip
- yard block
- faint road bands
- day/night tint overlay

This is stronger than the old flat dashboard background, but it is still a backdrop layer, not a full scenic factory environment with roads, pipes, traffic, or animated workers.

## 5. Features that may have become hidden or inaccessible

| Feature | Current accessibility |
| --- | --- |
| Refinery expansion | Technically still exists, but only on hidden `Stats`. No visible 5-tab path leads to it. |
| Automation | Still accessible, but split. Factory has the trade pill and crude/gas auto-trade summary; Production has the full auto-trade thresholds and feedstock priority. |
| Contracts | Accessible through Business tab. Hidden contract events can also route there from Factory Events. The old Factory-side contract context is gone. |
| Research | Accessible through Business tab. HQ shows a placeholder card only. |
| Achievements | Accessible through the Factory goal chip and from hidden `Stats`. Not visible as its own tab. |
| Rankings | Annual ranking still exists, but only inside the transient year-end `AwardModal`. There is no persistent visible screen for ranking history in the current 5-tab flow. |
| Settings | Reachable from Main Menu and hidden `Stats`, but not from the visible in-game 5-tab navigation. |

## 6. Current known UI problems

### HIGH

- The live Factory screen is using an unreviewed prototype renderer, not the documented safe default.
- The isometric Factory view always renders a fixed `9x9` world, so smaller real refinery sizes show large numbers of locked cells and a much larger canvas than the gameplay system actually owns.
- The live isometric renderer regresses building readability by replacing the silhouette/icon identity work with generic colored box placeholders.
- Important in-game destinations are effectively hidden because `Stats` is removed from the tab bar while still owning expansion, save tools, app links, and one visible path back to Settings.

### MEDIUM

- The Factory top-right `⚙️` button looks like Settings but actually opens Events.
- Factory has lost contextual surfaces that existed or were planned earlier, including visible Production Overview, Current Contract context, and any obvious Boost control.
- Visual consistency is weak across screens: Factory is heavily experimental while Production, Staff, Business, and HQ remain simple card/list screens.
- Trade behavior is split in a way that may be hard to learn:
  gasoline sell is on Factory, secondary product selling is on Production.

### LOW

- HQ uses a full visible tab slot but is still only placeholder content.
- Isometric labels and badges are very small relative to the fixed tile size and may be hard to read on-device.
- The secondary stats affordance (`···`) is functional, but easy to miss.

## 7. Current known technical problems

### HIGH

- `FACTORY_VIEW_MODE` is hardcoded to `'isometric'` even though the surrounding comments still say the safe live default should remain `'grid'` until review.
- `FactoryIsometricView` is hardcoded to a `9x9` canvas and is not driven by the actual current expansion balance (`3x3` to `6x6`).
- The active Factory renderer has not been visually verified on a real device or simulator, so tap accuracy, overlap behavior, and readability are still uncertain.

### MEDIUM

- Known require cycle remains:
  `gameCalculations.ts -> recruitment.ts -> gameCalculations.ts`
- The Factory screen contains notable dormant or contradicted code paths:
  `BuildingGrid`, `FactoryMapView`, `ProductionOverview`, `CollapsibleCard`, `currentContract`, and boost-related state are still present around a live renderer that no longer uses them.
- The branch now has two parallel building-visual systems, which raises the risk of future UI changes updating one renderer and not the other.
- `src/buildingIcons.ts` appears to be legacy/unused on this branch.

### LOW

- README/current-task/docs are out of sync with the actual live flag state on this branch.
- Expo linking `scheme` warning is still documented as unresolved.

## 8. What changed in the last 10 commits

Summary only:

- Trade controls were consolidated into a unified collapsible Factory trade panel.
- Auto-trade was expanded to cover all five secondary products.
- A layering fix was added so the expanded trade panel no longer sits behind other floating UI.
- Choice-event fallback timing was throttled to at most once per in-game day.
- The branch then shifted heavily into Factory map experiments:
  first 2.5D, then true isometric.
- The isometric prototype was repeatedly retuned:
  tile scale changes, grid-line rendering, larger canvas, scrollable `9x9` map, darker/lighter ground treatment, and finally a switch to fixed-size SVG isometric box placeholders instead of `BuildingSilhouette`.

In short:

- the first part of the recent history stabilized trading UX
- the second part aggressively changed the live Factory renderer

## 9. Top 5 recommended next tasks

| Task | Expected effort | Risk | Impact |
| --- | --- | --- | --- |
| Decide the live Factory renderer and stabilize it (`grid`, `map2_5d`, or a polished isometric version) after screenshot/device review | Medium | Medium | High |
| Restore visible access to hidden live systems: expansion, settings, save tools, and ranking/history entry points | Small to Medium | Low | High |
| Make visual ownership consistent: either teach `FactoryIsometricView` the real silhouette/icon system or revert live Factory to the renderer that already has it | Medium | Medium | High |
| Resolve screen ownership between `HQ` and hidden `Stats` so visible tabs match where systems actually live | Medium | Medium | High |
| Clean dormant branch state: remove or park dead Factory code paths, restore/replace hidden Boost entry, and update docs to match the real branch behavior | Small to Medium | Low | Medium |

## 10. Final recommendation

**D. Stabilize current branch**

Reason:

- the branch already has enough new UI direction to evaluate
- the live Factory screen is currently prototype-heavy and partly regressed in clarity/discoverability
- pushing further into new UI or a new 2.5D pass before stabilizing would compound hidden-route and renderer-split problems
