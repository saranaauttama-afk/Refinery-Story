# Current Task

Content Expansion 1: More Events and Staff.

## Overview

The game is playable, but events and staff feel too limited.

Goal:
Add more variety without changing core systems.

## Add Random Events

Add 4 new simple random events:

1. Market Demand Spike
- +$750
- Message: "Market demand increased. Money +$750."

2. Safety Inspection
- If reputation >= 50: +10 reputation
- Else: -$300
- Prevent money below 0

3. Equipment Wear
- -10 gasoline
- Prevent gasoline below 0

4. Efficient Batch
- +30 gasoline
- Clamp to max gasoline

## Add Staff Types

Add 2 new worker types:

### Chemist
Cost:
$1500

Bonus:
+10% RP earned from contracts

Unlock:
Refinery Level 4

### Logistics Coordinator
Cost:
$2000

Bonus:
+10% shipment crude received

Unlock:
Refinery Level 5

## UI Requirements

- Show new staff in Staff Panel
- Show locked staff with unlock requirement
- Show new staff in Workforce Summary after hiring
- Update English and Thai labels

## Technical Rules

Keep existing systems working.

Do not add:
- Staff levels
- Staff rarity
- Staff salaries
- Staff assignment
- New shipment systems
- Backend
- Routing

Build passes.
Lint passes.