# Refinery Story — Mobile (Expo) — AI Development Rules

This is the ACTIVE codebase for Refinery Story as of 2026-06-15. The repo
also contains an older web app in `../src/` with its own `../Doc/`
folder (AGENTS.md, CURRENT_TASK.md, etc.) -- that documentation describes
`src/` only and may be stale relative to here. If you're not sure which
codebase a request is about, assume it's this one (`mobile/`) unless the
user explicitly says "the web version."

**Before doing anything else, read `README.md` in this directory.** It
has a "👋 START HERE — Session Handoff" section at the very top with the
current state, what shipped most recently, and what's next. That section
is kept up to date after every session and is the actual entry point --
this file just exists so agent tooling that looks for `AGENTS.md`/
`CLAUDE.md` first finds a pointer to it instead of stopping here or
falling back to `../Doc/`.

## Working agreements (carried over from the web app's Doc/AGENTS.md,
apply here too)

- Keep the app runnable at all times; verify with `cd mobile && npx tsc
  --noEmit` after changes (this repo has no automated test suite for
  `mobile/` -- isolated `node -e "..."` simulations are used instead to
  verify new game-logic math before committing; see recent git log for
  examples).
- Avoid overengineering and large refactors unless requested. Prefer
  simple, explicit code over generic frameworks/abstractions.
- Gameplay first: prioritize fun, simplicity, readability, maintainability
  over architectural purity.
- New ideas that aren't the current task go into `README.md`'s backlog
  sections ("What's NOT done / known gaps" or a new "## DESIGN (not
  started)" section), not implemented immediately.
- The user communicates in Thai and prefers a single short Thai summary
  at the end of a task, not step-by-step narration while working.
