# UI Status — Master Handoff Document

Branch: `feature/ui-skeleton-v1`
Last updated: 2026-06-18

---

## A. Current Architecture

### Factory (`app/game/(tabs)/index.tsx`)

The primary gameplay screen. Responsible for:

- Displaying the building grid (tap-to-build, tap-to-inspect)
- Showing the refinery scene (sky + yard background, building tiles in yard)
- Compact floating HUD: refinery name, level, upgrade indicator
- Compact floating HUD: time of day, events/settings button
- Floating resource strip: Money, Crude, Gasoline
- Floating goal chip: current milestone name + inline progress
- Floating action buttons: Buy 10 Crude, Sell 10 Gas
- Sheet modals: Build picker, Building Info, Events, More Info (secondary stats)

Factory does NOT handle: production health, automation settings, contracts,
staff assignment to plants (still accessible via Building Info sheet).

### Production (`app/game/(tabs)/production.tsx`)

Responsible for:

- Production Overview (inventory levels for all products)
- Production Health card (identifying bottlenecks, idle buildings)
- Bottlenecks card (derived state explanations)
- Automation settings (auto-trade, feedstock priority)
- Non-gasoline product inventory

### Staff (`app/game/(tabs)/staff.tsx`)

Responsible for:

- Hiring workers
- Viewing staff roster
- Staff stats and traits

### Business (`app/game/(tabs)/business.tsx`)

Responsible for:

- Active and available contracts
- Reputation system
- Unlocking business-level upgrades

### HQ (`app/game/(tabs)/hq.tsx`)

Currently a placeholder. Intended future role:

- Refinery-level progression hub
- Era unlock tracking
- Major milestone display
- Company identity / branding

---

## B. Current Factory Layout

The Factory screen uses **layered composition** — not a vertical dashboard stack.
All main elements are `position: 'absolute'` within a single `flex: 1` scene container.

### Layer 0 — Background (`zIndex: 0`, `pointerEvents: "none"`)

An `absoluteFill` View containing three stacked children that paint the world:

1. **Sky** (`height: sceneHeight × 0.12`)
   - Color: `#6FA8C8` (day) / `#0D1B2E` (night)
   - Subtle highlight sheen and warm haze near horizon
   - Provides atmosphere without consuming playable space

2. **Horizon strip** (`height: 14 px`)
   - Color: `#6A7A5A` — treeline / industrial silhouette separator

3. **Yard / Factory Ground** (`flex: 1` — fills remaining ~87 % of scene)
   - Color: `#B8A882` — dusty concrete
   - Two decorative road strips (absolute within yard)

This background never intercepts touches. It paints the world behind all gameplay.

### Layer 1 — Grid (`zIndex: 10`)

`position: 'absolute', top: yardTop, left: 0, right: 0, bottom: 0`

Contains a `ScrollView` which holds:
- `BuildingGrid` — tappable grid of building tiles
- Hint text ("Tap empty to build · tap built for info")

The `ScrollView` content has `paddingTop` computed to clear the resource strip
and goal chip overlays above it.

### Layer 2 — HUD (`zIndex: 20`)

Two independently positioned elements:

**Top-left** — Refinery name + level pill
- Tap to trigger upgrade if ready
- Level pill turns gold with "↑" when upgrade is available

**Top-right** — Time chip + ⚙️ events button
- Shows game clock + day of month
- ⚙️ opens Events sheet (hidden events / mystery rewards)

### Layer 3 — Resource Strip + Goal Chip (`zIndex: 20`)

**Resource strip** — positioned to straddle the sky/yard boundary
- Dark semi-transparent pill
- Shows: `$` (money) · Crude (current/max) · Gas (current/max)
- `···` chip opens the More Info sheet (secondary stats)
- `justifyContent: 'space-between'` — no marginLeft: 'auto' hack

**Goal chip** — positioned just below the resource strip, inside yard
- Compact single-line pill (28 px tall)
- Shows: 🎯 icon · goal name · 56 px inline progress track · n/total
- Tappable → navigates to achievements screen

### Layer 4 — Action Buttons (`zIndex: 20`)

`position: 'absolute', bottom: FLOATING_TAB_BAR_CLEARANCE`

