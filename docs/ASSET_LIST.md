# Refinery Story Mobile - Asset List

## Scope

This document is a production-facing visual asset audit for the current Expo /
React Native build of Refinery Story.

It is planning only:

- no UI redesign
- no gameplay changes
- no balance changes
- no save-data changes
- no placeholder art production

## Current Visual State

Current in-project visual coverage:

- `BuildingTile` still uses colored placeholder boxes with 2-letter labels.
- Most screens rely on text, color, borders, and a few emoji markers.
- no production-ready asset set is currently wired into the app
- The existing SVG set is useful for coverage audit and silhouette continuity,
  but it is not the final low poly industrial / miniature diorama target.

Coverage gaps already visible from the current code:

- 8 newer building types have no legacy icon coverage.
- newer products such as `recycledMaterial` and `plasticPellets` have no legacy icon coverage
- `powerPlant`, `wasteTreatmentPlant`, `polymerPlant`, and tank-farm storage assets need new art
- staff presentation is still text-first, not portrait-first
- contracts, achievements, events, and utility actions are still mostly text-only

## Priority Definitions

- `P0`: needed to make the core gameplay loop feel visually intentional
- `P1`: needed to support the full current feature set cleanly
- `P2`: polish, content expansion, or low-risk visual depth

## Resolution Guidance

Recommended resolutions below are master sizes, not final runtime draw sizes.
All assets should be authored larger than display size, then exported for
mobile as needed.

## Estimated Unique Asset Count

Planned unique asset count for the current game: `130`

Category breakdown:

- Buildings: 17
- Products: 7
- Resource Icons: 12
- Staff: 15
- Contracts: 12
- Events: 14
- Achievements: 21
- UI Icons: 19
- Backgrounds: 8
- Decorations: 5

