# Agent Finish Mode

## Mission

Move Refinery Story from its current playable mobile build to a stable v1.0.
Work through `RELEASE_CHECKLIST.md` in order and keep the app runnable.

## Autonomy

The agent may inspect, implement, test, document, and commit tasks inside the
active phase without requesting file-by-file instructions.

Pause for user approval only when:

- a checklist item is explicitly marked as an approval gate;
- a choice changes gameplay scope, save compatibility, or the final art direction;
- credentials, external publication, payment, or destructive repository work
  would be required;
- a blocker cannot be resolved safely from the repository.

## Scope Rules

- Do not add new gameplay systems during Finish Mode.
- Do not silently resurrect prototype branches.
- Do not change balance while repairing camera or graphics infrastructure.
- Preserve old saves unless a documented migration is included.
- Prefer small verified commits that leave the app runnable.
- Current source and git history outrank stale documents.

## Required Verification

For each implementation batch, report:

1. files changed;
2. behavior changed;
3. typecheck result;
4. simulation/build result;
5. focused manual checks;
6. the next checklist item.

## Art Production Rules

- Do not mass-produce building art before the three-building pilot is approved.
- Enforce the art bible with automated validation.
- Reject assets that contain baked backgrounds, fake transparency, excessive
  colors, inconsistent anchors, or non-pixel sampling.
- Integrate and inspect assets in the actual camera at every supported zoom.
