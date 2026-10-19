# Refinery Story v4

Expo / React Native / TypeScript refinery management game, rewritten from scratch on `rewrite/v4`.

## Development

```sh
npm ci
npm start
npx tsc --noEmit
npm run v4:check
npm run export:web
```

Read [PLAN.md](docs/v4/PLAN.md), [GDD.md](docs/v4/GDD.md), and [ART.md](docs/v4/ART.md) before working on a milestone. V1–V3 implementation is retired; its history remains in Git.

Implemented: deterministic simulation/save, isometric Skia yard, production and blending, 40 customers/contracts, 30 combos/auras, staff, investments/progression/awards/events/market, Year 15 evaluation/NG+, code-drawn sprites, onboarding/audio/haptics and balance checks.

- Thai is the default UI language. Use New Game, then the $50k starter refinery button.
- Build/Blend/Staff/Customers/Company panels run over the live yard; use HUD speed controls to pause.
- Backgrounding pauses and saves; the title screen pauses the simulation. Continue restores the v4 save slot.
- Settings for sound/haptics and the Recipe Book are in Company.
- Gates: `npx tsc --noEmit`, `npm run v4:check` (all milestones, including 20 seeded 16-year runs).
- Reproduce the balance report: `npm run v4:check -- --write-report`.
- Art gallery: [ART-GALLERY.svg](docs/v4/ART-GALLERY.svg). Balance results: [BALANCE-REPORT.md](docs/v4/BALANCE-REPORT.md).

Pushes to `rewrite/v4` trigger the Android Preview APK workflow. Owner verdicts and native device frame-rate checks are deferred; headless checks do not substitute for device testing.
