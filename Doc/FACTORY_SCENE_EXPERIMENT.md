# Factory Scene Experiment

Branch: `feature/ui-skeleton-v1`  
Date: 2026-06-19

## Goal

Create a separate visual experiment that tests refinery world context
without changing gameplay, save format, balance, or the live Factory
renderer.

This experiment is intentionally **not** a new renderer mode for live play.
It is a composition study.

## Why This Experiment Exists

The isometric prototype answered one question clearly:

Projection alone does not make the Factory feel like a refinery.

Changing square tiles into an isometric board changed the viewing angle,
but it did not solve the deeper visual problem:

- the scene still read as a board
- the scale still read as tile-first
- the world still lacked coastline, docks, zoning, roads, and industrial context

The missing ingredient was not "better projection."
The missing ingredient was **world context**.

## What Was Built

New files:

- `src/components/FactoryScenePrototype.tsx`
- `app/factory-scene-prototype.tsx`

The prototype uses:

- React Native `View`
- `react-native-svg`
- borders
- layered background blocks

No image assets, gameplay data, save data, balance logic, or animation were added.

## Prototype Intent

The prototype treats buildings as **landmarks**, not tiles.

Scene structure:

- upper area:
  sea, harbor edge, coastline, horizon atmosphere
- middle area:
  refinery district, tank farm zone, process unit zone
- lower area:
  roads, logistics yard, loading zone

Representative landmark objects:

- tank farm clusters
- multiple process towers
- laboratory block
- maintenance yard
- loading station
- pipe rack strips

## What Was Learned

### 1. World context changes the first impression faster than projection

Sea, docks, industrial zoning, and logistics lanes immediately make the
scene read as a refinery environment even before any gameplay object is
interactive.

### 2. Scale matters more than tile angle

Multiple tank clusters, repeated towers, and a loading zone make the
facility feel larger than a board. This helps communicate "site" instead
of "grid."

### 3. Districts are more important than single tiles

The strongest cues came from grouped zones:

- storage district
- process district
- support district
- logistics district

That grouping communicates function faster than isolated building rendering.

### 4. Projection alone was insufficient

The isometric prototype still looked like a board because:

- the grid was still the dominant visual idea
- the player still saw cells before seeing a place
- there was little evidence of harbor intake, storage fields, or dispatch flow

## Recommendations

### Short-term

Keep `grid` as the live Factory default.

Use this scene-first experiment as a reference for future world-context work.

### Medium-term

If visual direction continues, prioritize:

1. world backdrop
2. zoning
3. refinery scale
4. support/logistics context
5. only then reconsider projection

### Recommendation Verdict

Pursue **scene-first approach**.

Do not treat 2.5D or isometric projection as the primary solution to the
Factory feeling problem.

Projection may still matter later, but world context should lead.
