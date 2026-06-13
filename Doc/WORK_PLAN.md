# WORK PLAN — Hidden/Discoverable Combos (BACKLOG item #4)

Branch: `feature/hidden-combos` (off rival-refineries). Started 2026-06-13.

## Design
5 NEW one-time combos, each a SET of 3 distinct building types found in any
3 consecutive cells of a row or column (order-independent). Not shown
anywhere in-game UI — player discovers by experimenting with layout. First
time a combo's building set is present on the grid -> one-time cash/RP
(/reputation) reward + discovery toast (reuse era-banner-toast pattern) + log
entry. Tracked in `discoveredCombos: string[]`.

## Combos (easy -> hard)
1. "Full Refinery Line" {crudeTank, distillationUnit, productTank} - early,
   the starter trio. Small reward.
2. "Command Center" {laboratory, maintenanceWorkshop, salesOffice} - 3
   support buildings together.
3. "Jet Set Row" {distillationUnit, jetFuelPlant, salesOffice}
4. "Refining Triangle" {distillationUnit, lubricantPlant, petrochemicalPlant}
5. "Petrochemical Complex" {lubricantPlant, jetFuelPlant, petrochemicalPlant}
   - hardest (all 3 advanced plants in a row), biggest reward incl. reputation.

## Tasks
### 1. data/hiddenCombos.ts + types (HiddenComboConfig, discoveredCombos field)  [x]
### 2. Detection: getNewlyDiscoveredCombos(grid, discoveredCombos)  [x]
### 3. Wire into tick: apply reward + log + queue discovery toast  [x]
### 4. ComboDiscoveryToast component (reuse era-banner-toast pattern)  [x]
### 5. Save migration: discoveredCombos defaults []  [x]
### 6. Tests + docs + push  [x]
