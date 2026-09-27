# Factory Scene Vision

Branch: `feature/ui-skeleton-v1`
Last updated: 2026-06-18

---

## What the Target Is NOT

The target visual is NOT:

- A dashboard
- A spreadsheet
- A grid of cards with stats
- A resource management panel with a grid attached
- A mobile idle game that looks like a to-do list
- A clone of a generic city-builder grid

If the first impression is "I see colored boxes with numbers," the visual
direction is wrong.

---

## What the Target IS

The target is:

- A **living refinery** — industrial, operational, grounded
- A **management simulation** — the player is running an actual facility
- A **visual progression system** — the world should look different at
  level 3 than it did at level 1
- **Kairosoft-inspired feel** — top-down management scene, buildings
  placed in a world, visual density that rewards exploration
- A **scene you inhabit**, not a UI you operate

The player should glance at the Factory screen and think:
*"I'm running a refinery."*
Not:
*"I'm managing a grid."*

---

## Design Principles

### 1. The Refinery Is the Hero

The building grid should dominate the screen.
Everything else — resources, goals, actions — overlays the world.
Nothing should push the refinery downward.

The background provides atmosphere.
The grid is the world.
The HUD provides information.
Nothing competes with the grid for space.

### 2. Information Overlays the World

Stats, goals, and resources float over the scene.
They do not create their own layout blocks.
The player sees the refinery first, then the information.

### 3. Players Should See Growth

At level 1: sparse grid, small yard, basic buildings.
At level 5: dense grid, complex building mix, visible throughput relationships.
At level 10: full yard, era-appropriate visual changes, rich scene density.

Growth should be visible without reading numbers.
If the player comes back after a session and immediately sees that things
have changed — buildings added, products running — the visual communication
is working.

### 4. Buildings Should Feel Like Placed Objects

Buildings are objects placed on a yard, not cards in a grid.
Each building type should have a distinct silhouette recognizable at a glance.
Buildings should feel like they are *on the ground*, not *in boxes*.

Empty slots should read as ground/placement zones, not empty card outlines.

### 5. Logistics Should Eventually Become Visible

The operational relationships between buildings — crude flows from tank to
distillation, feedstock flows to product plants, products flow to sales —
should become visually readable over time.

This does not require simulation. Simple visual connectors (pipes between
categories, road paths) communicate the logic without animating it.

### 6. Era Progression Should Visually Affect the World

When the player advances eras (from Early Refinery to Modern Plant etc.),
the world should look different. Color palette shifts, different building
silhouette styles, different atmospheric conditions.

This is future work. But all visual decisions should leave room for it.

---

## Current Visual State vs Target

| Element | Current | Target |
|---|---|---|
| Sky area | 12 % of scene, flat color | Atmospheric, era-appropriate |
| Yard background | Flat `#B8A882` with 2 road strips | Ground detail, concrete pads, road network |
| Building tiles | Category-colored rounded rectangles | Distinct silhouettes, object-on-ground feel |
| Tile empty slots | Dashed border, faint `+` | Placement pad / ground marking |
| Building relationships | Invisible | Pipe/road connectors (non-interactive) |
| Day/night | Sky color change + dark veil | Lighting shift on ground and tiles |
| Production activity | Gold pulse glow on producing tiles | Visible flow / activity indicators |
| Era identity | None | Color palette + building style shifts |

---

## Future Scene Elements

The following are **future work** and should not be implemented until
the yard foundation and building silhouettes are solid:

### Near Future (Visual Layer Phase 3–4)
- **Roads** — Path strips between building clusters
- **Pipes** — Connecting crude tanks → distillation → product tanks
- **Placement shadows** — Subtle drop shadow per building tile
- **Yard ground detail** — Subtle concrete variation, wear marks

### Medium Term (Visual Layer Phase 5–6)
- **Workers** — Small dot or figure sprites moving between buildings
- **Trucks** — Entering/exiting yard when buying crude or selling product
- **Smoke/steam** — Atmospheric particles above active processing buildings
- **Light pools** — Night-time light sources near buildings

### Long Term (Visual Layer Phase 7+)
- **Ships** — If port / coastal facility map is introduced
- **Era visual shifts** — Palette and style changes per era
- **Expansion animations** — Grid growth when refinery upgrades
- **Weather/season atmosphere** — Subtle sky and ground changes per season

---

## Rules for Future Visual Work

1. **Never push the grid down.** All overlays must be absolutely positioned.
2. **No new image assets yet.** All visual work should use React Native
   View compositions until a pixel art production pipeline is established.
3. **No isometric math yet.** Top-down / slight overhead perspective only.
4. **Incremental passes.** Each visual phase should be independently shippable.
5. **Test on small screens first.** iPhone SE / 375 px width is the constraint.
6. **Gameplay first.** A visual change that breaks tap targets or hides
   information is wrong, no matter how good it looks in isolation.

---

*For current concerns and blockers, see `Doc/UI_CONCERNS.md`.*
*For the next recommended task, see `Doc/NEXT_TASK.md`.*