## Buildings

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BLD_CRUDE_TANK` | Crude Tank Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Heavy raw-storage silhouette; early-game core asset |
| `BLD_DISTILLATION_UNIT` | Distillation Unit Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Main refinery hero silhouette; highest visibility building |
| `BLD_PRODUCT_TANK` | Product Tank Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Cleaner storage family; pairs with crude tank for progression contrast |
| `BLD_LABORATORY` | Laboratory Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Support building; science/teal accent family |
| `BLD_MAINTENANCE_WORKSHOP` | Maintenance Workshop Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Utility building with crane/tooling cues |
| `BLD_SALES_OFFICE` | Sales Office Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Most polished support building; admin/business identity |
| `BLD_LUBRICANT_PLANT` | Lubricant Plant Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Core downstream plant; gold-dark family |
| `BLD_JET_FUEL_PLANT` | Jet Fuel Plant Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Core downstream plant; blue family |
| `BLD_PETROCHEMICAL_PLANT` | Petrochemical Plant Render | Buildings | Home (Refinery), Build Sheet, Building Info | P0 | 1024x1024 | Square | Core downstream plant; purple family |
| `BLD_POWER_PLANT` | Power Plant Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Strong red energy silhouette; high read value |
| `BLD_WASTE_TREATMENT_PLANT` | Waste Treatment Plant Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Recycling/cleanup utility; green-dark family |
| `BLD_POLYMER_PLANT` | Polymer Plant Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Advanced clean-tech production building |
| `BLD_LUBRICANT_TANK` | Lubricant Tank Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Tank-farm storage asset for lubricants |
| `BLD_JET_FUEL_TANK` | Jet Fuel Tank Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Tank-farm storage asset for jet fuel |
| `BLD_PETROCHEMICAL_TANK` | Petrochemical Tank Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Tank-farm storage asset for petrochemicals |
| `BLD_RECYCLING_BUNKER` | Recycling Bunker Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Chunkier storage family; not a standard tank silhouette |
| `BLD_PELLET_SILO` | Pellet Silo Render | Buildings | Home (Refinery), Build Sheet, Building Info | P1 | 1024x1024 | Square | Clean silo asset for plastic pellets |

## Products

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `PRD_GASOLINE` | Gasoline Product Icon | Products | Home (Refinery), Business, Contracts | P0 | 512x512 | Square | Warm amber fuel identity |
| `PRD_ASPHALT` | Asphalt Product Icon | Products | Stats, Business, Standing Orders | P1 | 512x512 | Square | Dark slab/block silhouette |
| `PRD_JET_FUEL` | Jet Fuel Product Icon | Products | Home (Refinery), Business, Contracts | P0 | 512x512 | Square | Blue aviation-fuel identity |
| `PRD_LUBRICANTS` | Lubricants Product Icon | Products | Home (Refinery), Business, Contracts | P0 | 512x512 | Square | Gold-dark premium fluid identity |
| `PRD_PETROCHEMICALS` | Petrochemicals Product Icon | Products | Home (Refinery), Business, Contracts | P0 | 512x512 | Square | Purple chemistry identity |
| `PRD_RECYCLED_MATERIAL` | Recycled Material Product Icon | Products | Home (Refinery), Business, Events | P1 | 512x512 | Square | Green-dark recycled bundle/flakes identity |
| `PRD_PLASTIC_PELLETS` | Plastic Pellets Product Icon | Products | Home (Refinery), Business, Events | P1 | 512x512 | Square | Teal pellet cluster/container identity |

## Resource Icons

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `RES_MONEY` | Money Icon | Resource Icons | Home (Refinery), Store, Stats | P0 | 256x256 | Square | Replace text-only money chip accent |
| `RES_CRUDE_OIL` | Crude Oil Icon | Resource Icons | Home (Refinery), Business, Contracts | P0 | 256x256 | Square | Distinct from gasoline and feedstock |
| `RES_FEEDSTOCK` | Feedstock Icon | Resource Icons | Home (Refinery), Business | P0 | 256x256 | Square | Mid-process resource icon |
| `RES_ELECTRICITY` | Electricity Icon | Resource Icons | Home (Refinery), Stats | P1 | 256x256 | Square | Power gating support resource |
| `RES_WASTE` | Waste Icon | Resource Icons | Home (Refinery), Stats | P1 | 256x256 | Square | Environmental pressure signal |
| `RES_GASOLINE` | Gasoline Resource Icon | Resource Icons | Home (Refinery), Stats | P0 | 256x256 | Square | Distinct chip icon for primary product |
| `RES_ESG` | ESG Score Icon | Resource Icons | Home (Refinery), Stats | P0 | 256x256 | Square | Needs premium sustainability cue, not cartoon leaf |
| `RES_SEASON` | Season Icon | Resource Icons | Home (Refinery), Stats | P1 | 256x256 | Square | Seasonal demand cue; subtle, not weather-app literal |
| `RES_TIME` | Time / Clock Icon | Resource Icons | Home (Refinery) | P0 | 256x256 | Square | Pairs with day/night clock chip |
| `RES_RESEARCH_POINTS` | Research Points Icon | Resource Icons | Business, Stats | P1 | 256x256 | Square | Used in research progression |
| `RES_UPGRADE_POINTS` | Upgrade Points Icon | Resource Icons | Business, Stats | P1 | 256x256 | Square | Used in perks tree progression |
| `RES_REPUTATION` | Reputation Icon | Resource Icons | Business, Stats, Awards | P1 | 256x256 | Square | Business prestige signal |

## Staff

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `STF_OPERATOR_PORTRAIT` | Operator Portrait | Staff | Staff, Hidden Event reward reveal | P0 | 768x1024 | Portrait | Core early-game worker portrait |
| `STF_MECHANIC_PORTRAIT` | Mechanic Portrait | Staff | Staff | P0 | 768x1024 | Portrait | Maintenance role portrait |
| `STF_SALES_AGENT_PORTRAIT` | Sales Agent Portrait | Staff | Staff | P0 | 768x1024 | Portrait | Business-facing portrait |
| `STF_SAFETY_OFFICER_PORTRAIT` | Safety Officer Portrait | Staff | Staff, Events | P1 | 768x1024 | Portrait | Safety/compliance identity |
| `STF_CHEMIST_PORTRAIT` | Chemist Portrait | Staff | Staff, Research flavor moments | P0 | 768x1024 | Portrait | Science support portrait |
| `STF_LOGISTICS_COORDINATOR_PORTRAIT` | Logistics Coordinator Portrait | Staff | Staff, Business | P1 | 768x1024 | Portrait | Shipment/standing-order support role |
| `STF_FUEL_SPECIALIST_PORTRAIT` | Fuel Specialist Portrait | Staff | Staff | P1 | 768x1024 | Portrait | Production support role |
| `STF_AVIATION_SPECIALIST_PORTRAIT` | Aviation Specialist Portrait | Staff | Staff, Assign flow | P1 | 768x1024 | Portrait | Specialist portrait for jet fuel plant |
| `STF_CHEMICAL_ENGINEER_PORTRAIT` | Chemical Engineer Portrait | Staff | Staff, Assign flow | P1 | 768x1024 | Portrait | Specialist portrait for petrochemical plant |
| `STF_POLYMER_ENGINEER_PORTRAIT` | Polymer Engineer Portrait | Staff | Staff, Hidden Event reward reveal | P1 | 768x1024 | Portrait | Late-game specialist portrait |
| `STF_BADGE_ROOKIE` | Rookie Tier Badge | Staff | Staff recruitment cards | P1 | 256x256 | Square | Recruitment tier accent badge |
| `STF_BADGE_SKILLED` | Skilled Tier Badge | Staff | Staff recruitment cards | P1 | 256x256 | Square | Recruitment tier accent badge |
| `STF_BADGE_EXPERT` | Expert Tier Badge | Staff | Staff recruitment cards | P1 | 256x256 | Square | Recruitment tier accent badge |
| `STF_BADGE_STAR` | Star Tier Badge | Staff | Staff recruitment cards | P1 | 256x256 | Square | Highest recruitment tier badge |
| `STF_BADGE_VETERAN` | Veteran Trait Badge | Staff | Staff cards, hidden-event hires | P1 | 256x256 | Square | Reusable trait marker, not a full portrait |

## Contracts

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CON_FRAME_STANDARD` | Standard Contract Card Frame | Contracts | Business | P0 | 1024x640 | Landscape | Reusable frame for normal contracts |
| `CON_BADGE_TIER_1` | Contract Tier 1 Badge | Contracts | Business | P1 | 256x256 | Square | Reusable badge for entry-tier contracts |
| `CON_BADGE_TIER_2` | Contract Tier 2 Badge | Contracts | Business | P1 | 256x256 | Square | Reusable badge for mid-tier contracts |
| `CON_BADGE_TIER_3` | Contract Tier 3 Badge | Contracts | Business | P1 | 256x256 | Square | Reusable badge for late-tier contracts |
| `CON_GLYPH_GASOLINE` | Gasoline Contract Glyph | Contracts | Business, Events | P0 | 256x256 | Square | Used across gasoline-delivery contracts |
| `CON_GLYPH_ASPHALT` | Asphalt Contract Glyph | Contracts | Business, Stats | P1 | 256x256 | Square | Used for asphalt-specific requests and standing orders |
| `CON_GLYPH_JET_FUEL` | Jet Fuel Contract Glyph | Contracts | Business | P1 | 256x256 | Square | Used for jet fuel deliveries and standing orders |
| `CON_GLYPH_LUBRICANTS` | Lubricants Contract Glyph | Contracts | Business | P1 | 256x256 | Square | Used for lubricants deliveries and standing orders |
| `CON_GLYPH_PETROCHEMICALS` | Petrochemicals Contract Glyph | Contracts | Business | P1 | 256x256 | Square | Used for petrochemicals deliveries and standing orders |
| `CON_LOGISTICS_TRUCK` | Local Shipment Truck Glyph | Contracts | Business | P1 | 256x256 | Square | Covers miniDelivery and localTruck options |
| `CON_LOGISTICS_TANKER` | Coastal Tanker Ship Glyph | Contracts | Business | P1 | 256x256 | Square | Covers coastalTanker and importedShip options |
| `CON_LOGISTICS_SEAL` | Standing Order Seal | Contracts | Business | P1 | 256x256 | Square | Reusable standing-order marker across all 4 orders |

