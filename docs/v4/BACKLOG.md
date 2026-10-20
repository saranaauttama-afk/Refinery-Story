# V4 Backlog — playtest notes

Running log of feedback and ideas from Sarana's APK playtests. Nothing here is
decided until it moves into PLAN.md.

## Open — waiting for a decision

| #   | From       | Topic                                     | Notes / options                                                                                                                                                                                                                         |
| --- | ---------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | v4.0.11 Y3 | **SS is too easy**                        | Y3 blend scored 623, but SS starts at 400. After that, grade gives nothing to chase. Options: (a) grade thresholds rise with rank (big buyers get pickier); (b) add an SSS tier for late game.                                          |
| 2   | v4.0.11 Y3 | **One recipe for all blend stations**     | Every station uses the same base and additive, so a second station only adds speed. Gasoline sat unused (4,695 units) while diesel was selected. Proposal: each station sets its own recipe, so a new station opens a new product line. |
| 3   | v4.0.11 Y3 | **Product tanks: shared or per product?** | Now one shared pool: each tank adds 1,200 capacity, and lots of any product sit together with their own grade. Proposal: keep it shared (simpler). If split tanks come later, make them flavor, e.g. an LPG sphere.                     |
| 4   | v4.0.11 Y3 | **Yard tells you what to do next**        | Short alerts on the yard: tank near full, new contract offer, staff out of power, base stock piling up. The player then doesn't have to open every sheet to check.                                                                      |

## UI fixes — Sarana will point them out one by one

| #   | Topic                              | Notes                                                                                                                     |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| U1  | Camera shows too much sky          | Nearly half the screen is empty sky. Start the camera lower so the yard fills the screen. Promised with the first UI fix. |
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
