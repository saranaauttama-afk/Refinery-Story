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

M0 provides the Thai-default title screen and the v4 yard placeholder. Simulation and Continue/save support begin in M1. Pushes to `rewrite/v4` trigger the Android Preview APK workflow; installation and owner approval are tracked separately in the plan.
