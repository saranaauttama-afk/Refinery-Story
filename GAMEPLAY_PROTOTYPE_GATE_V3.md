# Gameplay V3 — Prototype gate

2026-09-26 · **PASS TO R2 — player decision on build #69**

This gate evaluates the C0→C2 Gasoline prototype only. It does not authorize
Lube, Jet, later clients, art/map work, a build, or a push.

## Automated comparison

Command: `npm run check:v3-gate`

The fixture uses the same V3 production, wage, inventory, sale, job, COGS and
action reducers as the preview. It supplies ordinary affordable input, one local
Operator and no boost. Values below are deterministic candidate-dataset evidence,
not final promises.

| Recipe | Market | Qty | Production time | Receipts | COGS | Wages | Contribution | Contribution/min |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volume Q35 | Spot | 35 | 23.4s | $630.00 | $364.74 | $1.56 | $263.70 | $676.16 |
| Precision Q55 | Spot | 35 | 36.6s | $630.00 | $364.74 | $2.44 | $262.82 | $430.86 |
| Volume Q35 | Local Trial | 40 | 26.8s | $871.20 | $416.84 | $1.79 | $452.57 | $1,013.22 |
| Precision Q55 | Performance Trial | 35 | 36.6s | $1,039.50 | $364.74 | $2.44 | $672.32 | $1,102.17 |

Interpretation:

- Volume is the stronger spot recipe because it clears the same 35 units 13.2s
  sooner and earns about 57% more contribution per minute.
- Precision is not a universal upgrade: it loses on spot, but wins while a Q55
  premium buyer is available.
- The decision is therefore market × recipe, not a linear quality ladder.
- Completion bonuses are finite milestone payments. They must not be copied into
  unbounded premium repeats when R2 adds repeat work.

## Automated acceptance evidence

- Fresh deterministic route reaches C1 only after Tutorial Gasoline 20 ships.
- C2 requires 40 completed-job units from one developed blueprint; default stock
  cannot satisfy this condition.
- The UI can dispatch a chosen qualifying blueprint, so a lower-quality lot does
  not silently consume the player's intended showcase shipment.
- Operator transfer changes one local line only. Reserve/unpaid states do not
  keep role bonuses.
- Recovery, loaners, protected stock, duplicate action sequence, reload, nested
  modal pause and app-background pause fixtures pass.
- Legacy balance, camera and factory-map regressions pass through the direct tsx
  loader. The `npx tsx` wrapper may fail to create its sandbox IPC socket; that is
  a runner restriction, not a gameplay assertion.

## Required Android playtest

Status remains **pending** until one 15–20 minute fresh-device session records:

1. Time and taps to the Tutorial delivery and C1.
2. Whether the player understands why Volume suits spot and Precision suits the
   Performance buyer without reading this document.
3. One deliberate Operator move and the visible change it causes.
4. One useful investment choice (Lab timing, crude working capital, tank, or
   automation opt-in) that is not merely a forced purchase.
5. First developed shipment and C2, with no repetitive claim/sell tapping doing
   the strategic work.
6. A forced zero-cash recovery and, separately, missing-route loaner recovery.
7. Thai/English wrapping, touch targets, modal nesting, background/resume and
   small-screen scrolling.

## Gate decision

**2026-09-26 — Pass to R2 (player decision).** After playing Android build #69
(release `9b8fe406`) the player judged the prototype playable enough to continue
(“พอเล่นได้ ทำต่อเลย”). No per-item timings or observations for checklist
items 1–7 were supplied, so they are not recorded here as measured evidence;
revisit them during the V3-19 Android acceptance pass.

Previous status (2026-09-25): **Pending device evidence.** Automated economics support the intended choice, so
there is no current reason to add later product families to hide a weak Gasoline
loop. After device play, choose exactly one outcome: pass to R2, correct mechanics
within V3-00…09, or stop expansion.
