# UI Concerns Register

Branch: `feature/ui-skeleton-v1`
Last updated: 2026-06-18

---

## HIGH PRIORITY

### H1 — Factory does not yet communicate "living refinery"

**Why it matters:**
The core product promise is a Kairosoft-style management simulation of an
oil refinery. If the Factory screen reads as a colored grid instead of a
living industrial facility, the product identity is weak. First impressions
shape retention.

**Current state:**
Grid on a beige/concrete background. No pipes. No roads. No visual flow.
Buildings are isolated tiles with no spatial relationship to each other.

**Potential solutions:**
- Add pipe/road connectors between tiles (non-interactive, visual only)
- Add subtle shadow depth to tiles to suggest 3D placement
- Add faint conveyor or flow direction indicators between linked buildings
- Add era-appropriate background detail (smoke stacks silhouette, water)

**Recommended timing:** Next task (Visual Layer Phase 3A)

---

### H2 — Grid still dominates scene composition

**Why it matters:**
The goal is a *scene* that contains a grid, not a *grid* that has a scene
around it. The grid is still the only meaningful visual element on the yard.

**Current state:**
Yard background is a flat `#B8A882` with two decorative road strips.
The grid tiles float on this background without visual integration.

**Potential solutions:**
- Add a subtle concrete pad / shadow behind the grid
- Add faint placement grid lines on the yard floor
- Vary the yard background with texture-like color variation (no assets)
- Let the grid shape change as buildings are added (don't hard-border it)

**Recommended timing:** Visual Layer Phase 3A–3B

---

### H3 — Expansion and refinery growth UX needs review

**Why it matters:**
Players upgrade the refinery to unlock more grid slots. This is a key
progression moment. Currently it is handled via a tap on the refinery name
in the HUD, with a small text indicator. This is discoverable only if the
player taps the name.

**Current state:**
Level pill shows "Lv5 ↑" in gold when upgrade is ready. Upgrade triggers
on tap. No fanfare. No visible new tiles appearing. No growth animation.

**Potential solutions:**
- Show a pulsing indicator near the HUD when upgrade is ready
- Show grid expanding animation when upgrade completes
- Display a brief confirmation overlay ("Refinery upgraded to Lv6 — 2 new slots")
- Separate upgrade into a dedicated short sheet/modal

**Recommended timing:** After Visual Layer Phase 3, before Visual Layer Phase 4

---

## MEDIUM PRIORITY

### M1 — Day/Night cycle exists but has minimal visual impact

**Why it matters:**
Day/night is computed and affects the game clock display and a night overlay
opacity. But the visual change is subtle — a dark sky color and a faint veil.
The time mechanic is not felt.

**Current state:**
`isDaytime` controls sky background color and a `0.22` opacity dark overlay.
No lighting change on building tiles. No ambient light shift on the yard.
No worker or truck behavior tied to time.

**Potential solutions:**
- Adjust building tile surface brightness based on time of day
- Add a warm orange tint to sky near "dusk" transitions
- Shift yard ground color subtly at night (cooler, darker)
- Reserve worker/truck movement for Visual Layer Phase 4+

**Recommended timing:** Visual Layer Phase 3B or 4

---

### M2 — Building silhouettes still feel generic

**Why it matters:**
The `BuildingSilhouette` component renders a simplified shape per building
type. The shapes are currently very basic (rectangles + small shapes) and
don't strongly communicate the building's industrial function.

**Current state:**
Silhouettes use the building's icon (`BUILDING_TILE_ICONS`) plus category-
specific shapes. The family-based silhouette system exists but shapes are
minimal.

**Potential solutions:**
- Add chimney-stack shapes to distillation and processing units
- Add tank dome shapes to crude/product tanks
- Add antenna/sensor shapes to laboratory
- Ensure each silhouette reads as distinct at 70 px tile size

**Recommended timing:** Visual Layer Phase 3B

---

### M3 — Goal chip occupies valuable HUD space on small screens

**Why it matters:**
On a 375 px wide screen (iPhone SE), the goal chip (full width, 28 px)
combined with the resource strip (28 px) takes 56 px of overlay space
near the top of the yard. On very short screens this could push grid tiles
further down.

**Current state:**
Goal chip is compact at 28 px but still full width. Goal chip and resource
strip are two separate rows of overlay.

**Potential solutions:**
- Merge resource strip and goal chip into one combined bar
- Make goal chip collapsible (collapsed by default, tap to expand)
- Move goal entirely to a floating badge in a corner

**Recommended timing:** If screen-size issues are reported, otherwise Low

---

## LOW PRIORITY

### L1 — Require cycle warning

**Why it matters (low):**
`gameCalculations.ts → recruitment.ts → gameCalculations.ts` creates a
circular dependency. No runtime error has been observed, but it is a code
quality concern and could surface issues in bundler optimizations.

**Potential solutions:**
- Extract the shared type/function used by both into a separate utilities module
- Refactor one file to not import the other

**Recommended timing:** Technical debt sprint, not UI work

---

### L2 — Expo Linking scheme warning

**Why it matters (low):**
Expo warns that a `scheme` is required in `app.json` for linking to work.
No linking features are currently used in-app, so this is cosmetic.

**Potential solutions:**
- Add `"scheme": "refinerystory"` to `app.json`

**Recommended timing:** Before any build submission

---

### L3 — Android emulator instability

**Why it matters (low):**
The Android emulator sometimes shows "System UI isn't responding" and
Expo may show "Cannot connect to Expo CLI." This is consistent with an
under-resourced emulator, not app code.

**Potential solutions:**
- Increase emulator RAM allocation
- Use a physical device for testing
- Use Expo Go on device instead of emulator

**Recommended timing:** Dev environment issue, not code work

---

### L4 — Stats screen hidden but not removed

**Why it matters (low):**
`app/game/(tabs)/stats.tsx` exists and is hidden via `href: null` in the
tab layout. It is dead UI that adds confusion for new contributors.

**Potential solutions:**
- Delete the file when IA is finalized
- Or repurpose it as an internal debug screen

**Recommended timing:** IA cleanup sprint, not UI work

---

*For the intended visual direction, see `Doc/UI_VISION.md`.*
*For the next task, see `Doc/NEXT_TASK.md`.*
