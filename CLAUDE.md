# CLAUDE.md

Guide for AI assistants working in this repo. Keep it current as the codebase evolves.

## What this is

**Refinery Story** — a Kairosoft-style refinery management sim, built as an
Expo / React Native mobile app (TypeScript). You build a production complex on
an isometric grid: crude → distillation → feedstock → downstream plants →
products, plus electricity, waste, staff, research, contracts, and a calendar.

The app lives at the repo root (an older web build was removed). The active
development branch is **`devMobile`**; `main` is far behind. Feature branches
fork off `devMobile`.

## Run & verify

- Install: `npm install`
- Dev: `npm run start` (Expo). `npm run web` for the browser build.
- **Typecheck (the gate): `npx tsc --noEmit`** — there is no automated test
  suite. Do NOT run `npm run build` (that was the old web app).
- For pure logic, write throwaway `node -e` sims of the exported functions.
- To see UI without a device: `npx expo export --platform web`, serve `dist/`
  with a static server, and screenshot with the pre-installed Playwright +
  Chromium (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). Native-only
  bits (haptics) no-op on web but the screens render.

## Architecture

- **`app/`** — Expo Router screens. `app/game/(tabs)/` holds the gameplay
  screens; `index.tsx` is the factory home (the big full-bleed scene). The
  other tabs (contracts/supply/recruit/research/company) are pushed screens
  with a close button (hub model), navigated via the persistent `BottomNav`.
  `research.tsx` is the R&D tab (Research + Perks, pulled out of the Company
  hub so progression is one tap away); Company still holds team/grow/settings.
- **`app/_layout.tsx`** — root: loads the font, wraps `SettingsProvider` →
  `GameProvider`, and renders `GlobalOverlays` (banners, modals, confetti).
- **`src/hooks/useGameLoop.ts`** — the heart. Owns all game state, the main
  tick loop (production / ESG / demand / staff XP / era / milestones / crisis /
  hidden events / awards / auto-trade / recruitment / shipments / events), and
  ~50 action handlers. Exposed app-wide via `GameContext` (`useGame()`) so only
  one loop runs. Speed control lives here (`speed` drives the tick period).
- **`src/game/utils/gameCalculations.ts`** — pure functions: `tick`,
  `calculateDerivedStats` (the big derived-state computation read everywhere),
  economy/storage/production math, shipments, year-end close, etc. Prefer
  adding pure logic here and importing it into the hook.
- **`src/game/data/balance.ts`** — all tunable constants (economy, production,
  contracts, plants, wages, awards, calendar, shipments, ...). Tune here, not
  in logic.
- **`src/game/data/`** — content tables (buildings, workers, research, perks,
  contracts, eras, events, hidden combos/events, recruitment, rivals).
- **`src/game/types.ts`** — `GameState` and all domain types.
- **`src/game/utils/gameStorage.ts`** — AsyncStorage save/load with
  field-by-field sanitization + migrations. Add a migration when you change the
  shape or meaning of a saved field.
- **`src/components/`** — UI components (diamond grid view, banners, modals,
  HUD pieces, BottomNav, PlantSmoke, DeliveryTruck, Confetti, ...).
- **`src/theme.ts`** — palette, spacing, radii, `fonts`, layout constants.
- **Art slots** — `ArtSlot` + `src/art/registry.ts` render a labelled
  placeholder wherever raster art belongs but isn't drawn yet; registering the
  image in `registry.ts` swaps it in with no screen-code change. The spec for
  every needed image lives in `ASSETS_NEEDED.md`. (Code-drawn graphics — the
  isometric scene, smoke, trucks — are NOT art slots.)

## Conventions & gotchas

- **State is immutable** — action handlers go through `update(fn)` in
  `useGameLoop`, returning a new `GameState`. Never mutate.
- **Invariant**: for each `WorkerType`,
  `employees.filter(e => e.type === t).length === workerCounts[t]`. Update both
  together (a past bug skipped `workerCounts` on a hidden-event hire).
- **Staff morale** — `staffMorale` (0–100) drifts toward 60 each tick. Actions
  (hires, level-ups, retirements, wages, year-end grade, staff choice events)
  bump it. `moraleMultiplier` in `DerivedStats` scales worker effectiveness.
- **Specialization** — permanent choice at Level 5 (`SPECIALIZATION_BALANCE`).
  `game.specialization` is `'green' | 'industrial' | null`. Green boosts ESG
  regen ×1.5, sell price +10%, wages −20%, reputation +15/year, but production
  −10%. Industrial boosts output +15%, crude storage +25%, contracts +20%,
  maintenance −25%, but ESG decay ×1.3. Triggered via `specializationChoice`
  event in `upgradeRefinery`; modifiers applied across `calculateDerivedStats`,
  `getEsgDrift`, `getYearlyPayroll`, `getYearlyMaintenance`, `closeBusinessYear`.
- **Time is a pure pause model** — everything is keyed off `tickCount`; the tick
  loop pauses when backgrounded and when `speed === 0`. Do NOT introduce
  wall-clock (`Date.now()`) into game logic; shipments were migrated off it.
- **Bilingual text** — UI strings are `{ en, th }` (`src/game/translations`).
  All gameplay tabs (factory + contracts/supply/recruit/research/company) now
  go through `useLang()`'s `t()`; add new strings to `translations.ts` and read
  them with `t(...)` rather than `.en`. (Event-log content is still mixed.)
- **Transient banners** sit below the HUD via `OVERLAY_BANNER_TOP` so they never
  cover the resource bar.
- **`calculateDerivedStats` is hot** — it runs every tick and render. Pass a
  precomputed result down rather than recomputing when you can.
- Commit only when asked. Branch off `devMobile`; never push to `main` without
  explicit permission.

## Where things are going

See **`ROADMAP.md`** for the current plan (balance tuning, then the dynamic
market, specialization, layout depth, people/morale, and an endgame spine).
