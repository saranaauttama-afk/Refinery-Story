# Refinery Story - AI Development Rules

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

Always read:

1. AGENTS.md
2. CURRENT_TASK.md
3. GAME_DESIGN.md

before implementing changes.

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
