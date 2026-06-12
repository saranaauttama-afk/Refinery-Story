# Project Vision

Refinery Story is a Kairosoft-style idle/management game: build a small
petrochemical refinery, grow it into a multi-product operation, and keep a
short → medium → long goal visible at all times.

## What "done" looks like for a session

A player opens the game, has something to do in the next 10 seconds (sell,
buy, build), something to aim for in the next few minutes (a contract, a
milestone, a perk), and something to look forward to over a longer session
(the next era, the next plant, the annual awards ceremony).

## What makes it THIS game, not a generic factory game

- **The refinery is the star.** Grid layout and adjacency aren't decoration —
  Distillation Units are the literal heart of the economy (gasoline speed +
  feedstock for advanced products).
- **Few mechanics that multiply**, not many parallel systems. New systems
  should hook into combo/adjacency, staff levels, perks, eras, or awards
  rather than create a new isolated loop.
- **Progressive disclosure.** A brand-new player on a 9-cell grid sees a
  simple crude→gasoline loop. The feedstock chain, staff training, perk tree,
  eras, and annual awards reveal themselves as the refinery grows.
- **Save-compatible, always.** Every change defaults gracefully for old saves.

## Current platform

Web app (React + Vite). Mobile/Expo UX is an explicitly deferred later phase —
see DONT_BUILD_YET.md. Gameplay depth and balance come first.

## Where to look for more

- `GAME_DESIGN.md` — current systems, rewritten as the game evolves.
- `ROADMAP.md` — what's shipped, phase by phase.
- `BACKLOG.md` — what's proposed but not started.
- `CURRENT_TASK.md` — what's in flight right now.
- `archive/` — superseded design proposals, kept for historical rationale.
