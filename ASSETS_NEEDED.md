# Art assets needed

This game's screens use an **art-slot system** so missing raster art never
blocks development. Anywhere a hand-made/AI-generated image belongs, the UI
shows a dashed **placeholder** with the asset id and target size. The moment you
add the real file, it swaps in automatically.

## How to add an image (3 steps)

1. **Generate** a PNG matching the **Size** below (transparent background unless
   noted). Export at **2× the listed size** for crisp retina display, but keep
   the same aspect ratio.
2. **Save** it to `assets/art/<id>.png` — the filename must equal the **id**
   exactly (e.g. `assets/art/menu_hero.png`).
3. **Register** it: open `src/art/registry.ts` and uncomment (or add) that id's
   line. Done — the placeholder is replaced everywhere it's used.

> Code-drawn graphics (the isometric factory, smoke, trucks, confetti, the
> diamond grid, HUD shapes) are **not** in this list — those are generated in
> code and need no art files. This list is only the raster art I can't draw.

## Conventions

- **Format:** PNG (transparent bg) unless the row says "full-bleed" (then a
  solid/painted background is fine).
- **Style:** match the existing plant sprites in `assets/plants/` — soft,
  rounded, slightly stylised "Kairosoft-ish" look; cream/teal/gold palette
  (see `src/theme.ts`).
- **Export scale:** author at 2× the listed px (e.g. a `1080×600` slot →
  export `2160×1200`). The slot downscales cleanly.

## Asset list

| id | Used on | Size (px) | Aspect | Notes |
|----|---------|-----------|--------|-------|
| `contracts_header` | Contracts tab | 1080×260 | ~4:1 | Thin banner — loading dock / cargo trucks. |
| `contracts_empty` | Contracts tab (empty state) | 480×480 | 1:1 | Round illustration — empty clipboard / "no orders". |
| `supply_header` | Supply tab | 1080×260 | ~4:1 | Thin banner — crude tanker / pipeline. |
| `research_header` | R&D tab | 1080×260 | ~4:1 | Thin banner — lab beakers & blueprints. |
| `team_empty` | Company › Team (empty state) | 480×480 | 1:1 | Round illustration — empty desks / hiring sign. |
| `achievements_hero` | Achievements (`app/achievements.tsx`) | 1080×240 | ~4.5:1 | Thin banner — trophy shelf / podium. |

### Pages intentionally without art slots

- **Front menu** — now uses a full-bleed title background (`assets/bg/menu_bg.png`,
  logo + scene baked in); buttons overlay the lower third. No slot needed.
- **Factory home** — already fully visual (code-drawn isometric scene: ground,
  sky, plant sprites in `assets/plants/`, smoke, trucks). No new art needed.
- **Recruit tab** — already has a code-drawn "hiring office" scene + candidate
  figures. No new art needed.
- **Settings / Store** — plain utility screens; text-only by design.

## Status

- ✅ Art-slot system live (`ArtSlot` + `src/art/registry.ts`).
- ✅ Slots placed on: front menu, Contracts, Supply, R&D, Company (team empty),
  Achievements.
- ⏳ Waiting on generated PNGs → drop into `assets/art/` + register.
