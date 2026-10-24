# V4 Backlog — playtest notes

Running log of feedback and ideas from Sarana's APK playtests. Nothing here is
decided until it moves into PLAN.md.

## Decided (v4.0.12)

- **SS harder, still reachable:** grade thresholds scale with rank (`GRADE_SCALE`).
- **Per-station recipes:** each blend station has its own recipe; more product kinds bring more buyers.
- **Tanks stay shared.**
- **Yard notices are optional:** small pills on the yard (tanks nearly full, contract offers, staff without a post, station with no refining unit). Tap opens the sheet; ✕ hides it. Nothing is forced.
- **U1 camera:** opens centred on the buildings (or the owned land).

## Formula Lab (2026-10-22) — in the game on `feature/formula-lab`, waiting for playtest

Owner idea: grades come from research + combos, not stats. Catalyst Lab researches graded
catalysts (D–SS); Formula Lab mixes base/formula + 1–3 catalysts into a permanent formula;
blend stations produce at that grade and use up catalysts. Design, numbers and pacing:
[`FORMULA-LAB.md`](FORMULA-LAB.md).

## Done since v4.0.12 (were open)

#5 lab research → Formula Lab + Product Lab (4.2), #6 demand per product (market), #7 rivals scale with year.

## Old open list (v4.0.12 Y4–5) — kept for history

| #   | Topic                                     | Notes                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5   | **Recipes too easy: research in the lab** | Every base × additive can be tried right away, and one lot shows its letter. Proposal: the blend sheet lists only researched recipes; the lab runs research projects (RD + money + weeks). The odds and quality of a find depend on lab level, the chemist assigned and a little luck. |
| 6   | **Everything sells**                      | Every product line sells well. Proposal: demand per product cools down when you sell a lot of the same thing, and recovers over time (trend).                                                                                                                                          |
| 7   | **Rivals too weak at awards**             | Y4: our product score was 1059 against rivals at 328–352. Proposal: rivals scale with year/rank so awards stay contested.                                                                                                                                                              |

## UI fixes — Sarana will point them out one by one

| #   | Topic                              | Notes                                                                                                 |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| U2  | Zoom-out view                      | See the whole yard at once.                                                                           |
| U3  | Yard is cluttered and hard to read | Mostly an art problem: PixelLab sprites with a distinct look per building. Code shapes are temporary. |

## Later

- PixelLab art pass (after systems and UI are done).
- Tuning pass.
- Fun features beyond Kairosoft (ideas 1–4 from the chat; their text isn't saved in the repo, so they need to be listed again when picked up).
- Badge on the Customers tab when there is a new offer.

## How things work now (for reference)

- Crude → distillation splits it into base stock (each base caps at 6,000) → a blend station takes the selected base + additive and makes a 300-unit lot every 48 ticks → product tank.
- Lots never merge; each keeps its grade.
- Sales are automatic. About one buyer truck per week, more often with the highway. Each buyer wants one product with a minimum grade and takes the best matching lot, 300 units. When tanks are ≥80% full, buyers take the worst lot at half price.
- Contracts deliver automatically every week.
