# UI Blueprint V1

## Objective

Design a clearer mobile-first UI architecture for Refinery Story that reduces overload on the current Refinery and Business tabs, keeps the Factory screen focused on moment-to-moment play, and moves management systems into dedicated destinations.

## Core Principles

- Factory is the default home and the only place for grid interaction.
- Operational decisions should live away from the grid so the player is not reading long management lists while trying to build.
- Long-term progression should be grouped under HQ instead of spread across Stats, Achievements, and app-level links.
- Each top-level screen should answer one player question.
- Important actions should be visible, thumb-reachable, and no more than 1-2 taps from their parent system.
- Hidden-event rewards should use one consistent discovery surface instead of forcing the player to search multiple tabs.

## Top-Level Navigation

Primary bottom navigation:

| Screen | Purpose |
| --- | --- |
| Factory | Real-time home gameplay, grid interaction, immediate resources, current objective |
| Production | Flow control for materials, power, storage, selling, and automation |
| Staff | Hiring, roster management, training, and plant assignment |
| Business | Revenue planning through contracts, shipments, standing orders, and market context |
| HQ | Long-term progression, research, awards, achievements, era growth, save tools, settings access |

Recommended global secondary surfaces:

- Event Inbox: top-right bell/button on all five screens for hidden events, annual notices, and claimable discoveries.
- Achievements Detail: pushed route from HQ and Goal Card.
- Building Sheet: bottom sheet from Factory only.
- Settings: entered from HQ, not from a permanent bottom tab.

## Screen Architecture

### Factory

Purpose: the player checks status, places buildings, inspects buildings, and reacts to short-term bottlenecks here.

Primary goal:

- Let the player understand refinery health and act on the grid in seconds.

Secondary goal:

- Surface the next priority without forcing the player to leave the play screen.

Key information shown:

- Money
- Time and day state
- Crude, gasoline, feedstock, electricity, waste
- One-line alert state for bottlenecks
- Current goal / milestone progress
- Active boost or timed effects
- Grid state with building occupancy and expansion edge

Actions available:

- Tap empty tile to build
- Tap occupied tile to inspect
- Open build category picker
- Open event inbox
- Jump to related screen from alerts or goal card
- Trigger quick buy crude and quick sell gasoline if retained as pinned shortcuts

Components needed:

- Top HUD bar
- Resource chip rail
- Alert strip
- Goal card
- Factory grid
- Build FAB or docked build button
- Building inspect sheet
- Build picker sheet
- Floating feedback numbers

### Production

Purpose: the player manages throughput, storage pressure, energy pressure, product output, and auto-rules.

Primary goal:

- Explain what is being produced, what is blocked, and what should be sold or rebalanced next.

Secondary goal:

- Reduce the need to visit Business for basic selling and operational tuning.

Key information shown:

- Product inventory and fill levels
- Feedstock use and priority split
- Electricity generation versus consumption
- Storage capacity by product type
- Automation rules and current thresholds
- Sell value and current market multiplier for sellable goods

Actions available:

- Sell products
- Adjust feedstock priority
- Enable or disable auto-trade
- Set sell and crude thresholds
- Inspect bottlenecks
- Jump to Factory to build missing capacity

Components needed:

- Inventory summary card
- Feedstock allocation card
- Power balance card
- Storage panel
- Product sales list
- Automation card group
- Bottleneck insight row

### Staff

Purpose: the player grows the workforce and assigns talent to the right plants.

Primary goal:

- Make recruiting, upgrading, and assigning employees fast and understandable.

Secondary goal:

- Highlight unassigned specialists and training opportunities before they are forgotten.

Key information shown:

- Recruitment candidates
- Team size and salary pressure if added later
- Employee levels, traits, XP progress
- Current assignments and unassigned specialists
- Training costs and benefits

Actions available:

- Hire candidate
- Refresh recruitment pool
- Train employee
- Assign employee to a building
- Unassign or reassign employee
- Filter roster by role, assignment state, or plant type

Components needed:

- Recruitment carousel or stacked cards
- Employee list
- Training modal or inline action row
- Assignment picker
- Specialist status summary

### Business

