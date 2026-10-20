# UI playtest — 4.0.13 / Android 25

Branch: `rewrite/v4`. Base: `4efe8e8` (preserves the concurrent Phase A research, demand and rivals implementation).
Scope: UI and renderer only; no edits to sim, data, scripts/v4, footprints, balance,
combo rules or save format.

## Implemented

- 27 distinct building/decor designs, all five levels supported; flat roads retain their footprint.
- Chunky stepped steel tanks, quieter yard tiles, worker/truck sprites and pixel effects.
- Buildings, moving workers, trucks and placement ghosts share depth ordering. Movers use their actual interpolated position.
- Shared sprite commands for yard, catalogue, building info and translucent placement preview.
- Cached CPU Skia thumbnails avoid a GPU context per catalogue card or staff portrait.
- Whole-footprint valid/invalid tint; explicit confirm/cancel; known combo previews; hidden combo names remain hidden.
- Navy industrial headers, cream surfaces, square accents and consistent buttons across every screen, including title, guides and notices.
- Wrapped staff actions and job choices, full-width building actions, localized combo partner names and demolition confirmation.
- Responsive HUD values, accessible zoom/recentre controls and camera framing from projected sprite bounds.

## Automated gates

All passed locally:

```
npm run format
npx tsc --noEmit
npm run v4:check
npx expo export --platform web
```

The complete `v4:check` stdout is identical to the pre-redesign baseline, including
the existing 20-seed simulation and new Phase A research/fun gates. Protected directories have an empty Git diff.

## Browser checks (390 × 844)

Chromium with software rendering, actual exported Expo app, Thai fonts and CanvasKit loaded.

- Title, initial empty yard and guide; rank-up and annual awards notices dismiss in sequence.
- Build, Blend, Staff, Customers, Company, Land and Recipe Book: no page horizontal overflow or action buttons outside the viewport.
- Populated starter yard and dense fixture with 40 buildings, all 27 types, levels 1–5 and 12 assigned staff.
- Catalogue selection displays the actual sprite and enters placement.
- Invalid/outside-owned-land footprint disables confirm; cancel leaves funds unchanged.
- Place a tank: $8,000,000 → $7,995,000.
- Upgrade the tank: $7,995,000 → $7,992,000, info shows Lv 2/5.
- Move from (4,0) to (5,1): $7,992,000 → $7,990,000; level retained.
- Cancel demolition keeps the building; confirm demolition refunds the original $2,500: final $7,992,500.
- Seven guided placements cost exactly $50,000; guide collapse, pan and zoom/recentre controls work.
- The concurrent Phase A lab idle alert opens the correct building, displays research options and dispatches the existing $5,000 / 100 RD project action. Research progress renders in the same design system.

Fixtures are isolated browser saves for UI validation; no test resources or debug controls are included in the app.

## Device validation

Android Preview APK is produced by the existing GitHub Actions workflow after push.
APK installation, native touch/pinch behavior and device frame-rate measurements require
an Android device and are not claimed by the browser checks.

Existing gameplay proposals and the Phase A implementation in BACKLOG.md / AUDIT.md remain untouched by this UI change.
