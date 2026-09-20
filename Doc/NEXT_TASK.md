# Next Recommended Task

Branch: `feature/ui-skeleton-v1`  
Last updated: 2026-06-19

---

## Immediate Next Task

### Factory Map Projection Prototype Review

**Goal:**
Review the existing Factory renderer directions before adding any new visual
features.

This is a review/decision task, not a polish pass.

### What to review

Compare the three current renderer paths:

1. `grid`
2. `map2_5d`
3. `isometric`

Questions to answer:

- Which renderer best preserves tap clarity and build/inspect readability?
- Which renderer best supports the intended Kairosoft-style factory scene?
- Which renderer is safe enough to become the live default later, if any?
- Does either prototype need revision before it is worth promoting?

### What NOT to add in this task

- no roads
- no pipes
- no workers
- no trucks
- no smoke
- no new animation
- no new art
- no new gameplay systems
- no new isometric pass from scratch

### Success criteria

- renderer choice is reviewed with the user
- live default remains stable until that review is complete
- any approved follow-up is scoped from real prototype feedback, not guesswork

---

## Task After That

### Visual Direction Follow-Up (depends on review result)

If the user approves one projection path:

- promote/refine only that path
- keep interactions stable
- avoid parallel renderer churn

If the user rejects both prototypes:

- return to the current `grid` renderer
- improve scene support around it instead of forcing projection changes

---

## Longer-Term Backlog

| Area | Later work |
| --- | --- |
| Factory atmosphere | stronger living-refinery feel |
| Boost ownership | restore or clarify visible Boost UI |
| Rankings/history | give awards and ranking history a durable visible home |
| Renderer architecture | reduce live/prototype split risk |
| Technical debt | require cycle warning |
| Build config | Expo `scheme` warning |

---

## Rules For The Next Task

1. Keep the live Factory renderer on the reviewed safe default until the user approves a change
2. Do not delete prototype code during review
3. Do not change gameplay balance or save format
4. Run `npx tsc --noEmit` before committing
5. Prefer one renderer direction over maintaining multiple active visual paths
