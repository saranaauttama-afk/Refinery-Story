# Coastal Pixel Industrial redesign — 4.0.25

Owner approved the new illustrated game-screen concept on 21 October 2026 and asked to implement it together with a matching title screen. This supersedes the earlier small-screen chrome sizes and two-row HUD requirement for this visual pass. Game rules and content data remain protected.

Branch: rewrite/v4. Base: 6f4ae43. Version 4.0.25 / Android 37.

## Implemented

- New native-resolution coastal title art, a two-line live-text metal logo, cream menu frame and large orange/cream New Game and Continue buttons.
- Existing ready/loading, save-error, newGame and Continue behavior remains wired to GameProvider and Expo Router.
- Cream enamel HUD with a navy brand plate, large resource instruments, live date/rank progress, bell, existing speed cycle and a shortcut to the existing Company settings view.
- Five original code-native pixel icons and a larger 88px navy/enamel navigation dock. Icons stay sharp at device resolution.
- Larger Build previews, high-resolution original menu art and shared enamel highlights.
- A generated empty coastal environment behind the actual Skia yard. No gameplay buildings, roads or controls are baked into this background.
- Concrete remains computed from owned parcels, with precise tile placement highlighting. The scenery uses the same camera transform as the yard.
- Opening framing uses actual raster sprite bounds and a closer 3x minimum presentation zoom, within the existing 1x–4x zoom controls. This changes only the local view, not positions, footprints or saved state.
- Starter guidance occupies a framed lower-yard card; the post-guide Build CTA uses the existing catalogue action. Toast offset follows the card height so messages stay readable.

## Art sources

Both assets were generated with built-in image_gen using the approved concept as style reference, then copied into the game at the original resolution. No downscaling, pixelation or JPEG conversion.

| File | Native size | SHA-256 |
|---|---|---|
| assets/v4/art/title_coastal_v2.png | 1024×1536 | 8b011e1530a161b15403a318e4066f9f577fec25144cdcb3348927ea27670e07 |
| assets/v4/art/yard_coastal_v2.png | 1774×887 | a94632714335ce7727252e359ea773fd59d957e27074d901ccab02a1ae06e8d6 |

The title contains an illustrative refinery. The playable yard backdrop contains only empty terrain/coast; existing plant sprites and their registry are retained for the dedicated plant pass.

Header art now reads the original bg_build/bg_blend/bg_staff/bg_customers/bg_company PNGs in art-src/gpt. Existing small JPEG derivatives are preserved but no longer used in those headers.

## Exact generation prompts

### Title background

~~~text
Use case: stylized-concept.
Asset type: the actual high-resolution portrait TITLE SCREEN BACKGROUND asset for the mobile game REFINERY STORY. Use input image 1, the approved complete game-screen concept, ONLY as the art-style reference: cheerful sharp chunky pixel industrial art, navy outlines, warm cream, steel grey, orange and yellow, beautiful blue coastal water. This output is BACKGROUND ART ONLY, without any interface.

Create a premium cute miniature coastal refinery seen in fixed 2:1 pixel isometric/dimetric perspective. Tall compact steel distillation column with orange rings, low round oil tanks, red and blue product bands, a small orange-roof loading canopy, one little tanker truck and a few tiny hard-hat workers. Shared clean concrete yard, simple thick pipes that stay near machinery, bright tropical green verges, a small road, sparkling turquoise coastline and a few simple palm trees. It should feel like a lovingly built miniature game world, with strong clear silhouettes and generous space, not a technical refinery illustration. Simplify machinery compared to the input reference. Crisp deliberate square pixel clusters, dark stepped outlines, flat three-tone materials. No blur, no depth of field, no realistic metal, no smooth 3D shading, no microdetail noise.

Portrait composition, ideally 1536x2304 or similarly high-resolution portrait. The MAIN REFINERY is large and beautifully composed in the middle 55% of the image. Reserve the top 23% as calm blue sky and distant blue coastline with sparse small pixel clouds, suitable for a large separately rendered game logo. Keep the bottom 22% visually quieter with paved road/forecourt and a little greenery, suitable for a separate menu overlay. The scene must fill the full frame with no blank border and retain its refinery focal point when cropped to a tall phone screen. Top-left daylight, bright cheerful colour, thoughtful large shapes. Visually match the approved reference style without copying its HUD.

