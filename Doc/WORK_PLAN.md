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
