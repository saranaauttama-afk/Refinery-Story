# Refinery Story Mobile - Art Bible

## Purpose

This document defines the visual direction for Refinery Story mobile.
It is the source of truth for future environment art, building renders,
product icons, portraits, and image-generation prompts.

North star:

- Low Poly Industrial
- Miniature Diorama
- Clean, premium, mobile-readable

Hard constraints:

- Do not use pixel art.
- Do not use Kairosoft-like character-heavy presentation.
- Do not lean on comedy, clutter, or toy-box chaos.
- Keep silhouettes simple and readable at small sizes.
- Favor industrial clarity over decoration.

## Core Visual Identity

Refinery Story should feel like a premium desk-sized industrial model:
part management sim, part collectible miniature display.

Visual pillars:

- Low poly forms with intentional simplification, not cheap blockiness.
- Miniature-diorama staging: each building should feel like a crafted model
  placed on a clean base tile.
- Industrial materials: painted steel, concrete, tanks, pipes, vents,
  catwalks, stacks, ducts, and safety railings.
- Controlled color accents: neutral steel and cream first, accent colors
  second.
- Readability first: every asset must remain clear on a phone screen.
- Clean premium finish: lightly stylized, tidy, not rusty, not grimdark.

Mood words:

- orderly
- engineered
- calm
- premium
- tactile
- modern industrial

## What Makes It Different From Kairosoft

Refinery Story should clearly avoid the familiar Kairosoft formula.

Kairosoft-like traits to avoid:

- pixel rendering
- busy scenes packed with tiny characters
- cute chibi focus
- playful visual noise
- flat front-facing building icons
- candy-saturated colors across the whole screen

Refinery Story direction instead:

- low poly 3D-look assets rendered from a consistent isometric angle
- buildings are the stars, not crowds of characters
- premium industrial calm instead of playful chaos
- fewer, stronger shapes with better material separation
- more negative space and cleaner UI framing
- miniature model display energy rather than toy-town bustle

In one sentence:

Refinery Story is "industrial diorama strategy" rather than "cute pixel
town sim."

## Color Palette

Base the art direction on `src/theme.ts`.

Primary palette tokens:

| Token | Hex | Use |
| --- | --- | --- |
| `cream` | `#F4EAD7` | main UI background, card fill, soft neutral base |
| `creamBorder` | `#D8C7A8` | borders, panel separation, base trims |
| `ground` | `#E3D6BC` | terrain tile, plinth, ground plane |
| `white` | `#FFFFFF` | highlight, labels, specular pop |
| `ink` | `#2B3A4A` | primary text, dark line accents |
| `inkMuted` | `#6B7A8A` | secondary text, soft interface detail |
| `steelLight` | `#C9D3DB` | clean metal panels, light tanks |
| `steelMid` | `#9AAAB8` | standard steel body color |
| `steelDark` | `#6E7E8C` | shadows, frames, pipe contrast |
| `orange` | `#E8833A` | warning, maintenance, heat accents |
| `orangeDark` | `#C96A1F` | deeper orange trim |
| `gold` | `#F2C12E` | premium reward, sales, highlight |
| `goldDark` | `#E0A823` | product-processing accent |
| `green` | `#7FAE74` | storage, stable production, eco-positive note |
| `greenDark` | `#5C8A52` | recycling, treatment, heavy utility |
| `blue` | `#5B8DBF` | fuel/aviation cool accent |
| `blueDark` | `#3F6E9E` | deeper fuel piping/shadow accent |
| `teal` | `#7FD1C8` | science, polymer, clean tech |
| `purple` | `#9B86C2` | petrochemical identity accent |
| `red` | `#C0392B` | power, heat, hazard emphasis |

Palette rules:

- Use steel neutrals for 60-70% of any building asset.
- Use one dominant accent color per building type.
- Keep accent colors crisp and localized: pipes, tanks, trims, roof panels,
  warning bands, valves, signage plates.
- Avoid rainbow assets. Most buildings should read as steel first, accent
  second.
- UI should stay cream/ink dominant. Accent colors should guide attention,
  not flood the screen.

## Form Language

Shape rules:

- Big simple masses first, small utility details second.
- Prefer cylinders, rectangular tanks, short towers, pipe loops, ducts, and
  stacked modules.
- Use bevels and chamfers to soften edges.
- Keep rooflines varied enough to distinguish silhouettes at thumbnail size.
- Avoid hairline details that disappear on mobile.

Material rules:

- Painted steel
- matte concrete
- rubber hoses only where necessary
- subtle glass only for labs/control windows
- minimal grime
- no photoreal rust textures

Camera and lighting:

- Consistent isometric 3/4 top-down angle
- Soft daylight
- Clean shadow under each asset
- Slight ambient occlusion in seams
- No dramatic night lighting for base asset renders

## Building Asset Direction

Every building should feel like a miniature industrial model on a neat,
self-contained footprint. The silhouette must be identifiable before any
tiny detail is noticed.

| BuildingType | Visual role | Dominant forms | Accent color | Asset notes |
| --- | --- | --- | --- | --- |
| `crudeTank` | raw storage | 1-2 large cylindrical tanks, short ladders | `steelMid` | broad, sturdy, heavy; black oil cues should be subtle |
| `distillationUnit` | core refining tower | vertical column, side pipes, condenser tanks | `steelDark` | tallest classic refinery silhouette; main hero asset |
| `productTank` | refined output storage | cleaner tank cluster, flatter tops | `green` | should read more orderly and polished than crude storage |
| `laboratory` | R&D support | compact building block, roof vents, glass strip | `teal` | cleaner, smarter, less heavy-industry than plants |
| `maintenanceWorkshop` | repair/utilities | workshop shed, gantry, tool bay, crane arm | `orange` | practical, mechanical, rugged but tidy |
| `salesOffice` | business/admin | modular office block, canopy, sign plinth | `gold` | the most polished non-industrial building |
| `lubricantPlant` | specialty processing | medium tank + compact process skids | `goldDark` | warm premium processing tone, compact and efficient |
| `jetFuelPlant` | aviation fuel line | long horizontal tanks, pipe racks, cooler modules | `blue` | streamlined, precise, cooler temperature feel |
| `petrochemicalPlant` | chemical conversion | vertical vessels, reactor pods, cross-pipes | `purple` | denser chemistry silhouette, but still readable |
| `powerPlant` | energy generation | turbine hall, stacks, heat exchangers | `red` | strongest hazard/energy presence; bold silhouette |
| `wasteTreatmentPlant` | cleanup/recycling utility | settling tanks, filters, treatment basins | `greenDark` | should feel responsible and functional, not dirty |
| `polymerPlant` | advanced materials | pelletizing line, hoppers, clean process modules | `teal` | modern clean-tech industrial look |
| `lubricantTank` | lubricant storage | compact premium tank set | `goldDark` | match Lubricant Plant family identity |
| `jetFuelTank` | jet fuel storage | horizontal aviation tanks | `blue` | pair visually with Jet Fuel Plant |
| `petrochemicalTank` | petrochemical storage | chemical cylinders with pipe collars | `purple` | pair visually with Petrochemical Plant |
| `recyclingBunker` | recycled material storage | bunker bin, conveyor inlet, sorting box | `greenDark` | chunkier and more grounded than tanks |
| `pelletSilo` | plastic pellet storage | clean silos, feed hopper, outlet pipe | `teal` | should feel precise, dry, and advanced |

Family consistency rules:

- Processing plants should look related through shared steel materials and
  pipe language.
- Storage assets should look simpler and calmer than production plants.
- Support buildings should feel smaller and more architectural than heavy
  process infrastructure.
- Tank-farm buildings should inherit the accent color of their matching
  product line.

Priority silhouette hierarchy:

1. `distillationUnit`
2. `powerPlant`
3. `petrochemicalPlant`
4. `jetFuelPlant`
5. `polymerPlant`
6. `wasteTreatmentPlant`
7. all storage/support buildings

## Product Icon Direction

Product icons must read instantly at small mobile sizes. Use simple
industrial symbols, not literal tiny scene renders.

General rules:

- Use one strong central object per icon.
- Keep background simple or transparent.
- Use bold value separation and minimal micro-detail.
- Match each product to its building-family accent color.
- Favor clean badge-like silhouettes over busy containers.

| Product | Direction |
| --- | --- |
| `gasoline` | fuel can or rounded fuel droplet with warm amber-gold accent |
| `asphalt` | dark slab/block with subtle texture, heavy and dense |
| `jetFuel` | compact aviation canister or drum with blue accent band |
| `lubricants` | clean oil bottle, drum, or droplet with gold-dark accent |
| `petrochemicals` | chemical flask, sealed canister, or reactor vial with purple accent |
| `recycledMaterial` | compressed recycled bundle/flakes with green-dark accent |
| `plasticPellets` | small pellet cluster in a clean teal container or hopper shape |

Icon rendering style:

- low poly but simplified
- premium mobile-game icon finish
- crisp edge lighting
- restrained gradients
- no text baked into the icon

## Worker and Staff Portrait Direction

Portraits should support the management fantasy without turning the game
into a character-collector presentation.

Direction:

- bust or chest-up portraits only
- 3/4 view preferred
- neutral or lightly confident expressions
- industrial uniforms, safety jackets, helmets, headsets, lab coats as needed
- color accents tied to role family, not to rarity fireworks