Two side-by-side buttons:
- **Buy 10 Crude** (steel blue background)
- **Sell 10 Gas** (green background)

Float above the bottom nav bar. Always in thumb reach.

### Bottom Navigation

The floating tab bar (`_layout.tsx`) is `position: 'absolute'` at
`bottom: spacing.md` with `height: 72` and `borderRadius: radii.lg`.
It is rendered by Expo Router Tabs, not by Factory itself.

`FLOATING_TAB_BAR_CLEARANCE = 72 + 12 + 16 = 100 px` is the constant
used by all screens for bottom padding.

---

## C. What Worked

### 5-Tab Structure
Extracting Production, Staff, Business, and HQ into dedicated tabs made
Factory focused. Factory now owns the grid loop; Production owns health
and inventory; Business owns contracts.

### Production Extraction
Removing Production Overview and Automation from Factory significantly
reduced Factory's scroll content. Factory is now genuinely compact.

### Production Health Card
Surfacing derived bottleneck state ("this building is idle because X")
in the Production tab gave players a meaningful view into their refinery
without cluttering Factory.

### Floating Tab Bar
The floating pill tab bar gives a premium feel and leaves the Factory scene
uninterrupted. The entire Factory area extends to the screen edges.

### Layered Composition Architecture
Using `absoluteFill` background + independently positioned layers (grid,
HUD, overlays, actions) was the correct structural decision. It enables
future visual depth without changing the layout model.

### Building Identity System
Per-category accent colors, surface colors, and level badges make tiles
visually distinct even before silhouettes were complete. Immediately
readable at a glance.

---

## D. What Did NOT Work

### Large Sky Block (33 % of screen)
The first "scene" attempt used `flex: 1` (sky) + `flex: 2` (yard) as siblings.
This was a vertical dashboard stack with a sky section on top — not a scene.
Sky at 33 % meant the grid didn't appear until 40 %+ down the screen.
**Rejected.** Sky reduced to 12 %.

### Stacked Dashboard Layout
The original Factory layout was a ScrollView with:
Header → StatBoxRow → GoalCard → MoreInfo toggle → Grid → ActionButtons
This is a productivity app pattern, not a management game pattern.
**Rejected.** Replaced with layered absolute composition.

### Building Tiles as Cards
Early tiles were white cards with abbreviation text (DU, CT, PT...).
This made the grid feel like a spreadsheet, not a factory floor.
**Rejected.** Replaced with category-colored tiles + silhouettes.

### Abbreviation-First Building Identity
Putting the abbreviation (DU, CT...) as the primary visual was wrong.
Players don't memorize abbreviations. The building type should be visually
recognizable through shape/icon, not text.
**Rejected.** Silhouette/icon first; abbreviation is now tiny secondary label.

### Attempting Pure Icon Identity
The first visual pass tried standard icons (flame, droplet, box) as the
building's primary visual. These felt generic and disconnected from the
industrial theme.
**Partially replaced** by category-specific silhouettes (BuildingSilhouette).

---

## E. Current Visual Problems

### 1. Factory still feels like a grid management game
The grid is the correct primary element, but the surrounding scene doesn't
make it feel like a *living refinery*. There are no visual cues (pipes,
roads, smoke) that suggest an industrial operation.

### 2. Buildings feel like placed cards
Each building tile has a rounded border and a colored background. On the
yard ground, they read as cards placed on a surface rather than objects
embedded in terrain.

### 3. Refinery scene identity is weak
A player who has never seen the game would see a colored grid on a beige
background. The visual language doesn't communicate "oil refinery" or
"industrial management simulation."

### 4. Top background area needs refinement
The 12 % sky area functions but is bare. Even with day/night switching,
it lacks visual depth or industrial atmosphere (no distant structures,
no water, no smoke stacks on the horizon).

### 5. Roads / pipes / logistics are not represented
There is no visual language for how crude flows from tank to distillation
to product tank. The operational relationships between buildings are invisible.

---

*For concerns with priority levels and recommended timing, see `Doc/UI_CONCERNS.md`.*
*For the intended visual direction, see `Doc/UI_VISION.md`.*
*For the next recommended task, see `Doc/NEXT_TASK.md`.*
