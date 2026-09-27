# Refinery Story v1.0 — Release Checklist

This file is the ordered source of truth for Finish Mode. New ideas are
recorded separately and do not interrupt this sequence unless they block the
release.

## Scope Lock

- [x] Expo / React Native mobile app is the production codebase.
- [x] `devMobile@ca64cbf` selected as the release baseline.
- [x] Release branch created: `release/refinery-story-v1`.
- [x] No new gameplay systems until Release Candidate.

## Phase 0 — Reproducible Baseline

- [x] Synchronize `package-lock.json` with `package.json`.
- [x] Verify clean `npm ci`.
- [x] Verify TypeScript.
- [ ] Verify balance simulation.
- [ ] Record device test matrix and supported orientations.

## Phase 1 — Map / Camera / Grid

- [ ] One camera state owns world pan and zoom.
- [ ] Ground, grid, buildings, effects, hit testing, and background derive from
      the same camera transform.
- [ ] Parallax is applied after the world transform and cannot expose an edge.
- [ ] Bounds use the visible/playable world, not an invisible shell.
- [ ] Camera reclamps or recenters after viewport and grid-size changes.
- [ ] Tap, drag, pinch, move, and swap gestures do not conflict.
- [ ] Add a deterministic Reset/Center camera action.
- [ ] Define pixel-art-safe zoom levels and sampling behavior.
- [ ] Test grid sizes from 3x3 through 6x6 on Android.
- [ ] Test dense late-game layout without frame drops.

## Phase 2 — Pixel Art Foundation

- [ ] Freeze tile dimensions, isometric angle, footprint, sprite canvas, base
      anchor, palette, outline, shadow, and nearest-neighbor rules.
- [ ] Add automated asset validation for filename, dimensions, alpha, and
      palette limits.
- [ ] Replace three pilot buildings: Distillation Unit, Crude Tank, Laboratory.
- [ ] Approve pilots in-game at every supported zoom level.

## Phase 3 — Asset Production

- [ ] Replace all 17 building families at levels 1–3 (51 sprites).
- [ ] Produce ground, roads, pipes, sea edge, and reusable decorations.
- [ ] Complete remaining screen banners and empty-state art.
- [ ] Validate every asset before integration.

## Phase 4 — Visual Integration

- [ ] Correct isometric draw order and overlaps.
- [ ] Build/select/remove/upgrade states remain readable.
- [ ] Shadows, smoke, night tint, workers, and trucks match the art direction.
- [ ] UI remains legible on small phones and common Android aspect ratios.

## Phase 5 — Release Candidate

- [ ] New-game-to-endgame automated balance run.
- [ ] Save migration and corrupted-save recovery checks.
- [ ] First-run onboarding playtest.
- [ ] Performance and memory pass on a physical Android device.
- [ ] Closed playtest and blocker bug pass.
- [ ] Signed Android release build.

## Approval Gates

User approval is required only at these points:

1. Camera behavior on a physical device.
2. Three-building Pixel Art pilot.
3. Release Candidate gameplay/build.