## Events

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `EVT_CHOICE_SUPPLIER` | Supplier / Supply Pressure Header | Events | Global Choice Event modal | P2 | 1280x720 | Landscape | Covers supplierNegotiation and supplyChainDelay tones |
| `EVT_CHOICE_RESEARCH` | Research / Incentive Header | Events | Global Choice Event modal | P2 | 1280x720 | Landscape | Covers researchGrant and governmentIncentive |
| `EVT_CHOICE_WORKFORCE` | Workforce / Training Header | Events | Global Choice Event modal | P2 | 1280x720 | Landscape | Covers workerRecruitment and trainingRequest |
| `EVT_CHOICE_EQUIPMENT` | Equipment Risk Header | Events | Global Choice Event modal | P2 | 1280x720 | Landscape | Covers equipmentEmergency and oldEquipmentSale |
| `EVT_CHOICE_QUALITY` | Quality / Community Header | Events | Global Choice Event modal | P2 | 1280x720 | Landscape | Covers qualityAlert and communityComplaint |
| `EVT_CHOICE_BUSINESS` | Investor / Rush Order Header | Events | Global Choice Event modal | P2 | 1280x720 | Landscape | Covers investorVisit and rushOrder |
| `EVT_STAMP_MARKET` | Market Opportunity Stamp | Events | Activity log, future event cards | P2 | 256x256 | Square | Maps to discount, demand spike, supplier discount style events |
| `EVT_STAMP_OPERATIONS` | Operations Efficiency Stamp | Events | Activity log, future event cards | P2 | 256x256 | Square | Maps to tune-up, efficient batch, inspection, suggestion events |
| `EVT_STAMP_INCIDENT` | Incident / Safety Stamp | Events | Activity log, future event cards | P2 | 256x256 | Square | Maps to leak, wear, contamination, hiccup events |
| `EVT_STAMP_COMMUNITY` | Community / PR Stamp | Events | Activity log, future event cards | P2 | 256x256 | Square | Maps to news, community visit, goodwill-style moments |
| `EVT_HIDDEN_MYSTERY_SIGIL` | Hidden Event Mystery Sigil | Events | Business, Staff, Build Sheet, global banner | P1 | 256x256 | Square | Replaces plain `???` feeling with a reusable mystery mark |
| `EVT_HIDDEN_REVEAL_CONTRACT` | Hidden Contract Reward Card | Events | Business | P2 | 768x1024 | Portrait | Reveal card for hidden contract rewards |
| `EVT_HIDDEN_REVEAL_BUILDING` | Hidden Building Reward Card | Events | Home (Refinery) build sheet | P2 | 768x1024 | Portrait | Reveal card for hidden building rewards |
| `EVT_HIDDEN_REVEAL_STAFF` | Hidden Staff Reward Card | Events | Staff | P2 | 768x1024 | Portrait | Reveal card for hidden staff rewards |