Purpose: the player decides where revenue should come from and what external market actions matter now.

Primary goal:

- Present demand opportunities clearly so the player can choose the best money-making action.

Secondary goal:

- Keep logistics and contracts in one commercial layer rather than mixing them with research or stats.

Key information shown:

- Active contract
- Available contracts
- Shipments in transit
- Standing-order cooldowns and payouts
- Market demand, prices, seasonal modifiers, and reputation impact

Actions available:

- Accept contract
- Deliver contract
- Order crude shipment
- Trigger standing order
- Compare contract value versus direct sales
- Pin a target product to Production

Components needed:

- Contract board
- Shipment tracker
- Standing-order list
- Market pulse panel
- Revenue comparison badges

### HQ

Purpose: the player manages long-term advancement and all meta-level tools.

Primary goal:

- Give progression systems a clear home and make the refinery feel like it is advancing through eras.

Secondary goal:

- Remove save, reset, rename, and settings clutter from gameplay-facing screens.

Key information shown:

- Research tree or research list
- Achievement progress
- Awards and annual results
- Era timeline and next era requirements
- Manual save status and save tools
- Settings entry and app-level utilities

Actions available:

- Start research
- Claim achievement rewards if any are added later
- Review awards
- View era requirements
- Manual save
- Rename company or refinery
- Open settings
- Return to main menu if needed

Components needed:

- HQ overview header
- Research panel
- Achievements panel
- Awards panel
- Era progression card
- Save tools card
- Settings entry row

## Factory Screen Design

### Top HUD

Top row:

- Left: refinery name and level
- Center: time chip with day/night indicator
- Right: inbox button and pause/help if ever added

Second row:

- Money as the largest value
- Small trend badge for income direction
- Compact alert icons for power shortage, full storage, missing crude, idle staff

### Resource Layout

Always visible quick resources:

- Crude
- Gasoline
- Feedstock
- Electricity
- Waste

Expandable secondary strip or tap-to-expand drawer:

- Research points
- Reputation
- ESG
- Asphalt
- Key secondary products only when unlocked

Rule:

- Factory should show only the resources required for immediate build and production decisions.
- Full product detail belongs to Production.

### Goal Card

Placement:

- Directly under the HUD and above the grid.

Content:

- Current objective title
- Why it matters in one short sentence
- Progress bar
- Primary CTA such as `View HQ`, `Open Business`, or `Build Now`

Behavior:

- Tapping the card opens detailed milestone or achievement context.
- If a critical bottleneck exists, the card can temporarily swap to a warning state.

### Grid Placement

Layout:

- Grid is the visual center of the screen.
- Keep it above the thumb zone occupied by bottom navigation.
- At 6x6, use larger spacing around the grid and simplify tile chrome to protect tap accuracy.

Tile display priority:

- Icon or building silhouette
- Level badge
- Assignment badge if staffed
- Small warning dot for blocked or full state

Grid support UI:

- Build button anchored below or overlapping the lower-right edge of the grid
- Expansion button appears only when expansion is available
- Optional filter toggle for `Show Alerts`

### Build Flow

1. Player taps empty tile or the build button.
2. Build sheet opens with categories:
   - Core
   - Production
   - Storage
   - Support
3. Each building row shows:
   - Name
   - Cost
   - Unlock level
   - Short benefit line
   - Status: `Available`, `Locked`, or `Event Reward`
4. Player taps building.
5. Confirm panel shows tile target, cost, and effect summary.
6. Placement completes and the sheet closes back to Factory.

Build-flow rules:

- Do not bury hidden-event buildings in a separate discovery path.
- Event-granted buildings should appear in the same picker with a highlighted free badge.

### Building Inspect Flow

1. Player taps occupied tile.
2. Inspect sheet opens with a compact summary header:
   - Building name
   - Level
   - Assigned worker
   - Current output or bonus
3. Body uses tabs or segmented sections:
   - Overview
   - Upgrade
   - Staff
   - Rearrange
4. Actions stay pinned at the bottom:
   - Upgrade
   - Assign / Reassign
   - Move
   - Swap
   - Demolish

Inspect-flow rules:

