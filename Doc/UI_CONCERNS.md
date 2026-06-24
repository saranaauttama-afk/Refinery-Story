# UI Concerns Register

Branch: `feature/ui-skeleton-v1`  
Last updated: 2026-06-19

---

## Stabilized In This Milestone

The following are no longer top concerns on the visible player path:

- Refinery Expansion being hidden inside Stats
- Settings/save tools being hidden in Main Menu or hidden Stats
- HQ being placeholder-only
- Factory Events using a gear icon that looked like Settings
- Prototype renderer being forced live by default

These are considered stabilized for now, not permanently "finished forever."

---

## HIGH PRIORITY

### H1 - Factory still does not communicate "living refinery"

**Why it matters:**
The branch is structurally cleaner, but the core visual fantasy is still not
landing. The Factory screen is more readable than before, yet it still does
not fully feel like an industrial facility in motion.

**Current state:**

- layered scene is in place
- grid-first layout is correct
- background atmosphere exists
- but the scene still lacks convincing refinery life

**Recommended timing:** next visual-direction task, after projection review

---

### H2 - Factory map direction still needs approval

**Why it matters:**
This branch now contains three renderer paths:

- `grid`
- `map2_5d`
- `isometric`

The live default is safely back on `grid`, but the future direction has not
been chosen yet. Starting another visual pass before reviewing the existing
projection prototypes would create more churn than clarity.

**Current state:**

- `grid` is the live reviewed renderer
- `map2_5d` and `isometric` remain available for review
- prototype renderers still need screenshot/device judgment before promotion

**Recommended timing:** immediate next task

---

## MEDIUM PRIORITY

### M1 - Building renderer split remains a maintenance risk

**Why it matters:**
There are still two competing visual systems:

- `BuildingGrid` / `BuildingTile` / `BuildingSilhouette`
- `FactoryIsometricView`

Even with clearer documentation, future contributors could still update the
wrong renderer or assume the prototype is authoritative.

**Current state:**

- live authoritative renderer is documented
- prototypes now still source category colors/badges from `buildingIdentity`
- split architecture still exists

**Recommended timing:** after renderer direction is approved

---

### M2 - Boost UI has weak visible ownership

**Why it matters:**
Boost logic still exists, but it no longer has a strong visible surface in
the current Factory flow. Players may not discover or remember it.

**Current state:**

- boost state/actions still exist in code
- no clear current Factory affordance is visible in the live branch

**Recommended timing:** after projection review, before deeper visual polish

---

### M3 - Rankings / award history still need durable ownership

**Why it matters:**
Annual ranking still mostly appears during the year-end `AwardModal`, while
HQ currently provides only summary-level visibility. That is better than
before, but still not a fully owned progression surface.

**Current state:**

- HQ shows award/era summary
- last ranking can be summarized there
- full ranking/history still does not have a dedicated visible screen

**Recommended timing:** after projection review or alongside deeper HQ work

---

### M4 - Hidden Stats route still exists as legacy ownership

**Why it matters:**
The visible player path is now fixed, but `app/game/(tabs)/stats.tsx` still
exists as a hidden route. It is useful as a safety net during transition,
but it is still architectural debt.

**Current state:**

- Stats is hidden from nav
- HQ now owns visible access to the important systems Stats used to gate

**Recommended timing:** later IA cleanup pass

---

## LOW PRIORITY

### L1 - Require cycle warning

**Current state:**
`gameCalculations.ts -> recruitment.ts -> gameCalculations.ts`

**Recommended timing:** technical debt pass, not visual work

---

### L2 - Expo Linking scheme warning

**Current state:**
build-time config warning still present

**Recommended timing:** before any build/distribution work

---

### L3 - Prototype renderers still lack real device verification

**Current state:**
typecheck passes, but prototype visuals/tap behavior still have not been
verified on device/simulator in this environment

**Recommended timing:** during projection review

---

*For current state and ownership, see `Doc/UI_STATUS.md`.*
*For the next recommended task, see `Doc/NEXT_TASK.md`.*
