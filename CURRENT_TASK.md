# CURRENT TASK — Release Foundation

## Goal

Finish Refinery Story as a stable mobile `v1.0` without expanding gameplay
scope. The production baseline is the Expo/React Native code on
`release/refinery-story-v1`, forked from `devMobile` at `ca64cbf`.

## Active Phase

`Phase 0 — Repository and release baseline`

## Required Work

1. Make a fresh dependency install reproducible with `npm ci`.
2. Keep `npm run typecheck` and `npm run sim:check` as release gates.
3. Treat `RELEASE_CHECKLIST.md` as the ordered source of truth for remaining work.
4. Freeze new gameplay features until the release candidate passes.
5. Begin camera work only after the baseline commit is clean and verified.

## Next Phase

`Phase 1 — Map / Camera / Grid foundation`

The known issue to reproduce and fix is that pan and pinch-zoom can feel
detached from the background and active building grid. Do not tune offsets at
random. Unify the world-camera model, bounds, hit testing, and pixel-art zoom
policy first.

## Definition of Done

- `npm ci` succeeds from a clean checkout.
- `npm run typecheck` succeeds.
- `npm run sim:check` succeeds in a normal development/CI environment.
- Release documents agree on the active branch, scope, and next task.
- No gameplay balance or save-format behavior changes in this phase.
