# Refinery Story Mobile - Screen Art Requirements

## Scope Note

In this document, `Home` refers to the primary Home / Refinery gameplay tab
(`app/game/(tabs)/index.tsx`), not the title menu.

The title/menu entry screen is still tracked in the asset plan, but it was not
part of the requested screen list for this pass.

## Home (Refinery)

### Current visual elements

- cream background and warm neutral palette from `src/theme.ts`
- building grid with colored placeholder tiles and 2-letter abbreviations
- resource chips in a wrapped card grid
- next-goal card, buy/sell action buttons, product sell chips
- boost card, auto-trade card, feedstock-priority card
- bottom sheet for build picker and building info
- floating income/expense numbers
- subtle night overlay

### Missing art opportunities

- real building renders for every grid cell
- visual plinth/base treatment for the diorama grid
- resource icons inside chips
- product icons inside sell chips
- action icons for buy, sell, build, upgrade, move, swap, demolish
- more premium build-sheet and info-sheet header accents
- replacement for the emoji worker marker

### Recommended future assets

- full building render set
- grid plinth system
- empty-cell marker
- core resource icon set
- core product icon set
- action icon set
- production glow FX
- worker presence marker
- Home background that supports both day and night overlay states

## Business

### Current visual elements

- text-first sections for contracts, research, perks, shipments, and standing orders
- reusable `ListRow` cards with buttons
- mystery contract rows for hidden events
- no dedicated glyph system for business content

### Missing art opportunities

- contract identity beyond text lines
- research and perk visual anchors
- shipment and standing-order logistics cues
- hidden contract reveal treatment
- richer section-level atmosphere without redesigning layout

### Recommended future assets

- standard contract frame
- contract tier badges
- commodity glyphs for gasoline, asphalt, jet fuel, lubricants, petrochemicals
- shipment vehicle glyphs
- standing-order seal
- hidden event mystery sigil
- hidden contract reveal card
- business background

## Staff

### Current visual elements

- recruitment cards and employee cards are text-led
- candidate tier is shown with text badges and border color
- assignment is explained through labels and button states
- hidden staff event rows exist as text entries

### Missing art opportunities

- role portraits for recruits and employees
- stronger differentiation between early staff and specialists
- tier and trait badges that feel collectible but still grounded
- assignment marker that is not just text
- hidden staff reward reveal treatment

### Recommended future assets

- 10 worker-role portraits
- rookie / skilled / expert / star recruitment badges
- veteran trait badge
- assign and train icons
- hidden staff reward card
- staff background

## Stats

### Current visual elements

- clean stat cards and rows
- achievements entry row
- grid expansion CTA
- asphalt production buttons
- activity log and save/reset utilities

### Missing art opportunities

- iconography for ESG, reputation, research, upgrade points, and expansion
- asphalt visual identity
- stronger era and progression presentation
- visual separation between utility actions and world-state stats

### Recommended future assets

- extended resource icon set
- asphalt product icon
- expand-grid icon
- save icon
- stats background
- later optional era crest support if a dedicated stat-callout is added

## Achievements

### Current visual elements

- milestone cards with trophy/lock emoji
- progress bars for incomplete milestones
- hidden combos shown as plain text within a summary card
- win-state banner remains text-led

### Missing art opportunities

- milestone-specific badge system
- hidden-combo emblem system
- more ceremonial visual language for milestone completion
- stronger header identity for the achievements screen

### Recommended future assets

- 16 milestone badges
- 5 hidden-combo badges
- achievements background
- celebration FX pack for milestone and win moments

## Store

### Current visual elements

- clean card list with price buttons
- remove-ads state badge
- rewarded-ad "Soon" badges
- no item art for boosts or purchases

### Missing art opportunities

- premium commerce visuals for store items
- more believable product identity for boost packs
- stronger store-branding treatment without changing the layout

### Recommended future assets

- store icon
- store background
- optional reusable purchase/emblem treatment that fits the Art Bible
- icon support for remove-ads / boosts if store depth grows later

## Settings

### Current visual elements

- text rows, toggles, and utility cards
- language switch buttons
- save reset section
- about copy and store link

### Missing art opportunities

- simple utility iconography for language, audio, save, and about
- calmer screen identity to reduce the "plain form" feel
- more refined affordance for destructive save actions

### Recommended future assets

- back icon
- save icon
- settings background
- store icon reuse
- future utility icon family if settings depth increases

## Cross-Screen Notes

- The Home (Refinery) tab is the first art target because it is the visual
  center of the product.
- Business and Staff are the next highest leverage screens because they are
  currently the most text-heavy.
- Achievements benefits most from content art rather than layout changes.
- Store and Settings should stay restrained and reuse the same premium
  industrial language instead of becoming overly commercial or gamey.