ABSOLUTELY NO text, letters, numbers, logos, signs, buttons, counters, HUD, frames, badges, watermark or interface anywhere. Do not bake any user interface into the artwork. A single cohesive sharp background painting for a game, no collage, no sprite sheet.
~~~

### Playable-yard environment

~~~text
Use case: stylized-concept.
Asset type: a HIGH-RESOLUTION ENVIRONMENT BACKDROP for the playable isometric yard of Refinery Story. The two references show the approved pixel-industrial game concept and the matching new title illustration. Use their bright sharp pixel-art style, coastal blues, cheerful lush greens and top-left daylight. This output is environment art ONLY, ready to sit BEHIND a separately rendered interactive concrete yard.

Landscape composition 1536x1024 or larger. Fixed 2:1 dimetric/isometric game camera, looking down at a miniature coastal industrial site. The entire middle is a VERY LARGE EMPTY FLAT QUIET PALE SAGE-GREEN LAND CLEARING, approximately a broad 2:1 isometric diamond, occupying about 70% of image width and the middle 42% of image height, centred slightly below the image midpoint. NOTHING occupies this empty central clearing. It must be calm and virtually uniform because the game will draw its own 16x16 concrete ground grid over it. Do not draw a concrete yard, a foundation, grid, slab, pavement, markings or objects in this clearing.

Only around the far outskirts of the empty land clearing: beautiful turquoise-blue sea, a little pale sandy coastline, a few chunky low green trees and shrubs, simple rocky coast corners and a small number of palm trees. All trees and rocks stay near the OUTER EDGES, never in the central clearing. Keep the perimeter restrained and uncluttered, with large readable shapes. All four image corners and the entire outer image boundary should be BLUE WATER so it blends into a solid-blue world background beyond the image. No horizon line and no sky; this is an overhead isometric world environment, not a scenic postcard. No buildings at all, no refinery, tanks, machinery, pipes, trucks, workers, roads, fences, utility poles or ships. The game adds its own live objects and public road.

Crisp charming high-resolution chunky pixel art in the visual direction of Kairosoft mobile games. Deliberate square pixel clusters, dark clean outlines on coast objects, flat simple three-tone materials. Low contrast in the central land; stronger colour on the far coast. Strong consistency with the two references. NO blur, low-resolution upscaling, painterly texture, realistic 3D, microdetail noise or depth of field. NO text, letters, numbers, logos, interface, border, HUD or mockup frame. A single coherent empty coastal-land backdrop with plenty of quiet central space for the real playable yard.
~~~

The tool returned the native sizes recorded above; the requested ideal prompt size is not asserted as the actual output size.

## Validation

All required gates passed: npm run format, npx tsc --noEmit, npm run v4:check, the cleared web export and git diff --check. The complete simulation output is byte-identical to the pre-redesign baseline.

Actual exported Expo/CanvasKit app tested in Chromium at 390×844 and 360×740. No browser exceptions or page horizontal overflow. All 16 browser checks passed, including fresh New Game, Continue preserving saved money, New Game from an existing save, outside-land placement rejection, cancel preserving cash, a $5,000 tank placement, a $20,000 land purchase, help, hiring/customer tabs, settings and the Build CTA.

See [browser results](previews/coastal-4.0.25/browser-check.json) and individual 2x screenshots:

- [Title — new player](previews/coastal-4.0.25/title.png)
- [Title — Continue and New Game](previews/coastal-4.0.25/title-continue.png)
- [Playable yard](previews/coastal-4.0.25/yard.png)
- [Build](previews/coastal-4.0.25/build.png)
- [Staff](previews/coastal-4.0.25/staff.png)
- [Company](previews/coastal-4.0.25/company.png)

Checks use isolated local browser fixtures; none are shipped in the app. The populated preview uses a paused rank-3 save with extra funds. Export uses --clear so the embedded web Expo config also reports 4.0.25.

No changes to src/v4/sim, src/v4/data, scripts/v4, existing plant art/registry, RNG, costs, progression, recipes, saves, canPlace or tile inverse math. Required format, TypeScript and v4:check gates must pass before commit; v4:check output is compared with the pre-redesign baseline.

Android APK compilation is handled by the existing workflow after the branch update. Native frame rate and device interaction are not claimed from browser verification.
