# Refinery Story - AI Development Rules

> ⚠️ **Two codebases exist in this repo: `src/` (the original web app,
> what the rest of this file describes) and `mobile/` (an Expo/React
> Native port, started later). As of 2026-06-15, `mobile/` is the ACTIVE
> codebase -- almost all current work happens there, on the `devMobile`
> branch. If the user's request sounds like it's about the game in
> general (not explicitly "the web version"), check
> `mobile/README.md` FIRST (it has its own "START HERE" handoff section
> at the top) before assuming this Doc/ folder's CURRENT_TASK.md is the
> relevant one -- it describes `src/` work only and may be stale relative
> to `mobile/`.**

## Project Vision

Refinery Story is a Kairosoft-inspired refinery management simulation game.

The game should be:

* Easy to learn
* Satisfying to optimize
* Focused on progression
* Focused on fun rather than realism
* Playable in short sessions

---

## Development Philosophy

Gameplay First.

Always prioritize:

1. Fun
2. Simplicity
3. Readability
4. Maintainability

Never prioritize architecture over gameplay.

---

## General Rules

* Keep the game runnable at all times.
* Avoid overengineering.
* Prefer simple code over generic frameworks.
* Prefer explicit code over abstractions.
* Avoid premature optimization.
* Avoid large refactors unless requested.

---

## Technical Stack

Frontend:

* React
* TypeScript
* Vite

Styling:

* CSS
* Tailwind (optional)

State:

* React State
* Zustand (when useful)

---

## Architecture Rules

Allowed:

* Components
* Utility functions
* Small reusable hooks

Avoid:

* ECS
* Plugin systems
* Dependency injection frameworks
* Generic simulation frameworks

Unless explicitly requested.

---

## Coding Rules

* Use TypeScript.
* Keep functions small.
* Keep components focused.
* Use descriptive names.
* Prefer readability over cleverness.

---

## Before Making Changes

First, determine which codebase the request is about: if it's about
`mobile/` (the active Expo app) or unclear, read `mobile/README.md` first
-- it has its own up-to-date "START HERE" handoff section and supersedes
everything below for mobile work. Only if the request is specifically
about the web app in `src/`, read in this order:

1. AGENTS.md (this file)
2. CURRENT_TASK.md
3. GAME_DESIGN.md (rewritten to match current state — trust this over memory)

`Doc/archive/` holds superseded design proposals (kept for historical
rationale only — do not treat their "not implemented yet" notes as current).

---

## Output Requirements

After implementation provide:

1. Files changed
2. Summary of changes
3. Build result
4. Lint result
5. Manual testing instructions

---

## Important

The current goal is:

Build a fun game.

Not:

* Perfect architecture
* Enterprise patterns
* Multiplayer systems
* Real-world refinery simulation

---

## New Idea Rule

Do not immediately implement every new idea.

When a new idea appears:

1. Add it to BACKLOG.md
2. Discuss priority
3. Promote to CURRENT_TASK.md only when appropriate