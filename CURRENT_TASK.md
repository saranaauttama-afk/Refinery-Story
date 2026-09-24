# CURRENT TASK — U2.6 Operations Flow UI

## Goal

Turn Operations into a readable live production dashboard without changing
production balance, save data, or the established Factory scene.

## Active Phase

`U2.6 — implementation complete, device review deferred to the next APK`

## Shipped in This Pass

1. Added a live Crude → Process → Gas production flow.
2. Added real bottleneck diagnosis for paused production, missing
   distillation, empty crude, full gasoline storage, and low electricity.
3. Added live node status and output-per-minute feedback.
4. Added compact speed, Factory, and Auto Trade controls.
5. Added feedstock, electricity, and waste process inventory.
6. Collapsed detailed Auto Trade thresholds by default.
7. Preserved all economy, balance, and save behavior.

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