- Dangerous actions like Demolish must be visually separated.
- Overview should answer "what is this doing right now?" before showing management actions.
- Do not stack every action in one long unstructured sheet.

## Production Screen Design

### Inventory

Use a top summary card with:

- Total products in storage
- Highest-value sellable product
- Most overfilled product
- Most constrained product

Below it, show a product list with rows for:

- Gasoline
- Lubricants
- Jet fuel
- Petrochemicals
- Recycled material
- Plastic pellets
- Asphalt as non-sell inventory if retained

Each row shows:

- Current stock
- Capacity
- Fill bar
- Sell price
- Quick sell CTA if sellable

### Feedstock

Dedicated feedstock card:

- Current feedstock stock
- Input rate and use pressure
- Priority sliders or steppers for lubricant, jet fuel, petrochemical
- Warning text when one plant family is starved

### Electricity

Dedicated power card:

- Current electricity available
- Generation per cycle
- Consumption per cycle
- Biggest consumers
- Warning state when shortages are reducing output

### Storage

Storage panel groups capacities by type:

- Crude
- Gasoline
- Lubricant storage
- Jet fuel storage
- Petrochemical storage
- Recycled material storage
- Plastic pellet storage

Each storage row should show:

- Capacity
- Current usage
- Linked building source
- CTA: `Build More` which deep-links to Factory with the relevant building preselected

### Product Sales

Product sales section:

- Rows for all directly sellable products
- Sell actions: `Sell 1`, `Sell 10`, `Sell All` or a simpler `Quick Sell` plus quantity sheet
- Revenue preview before confirmation
- Optional `Best Margin` badge based on market state

### Automation

Automation should sit as the last major block but remain visible:

- Auto-buy crude toggle
- Auto-sell gasoline toggle
- Threshold controls
- Saved presets later if needed
- Feedstock auto-balance if ever added

Automation rules:

- Show current rule state in plain language
- Avoid hiding all automation inside a small icon on another screen

## Staff Screen Design

### Recruitment

Top section:

- 3 candidate cards
- Timer to next free refresh
- Paid refresh button
- Small tag for rarity, trait, and specialty

### Employee List

Roster section:

- Default sort by assigned status and level
- Filter chips:
  - All
  - Unassigned
  - Specialists
  - Support

Each employee row shows:

- Name
- Role
- Level
- XP bar
- Trait
- Current assignment or `Unassigned`

### Training

Training action should live inline on the employee row and open a small modal with:

- Current level
- Next level benefit
- Cost
- Confirm button

### Assignment

Assignment flow:

1. Tap `Assign` on employee row.
2. Assignment sheet shows valid target buildings only.
3. Each target row shows:
   - Building name
   - Tile number or nickname
   - Current occupant
   - Output bonus preview
4. Confirm assignment.

Assignment rules:

- Reassignment should be one flow, not unassign then assign.
- Unassigned specialists should always be called out near the top of the screen.

## Business Screen Design

### Contracts

Top section:

- One active contract card
- Secondary list of available contracts
- Sort options: payout, deadline pressure if added later, product type

Contract row content:

- Product required
- Quantity
- Reward
- Reputation effect
- Deliver progress

### Shipments

Shipment section:

- Crude order buttons or cards
- Transit timers
- Delivery size and cost
- Current storage impact warning

### Standing Orders

Standing-order section:

- Available orders
- Cooldown timers
- Reward amount
- Trigger button

### Market Information

Market panel should explain the economy clearly:

- Seasonal multiplier
- Era modifier
- Highest-demand product
- Lowest-value product
- ESG premium indicator

Market rules:

- Keep this concise and visual.
- It should help decisions, not become a full analytics page.

## HQ Screen Design

### Research

Research is the first block on HQ because it changes the economy most often.

Recommended contents:

- Active research slot
- Available research list
- Prerequisite state
- RP cost
- Short outcome line

### Achievements

Achievement block:

- Next three milestone cards
- Hidden combo progress summary
- Button to full achievements route

### Awards

Awards block:

- Latest annual result
- Rival ranking snapshot
- Button to historical report if added later

### Era Progression

Era card:

- Current era
- Next era requirements
- Demand changes preview
- Visual timeline or stepped meter

### Save Tools

Save tools card:

- Last autosave status
- Manual save
- Rename refinery/company
- Reset save behind confirmation

### Settings Access

Settings entry should be a small utility section at the bottom:

- Language
- Audio
- Store
- Main menu
- About

## Information Hierarchy

### Tier 1

These should appear on the first screen layer or always-visible HUD surfaces.

Systems:

- Money
- Crude
- Gasoline
- Feedstock
- Electricity
- Waste
- Current goal
- Critical alerts
- Grid state
- Active contract summary
- Unassigned specialist warning

Placement:

- Factory HUD
- Factory alert strip
- Factory goal card
- Production top summary
- Small status badges on Staff and Business headers

### Tier 2

These should appear one scroll down, in dedicated cards, or in the owning top-level screen.

Systems:

- Product inventory
- Storage capacities
- Product selling
- Automation rules
- Recruitment candidates
- Employee roster
- Contracts list
- Shipments
- Standing orders
- Research progress
- Achievement progress
- Era requirements

Placement:

- Production body
- Staff body
- Business body
- HQ body

### Tier 3

These should live in deeper detail screens, sheets, or expandable cards.

Systems:

- Detailed formulas and exact bonuses
- Rival history
- Full award history
- Settings and store links
- Rename and reset tools
- Hidden combo archive
- Extended market explanations

Placement:

- HQ deep sections
- Modal sheets
- Achievements detail route
- Optional annual report route

## Wireframes

### Factory

```text
+--------------------------------------------------+
| Lv12 Refinery         14:20 Day 3         Inbox |
| $245,000      +trend   !Power  !Storage         |
+--------------------------------------------------+
| Crude | Gas | Feed | Elec | Waste               |
+--------------------------------------------------+
| GOAL: Reach Lv13 by upgrading Distillation      |
| [Progress---------]              [Open HQ]       |
+--------------------------------------------------+
|                                                  |
|                FACTORY GRID 5x5                  |
|        [ ][L2][PP][JT][ ]                        |
|        [CT][DU][PP][WS][ ]                       |
|        [ ][LB][PT][PL][ ]                        |
|        [ ][SO][MW][RB][ ]                        |
|        [ ][ ][ ][ ][ ]                           |
|                                                  |
+--------------------------------------------------+
| Alert: Petrochemical storage almost full         |
+--------------------------------------------------+
| [Quick Buy Crude]                 [Build +]      |
+--------------------------------------------------+
| Factory | Production | Staff | Business | HQ     |
+--------------------------------------------------+
```

### Production

```text
+--------------------------------------------------+
| Production                               Inbox   |
+--------------------------------------------------+
| Inventory Summary                                  |
| Most Full: Petrochemicals   Best Value: Jet Fuel   |
+--------------------------------------------------+
| Products                                           |
| Gasoline        180/300   [bar------]  [Sell]      |
| Lubricants       90/200   [bar---   ]  [Sell]      |
| Jet Fuel         40/200   [bar--    ]  [Sell]      |
| Petrochemicals  190/200   [bar----- ]  [Sell]      |
| Recycled Mat     20/150   [bar-     ]  [Sell]      |
| Plastic Pellets  75/200   [bar---   ]  [Sell]      |
+--------------------------------------------------+
| Feedstock: 120     Lube 40% | Jet 20% | Petro 40% |
+--------------------------------------------------+
| Electricity: 18 gen / 24 use   SHORTAGE           |
+--------------------------------------------------+
| Storage: [Build More Tanks]                       |
+--------------------------------------------------+
| Automation: Auto-buy ON | Auto-sell OFF          |
+--------------------------------------------------+
| Factory | Production | Staff | Business | HQ     |
+--------------------------------------------------+
```

### Staff

