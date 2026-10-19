# Refinery Story — AI Development Rules (v4 rewrite)

You are on branch **`rewrite/v4`**: a from-scratch rewrite of Refinery Story,
a Kairosoft-style refinery management game (Expo / React Native / TypeScript,
Skia for the yard).

## Read first, in this order

1. [`docs/v4/PLAN.md`](docs/v4/PLAN.md) — milestones, folder layout, rules,
   status table. Find the first milestone that is not done and work on it.
2. [`docs/v4/GDD.md`](docs/v4/GDD.md) — game rules and all starting numbers.
3. [`docs/v4/ART.md`](docs/v4/ART.md) — code-drawn graphics and UI style.

Everything from V1–V3 (old `src/game`, old docs, `GAMEPLAY_*_V3.md`, …) is
retired. Do not port its logic or read its docs for rules. Milestone M0
deletes it.

## Working agreements

- New code goes under `src/v4/` and `app/`. The sim core `src/v4/sim/` must not
  import React, React Native, Expo or Skia.
- All tunable numbers in `src/v4/data/balance.ts`; content tables in
  `src/v4/data/*.ts`.
- No `Date.now()` or `Math.random()` in sim code — tick count + seeded RNG.
- Gates before every commit: `npx tsc --noEmit` and `npm run v4:check`
  (once it exists, from M0/M1).
- Keep it simple and explicit; no generic frameworks. Gameplay fun first.
- Work one milestone at a time; commit to `rewrite/v4`. Never push to `main`.
- After finishing a milestone, update the Status table in `docs/v4/PLAN.md`.
- The owner speaks Thai and wants **one short Thai summary at the end of a
  task**, not step-by-step narration.
- Ideas outside the current milestone go into a "Backlog" section at the end of
  `docs/v4/PLAN.md`, not into code.