## Achievements

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ACH_FIRST_FUEL` | First Fuel Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `firstFuel` milestone |
| `ACH_SMALL_SUPPLIER` | Small Supplier Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `smallSupplier` milestone |
| `ACH_GROWING_REFINERY` | Growing Refinery Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `growingRefinery` milestone |
| `ACH_RESEARCH_BEGINNER` | Research Beginner Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `researchBeginner` milestone |
| `ACH_UPGRADE_BUILDER` | Upgrade Builder Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `upgradeBuilder` milestone |
| `ACH_REPUTED_SUPPLIER` | Reputed Supplier Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `reputedSupplier` milestone |
| `ACH_INDUSTRIAL_PRODUCER` | Industrial Producer Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `industrialProducer` milestone |
| `ACH_REFINERY_LEVEL_5` | Refinery Level 5 Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `refineryLevel5` milestone |
| `ACH_RESEARCH_ADVANCED` | Research Advanced Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `researchAdvanced` milestone |
| `ACH_CONTRACT_VETERAN` | Contract Veteran Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `contractVeteran` milestone |
| `ACH_TIER_THREE_CONTRACTOR` | Tier Three Contractor Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `tierThreeContractor` milestone |
| `ACH_FULL_WORKFORCE` | Full Workforce Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `fullWorkforce` milestone |
| `ACH_JET_FUEL_PIONEER` | Jet Fuel Pioneer Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `jetFuelPioneer` milestone |
| `ACH_AVIATION_PARTNER` | Aviation Partner Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `aviationPartner` milestone |
| `ACH_PETROCHEMICAL_PIONEER` | Petrochemical Pioneer Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `petrochemicalPioneer` milestone |
| `ACH_PRODUCT_MOGUL` | Product Mogul Badge | Achievements | Achievements | P2 | 512x512 | Square | Badge for `productMogul` milestone |
| `ACH_COMBO_FULL_REFINERY_LINE` | Full Refinery Line Combo Badge | Achievements | Achievements | P2 | 512x512 | Square | Hidden combo emblem |
| `ACH_COMBO_COMMAND_CENTER` | Command Center Combo Badge | Achievements | Achievements | P2 | 512x512 | Square | Hidden combo emblem |
| `ACH_COMBO_JET_SET_ROW` | Jet Set Row Combo Badge | Achievements | Achievements | P2 | 512x512 | Square | Hidden combo emblem |
| `ACH_COMBO_REFINING_TRIANGLE` | Refining Triangle Combo Badge | Achievements | Achievements | P2 | 512x512 | Square | Hidden combo emblem |
| `ACH_COMBO_PETROCHEMICAL_COMPLEX` | Petrochemical Complex Combo Badge | Achievements | Achievements | P2 | 512x512 | Square | Hidden combo emblem |

## UI Icons

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `UI_BACK` | Back Icon | UI Icons | Achievements, Store, Settings | P1 | 256x256 | Square | Replaces text-only back affordance later |
| `UI_MAIN_MENU` | Main Menu Icon | UI Icons | Stats | P1 | 256x256 | Square | Replaces text-only main-menu affordance later |
| `UI_TAB_REFINERY` | Refinery Tab Icon | UI Icons | Home (Refinery) tab bar | P0 | 256x256 | Square | Future branded replacement for generic factory icon |
| `UI_TAB_STAFF` | Staff Tab Icon | UI Icons | Staff tab bar | P0 | 256x256 | Square | Future branded replacement for generic users icon |
| `UI_TAB_BUSINESS` | Business Tab Icon | UI Icons | Business tab bar | P0 | 256x256 | Square | Future branded replacement for generic briefcase icon |
| `UI_TAB_STATS` | Stats Tab Icon | UI Icons | Stats tab bar | P0 | 256x256 | Square | Future branded replacement for generic chart icon |
| `UI_BUILD` | Build Action Icon | UI Icons | Home (Refinery), Build Sheet | P0 | 256x256 | Square | Used for empty-cell and build actions |
| `UI_UPGRADE` | Upgrade Action Icon | UI Icons | Home (Refinery), Stats | P0 | 256x256 | Square | Used for building and refinery upgrade cues |
| `UI_MOVE` | Move Action Icon | UI Icons | Home (Refinery) | P1 | 256x256 | Square | Used in rearrange flow |
| `UI_SWAP` | Swap Action Icon | UI Icons | Home (Refinery) | P1 | 256x256 | Square | Used in rearrange flow |
| `UI_DEMOLISH` | Demolish Action Icon | UI Icons | Home (Refinery) | P1 | 256x256 | Square | Used in rearrange flow |
| `UI_ASSIGN` | Assign Staff Icon | UI Icons | Staff, Home (Refinery) info sheet | P1 | 256x256 | Square | Used for per-cell specialist assignment |
| `UI_TRAIN` | Train Staff Icon | UI Icons | Staff | P1 | 256x256 | Square | Used on employee actions |
| `UI_REFRESH` | Refresh Pool Icon | UI Icons | Staff | P1 | 256x256 | Square | Used on recruitment refresh |
| `UI_BUY_CRUDE` | Buy Crude Action Icon | UI Icons | Home (Refinery), Business | P0 | 256x256 | Square | Supports primary early-game action |
| `UI_SELL_PRODUCTS` | Sell Products Action Icon | UI Icons | Home (Refinery), Business | P0 | 256x256 | Square | Supports gasoline and product selling cues |
| `UI_SAVE` | Save Action Icon | UI Icons | Stats, Settings | P1 | 256x256 | Square | Used for manual save and save-data grouping |
| `UI_EXPAND_GRID` | Expand Grid Icon | UI Icons | Stats | P1 | 256x256 | Square | Used for growth/progression CTA |
| `UI_STORE` | Store / Purchase Icon | UI Icons | Store, Settings, Home title/menu | P1 | 256x256 | Square | Used for monetization/demo-store surface |

## Backgrounds

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `BG_TITLE_MENU` | Title / Menu Background | Backgrounds | App entry, splash, main menu | P2 | 1440x2560 | Portrait | Separate from gameplay screens; premium intro mood piece |
| `BG_HOME_REFINERY` | Home / Refinery Background | Backgrounds | Home (Refinery) | P0 | 1440x2560 | Portrait | Must support grid, resource chips, cards, and night overlay |
| `BG_BUSINESS` | Business Background | Backgrounds | Business | P1 | 1440x2560 | Portrait | Subtle industrial paperwork / commerce tone |
| `BG_STAFF` | Staff Background | Backgrounds | Staff | P1 | 1440x2560 | Portrait | Recruitment / workforce tone without crowd clutter |
| `BG_STATS` | Stats Background | Backgrounds | Stats | P1 | 1440x2560 | Portrait | Calm dashboard background |
| `BG_ACHIEVEMENTS` | Achievements Background | Backgrounds | Achievements | P2 | 1440x2560 | Portrait | Trophy / milestone surface tone |
| `BG_STORE` | Store Background | Backgrounds | Store | P2 | 1440x2560 | Portrait | Commerce layer without breaking premium industrial style |
| `BG_SETTINGS` | Settings Background | Backgrounds | Settings | P2 | 1440x2560 | Portrait | Quiet utility backdrop |

## Decorations

| Asset ID | Asset Name | Category | Screen Usage | Priority | Recommended Resolution | Orientation | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `DEC_GRID_PLINTH_SYSTEM` | Grid Tile Plinth / Base System | Decorations | Home (Refinery) | P0 | 1024x1024 | Square | Foundational miniature-diorama base language under all buildings |
| `DEC_EMPTY_CELL_MARKER` | Empty Cell Marker | Decorations | Home (Refinery) | P0 | 256x256 | Square | Replaces plain plus-sign feel with a premium build cue |
| `DEC_PRODUCTION_GLOW` | Production Glow FX | Decorations | Home (Refinery) | P1 | 512x512 | Square | Supports active-building pulse without redesigning logic |
| `DEC_WORKER_MARKER` | Worker Presence Marker | Decorations | Home (Refinery) | P1 | 256x256 | Square | Replaces bobbing emoji worker badge later |
| `DEC_CELEBRATION_FX_PACK` | Celebration FX Pack | Decorations | Awards, Achievements, Win modal, banners | P2 | 1024x1024 | Square | Confetti, sparkle, reward burst, and polish accents |

## Notes for Production

- Do not create every P2 asset before the core Home (Refinery) set is working.
- a fresh asset set should be created from the current Art Bible, not from deleted legacy icons
- Buildings, products, resource icons, and the grid plinth system should be
  treated as the first visual milestone because they affect the primary play
  loop every session.
