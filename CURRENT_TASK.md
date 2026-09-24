# CURRENT TASK — U2.5 Compact Factory UI

## Goal

Finish the approved Factory cleanup before starting the gameplay fun pass.
Keep the refinery world visually dominant and move operational controls to
their correct top-level screen.

## Active Phase

`U2.5 — implementation complete, device review pending`

## Shipped in This Pass

1. Reduced the always-visible Factory resource dock from five stats to the
   four core values: money, crude, gasoline, and reputation.
2. Removed the large background plate and bottom Inventory/Trade dock from
   the refinery scene.
3. Changed Build to a compact icon-only camera control.
4. Moved the current goal into the More Info sheet.
5. Moved spot Buy/Sell and all Auto Trade controls to Operations.
6. Preserved all existing Auto Trade settings and save behavior.

## Release Gates

- `npm run typecheck`
- `scripts/sim-check.ts`
- `scripts/full-loop-sim.ts`
- `scripts/camera-check.ts`
- Android APK build and physical-device review

## Next Phase

`U2.6 — Operations production-flow redesign`

Add the approved Crude Tank → Distillation → Storage flow, bottleneck status,
and plant actions without changing production balance. The separate gameplay
redesign remains documented in [FUN_BLUEPRINT.md](FUN_BLUEPRINT.md) and starts
only after the UI V2 screens are complete.
