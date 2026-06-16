# Refinery Story Mobile - UI Home Redesign Plan

## Scope

This document plans a redesign for the main Home / Refinery screen only.

Constraints:

- documentation only
- no code changes in this task
- no gameplay logic changes
- no balance changes
- no save-data changes
- no new game systems

Target direction:

- vertical mobile screen
- clean bright low-poly refinery diorama
- big refinery scene as the hero
- resource HUD at top
- production overview lower-left
- current contract / activity lower-right
- bottom navigation remains at the bottom
- reduced clutter
- readable on phone first

## 1. Current Layout Summary

Current Home screen structure in `app/game/(tabs)/index.tsx`:

1. Header row
   - refinery name + level
   - refinery-upgrade subtitle
   - season label
2. "Next goal" card
3. Resource HUD via `ResourceBar`
4. Building grid via `BuildingGrid`
5. Grid hint text
6. Two primary action buttons
   - buy crude
   - sell gasoline
7. Product sell chips
8. Boost card
9. Auto-trade card
10. Feedstock Priority card
11. Build sheet
12. Building info sheet

Current supporting components:

- `ResourceBar` is a wrapped chip grid
- `BuildingGrid` is a centered grid block on a flat `ground` background
- `BuildingTile` still uses colored placeholder rectangles with short text codes
- `FloatingNumbers` overlays near the top-right
- night mode is a full-screen tint overlay

Current visual behavior:

- almost every functional block is stacked vertically
- the playfield is visually equal to the utility cards below it
- the screen is informative, but not scene-led

## 2. Problems With Current Home Screen

### The hero scene is too small

The refinery grid is the most important fantasy surface in the game, but it is
visually compressed by the large stack above and below it. The player sees the
scene as one card among many instead of the main stage.

### The hierarchy is too flat

The screen currently treats:

- progression
- resources
- build/playfield
- selling
- boost
- automation
- feedstock management

as a single vertical list. This makes the screen feel busy even when the
individual components are simple.

### The top HUD is bulky

`ResourceBar` wraps into multiple rows. It is reliable, but it consumes a large
amount of vertical height before the player reaches the refinery scene.

### The main actions are fragmented

Buy crude, sell gasoline, product selling, boost, auto-trade, and feedstock
priority are all separated into different visual zones. This is functional but
does not support a clear "operate the refinery" flow.

### The screen lacks a compact operational overview

The requested target style needs:

- production overview lower-left
- current contract / activity lower-right

The current Home screen has neither. Operational context is spread across the
Business tab and the lower cards.

### It is too text-heavy for the intended art direction

The current structure depends on text labels and bordered cards. That keeps the
screen usable, but it does not yet feel like a premium low-poly industrial
management surface.

### The current layout is not built around the future image pipeline

Once the final low-poly assets land, the current stacked structure will still
leave too little space for the refinery scene to carry the screen.

## 3. Proposed New Layout

### Core principle

The Home screen should become a scene-first control screen:

- HUD first
- refinery scene second
- operations summary third
- secondary systems pushed into a lower utility layer

### Proposed vertical layout

1. Top HUD band
   - compact refinery title block
   - compact resource HUD
   - time / season / ESG remain visible, but denser
2. Hero refinery scene
   - large bright low-poly diorama as the main focus
   - building grid remains the interactive surface
   - hinting, edit mode, and worker markers sit as lightweight overlays
3. Lower dock row
   - left: Production Overview card
   - right: Current Contract / Activity card
4. Bottom utility strip above tab bar
   - primary actions only: buy crude, sell gasoline, quick sell, boost
5. Secondary controls below fold or in collapsible utility section
   - auto-trade
   - feedstock priority
   - extended product selling details if needed
6. Bottom navigation
   - keep existing tab structure

### Target composition

Screen proportions:

- top HUD: ~14-18% height
- hero scene: ~42-50% height
- lower dock: ~16-20% height
- utility strip: ~10-14% height
- bottom nav: existing height

### Proposed information placement

Top:

- refinery name
- refinery level
- refinery upgrade CTA
- condensed resource chips

Center:

- hero diorama grid
- subtle day/night lighting
- tap targets remain unchanged

Lower-left:

- production overview
  - crude
  - feedstock
  - gasoline
  - electricity / waste when relevant
  - active boost state

Lower-right:

- current contract / activity
  - top incomplete contract or most relevant order
  - newest activity log item
  - hidden-event nudge when present

Bottom utility strip:

- buy crude
- sell gas
- quick product action
- boost

Secondary utility section:

- auto-trade
- feedstock priority
- advanced controls that matter less every second

### Contract / activity definition without new systems

The "current contract" panel should not create a new gameplay concept.
It should be a UI summary based on existing data only:

- first incomplete active contract, or
- most valuable ready contract, or
- first ready standing order

If none exists, fall back to:

- latest activity log entry, or
- "No active contract" with a Business-tab shortcut

## 4. Component Changes Needed

These are planned UI/component changes only, not gameplay changes.

