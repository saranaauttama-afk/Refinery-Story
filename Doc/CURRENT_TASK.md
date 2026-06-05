# Current Task

Prototype Fix Pass 1: Balance, Worker Visibility, and UI Readability.

## Overview

Fix the main issues found during playtesting.

Do not add new major systems.

Goal:
Make the prototype easier to understand and playable end-to-end in 10-15 minutes.

---

## Problems Observed

1. Storage progression is too small.
2. Contract requirements are too high compared to storage.
3. Random events give too much free crude.
4. Workers feel invisible after hiring.
5. The page requires too much vertical scrolling.
6. Important information is spread too far apart.

---

## Fix 1: Storage Progression

Increase storage scaling.

- Crude Tank:
  - +25 max crude

- Product Tank:
  - +25 max gasoline

- Mechanic:
  - +25 max crude
  - +25 max gasoline

- Bigger Tanks Research:
  - +50 max crude
  - +50 max gasoline

- Industrial Storage Research:
  - +150 max crude
  - +150 max gasoline

Update all English and Thai descriptions.

---

## Fix 2: Contract Pacing

Adjust contracts so prototype progression is testable.

Target:
- Tier 1 reachable in 2-3 minutes
- Tier 2 reachable in 5-8 minutes
- Tier 3 reachable in 10-15 minutes

Suggested contract requirements:

Tier 1:
- Local Gas Station: 20 gasoline
- City Bus Depot: 50 gasoline
- Airport Trial Supply: 100 gasoline

Tier 2:
- Regional Fuel Distributor: 200 gasoline
- Industrial Manufacturing Plant: 300 gasoline

Tier 3:
- International Airport: 500 gasoline
- Petrochemical Complex: 700 gasoline

Keep rewards roughly proportional.

Do not make contracts impossible due to storage limits.

---

## Fix 3: Event Rewards

Reduce free crude.

- Crude Discount:
  - Change from +50 crude to +10 crude

Clamp events:
- Crude Discount must not exceed max crude
- Quality Bonus must not exceed max gasoline
- Minor Leak must not reduce crude below 0

Update event descriptions.

---

## Fix 4: Worker Visibility

Workers should feel visible after hiring.

Add Workforce Summary near the refinery/grid area.

Display:
- Total staff count
- Operator count
- Mechanic count
- Sales Agent count
- Each worker bonus summary

Do not add:
- Worker movement
- Worker sprites
- Pathfinding
- Assignments
- Salary
- Morale

---

## Fix 5: Scroll and UI Pain Points

Improve layout readability.

Requirements:
- Reduce the hero/header height significantly
- Keep main resources visible near the top
- Group panels more clearly
- Make high-frequency actions easier to find:
  - Buy crude
  - Sell gasoline
  - Upgrade refinery
  - Fulfill contracts
- Reduce unnecessary vertical spacing
- Use compact cards where possible

Do not redesign the whole game.

Do not add routing or tabs yet.

---

## Technical Rules

Keep existing systems working:

- Idle production
- Refinery upgrades
- Building grid
- Combo system
- Contract Tier System
- Research Tier 1 and Tier 2
- Workers
- Random events
- Milestones
- Reputation
- Save/Load
- Bilingual UI
- Activity log

Do not add:
- New major systems
- Backend
- Routing
- Save slots
- Worker movement
- Animations
- Charts

---

## Success Criteria

- Player can reasonably progress through Tier 1, Tier 2, and Tier 3 during testing
- Storage can support larger contracts
- Crude does not grow uncontrollably from events
- Workers are visible after hiring
- Page is easier to scan
- Build passes
- Lint passes