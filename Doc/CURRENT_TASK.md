# Worker System Expansion 2.0 - Product Specialists

## Goal

Make workforce decisions more strategic by introducing product-specific specialist workers.

Workers should begin supporting different business strategies instead of providing only generic bonuses.

## Rules

1. Preserve save compatibility.

2. Keep existing workers unchanged:

   * Sales Agent
   * Mechanic
   * Safety Officer

3. Reuse existing workforce patterns.

4. Avoid large architecture rewrites.

## Requirements

### A. New Worker

Fuel Specialist

Unlock:

* Refinery Level 5

Cost:

* $1500

Effect:

* Gasoline sell price +5% per worker

### B. New Worker

Aviation Specialist

Unlock:

* Refinery Level 10

Cost:

* $3000

Effect:

* Jet Fuel production +20% per worker

### C. New Worker

Chemical Engineer

Unlock:

* Refinery Level 15

Cost:

* $5000

Effect:

* Petrochemical production +20% per worker

### D. Workforce UI

Display all new workers in WorkforcePanel.

Show:

* Name
* Cost
* Effect
* Current count

Use existing worker display patterns.

### E. Save Compatibility

Old saves must load safely.

Missing worker counts should default to 0.

### F. Code Quality

* Reuse workforce systems.
* Maintain TypeScript typing.
* Keep implementation simple.

## Success Criteria

* Existing saves load.
* New workers appear at correct levels.
* WorkforcePanel displays all workers.
* Effects apply correctly.
* Existing workers continue working.
* No gameplay regressions.
