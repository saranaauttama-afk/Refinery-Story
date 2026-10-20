# UI-only handoff (for Codex or any agent)

Scope: **look, layout and wording only.** Game rules stay exactly as they are.

## Hard limits — do not edit

- `src/v4/sim/**` (rules, save format, systems)
- `src/v4/data/**` (numbers, content tables, `balance.ts`). Exception: text-only
  fixes in `src/v4/data/buildingInfo.ts` and `src/v4/data/onboarding.ts`
  (wording only, the same keys and the same building ids).
- `scripts/v4/**` (checks and bot)
- `app.json`, apart from bumping `version` / `android.versionCode`

If a UI change seems to need a rule change, stop and add it to
`docs/v4/BACKLOG.md` under "Open — waiting for a decision" instead.

UI code may **read** anything from the sim (selectors such as `recipeOf`,
`yardAlerts`, `predictedScore`, `gradeFor(score, s.rank)`). UI code may only
**change** state through the existing actions in `src/v4/sim/actions.ts` (and
`selectBlend` from `sim/systems/blending`) via `dispatch`.

## Where the UI lives

| File                                                                                      | Screen                                                          |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `src/v4/ui/YardScreen.tsx`                                                                | Layout, bottom tab bar, which sheet is open                     |
| `src/v4/ui/HUD.tsx`                                                                       | Top bar: date, money, fame, RD, rank bar, speed                 |
| `src/v4/ui/Alerts.tsx`                                                                    | Optional notice pills over the yard                             |
| `src/v4/ui/Onboarding.tsx`                                                                | Guided first steps                                              |
| `src/v4/ui/BuildPanel.tsx` / `BuildingInfo.tsx` / `LandPanel.tsx`                         | Build sheet, tapped-building sheet, land map                    |
| `src/v4/ui/BlendPanel.tsx`                                                                | Blend sheet (station tabs, grade card, base/additive, tanks)    |
| `src/v4/ui/CustomersPanel.tsx` / `StaffPanel.tsx` / `CompanyPanel.tsx` / `RecipeBook.tsx` | Other sheets                                                    |
| `src/v4/ui/Notices.tsx`                                                                   | Rank-up / year awards pop-ups                                   |
| `src/v4/ui/cards.tsx`                                                                     | Shared bits: Card, Section, Row, Chip, Bar, SmallButton, Muted… |
| `src/v4/ui/controls.tsx`                                                                  | Sheet, Button, text styles                                      |
| `src/v4/render/YardCanvas.tsx`                                                            | Skia yard (camera, drawing). Drawing only — no rules            |

## Style rules

- Thai text font: `Kanit_400Regular` / `Kanit_600SemiBold`. Numbers and badges:
  `PixelifySans_700Bold`. Never Baloo2 (it has no Thai glyphs).
- Every visible string goes through `text({ en, th })` from `src/v4/i18n`.
- Ink `#14110F`, paper `#FFF6E3`, 2px black borders, 6–10px radius. Tab colours:
  build `#F08A24`, blend `#E2483D`, staff `#3D8FE0`, customers `#2FB38E`,
  company `#B184E3`.
- Phone first (390×844). No horizontal scroll. Touch targets ≥ 40px.
- `Bar` uses `flex: 1`, so put it inside a `Row`, not straight into a column.
- No emoji in UI text.

## Gates before every commit

```
npm run format
npx tsc --noEmit
npm run v4:check
```

All three must pass. `v4:check` covers the rules; a UI change should never move
its numbers. If it does, something outside the UI was touched — revert it.

Visual check on web: `npx expo export --platform web` and open it at 390×844
(copy `node_modules/canvaskit-wasm/bin/full/canvaskit.wasm` next to the export).

## Commits

- Branch `rewrite/v4` only. Never push to `main`.
- Bump `version` (4.0.x) and `android.versionCode` (+1) once per APK you want
  built. A push to `rewrite/v4` builds the APK in GitHub Actions ("Android
  Preview APK").
- End with one short Thai summary for Sarana.
