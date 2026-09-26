# CURRENT TASK — Refinery Story Gameplay V3

> **Updated 2026-09-26.** Source of truth for the V3 backlog is
> [GAMEPLAY_IMPLEMENTATION_V3.md](GAMEPLAY_IMPLEMENTATION_V3.md), with rules in
> [GAMEPLAY_SYSTEMS_V3.md](GAMEPLAY_SYSTEMS_V3.md) and design in
> [GAMEPLAY_MASTER_PLAN_V3.md](GAMEPLAY_MASTER_PLAN_V3.md). Older text that named
> V3-03 as the next task is obsolete.

## Baseline

- Release baseline: `release/refinery-story-v1` at `9b8fe406` (V3 playable prototype).
- Build baseline: GitHub Actions *Android Preview APK* run **#69**.
- Old saves are not supported; V3 uses its own fresh save model.

## Status

- V3-00 … V3-10: **complete**. The V3-10 prototype gate was passed to R2 by the
  player after playing build #69 (see
  [GAMEPLAY_PROTOTYPE_GATE_V3.md](GAMEPLAY_PROTOTYPE_GATE_V3.md)).
- V3-11 (Lube/Jet, power, storage, modules, rank1, 4×4): **complete in code**;
  Android interaction of the new panels still needs a device check.
- V3-11: merged to release `489ddfd`, Android Preview APK run **#70** succeeded.
- V3-12 (roles, hiring, support caps, training, research/specialization mapping,
  accomplishment records): **complete in code** on `claude/gameplay-v3`.
- V3-12: merged to release `3716957`, APK run **#71** succeeded.
- V3-13: merged to release `507d1b6`, APK run **#72** succeeded; **R2 gate passed**
  (player decision after playing #72).
- V3-14 (Petro, Polymer, Waste Treatment, asphalt, Materials OR-branch, rank2,
  5×5) plus V3-14d maintenance/upkeep: **complete in code** on `claude/gameplay-v3`;
  V3-14a–c merged at `2ec7db7`, APK run **#73** succeeded.
- V3-15 (showcase, clear, report, awards, 6×6): **complete in code**.
- **Direction change:** fixed-grid expansion is superseded by the expandable yard.
- V3-15.5 (expandable yard foundation): **complete in code** (`ee38f2b`, `afb1fe8`).
- V3-15.5 device check: **passed** (player, APK #76).
- V3-16 (adjacency, optional inbox, readable names/targets): **complete in code**.
- R3 legal full run: fixed a C1 soft-lock (decision ก); fresh-state bot now clears
  in 38.2 simulated minutes (`check:v3-legal-run`) — too fast, feeds V3-18.
- **Current task: R3 human gate** — play the newest APK (V3-16 + C1 fix). The
  legal full-run evidence item is done (`check:v3-legal-run`).

## Decisions recorded

- 2026-09-26 owner: add V3 maintenance "at the right time" → implemented as V3-14d
  before V3-15 (profitability gate depends on it). Tuning happens in V3-18.

## Rules for this work

- One milestone per commit series; run `npx tsc --noEmit`, every `npm run check:v3-*`
  script and `node --import tsx scripts/factory-map-check.ts` before pushing.
- Factory art, plant images, backgrounds, roads and PixelLab work stay in the
  backlog; do not edit them in gameplay milestones.
- Stop at human/playtest gates (R2 gate after V3-13, R3 gate after V3-16, V3-19).
