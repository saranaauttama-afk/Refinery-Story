# Refinery Story — Game Roadmap

Last updated: 2026-06-24  
Branch base: `devMobile` → `cleanup/dead-code-and-deps` → `feature/restore-hidden-routes` → `feature/diamond-shell-camera`

---

## สถานะปัจจุบัน (Done)

### Infrastructure
- [x] Expo / React Native project structure
- [x] GameContext + useGameLoop (tick-based simulation)
- [x] AsyncStorage save/load with sanitizer
- [x] TypeScript strict — circular dep แก้แล้ว (`employeeUtils.ts`)
- [x] Dead code cleanup (renderers, boost vars, buildingIcons)

### Core Loop
- [x] Crude → Gasoline production chain
- [x] Feedstock layer (Distillation Unit → downstream plants)
- [x] 5 secondary products: Asphalt, Lubricants, Jet Fuel, Petrochemicals, (Recycled/Pellets defined แต่ยังไม่ active)
- [x] Auto-trade ครบ 5 products
- [x] Contracts (37 contracts across all product lines)
- [x] Standing Orders (4 repeatable orders)
- [x] Grid Expansion (3×3 → 6×6)
- [x] Hidden combo system (5 combos)
- [x] Choice events + Random events

### Progression
- [x] Refinery levels + perk tree (3 branches × 3 tiers)
- [x] Tech eras (Foundation → Expansion → Modern → Energy Transition)
- [x] Research (10 items)
- [x] Milestones (16)
- [x] Annual Awards + rival ranking
- [x] ESG / Safety axis
- [x] Individual staff (hire, train, veteran trait, specialist assignment)
- [x] Seasonal gasoline demand

### UI / Navigation
- [x] 5-tab navigation: Factory, Production, Staff, Business, HQ
- [x] HQ ครอบทุกอย่างที่เคยซ่อนใน Stats (expansion, activity log, ESG, settings, store)
- [x] Production มี Asphalt production section
- [x] Stats tab ถูกเอาออกจาก tab bar
- [x] Diamond Ground isometric renderer (11×11 shell, flat-top)
- [x] Pan camera บน diamond shell (GestureDetector + Reanimated)
- [x] Floating HUD (resource bar, goal chip, trade pill)
- [x] Bottom sheets (Build, Building Info, More Info, Events)

---

## Phase 1 — Gameplay Depth (เพิ่ม content ที่ยังขาด)

### 1A: Recycled Material + Plastic Pellets Chain
**Priority: สูง** — art assets พร้อมแล้ว (`recycling_bunker`, `pellet_silo`), types ใน codebase มีแล้ว

- [ ] `recyclingBunker` → ผลิต `recycledMaterial` จาก waste byproduct
- [ ] `pelletSilo` → ผลิต `plasticPellets` จาก `recycledMaterial`
- [ ] Contracts สำหรับทั้ง 2 products (2–3 contracts each)
- [ ] Standing Order สำหรับ plasticPellets
- [ ] Production tab แสดง inventory + sell button
- [ ] Unlock levels: recyclingBunker Lv12, pelletSilo Lv16 (หลัง petrochemical)
- [ ] Balance: feedstock หรือใช้ waste เป็น input?

### 1B: Staff Hiring Cap + Retirement
**Priority: สูง** — ตอนนี้จ้างได้ไม่จำกัด ทำให้ late game ไม่มี tension

- [ ] กำหนด max headcount per type (เช่น max 5 per type หรือ total 20)
- [ ] Retirement mechanic: พนักงานสูงอายุ retire หลัง N ปี (ออก event ให้รู้ล่วงหน้า)
- [ ] Recruitment pool refresh เมื่อมีตำแหน่งว่าง
- [ ] ต้องตัดสินใจ: replace กับคนใหม่ Lv1 หรือพยายาม retain ด้วยเงิน?

### 1C: Contracts Panel UX
**Priority: กลาง** — panel ยาวมาก ที่ level สูงๆ

