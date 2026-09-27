# Refinery Story — AI Development Rules

This repo contains a single codebase: an Expo/React Native app (this is
its root). An earlier web app (Vite/React) used to live here too, with
its own `Doc/` folder of design docs -- both were removed in the
2026-06-15 cleanup that made this the only project in the repo. That old
documentation is archived at `docs-archive/web-app-docs-2026-06-13/` for
historical reference only; it describes code that no longer exists here
and should not be treated as current.

**Before doing anything else, read `README.md` in this directory.** It
has a "👋 START HERE — Session Handoff" section at the top with the
current state, what shipped most recently, and what's next. That section
is kept up to date after every session and is the actual entry point --
this file just exists so agent tooling that looks for `AGENTS.md`/
`CLAUDE.md` first finds a pointer to it.

## Working agreements

- Keep the app runnable at all times; verify with `npx tsc --noEmit`
  after changes (this repo has no automated test suite -- isolated
  `node -e "..."` simulations are used instead to verify new game-logic
  math before committing; see recent git log for examples).
- Avoid overengineering and large refactors unless requested. Prefer
  simple, explicit code over generic frameworks/abstractions.
- Gameplay first: prioritize fun, simplicity, readability, maintainability
  over architectural purity.
- New ideas that aren't the current task go into `README.md`'s backlog
  sections ("What's NOT done / known gaps" or a new "## DESIGN (not
  started)" section), not implemented immediately.
- The user communicates in Thai and prefers a single short Thai summary
  at the end of a task, not step-by-step narration while working.
