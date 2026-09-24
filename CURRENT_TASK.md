# CURRENT TASK — U2.6B Operations Visual Rebuild

## Goal

Bring Operations materially closer to the approved pixel-art control-room
mockup without changing production balance or save data.

## Active Phase

`U2.6B — implementation complete, device review deferred to the next APK`

## Shipped in This Pass

1. Added a new pixel-art refinery control-room background.
2. Replaced generic flow icons with the existing Crude Tank, Distillation Unit,
   and Product Tank sprites.
3. Added a focused Process card with live input/output, crew, efficiency,
   Pause/Resume, and a real building Upgrade action.
4. Moved automation into a dedicated tab in the main Operations panel.
5. Collapsed spot trade, market, shipments, and standing orders into a secondary
   Supply & Orders drawer so the production scene remains dominant.
6. Preserved live bottleneck diagnosis and all existing economy/save behavior.

## Release Gates

- `npm run typecheck`
- `scripts/sim-check.ts`
- `scripts/full-loop-sim.ts`
- `scripts/camera-check.ts`
- Android APK build after the next UI screen milestone

## Next Phase

`U2.7 — Business screen redesign`

Organize the current contract, available jobs, shipments, and market into one
clear business workflow. The separate gameplay redesign remains documented in
[FUN_BLUEPRINT.md](FUN_BLUEPRINT.md) and starts only after UI V2 is complete.
