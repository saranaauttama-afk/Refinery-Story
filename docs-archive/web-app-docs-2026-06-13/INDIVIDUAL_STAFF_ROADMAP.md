# Individual Staff Roadmap

Decision made 2026-06-13: move from per-TYPE shared level/XP to per-EMPLOYEE
individual level/XP. This is the foundational change BACKLOG item #2 (star
employees) was deferring — doing it now, before more is built on top of the
per-type model, while the migration surface is still manageable.

## Why (recap)
- Opens "assign this person to that plant" as a future system, which ties
  directly into the process chain (the refinery's own depth).
- The single biggest missing Kairosoft "your team" feeling — individuals you
  recognize, not just type counters.
- Foundation for legendary hires, retirement/turnover, traits later.

## Phase 1 — Data model migration (THIS SESSION)

- New `Employee = { id: string; type: WorkerType; name: string; level: number; xp: number }`.
- `GameState.employees: Employee[]` becomes the source of truth for
  name/level/xp. `workerLevels`/`workerXp`/`workerNames` REMOVED.
- `workerCounts: WorkerCounts` KEPT as a stored field (31 existing call sites
  read it for unlock checks, specialist multipliers, display, milestones) —
  invariant maintained: `employees.filter(type).length === workerCounts[type]`
  at every mutation site (hire, milestone free-hires).
- `effectiveWorkers(type)` becomes `sum(getWorkerLevelMultiplier(e.level))`
  over that type's employees — was `count * multiplier(sharedLevel)`. At
  uniform level these are identical; now the curve is smooth as individuals
  level up one at a time instead of the whole type jumping together.
- **"Concentrated training" XP** (preserves the EXISTING aggregate XP rate —
  no balance shift in total speed): each tick, the type's total XP budget
  (`count * xpPerWorkerPerTick`, unchanged formula) goes to the LOWEST-level
  employee of that type (tie-break: lowest xp, then array order). They level
  up one at a time, in sequence, rather than the whole type jumping together.
- **New hires start at level 1** (a real, intentional balance shift — late
  hires are "rookies" who need to catch up, making "build your team early"
  meaningful). Existing employees from migration keep the OLD shared level.
- Paid training (`handleTrainWorker`) now levels up the SAME "lowest-level"
  target employee (one click = one person's level-up), cost formula unchanged
  (based on that employee's current level).
- Save migration: old saves (workerCounts + workerLevels + workerXp +
  workerNames) → `employees[]`, ALL employees of a type get the OLD SHARED
  LEVEL (so `effectiveWorkers` is numerically IDENTICAL immediately after
  migration — `count * mult(sharedLevel) === sum(mult(sharedLevel), count times)`),
  xp resets to 0 (shared-pool XP doesn't map to individuals; small one-time
  loss, not a big deal).
- UI: StaffPanel roster shows each employee's name + their OWN level badge
  (extends the named-roster from the Charm Pass). One "currently training"
  progress bar + Train button targets the lowest-level employee (same
  one-button-per-type UX as before, now visibly tied to a person).
  WorkerPresenceBar tokens show each individual's own level.

## Phase 2 — Future
- Let the player CHOOSE who to train (not just auto-pick lowest-level).
- Retirement/turnover: long-tenured employees eventually retire, replaced by
  a new rookie — creates ongoing roster management.
- Employee detail view.

## Phase 3 — Future
- Assign specific employees to specific plants/buildings (ties into the
  feedstock process chain — e.g. assign a named chemist to the Petrochemical
  Plant for a local bonus). This is the payoff Phase 1 sets up for.

## Phase 4 — Future
- Traits / veteran tags / legendary hires (original BACKLOG #2 idea), now
  layered onto real individuals instead of type aggregates.

## Phase 3 — Assign Specialists to Plants (SCOPED, this session)

Scoped to the 2 EXISTING specialist-worker mechanics (not all 9 worker
types — that would be a much larger redesign):
- `aviationSpecialist` → `jetFuelPlant` (BONUS_BALANCE.aviationSpecialistJetFuelBonusRate = 0.20)
- `chemicalEngineer` → `petrochemicalPlant` (BONUS_BALANCE.chemicalEngineerPetrochemicalsBonusRate = 0.20)

### Design
- New `GameState.assignments: Partial<Record<WorkerType, string[]>>` — for
  'aviationSpecialist'/'chemicalEngineer', the list of EMPLOYEE IDs currently
  assigned to that plant. Capacity = `buildingCounts[plant.buildingKey]`
  (1 plant = 1 slot).
- **Balance shift (intentional, the actual "payoff")**: specialist bonus
  formula changes from `1 + workerCounts[specialistWorker] * rate` (every
  hire counts, flat rate) to `1 + sum(getEmployeeMultiplier(assigned
  employee) * rate)` over ASSIGNED employees only, capped at plant count.
  - UNASSIGNED specialists contribute ZERO to that plant's output.
  - ASSIGNED specialists contribute `rate * their own multiplier` — a
    leveled-up or Veteran specialist assigned is worth MORE than a fresh
    rookie. This is the direct payoff of Phase 1+4 (individual level/veteran
    now matters for WHERE you put someone, not just how many you have).
- Migration / auto-assign: on load, if `assignments[type]` is empty/missing
  but employees of that type exist, auto-fill up to plant capacity in hire
  order. Keeps existing saves functional (not a sudden cliff to zero) while
  introducing the cap going forward. Sanitized to valid employee IDs of the
  correct type on every load.
- UI: in StaffPanel, aviationSpecialist/chemicalEngineer roster rows get an
  Assign/Unassign toggle, with an "X/Y assigned" counter per type. Disabled
  when full (unless toggling off).

### Out of scope (future)
- Extending assignment to other worker types/buildings (chemist, operator,
  etc.) — would need to first establish what each type's bonus even means
  per-building (most are global, not per-plant, today).
- Per-instance (per grid-cell) production — production stays aggregated by
  building TYPE; assignment caps at plant COUNT, not specific cells.
