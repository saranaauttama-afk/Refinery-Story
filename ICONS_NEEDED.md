# Icon art needed (SVG → raster swap)

The game currently renders its **33 icons** as inline SVG (the
`assets/icons/*.svg` files are inlined into `src/components/iconRegistry.ts` by
`scripts/gen-icons.js` and drawn with `react-native-svg`'s `SvgXml` via
`GameIcon`). This list is for **replacing those vector icons with raster images**
(PNG) — one PNG per id below.

> These are the small "resource tile" icons (money, crude, a worker, a plant
> thumbnail, …) shown in the HUD, chips, pickers and cards. They are **separate**
> from the big code-drawn factory scene and from the `assets/plants/` sprites and
> the art-slot illustrations in `ASSETS_NEEDED.md`.

## How to add an image (per icon)

1. **Generate** a PNG for the **id** below at **256 × 256 px**, **1:1**,
   **transparent background** (see "Keep the tile background?" note).
2. **Save** it to `assets/icons-png/<id>.png` — the filename must equal the
   **id** exactly (e.g. `assets/icons-png/worker-operator.png`).
3. Tell me when a batch is in and I'll do the one-time **wiring** (a `require()`
   registry + switch `GameIcon` from `SvgXml` to `<Image>`); the swap is then
   automatic everywhere `GameIcon` is used — no per-screen changes.

> The id is just the existing SVG filename without `.svg`. The four short HUD
> aliases (`money`, `crude`, `gas`, `reputation`, `esg`, `research`, `season`,
> `feedstock`) keep working — they already map onto the ids below.

## Conventions

- **Size / export:** author at **256 × 256** (the SVGs use a 128 viewBox, so 256
  is a clean 2×). Square, 1:1. They display at 15–40 px, so 256 is plenty crisp.
- **Background — keep the tile?** Today every icon sits on a **cream rounded
  tile** (`#F4EAD7` with a soft isometric base shadow) so they read as little
  "resource tiles". Either:
  - **Keep that look** → paint the same cream rounded square into each PNG
    (consistent with the building thumbnails), **or**
  - **Go transparent** → deliver bare icons on transparent bg; tell me and I'll
    add the cream tile in code (`GameIcon` wrapper) so it stays consistent.
- **Style:** match the existing plant sprites in `assets/plants/` and the current
  icons — soft, rounded, slightly stylised "Kairosoft-ish"; cream/teal/gold
  palette with a dark `#2B3A4A` outline (see `src/theme.ts`).
- **Silhouette:** keep each icon's subject centered and chunky — they're tiny on
  screen, so detail is lost; readable silhouette matters more than fine detail.

## Icon list (33)

### UI / resource stats (5) — HUD dock, stat rows, season chip
| id | Alias | Used on | What it is |
|----|-------|---------|------------|
| `ui-money` | `money` | HUD dock, payouts, store | Cash / coins |
| `ui-reputation` | `reputation` | HUD dock, awards | Reputation (star / badge) |
| `ui-researchPoints` | `research` | R&D tab, RP costs | Research points (flask/atom) |
| `ui-esgScore` | `esg` | HUD "More info", ESG tier | ESG / sustainability score |
| `ui-season` | `season` | Calendar / season chip | Season indicator |

### Products & resources (9) — supply tab chips, contract requirements, flow strip
| id | Alias | Used on | What it is |
|----|-------|---------|------------|
| `product-crudeOil` | `crude` | HUD dock, supply | Crude oil (barrel/tank, brown) |
| `product-feedstock` | `feedstock` | refinery chain | Feedstock (tan barrel) |
| `product-gasoline` | `gas` | HUD dock, flow strip, contracts | Gasoline (green barrel + pump) |
| `product-asphalt` | — | asphalt contracts | Asphalt (dark slab) |
| `product-lubricants` | — | supply, contracts | Lubricants (gold drums) |
| `product-jetFuel` | — | supply, contracts | Jet fuel (blue barrel + plane) |
| `product-petrochemicals` | — | supply, contracts | Petrochemicals (purple, molecule) |
| `product-recycledMaterial` | — | supply | Recycled material |
| `product-plasticPellets` | — | supply, contracts | Plastic pellets |

### Workers (10) — recruit tab cards, Company › Team, plant staff badges
| id | Used on | What it is |
|----|---------|------------|
| `worker-operator` | recruit / team | Operator (gasoline throughput) |
| `worker-mechanic` | recruit / team | Mechanic (storage / upkeep) |
| `worker-salesAgent` | recruit / team | Sales agent (sell price) |
| `worker-safetyOfficer` | recruit / team | Safety officer (incident mitigation) |
| `worker-chemist` | recruit / team | Chemist (research points) |
| `worker-logisticsCoordinator` | recruit / team | Logistics coordinator (shipments) |
| `worker-fuelSpecialist` | recruit / team | Fuel specialist (gasoline price) |
| `worker-aviationSpecialist` | recruit / team | Aviation specialist (jet fuel output) |
| `worker-chemicalEngineer` | recruit / team | Chemical engineer (petrochem output) |
| `worker-polymerEngineer` | recruit / team | Polymer engineer (plastic pellets output) |

### Buildings (9) — build picker, plant detail, building lists
| id | Used on | What it is |
|----|---------|------------|
| `building-crudeTank` | build picker | Crude storage tank (orange) |
| `building-distillationUnit` | build picker | Distillation unit (crude → feedstock) |
| `building-productTank` | build picker | Product storage tank (green) |
| `building-laboratory` | build picker | Laboratory (research) |
| `building-maintenanceWorkshop` | build picker | Maintenance workshop (wrench) |
| `building-salesOffice` | build picker | Sales office ($) |
| `building-lubricantPlant` | build picker | Lubricant plant (gold drums) |
| `building-jetFuelPlant` | build picker | Jet fuel plant (plane) |
| `building-petrochemicalPlant` | build picker | Petrochemical plant (molecule) |

## Not yet iconned (optional — 8 building types with no icon today)

These building types currently fall back to no icon (`GameIcon` renders nothing).
Add them the same way if you want full coverage — **not required**, the game
works without them:

`building-powerPlant`, `building-wasteTreatmentPlant`, `building-polymerPlant`,
`building-lubricantTank`, `building-jetFuelTank`, `building-petrochemicalTank`,
`building-recyclingBunker`, `building-pelletSilo`

---

*Drop the PNGs in `assets/icons-png/` (matching the ids above) and ping me — I'll
wire `GameIcon` to use them and verify with a web export. If you'd rather keep
SVG and just restyle, you can instead edit `assets/icons/<id>.svg` and re-run
`node scripts/gen-icons.js`.*
