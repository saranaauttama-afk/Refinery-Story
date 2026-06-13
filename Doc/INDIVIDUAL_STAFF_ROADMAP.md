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
