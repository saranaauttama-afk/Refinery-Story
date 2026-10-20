# V4 Backlog — playtest notes

Running log of feedback and ideas from Sarana's APK playtests. Nothing here is
decided until it moves into PLAN.md.

## Decided (v4.0.12)

- **SS harder, still reachable:** grade thresholds scale with rank (`GRADE_SCALE`).
- **Per-station recipes:** each blend station has its own recipe; more product kinds bring more buyers.
- **Tanks stay shared.**
- **Yard notices are optional:** small pills on the yard (tanks nearly full, contract offers, staff without a post, station with no refining unit). Tap opens the sheet; ✕ hides it. Nothing is forced.
- **U1 camera:** opens centred on the buildings (or the owned land).

## UI fixes — Sarana will point them out one by one

| #   | Topic                              | Notes                                                                                                                     |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| U2  | Zoom-out view                      | See the whole yard at once.                                                                                               |
| U3  | Yard is cluttered and hard to read | Mostly an art problem: PixelLab sprites with a distinct look per building. Code shapes are temporary.                     |

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