- [ ] Collapse completed contract tiers (กดเปิด/ปิดได้)
- [ ] Filter: All / Active / Completed
- [ ] Badge count บน Business tab เมื่อมี contract ที่ fulfill ได้แล้ว

---

## Phase 2 — Visual & Feel

### 2A: Building Visual Identity (Diamond Ground)
**Priority: กลาง** — ตอนนี้ buildings ที่ไม่มี plant art ใช้แค่ shortcode

- [ ] ทุก building มี art หรือ icon ที่อ่านได้ชัดบน diamond tile
- [ ] Level badge แสดงชัดขึ้นบน plant image tiles
- [ ] Status badge (IDLE, FULL, FEED, PWR) อ่านได้บน mobile size

### 2B: Factory Atmosphere
**Priority: ต่ำ** — ขึ้นอยู่กับ art direction

- [ ] Road / pipe layer บน diamond ground
- [ ] Smoke particle บน active buildings
- [ ] Day/night cycle ที่มีผลกับ scene จริง (ไม่ใช่แค่ tint)

### 2C: Sound & Haptics Pass
**Priority: ต่ำ**

- [ ] Production tick sound
- [ ] Contract fulfill sound
- [ ] Level up fanfare
- [ ] Haptic feedback ครบทุก action สำคัญ

---

## Phase 3 — Meta & Retention

### 3A: Award History Screen
**Priority: กลาง** — ข้อมูลมีแล้วใน `game.awardHistory` แค่ต้องทำ UI

- [ ] HQ tab มี section "Award History" แสดง 12 years ล่าสุด
- [ ] แต่ละ year แสดง: grade, score, rank, payroll, net profit
- [ ] Chart แสดง score trend

### 3B: Save Export / Import
**Priority: กลาง** — ป้องกัน data loss เมื่อ reinstall

- [ ] Export save เป็น JSON file (share sheet)
- [ ] Import จาก file picker
- [ ] Validate + migrate format ก่อน import

### 3C: Onboarding / First-Run Guide
**Priority: กลาง** — มือใหม่ไม่รู้ต้องทำอะไร

- [ ] First-run overlay แนะนำ 3 steps แรก
- [ ] Highlight ปุ่มที่ต้องกดครั้งแรก
- [ ] ปิดได้ ไม่รบกวนผู้เล่นเก่า

---

## Phase 4 — Kairosoft Feel (Long-term)

- [ ] Workers เดินใน factory scene
- [ ] Trucks เคลื่อนที่เมื่อ shipment มาถึง
- [ ] Production feedback animation บน tiles (spark, pulse)
- [ ] Rival refinery cameo ใน award ceremony (แสดงชื่อ + building count)

---

## Deferred / Needs Design Discussion

| หัวข้อ | เหตุผลที่ defer |
|---|---|
| Multi-cut process chain (naphtha/distillate/residue) | complexity สูงเกินสำหรับ Kairosoft style |
| Per-plant module picker | ต้องออกแบบ UX ใหม่ทั้งหมด |
| Mixed-product contracts | ต้องแก้ completion logic |
| Multiplayer / leaderboard | out of scope สำหรับ solo dev |
| Web version | focus mobile ก่อน |

---

## Branch Convention

```
feature/<system>-<description>   เช่น feature/recycled-material-chain
fix/<what>                        เช่น fix/contracts-panel-overflow
cleanup/<what>                    เช่น cleanup/dead-code-and-deps
```

Branch ใหม่ทุกอันแตกจาก branch ล่าสุดที่ clean + typecheck pass

---

## Rules (ไม่เปลี่ยนโดยไม่มีเหตุผลชัดเจน)

1. `npx tsc --noEmit` ต้อง pass ก่อน commit ทุกครั้ง
2. ไม่เปลี่ยน save format โดยไม่มี migration ใน `sanitizeLoadedGameState`
3. ไม่เพิ่ม renderer ใหม่โดยไม่ตัดของเก่าออกก่อน
4. Balance constants อยู่ใน `balance.ts` เท่านั้น ห้าม hardcode ใน component
5. Art assets ใหม่ต้องมี lv1/lv2/lv3 ครบก่อน implement
