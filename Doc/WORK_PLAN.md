# WORK PLAN — Charm Pass (4 items, in order)

Branch: `feature/charm-pass` (off `feature/docs-cleanup`). Started 2026-06-13.
Resume note: `git log --oneline`, continue first unchecked item.

Goal: small, cheap, build/test-verifiable additions that increase Kairosoft
"charm" without new architecture. Each item independently committed.

## Items (in order)

### 1. Era banner/toast  [x]
- `bannerTitle` translation already exists (eras.bannerTitle).
- On era advance (highestEraIndex increases, detected in the staff/awards
  tick), show a dismissible toast/banner (NOT a full modal like awards —
  lighter touch) with the new era name + tagline.
- New component `EraBannerToast.tsx`. State: `pendingEraBanner: EraConfig | null`
  in App.tsx, set alongside the existing eraAdvanced log.

### 2. Refinery name + title progression  [x]
- `refineryName: string` in GameState (default translatable), editable via a
  small input in the hero panel.
- Title progression: lookup table by refinery level -> title string, shown
  next to the name in the hero panel.
- Save migration: default name; title derived via pure function (no stored
  field needed for title).

### 3. Named staff  [ ]
- Workers are counts, not individuals -- keep simple: curated name pool,
  `workerNames: Record<WorkerType, string[]>` in GameState. On hire, append
  next name (cycling through pool, deterministic by index).
- StaffPanel shows a small "roster" line (first few names + "+N more").
- Save migration: backfill names for existing headcount on load.

### 4. Feedstock-themed random events  [ ]
- 2 new RANDOM_EVENTS entries gated on
  maxFeedstockStorage > FEEDSTOCK_BALANCE.baseFeedstockStorage (player has
  distillation). e.g. "Distillation Hiccup" (small feedstock loss) and
  "Feedstock Surplus" (convert feedstock to bonus cash). Follow existing
  RANDOM_EVENTS pattern + applyRandomEvent branch.

## Verification per item
tsc / lint / build clean + targeted unit test. Commit each item separately.

## Docs
Update PLAYTEST_NOTES + CURRENT_TASK at the end covering all 4.
