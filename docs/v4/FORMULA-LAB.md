# Formula Lab — design (draft, not wired in yet)

**สรุปภาษาไทย:** แยกแล็บเป็น 2 ตัว — **Catalyst Lab** วิจัยได้สารเร่ง (เกรด D–SS + จำนวน)
และ **Formula Lab** เอาน้ำมันพื้นฐานหรือสูตรเดิม + สารเร่ง 1–3 ช่อง มาผสมเป็น **สูตรถาวร** ที่มีเกรด
สถานีผสม (blend) ผลิตตามเกรดของสูตรได้เลย แต่กินสารเร่ง 1 หน่วยต่อ 6 ล็อต (หมด = ตกเป็นเกรด D)
เพดานเกรดมาจาก **สารเร่งที่ดีที่สุดที่ใส่** ดังนั้นจะได้ S/SS ต้องมีแล็บเลเวลสูงและอยู่ปีหลัง ๆ

Why: in the current system the first SS arrives around year 4 (balance report: "first SS
Y4.3") and comes from stats/upgrades alone. The owner wants grades to come from research
and experimenting with combos, and to keep improving over a 15-year game.

## Loop

1. **Catalyst Lab** (research job, 2 weeks, RD + money): returns one random unlocked catalyst
   (the 20 additives in `data/additives.ts`) with a grade D/C/B/A/S/SS and a few units
   (4 + 1 per lab level).
   - Grade odds by lab level (table `FORMULA_LAB.catalyst.weights`); chemists' Chem adds a
     fraction of a level (`chemPerLevel`).
   - Hard ceiling by year (`maxGradeByYear`): B in Y1–2, A from Y3, S from Y6, SS from Y9.
   - 25% of finished jobs also reveal a hint (a good catalyst pair or a secret formula).
2. **Formula Lab** (mix, 1 week, money): start from a plain base (grade D) or a known formula,
   add catalysts from stock (2 units each).
   - Slots per mix by year: 1 (Y1–2), 2 (Y3–5), 3 (Y6+). A formula holds at most 3 catalysts;
     re-mixing a catalyst already in the formula is a _refine_.
   - Grade = average of inputs (formula + catalysts) + base×catalyst compatibility
     (`data/compatibility.ts`) + catalyst×catalyst synergy (`data/formulaLab.ts`) + secret
     bonus + small luck (±0.6, nudged up by lab level), rounded.
   - **Cap = best catalyst used** (`capAboveBest: 0`). A formula cannot ratchet itself past
     its catalysts — that was the first sim's bug (SS in year 3).
   - Never worse: a known formula keeps its better grade; only the catalysts are spent.
   - Pity: after 4 mixes in a row that do not beat their best input, the next one gets +1.
   - Synergy pairs become known once used; the book shows ??? until then.
3. **Blend stations** run a formula and produce lots at its grade. Every 6 lots use one unit of
   each catalyst in the formula, lowest grade first. Out of a catalyst → lots fall back to D
   until restocked. This keeps the Catalyst Lab busy after a formula is found, and gives
   low-grade research a use.

## Secret formulas

Exact base + catalyst sets in `secretFormulas` (Premium Gasoline, Euro Diesel, Jet A-1, Clean
LPG, Synthetic Lube, Eco Asphalt, Scented Candle Wax, Bio Pellet). They get +1 grade step,
×1.3 price and fame, but do **not** lift the cap (`secretCap: 0`): with the cap lifted the sim
reached SS in year 6–7 because the bot finds secrets instantly. Players only find them from
hints or by trying, so this can be loosened after playtest.

## Pacing (scripts/v4/formula-lab-sim.ts, 100 runs, gasoline, greedy bot)

| Grade | First formula (p10 / median / p90 year) |
| ----- | --------------------------------------- |
| B     | 1 / 1 / 1                               |
| A     | 3 / 3 / 3                               |
| S     | 6 / 6 / 6                               |
| SS    | 9 / 9 / 9                               |

Lots short of catalyst: median 4%. The bot assumes lab Lv1→5 over 9 years, 1 Catalyst Lab
until Y5 then 2, and always picks the best mix, so the year gates are the binding limit. Real
players will lag; luck and lab level matter more for them. Tune with `RUNS=200 node --import
tsx scripts/v4/formula-lab-sim.ts`.

## Status / next steps

Done: balance (`FORMULA_LAB`, `FORMULA_GRADES` in `data/balance.ts`), content
(`data/formulaLab.ts`), pure rules (`sim/systems/formulaLab.ts`), checks
(`scripts/v4/check-formula-lab.ts`, in `v4:check`), pacing sim.

Not done (needs owner decision before wiring):

1. Grade `D` joins `Grade` in `sim/types.ts`; `GRADES`, contracts, awards and prices learn it.
2. `GameState` gets a `formulaLab: FormulaLabState` slice; saves get a fresh-start or migration.
3. Buildings: keep `lab` as Catalyst Lab, add `formulaLab`; old base×additive research and the
   score-based grade in `blending.ts` are removed.
4. UI: Catalyst Lab sheet (stock by grade), Formula Lab mix sheet (slots, odds low–high,
   synergy book with ???), blend station picks a formula.