### `app/game/(tabs)/index.tsx`

Needs the largest structural change:

- replace the current long stacked flow with a scene-led composition
- split primary controls from secondary controls
- introduce a lower dock row with two summary cards
- keep build sheet and building info sheet behavior intact
- keep existing actions and handlers intact

### `ResourceBar`

Current role:

- multi-row stat chip wrap

Planned role:

- denser top HUD
- fewer rows
- more compact stat presentation
- optional icon slot per stat

Likely changes later:

- horizontal grouping
- smaller labels
- tighter spacing
- visual distinction between critical and secondary stats

### `BuildingGrid`

Current role:

- centered flat grid container

Planned role:

- main hero scene container
- larger scenic stage
- support overlay anchoring for:
  - edit mode hint
  - production pulses
  - worker markers
  - future decorative base/plinth treatment

Likely changes later:

- larger footprint
- stronger scene framing
- optional background layer support

### `BuildingTile`

Current role:

- placeholder color tiles with text short codes

Planned role:

- art-ready tile shell that can host final renders
- preserve level badge and tap behavior
- support placeholder art states without visual collapse

Likely changes later:

- image layer
- shadow/base treatment
- cleaner badge placement
- reduced reliance on text abbreviations

### New planned UI-only subcomponents

These do not need to exist yet, but the redesign should likely introduce:

- `HomeTopHud`
- `HomeHeroScene`
- `HomeProductionOverviewCard`
- `HomeContractActivityCard`
- `HomeQuickActionsBar`
- `HomeSecondaryControls`

This would keep the screen maintainable once the visual layer becomes richer.

## 5. Asset Placeholders Needed

These are planning placeholders for the redesign phase, not final art.

### Scene placeholders

- hero background block for Home screen
- grid plinth/base placeholder
- empty-cell placeholder mark
- image slot for building render

### HUD placeholders

- resource icon slots
- compact stat-chip placeholders
- time / season / ESG mini-glyph slots

### Lower dock placeholders

- production overview card shell
- contract/activity card shell
- progress mini-bar shell
- mini status badge shell

### Action placeholders

- buy crude icon slot
- sell gas icon slot
- quick product action icon slot
- boost icon slot

### Overlay placeholders

- edit mode banner shell
- worker marker shell
- production glow shell

## 6. What Can Be Done Before Real Images Exist

The following can be implemented before final art is ready:

- full layout restructuring
- new spacing and hierarchy
- HUD densification
- larger hero scene footprint
- lower dock card layout
- primary vs secondary control separation
- placeholder icon slots
- placeholder building art frames
- utility strip structure
- improved typography rhythm
- better panel sizing and margin system

Safe early implementation approach:

- continue using `colors` from `src/theme.ts`
- use neutral block placeholders instead of final renders
- keep tap targets and action handlers exactly as they are
- keep sheets and game actions unchanged

## 7. What Should Wait Until Final Images Exist

These should be tuned only after the real low-poly assets are available:

- final crop and scale of the refinery scene
- exact building render padding inside tiles
- final contrast between scene and overlay panels
- final glow intensity and shadow depth
- exact size of level badges against real art
- exact positioning of worker markers on top of real renders
- final panel translucency if the scene remains visible behind them
- final color intensity of resource icons
- final day/night blend tuning

Reason:

These decisions depend heavily on the brightness, massing, and silhouette
readability of the actual building renders.

## 8. Implementation Phases

### Phase 1 - Layout Skeleton

Goal:

- rebuild the Home screen hierarchy without using final art

Includes:

- top HUD restructuring
- hero scene enlargement
- lower dock introduction
- quick-action strip
- secondary controls moved lower

### Phase 2 - Component Refactor

Goal:

- make the new layout maintainable before art integration

Includes:

- split `index.tsx` into smaller Home-specific sections
- prepare `ResourceBar`, `BuildingGrid`, and `BuildingTile` for art slots
- preserve all current interactions and handlers

### Phase 3 - Placeholder Visual Pass

Goal:

- make the redesigned layout readable and pleasant before final assets

Includes:

- temporary visual shells
- placeholder icon slots
- plinth/base block treatment
- denser HUD card treatment

### Phase 4 - Asset Integration

Goal:

- swap in real low-poly scene assets with minimal layout churn

Includes:

- building render integration
- resource icon integration
- action icon integration
- production overview visual upgrade
- contract/activity panel visual upgrade

### Phase 5 - Final Polish

Goal:

- tune the redesigned Home screen around final art

Includes:

- scene scale tuning
- overlay readability tuning
- day/night pass tuning
- spacing polish
- motion polish

## Final Recommendation

The redesign should not try to make every current Home feature equally visible
at once. The main change is hierarchy:

- the refinery scene becomes the hero
- the HUD becomes denser
- operations become summarized
- secondary controls move out of the hero zone

If that hierarchy is respected, the final low-poly industrial art will have
room to carry the screen instead of fighting a stack of equally weighted cards.
