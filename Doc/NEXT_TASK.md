# Next Recommended Task

Branch: `feature/ui-skeleton-v1`
Last updated: 2026-06-18

---

## Immediate Next Task

### Visual Layer Phase 3A — Road & Yard Foundation

**Goal:**
Add visual connective language to the factory yard without changing gameplay,
save format, or grid interactions.

**What to add:**

1. **Pipe / road segments between building categories**
   - Render thin View strips connecting crude tanks → distillation units
   - Render thin View strips connecting distillation → product tanks
   - These are purely decorative — no hit targets, no gameplay effect
   - Use `pointerEvents="none"` on all connector elements

2. **Subtle concrete pad behind the grid**
   - A slightly lighter or darker rectangle behind the grid area
   - Makes the grid feel embedded in a designated zone, not floating

3. **Empty slot visual update (optional)**
   - Replace the dashed border / faint `+` with a subtle placement pad
   - Low-opacity ground marking that reads as "empty slot here"

**What NOT to add:**
- No trucks, workers, smoke, or animation
- No isometric rendering
- No image assets
- No new game logic

**Files likely to change:**
- `src/components/BuildingGrid.tsx` — connector layer between tiles
- `src/components/BuildingTile.tsx` — empty slot style update
- `app/game/(tabs)/index.tsx` — possibly yard background detail
- `src/buildingIdentity.ts` — pipe connection rules (which building types connect)

**Success criteria:**
- A player can visually trace the crude-to-gasoline flow path
- Grid feels embedded in a yard, not floating on a background
- All existing build/inspect/buy/sell interactions still work
- Typecheck passes

---

## Task After That

### Visual Layer Phase 3B — Building Silhouette Polish

**Goal:**
Make each building type visually distinct at 70 px tile size.

**What to improve:**
- Crude tank: dome / cylinder shape suggestion
- Distillation unit: chimney stack shape
- Product tank: shorter dome, different color tint
- Laboratory: antenna / precision instrument suggestion
- Maintenance: tool silhouette
- Sales office: building-like rectangular form

**Files likely to change:**
- `src/components/BuildingSilhouette.tsx`
- `src/buildingIdentity.ts`

---

## Task After That

### Visual Layer Phase 4 — Day/Night Atmosphere

**Goal:**
Make the day/night cycle visually felt, not just seen in the sky.

**What to change:**
- Shift yard ground color at night (cooler, slightly darker)
- Add warm tint to building tile surfaces at dusk
- Make the night overlay more directional (darker at edges, lighter in center)

**Files likely to change:**
- `app/game/(tabs)/index.tsx` — conditional yard/tile tint styles
- `src/components/BuildingTile.tsx` — day/night surface variants
- `src/theme.ts` — possibly night-mode palette constants

---

## Longer-Term Backlog

| Phase | Task |
|---|---|
| Phase 5 | HQ progression hub (real screen replacing placeholder) |
| Phase 5 | Refinery upgrade animation / expansion reveal |
| Phase 6 | Worker dots on active production buildings |
| Phase 6 | Truck appearance on buy/sell actions |
| Phase 7 | Era visual shifts (palette per era) |
| Phase 7 | Smoke/steam particles above active units |
| Phase 8 | Seasonal atmosphere changes |

---

## Rules for All Future Tasks

1. Preserve save compatibility at all times
2. Run `npx tsc --noEmit` before committing
3. Do not rewrite working systems
4. Mobile-first — test on 375 px width constraint
5. Layered composition must be preserved — never revert to dashboard stack
6. No image assets until pixel art pipeline is established
7. Incremental: each task should be independently shippable