```text
+--------------------------------------------------+
| Staff                                    Inbox   |
+--------------------------------------------------+
| Recruitment                                        |
| [Cand A] [Hire]   [Cand B] [Hire]   [Cand C][Hire]|
| Free refresh in 01:24              [Refresh $]    |
+--------------------------------------------------+
| Team Summary: 12 staff   2 unassigned specialists |
+--------------------------------------------------+
| Filters: [All] [Unassigned] [Specialists]         |
+--------------------------------------------------+
| Niran - Chemical Engineer  Lv3  XP [----]         |
| Assigned: Petrochemical Plant #2      [Reassign]  |
+--------------------------------------------------+
| Mali - Aviation Specialist Lv2 XP [--- ]          |
| Assigned: Unassigned                   [Assign]   |
+--------------------------------------------------+
| Kwan - Operator           Lv4 XP [-----] [Train]  |
+--------------------------------------------------+
| Factory | Production | Staff | Business | HQ     |
+--------------------------------------------------+
```

### Business

```text
+--------------------------------------------------+
| Business                                 Inbox   |
+--------------------------------------------------+
| Active Contract                                     |
| Deliver 120 Asphalt   Reward $18,000 + Rep         |
| Progress [--------]                     [Deliver]   |
+--------------------------------------------------+
| Available Contracts                                 |
| Jet Fuel x60     $12,500   Rep ++         [Accept] |
| Lubricants x90   $15,000   Rep +          [Accept] |
+--------------------------------------------------+
| Shipments                                            |
| Medium Crude Shipment   ETA 00:42         [Order]  |
+--------------------------------------------------+
| Standing Orders                                      |
| Municipal Asphalt    Ready now             [Run]   |
+--------------------------------------------------+
| Market Pulse                                         |
| Season: Summer   Gasoline x1.2                      |
| Era Bonus: Petrochemicals +10%                      |
| ESG Premium: Active                                 |
+--------------------------------------------------+
| Factory | Production | Staff | Business | HQ     |
+--------------------------------------------------+
```

### HQ

```text
+--------------------------------------------------+
| HQ                                         Inbox |
+--------------------------------------------------+
| Research                                           |
| Active: Storage Efficiency II  [Progress----]     |
| Next: Safer Cracking                     [Start]  |
+--------------------------------------------------+
| Achievements                                       |
| Reach Lv15                 [View]                 |
| Discover 3 hidden combos   [View]                 |
+--------------------------------------------------+
| Awards & Era                                       |
| Last Year: #2 among rivals                         |
| Current Era: Industrial Expansion                  |
| Next Era requirement [-------]           [Details] |
+--------------------------------------------------+
| Save Tools                                          |
| Autosave: 00:12 ago   [Manual Save]   [Rename]    |
| [Settings]                                [Reset]  |
+--------------------------------------------------+
| Factory | Production | Staff | Business | HQ     |
+--------------------------------------------------+
```

## Mobile UX Risks

### Too Many Taps

Risk:

- Players bounce between Factory, Business, and Stats-like utilities for related tasks.

Mitigation:

- Move all product operations to Production.
- Move all long-term systems to HQ.
- Add deep-link CTAs from alerts and cards so the player lands in the right section immediately.

### Too Much Scrolling

Risk:

- Business and Factory become long vertical stacks that bury important actions.

Mitigation:

- Give each screen one main job.
- Use clear top summaries and then 3-5 major blocks only.
- Split inspect actions into segmented subsections instead of one giant sheet.

### Small Targets

Risk:

- 6x6 grid cells, product sell chips, and thin text buttons become hard to tap.

Mitigation:

- Increase minimum touch area on tiles and row CTAs.
- Replace tiny chip-only selling with full-width product rows on Production.
- Reduce decorative clutter on late-game tiles.

### Hidden Actions

Risk:

- Important systems such as automation or hidden-event rewards become buried behind icons or unrelated sheets.

Mitigation:

- Give Production a permanent automation section.
- Use one global Event Inbox.
- Keep dangerous and advanced actions labeled in plain text instead of icon-only controls.

## Recommended Implementation Order

1. Replace the current 4-tab structure with the 5-screen map: Factory, Production, Staff, Business, HQ.
2. Move product selling, storage, feedstock, electricity, and automation off Factory into Production.
3. Move research, achievements, awards, save tools, and settings access into HQ.
4. Refactor the Factory building-info sheet into segmented sections.
5. Add a global Event Inbox to unify hidden-event discovery and reward claiming.
