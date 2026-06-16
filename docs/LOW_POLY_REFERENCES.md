# Refinery Story Mobile - Low Poly References

## Purpose

This file is a text-only reference guide for the target visual language.
It complements [ART_BIBLE.md](/d:/My%20App/New-Refinery-Story/docs/ART_BIBLE.md:1)
and gives a shorter shared reference for art planning, prompt writing, and
visual review.

## Visual Direction

Target style:

- low poly industrial
- miniature diorama
- premium mobile readability
- calm, engineered, and tactile

The game should feel like a carefully built tabletop refinery model rather
than a busy factory cartoon.

Important contrast:

- not pixel art
- not Kairosoft-like character density
- not noisy or comedic
- not photoreal grime

Desired emotional read:

- smart
- premium
- industrial
- compact
- readable

## Camera Angle

Preferred camera:

- consistent isometric 3/4 top-down angle
- slight top visibility on roofs and tanks
- enough side visibility to read pipes, stacks, and massing

Why this matters:

- the Home (Refinery) grid is the game's visual center
- assets need to read quickly in small tiles
- a fixed angle keeps all building families coherent

Rendering guidance:

- soft daylight
- grounded shadows
- subtle ambient occlusion
- no dramatic cinematic perspective shifts

## Color Palette

Base palette comes from `src/theme.ts`.

Primary neutrals:

- `cream` / `creamBorder` / `ground`
- `ink` / `inkMuted`
- `steelLight` / `steelMid` / `steelDark`

Accent families:

- `orange` / `orangeDark` for maintenance, warnings, heat
- `gold` / `goldDark` for premium output and sales-facing assets
- `green` / `greenDark` for storage, treatment, and sustainability
- `blue` / `blueDark` for fuel and aviation
- `teal` for science, polymer, clean-tech
- `purple` for petrochemicals
- `red` for power and hazard emphasis

Color behavior:

- most assets should be steel-first, accent-second
- UI should stay cream/ink dominant
- accents should guide meaning, not fill every surface

## Building Style

Core building language:

- large simple masses first
- pipes and utility detail second
- clean silhouettes over micro-detail
- industrial materials: painted steel, concrete, railings, ducts, tanks

Family rules:

- processing plants should share pipe-language and structural logic
- storage assets should be calmer and simpler than production assets
- support buildings should feel more architectural and less heavy-industrial
- every building should feel like it belongs on the same diorama base system

Readability rules:

- each building must be recognizable at tile size
- roofline and silhouette matter more than tiny detailing
- avoid texture noise that collapses on mobile

## Product Icon Style

Product icons should be:

- centered
- silhouette-led
- compact
- clean-edged
- low poly, but simplified further than building renders

Do:

- use one clear object per icon
- use accent color tied to the related building family
- keep value contrast strong
- support readability at 64-128 px

Do not:

- cram multiple props into one icon
- rely on text labels
- use painterly clutter
- make every icon equally bright

Examples of intended reads:

- gasoline: warm fuel can / droplet
- jet fuel: precise blue canister or drum
- lubricants: premium oil container
- petrochemicals: chemical vessel
- recycled material: compressed green-dark bundle
- plastic pellets: teal pellet cluster / hopper

## UI Style

The current UI structure should stay intact, but future art should make it
feel more premium and more game-specific.

UI direction:

- cream surfaces
- steel borders
- clear action hierarchy
- restrained icon use
- soft shadows
- rounded corners without toy-like puffiness

What future assets should support:

- clearer action recognition
- better scan speed
- a stronger connection between the UI and the refinery world

What future assets should avoid:

- arcade-like heavy outlines
- flat generic app icons that clash with the building art
- loud textures behind text
- overdecorated control panels

## Existing Project References

Useful current references inside the repo:

- `src/theme.ts` for the palette
- `src/buildingColors.ts` for current building-family color mapping
- `docs/ART_BIBLE.md` for full art rules

## Final Reference Summary

If an asset does not look like a clean, premium, small-scale industrial model
that can sit comfortably on a mobile screen, it is off target.

The correct direction is:

- low poly
- industrial
- miniature
- premium
- readable
