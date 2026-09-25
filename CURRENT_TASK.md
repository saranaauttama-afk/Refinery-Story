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
- V3-12: merged to release `3716957`, Android Preview APK run **#71** succeeded.
- V3-13 (client ladder, repeat/rush, C3/C4 predicates, offer ETA): **complete in code**.
- **Current task: R2 human gate** — 20–30 min midgame play on the V3-13 APK:
  fresh progress to C2/C3 and constructed-fixture checks show viable quality vs
  quantity decisions, no deadlock, and correct power/tank readouts. Record the
  player's result in GAMEPLAY_IMPLEMENTATION_V3.md. **Do not start V3-14 before it.**

## Rules for this work

- One milestone per commit series; run `npx tsc --noEmit`, every `npm run check:v3-*`
  script and `node --import tsx scripts/factory-map-check.ts` before pushing.
- Factory art, plant images, backgrounds, roads and PixelLab work stay in the
  backlog; do not edit them in gameplay milestones.
- Stop at human/playtest gates (R2 gate after V3-13, R3 gate after V3-16, V3-19).