What to avoid:

- chibi bodies
- oversized anime eyes
- exaggerated comedy faces
- crowded background scenes
- pixel portraits

Portrait style notes:

- Face shapes should be readable and grounded.
- Keep shading soft and graphic, not hyper-real.
- Backgrounds should be plain gradient cards or soft geometric shapes.
- Veteran/high-tier staff can gain more refined trims, badges, headset gear,
  specialty goggles, or cleaner tailoring instead of fantasy armor.

Suggested role cues:

- scientists/lab staff: teal, clean coat, tablet, safety glasses
- maintenance staff: orange, utility vest, gloves, tool harness
- sales/admin: gold, collared uniform, clipboard, tablet
- fuel/plant specialists: blue, purple, or teal accents based on domain

## UI Direction for Mobile

The UI should feel like an industrial control board wrapped in a warm,
premium mobile game shell.

Layout rules:

- prioritize one clear focal action per section
- generous spacing and card separation
- large tap targets
- minimal clutter around numbers and resources
- keep iconography and labels readable at a glance

Visual rules:

- cream and ink are the foundation
- use steel borders and dividers, not heavy black outlines
- highlight actions with gold, orange, blue, or green based on meaning
- use rounded corners, but avoid toy-like puffiness
- shadows should be soft and grounded

Component direction:

- Cards: cream fill, subtle steel or cream-border stroke, soft shadow
- Buttons: strong fill with high text contrast, simple icon support
- Tabs: compact, icon-led, clean active state
- Resource chips: color-coded but still harmonized with the neutral base
- Modal/sheets: feel like polished control panels, not pop-cartoon windows

Do not do:

- full-screen saturated panels
- noisy patterned backgrounds
- tiny decorative bolts everywhere
- character mascots occupying valuable UI space
- thick arcade outlines

## Asset Priority List

Priority 1:

- building renders for all `BuildingType` values
- consistent base tile/plinth treatment
- product icons for all sellable and stored goods

Priority 2:

- worker/staff portrait system
- UI icon set for build, upgrade, move, demolish, sell, research, power,
  waste, storage
- polish pass for card backgrounds and modal chrome

Priority 3:

- VFX accents: smoke puffs, subtle steam, spark, glow, sell flash
- event/achievement badge art
- decorative scene props for marketing images only

Priority 4:

- splash/menu key art
- app store promo compositions
- large marketing diorama scenes with vehicles or staff

Production note:

If time is limited, complete the building family first. The game fantasy
depends more on strong refinery silhouettes than on character art.

## Rules for Future Image Generation Prompts

All prompts should start from the same base visual language so assets feel
cohesive.

### Required prompt ingredients

Every prompt should specify:

- low poly industrial miniature diorama
- premium mobile game asset
- clean isometric 3/4 top-down view
- simple readable silhouette
- painted steel and concrete materials
- soft daylight
- isolated asset or transparent background when needed

### Negative prompt rules

Always exclude:

- pixel art
- voxel blockiness
- chibi characters
- Kairosoft style
- anime style
- photoreal grime
- over-detailed pipes everywhere
- text labels
- busy city background
- dramatic cinematic camera

### Prompt template for buildings

Use this structure:

```text
<building name>, low poly industrial miniature diorama, premium mobile game asset, clean isometric 3/4 top-down view, simple readable silhouette, painted steel, concrete base, controlled accent color <accent>, soft daylight, subtle ambient occlusion, tidy industrial details, isolated on transparent background, no text, no characters, no pixel art, no Kairosoft style
```

### Prompt template for product icons

```text
<product icon>, low poly premium mobile game icon, simple centered object, strong silhouette, clean industrial styling, accent color <accent>, soft highlight, transparent background, readable at small size, no text, no pixel art, no clutter
```

### Prompt template for portraits

```text
<role> worker portrait, premium mobile game portrait, clean stylized semi-realistic low poly illustration, chest-up 3/4 view, industrial uniform, calm confident expression, simple soft background, readable on small screen, no chibi, no anime exaggeration, no pixel art
```

### Prompt checklist before generating

- Is the silhouette recognizable at 64-128 px?
- Is there only one primary accent color?
- Does the asset read as industrial before decorative?
- Is the asset cleaner and more premium than playful?
- Would it still fit next to cream-and-steel UI without clashing?

If any answer is "no", rewrite the prompt before generating.

## Final Style Summary

Refinery Story should look like a refined tabletop refinery model:
modular, industrial, warm-neutral, and premium. Buildings lead. UI stays
clear. Characters support the fantasy but never dominate it. Every asset
should feel designed for mobile readability first and industrial charm
second.
