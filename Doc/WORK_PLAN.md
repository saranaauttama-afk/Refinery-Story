# WORK PLAN — Individual Staff, Phase 1 (Data Model Migration)

Branch: `feature/individual-employees` (off hidden-combos). See
Doc/INDIVIDUAL_STAFF_ROADMAP.md for the full design + future phases.

## Tasks
### 1. types.ts: Employee type, GameState.employees, remove workerLevels/workerXp/workerNames  [x]
### 2. gameCalculations.ts: init, effectiveWorkers, applyStaffXp (concentrated training), getYearlyPayroll, hire/train, milestone free-hires  [x]
### 3. App.tsx: hire/train handlers operate on employees  [x]
### 4. gameStorage.ts: migrate old saves (workerCounts+workerLevels+workerXp+workerNames -> employees)  [x]
### 5. StaffPanel.tsx + WorkerPresenceBar.tsx: per-employee level display  [x]
### 6. Tests + docs + push  [x]

## Verification
build/lint/tsc + full regression (116 prior assertions) + new migration/
formula tests. Dev server smoke test.


---

# WORK PLAN — Individual Staff, Phase 2a (Player Chooses Who to Train)

Branch: `feature/staff-training-choice` (off individual-employees).

## Tasks
### 1. App.tsx: handleTrainEmployee(employeeId) replaces handleTrainWorker(worker)  [x]
### 2. StaffPanel.tsx: per-employee roster rows with individual Train buttons  [x]
### 3. Remove dead trainingLabel/roster translations + .staff-roster/.staff-level-block CSS  [x]
### 4. Tests + docs + push  [x]


---

# WORK PLAN — Individual Staff, Phase 4 (Veteran Trait)

Branch: `feature/staff-veteran-trait` (off staff-training-choice). Phase 2b
(retirement/turnover) skipped: not a dependency of 3/4, deferred pending
design discussion (risk of feeling punitive).

## Tasks
### 1. balance.ts: veteranHireChance (5%), veteranBonusRate (+20%)  [x]
### 2. Employee.trait?: 'veteran'; getEmployeeMultiplier; getEffectiveWorkerSum uses it  [x]
### 3. createNewEmployee(employees, type) shared helper (3 hire sites)  [x]
### 4. StaffPanel: veteran badge + bonus% reflects it; hire log flavor line  [x]
### 5. Save migration: trait sanitize/round-trip  [x]
### 6. Tests + docs + push  [x]


---

# WORK PLAN — Individual Staff, Phase 3 (Assign Specialists to Plants)

Branch: `feature/staff-assignments` (off staff-veteran-trait). Scoped to the
2 existing specialist mechanics per Doc/INDIVIDUAL_STAFF_ROADMAP.md.

## Tasks
### 1. types.ts: GameState.assignments: Partial<Record<WorkerType, string[]>>  [x]
### 2. gameCalculations.ts: getAssignmentCapacity, getSpecialistMultiplier, export countBuildings  [x]
### 3. App.tsx: tick uses getSpecialistMultiplier; handleToggleAssignment handler  [x]
### 4. StaffPanel.tsx: assignment status header + per-employee Assign/Unassign  [x]
### 5. gameStorage.ts: getSafeAssignments with auto-assign-up-to-capacity fallback  [x]
### 6. Tests + docs + push  [x]


---

# WORK PLAN — Post-Phase-3 Balance Pass

Branch: `feature/post-phase3-balance-pass` (off main, post staff-assignments
merge).

## Tasks
### 1. Concentrated training over time (incremental hiring) simulation  [x]
### 2. Specialist assignment regression check (1:1, over-hire, payoff)  [x]
### 3. Mid-game derived-stats snapshot sanity check  [x]
### 4. Conclusion: no numeric constants changed. Docs updated.  [x]
