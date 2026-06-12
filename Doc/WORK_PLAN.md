# WORK PLAN — Refinery Process Chain (Feedstock Layer)

Branch: `feature/refinery-process-chain` (off `feature/staff-cleanup-and-economy`).
Started 2026-06-12. This note exists so work can resume in a fresh session if the
chat is cut off. `git log --oneline` shows what landed; continue first unchecked item.

## Why
Game is themed "develop a refinery" but mechanically everything is one step:
crude → product. This pass inserts ONE intermediate (feedstock) so production
becomes a chain and the Distillation Unit becomes the heart of the economy.
Principle: few mechanics that multiply (Kairosoft), progressive disclosure.

## The chain
- Tier 1 (crude-direct, simple, unchanged): gasoline, asphalt.
- Tier 2 (needs feedstock): jet fuel, lubricants, petrochemicals.
- Distillation Unit: each cycle crude → feedstock; adjacency to crude tanks boosts
  output (reuses combo system). More distillation = more feedstock throughput.
- Downstream plants consume feedstock instead of raw crude → routing tension.

## Scope: ONE intermediate (feedstock). No naphtha/distillate/residue/reformer/cracker (too much).

## Also cutting: unify the 3 duplicated downstream-plant tick blocks into one
config-driven loop (data/plants.ts). Removes ~100 lines while adding feedstock.

## Tasks
### Task 1 — feedstock resource + state  [x]
### Task 2 — Distillation produces feedstock  [x]
### Task 3 — Unify downstream plants on feedstock (data/plants.ts)  [x]
### Task 4 — UI (feedstock card, chain hints)  [x]
### Task 5 — Re-anchor meta to refinery (light)  [ ]
### Task 6 — Balance pass  [ ]
### Task 7 — Docs + verify + push  [ ]

## Save compat: feedstock defaults 0. Downstream plants now need feedstock;
distillation unlocks early & is needed for gasoline, so most players have it.
Acceptable balance shift for a prototype.

## Deferred: multi-cut chain, per-plant levels, mobile/Expo, perk differentiation.
