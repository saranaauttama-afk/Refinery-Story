import type { V3GuidanceStep } from '../../game/v3/campaign'
import type { BilingualTextValue } from '../../game/types'
import type { V3ActionEvent } from '../../game/v3/types'

/** Player-facing text for every V3 action/blocker event (moved out of app/index.tsx). */
export function eventText(message: V3ActionEvent | null, translate: (value: BilingualTextValue) => string): string {
  if (!message) return translate({ en: 'Ready', th: 'พร้อม' })
  const p = message.params
  switch (message.messageId) {
    case 'v3.action.ok': return translate({ en: 'Action committed and saved.', th: 'ทำรายการและบันทึกแล้ว' })
    case 'v3.action.sequence_mismatch': return translate({ en: `Duplicate/stale action blocked (expected ${p?.expected}).`, th: `บล็อกรายการซ้ำ/เก่า (ลำดับที่รอ ${p?.expected})` })
    case 'v3.build.occupied': return translate({ en: 'That cell is occupied.', th: 'ช่องนั้นมีอาคารอยู่แล้ว' })
    case 'v3.build.locked': return translate({ en: `Unlocks in campaign chapter C${p?.chapter}.`, th: `ปลดล็อกในแคมเปญบท C${p?.chapter}` })
    case 'v3.build.insufficient_cash': return translate({ en: `Need $${Number(p?.costCents ?? 0) / 100}.`, th: `ต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.upgrade.insufficient_cash': return translate({ en: `Upgrade needs $${Number(p?.costCents ?? 0) / 100}.`, th: `อัปเกรดต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.upgrade.locked': return translate({ en: `Upgrade unlocks in C${p?.chapter}.`, th: `อัปเกรดปลดล็อกในบท C${p?.chapter}` })
    case 'v3.trade.insufficient_cash': return translate({ en: 'Not enough cash to buy crude.', th: 'เงินไม่พอซื้อน้ำมันดิบ' })
    case 'v3.trade.storage_full': return translate({ en: 'Crude storage is full.', th: 'ถังน้ำมันดิบเต็ม' })
    case 'v3.trade.insufficient_stock': return translate({ en: 'Not enough unreserved stock.', th: 'สต็อกที่ไม่ถูกจองมีไม่พอ' })
    case 'v3.trade.inventory_pending': return translate({ en: 'Trade settlement activates in V3-04; no stock was changed.', th: 'ระบบซื้อขายจะเปิดใน V3-04 และยังไม่มีสต็อกถูกเปลี่ยน' })
    case 'v3.duty.resume_unaffordable': return translate({ en: 'Cash cannot cover the next wage cycle.', th: 'เงินยังไม่พอจ่ายค่าจ้างรอบถัดไป' })
    case 'v3.development.chapter_locked': return translate({ en: 'Product development unlocks in C1.', th: 'ระบบพัฒนาสินค้าปลดล็อกในบท C1' })
    case 'v3.development.invalid_lab': return translate({ en: 'Build and select a Laboratory first.', th: 'ต้องสร้างและเลือก Laboratory ก่อน' })
    case 'v3.development.insufficient_cash': return translate({ en: 'Not enough cash for the development fee.', th: 'เงินไม่พอจ่ายค่าพัฒนา' })
    case 'v3.development.insufficient_samples': return translate({ en: 'Need 10 unreserved samples of this product.', th: 'ต้องมีสินค้านี้ที่ไม่ถูกจอง 10 หน่วย' })
    case 'v3.development.invalid_config': return translate({ en: 'This family or module is not available yet.', th: 'สินค้าหรือโมดูลนี้ยังใช้ไม่ได้' })
    case 'v3.development.knowledge_locked': return translate({ en: 'Needs Lab Lv2 + Premium Fuel research for rank 1.', th: 'ต้องมี Lab Lv2 + วิจัย Premium Fuel สำหรับ rank 1' })
    case 'v3.development.invalid_lead': return translate({ en: 'This lead is unavailable.', th: 'หัวหน้าทดลองคนนี้ไม่ว่าง' })
    case 'v3.build.unsupported': return translate({ en: 'This building has no V3 system yet.', th: 'อาคารนี้ยังไม่มีระบบใน V3' })
    case 'v3.build.invalid_cell': return translate({ en: 'No empty slot. Expand the yard or remove a building.', th: 'ไม่มีช่องว่าง ขยายพื้นที่หรือรื้ออาคารก่อน' })
    case 'v3.upgrade.max_level': return translate({ en: 'Already at the highest level.', th: 'ถึงเลเวลสูงสุดแล้ว' })
    case 'v3.upgrade.unsupported': return translate({ en: 'This building cannot be upgraded here.', th: 'อาคารนี้อัปเกรดไม่ได้' })
    case 'v3.place.out_of_bounds': return translate({ en: 'Outside the refinery yard.', th: 'อยู่นอกพื้นที่โรงงาน' })
    case 'v3.place.locked_land': return translate({ en: 'Part of this footprint is on land you have not unlocked.', th: 'บางส่วนของพื้นที่อาคารอยู่บนที่ดินที่ยังไม่ปลด' })
    case 'v3.place.overlap': return translate({ en: 'Something is in the way (move it or pick another spot).', th: 'มีอาคารหรือของแต่งขวางอยู่ (ย้ายออกหรือเลือกที่ใหม่)' })
    case 'v3.place.no_footprint': return translate({ en: 'This building has no yard footprint.', th: 'อาคารนี้ไม่มีขนาดพื้นที่' })
    case 'v3.place.building_limit': return translate({ en: `Limit reached for this building (${p?.limit}) in this chapter.`, th: `อาคารนี้สร้างได้ครบ ${p?.limit} หลังแล้วในบทนี้` })
    case 'v3.building.missing': return translate({ en: 'That building no longer exists.', th: 'ไม่มีอาคารนี้แล้ว' })
    case 'v3.inbox.missing': return translate({ en: 'That message is gone.', th: 'ไม่พบข้อความนี้แล้ว' })
    case 'v3.inbox.resolved': return translate({ en: 'Already answered.', th: 'ตอบไปแล้ว' })
    case 'v3.land.unknown': return translate({ en: 'Unknown land parcel.', th: 'ไม่พบแปลงที่ดินนี้' })
    case 'v3.decor.locked': return translate({ en: `This decoration unlocks in C${p?.chapter}.`, th: `ของแต่งนี้ปลดล็อกในบท C${p?.chapter}` })
    case 'v3.decor.expo_required': return translate({ en: 'Win the annual Expo to unlock this.', th: 'ต้องชนะงานเอ็กซ์โปก่อนจึงจะปลดล็อก' })
    case 'v3.decor.cap': return translate({ en: `Decoration limit reached (${p?.cap}). Remove one to place more.`, th: `ของแต่งเต็มแล้ว (${p?.cap} ชิ้น) เก็บคืนบางชิ้นก่อน` })
    case 'v3.decor.missing': return translate({ en: 'That decoration is no longer there.', th: 'ไม่พบของแต่งชิ้นนี้แล้ว' })
    case 'v3.decor.unknown': return translate({ en: 'Unknown decoration.', th: 'ไม่รู้จักของแต่งชิ้นนี้' })
    case 'v3.land.owned': return translate({ en: 'This land is already yours.', th: 'ที่ดินนี้ปลดแล้ว' })
    case 'v3.land.locked': return translate({ en: `This land opens in C${p?.chapter}.`, th: `ที่ดินแปลงนี้เปิดในบท C${p?.chapter}` })
    case 'v3.land.requires_parcel': return translate({ en: `Unlock ${p?.parcel} first.`, th: `ต้องปลดแปลง ${p?.parcel} ก่อน` })
    case 'v3.land.insufficient_cash': return translate({ en: `This land costs $${Number(p?.costCents ?? 0) / 100}.`, th: `ที่ดินแปลงนี้ราคา $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.module.invalid_cell': return translate({ en: 'Modules fit owned production lines only.', th: 'ติดโมดูลได้เฉพาะไลน์ผลิตของเรา' })
    case 'v3.module.locked': return translate({ en: `Modules unlock in C${p?.chapter}.`, th: `โมดูลปลดล็อกในบท C${p?.chapter}` })
    case 'v3.module.plant_level': return translate({ en: `Upgrade this plant to Lv${p?.level} first.`, th: `ต้องอัปเกรดโรงงานเป็น Lv${p?.level} ก่อน` })
    case 'v3.module.no_change': return translate({ en: 'This module is already installed.', th: 'ติดตั้งโมดูลนี้อยู่แล้ว' })
    case 'v3.module.insufficient_cash': return translate({ en: `Module needs $${Number(p?.costCents ?? 0) / 100}.`, th: `โมดูลต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.hire.locked': return translate({ en: `Hiring this role unlocks in C${p?.chapter}.`, th: `จ้างตำแหน่งนี้ได้ในบท C${p?.chapter}` })
    case 'v3.hire.unsupported': return translate({ en: 'This role has no working V3 duty yet.', th: 'ตำแหน่งนี้ยังไม่มีหน้าที่ใน V3' })
    case 'v3.hire.staff_cap': return translate({ en: `Team is at the ${p?.cap}-person cap for this chapter.`, th: `ทีมเต็ม ${p?.cap} คนสำหรับบทนี้แล้ว` })
    case 'v3.hire.insufficient_cash': return translate({ en: `Hiring needs $${Number(p?.costCents ?? 0) / 100}.`, th: `จ้างต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.train.employee_missing': return translate({ en: 'Employee not found.', th: 'ไม่พบพนักงาน' })
    case 'v3.train.max_level': return translate({ en: 'Already at max level.', th: 'เลเวลสูงสุดแล้ว' })
    case 'v3.train.insufficient_cash': return translate({ en: `Training needs $${Number(p?.costCents ?? 0) / 100}.`, th: `ฝึกต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.train.insufficient_rp': return translate({ en: `Training needs ${p?.rp} RP.`, th: `ฝึกต้องใช้ ${p?.rp} RP` })
    case 'v3.build.requires_route': return translate({ en: 'Build a Petrochemical Plant first (Polymer uses Petro).', th: 'ต้องสร้าง Petrochemical Plant ก่อน (Polymer ใช้ Petro)' })
    case 'v3.job.invalid_branch': return translate({ en: 'Choose Petro or Pellets for this Materials job.', th: 'เลือก Petro หรือ Pellets สำหรับงาน Materials นี้' })
    case 'v3.career.employee_missing': return translate({ en: 'Employee not found.', th: 'ไม่พบพนักงาน' })
    case 'v3.career.max_rank': return translate({ en: 'Already at the top career rank.', th: 'ตำแหน่งสูงสุดแล้ว' })
    case 'v3.career.level_required': return translate({ en: `Reach Lv${p?.level} before promotion.`, th: `ต้องถึง Lv${p?.level} ก่อนเลื่อนตำแหน่ง` })
    case 'v3.career.insufficient_cash': return translate({ en: `Promotion needs $${Number(p?.costCents ?? 0) / 100}.`, th: `เลื่อนตำแหน่งต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.career.insufficient_rp': return translate({ en: `Promotion needs ${p?.rp} RP.`, th: `เลื่อนตำแหน่งต้องใช้ ${p?.rp} RP` })
    case 'v3.candidate.unavailable': return translate({ en: 'This candidate is no longer available.', th: 'ผู้สมัครคนนี้ไม่อยู่แล้ว' })
    case 'v3.expo.not_expo_month': return translate({ en: `The Expo only runs in month ${p?.month}.`, th: `งานแสดงจัดเฉพาะเดือน ${p?.month}` })
    case 'v3.expo.fame_locked': return translate({ en: `Needs company fame Lv${p?.level}.`, th: `ต้องมีชื่อเสียงบริษัท Lv${p?.level}` })
    case 'v3.expo.already_entered': return translate({ en: 'You already entered this year.', th: 'ปีนี้ส่งเข้าประกวดแล้ว' })
    case 'v3.expo.invalid_recipe': return translate({ en: 'Only recipes you developed can enter.', th: 'ส่งได้เฉพาะสูตรที่พัฒนาเอง' })
    case 'v3.expo.insufficient_samples': return translate({ en: `Needs ${p?.quantity} free units of this recipe.`, th: `ต้องมีสินค้าสูตรนี้ว่างอยู่ ${p?.quantity} หน่วย` })
    case 'v3.program.invalid_blueprint': return translate({ en: 'Recipe not found.', th: 'ไม่พบสูตรนี้' })
    case 'v3.program.wrong_family': return translate({ en: 'This recipe is for a different product line.', th: 'สูตรนี้เป็นของสินค้าอีกสาย ใช้กับไลน์นี้ไม่ได้' })
    case 'v3.program.plant_level': return translate({ en: `Needs this plant at Lv${p?.need} (now Lv${p?.have}). Upgrade it from the map or Build tab.`, th: `ต้องอัปเกรดโรงงานนี้เป็น Lv${p?.need} ก่อน (ตอนนี้ Lv${p?.have}) กดที่ตึกบนแผนที่เพื่ออัปเกรด` })
    case 'v3.program.module_mismatch': return translate({ en: `Needs the ${({ none: 'no module', throughput: 'Throughput', economy: 'Economy', precision: 'Precision' } as Record<string, string>)[String(p?.need)]} module on this line (installed: ${({ none: 'no module', throughput: 'Throughput', economy: 'Economy', precision: 'Precision' } as Record<string, string>)[String(p?.installed)]}). Fit it in the line card below.`, th: `ต้องติดตั้งโมดูล ${({ none: 'ไม่มีโมดูล', throughput: 'Throughput', economy: 'Economy', precision: 'Precision' } as Record<string, string>)[String(p?.need)]} ที่ไลน์นี้ (ตอนนี้: ${({ none: 'ไม่มีโมดูล', throughput: 'Throughput', economy: 'Economy', precision: 'Precision' } as Record<string, string>)[String(p?.installed)]}) ติดตั้งได้ที่การ์ดไลน์ผลิตด้านล่าง` })
    case 'v3.program.loaner_default_only': return translate({ en: 'A loaned unit only runs the Standard recipe.', th: 'เครื่องยืมใช้ได้เฉพาะสูตร Standard' })
    case 'v3.job.requires_previous': return translate({ en: 'Complete this client’s previous stage first.', th: 'ต้องทำขั้นก่อนหน้าของลูกค้ารายนี้ให้เสร็จก่อน' })
    case 'v3.job.rush_unavailable': return translate({ en: 'No qualifying running line to size a Rush.', th: 'ยังไม่มีไลน์ที่ผลิตคุณภาพถึงสำหรับงานด่วน' })
    case 'v3.job.auto_repeat_locked': return translate({ en: `Auto-repeat opens in C${p?.chapter}.`, th: `ทำซ้ำอัตโนมัติเปิดในบท C${p?.chapter}` })
    case 'v3.job.auto_repeat_invalid': return translate({ en: 'Only a proven repeat job can auto-repeat.', th: 'ทำซ้ำอัตโนมัติได้เฉพาะงานซ้ำที่เคยทำสำเร็จแล้ว' })
    case 'v3.maintenance.not_in_emergency': return translate({ en: 'The factory is operating normally.', th: 'โรงงานทำงานปกติอยู่แล้ว' })
    case 'v3.maintenance.unaffordable': return translate({ en: `Needs $${Number(p?.costCents ?? 0) / 100} (one minute of maintenance).`, th: `ต้องมี $${Number(p?.costCents ?? 0) / 100} (ค่าบำรุง 1 นาที)` })
    case 'v3.specialization.locked': return translate({ en: `Specialization opens in C${p?.chapter}.`, th: `เลือกแนวทางได้ในบท C${p?.chapter}` })
    case 'v3.specialization.chosen': return translate({ en: 'Specialization is already chosen.', th: 'เลือกแนวทางไปแล้ว' })
    case 'v3.duty.ineligible': return translate({ en: 'This role cannot take that duty.', th: 'ตำแหน่งนี้รับหน้าที่นั้นไม่ได้' })
    case 'v3.duty.occupied': return translate({ en: 'That duty is occupied (or the person is leading R&D).', th: 'หน้าที่นี้มีคนอยู่ (หรือพนักงานกำลังนำ R&D)' })
    case 'v3.duty.invalid_target': return translate({ en: 'That line is not available.', th: 'ไลน์นี้ใช้ไม่ได้' })
    case 'v3.research.unsupported': return translate({ en: 'This research has no V3 effect yet.', th: 'งานวิจัยนี้ยังไม่มีผลใน V3' })
    case 'v3.research.owned': return translate({ en: 'Already researched.', th: 'วิจัยแล้ว' })
    case 'v3.research.locked': return translate({ en: `Research unlocks in C${p?.chapter}.`, th: `วิจัยได้ในบท C${p?.chapter}` })
    case 'v3.research.prerequisite': return translate({ en: `Research ${p?.research} first.`, th: `ต้องวิจัย ${p?.research} ก่อน` })
    case 'v3.research.lab_level': return translate({ en: `Needs a Laboratory Lv${p?.level}.`, th: `ต้องมี Laboratory Lv${p?.level}` })
    case 'v3.research.insufficient_rp': return translate({ en: `Needs ${p?.rp} RP.`, th: `ต้องใช้ ${p?.rp} RP` })
    case 'v3.job.template_missing': return translate({ en: 'Offer unavailable.', th: 'ไม่มีงานนี้' })
    case 'v3.development.duplicate_signature': return translate({ en: 'This configuration is already certified.', th: 'สูตรรูปแบบนี้ได้รับการรับรองแล้ว' })
    case 'v3.development.project_active': return translate({ en: 'Finish or cancel the active project first.', th: 'ต้องจบหรือยกเลิกโครงการปัจจุบันก่อน' })
    case 'v3.job.slot_occupied': return translate({ en: 'Finish or cancel the current job first.', th: 'ต้องส่งหรือยกเลิกงานปัจจุบันก่อน' })
    case 'v3.job.locked': return translate({ en: 'This offer is locked or already completed.', th: 'งานนี้ยังล็อกหรือทำสำเร็จแล้ว' })
    case 'v3.job.cooldown': return translate({ en: 'This customer is still in cooldown.', th: 'ลูกค้ารายนี้ยังอยู่ในช่วงพักงาน' })
    case 'v3.job.insufficient_qualified_stock': return translate({ en: 'Not enough qualified reserved stock.', th: 'สินค้าที่ผ่านสเปกและจองไว้มีไม่พอ' })
    case 'v3.recovery.not_available': return translate({ en: 'Recovery is not needed or saleable stock can cover the deficit.', th: 'ยังไม่เข้าเงื่อนไขกู้เกม หรือมีสต็อกขายชดเชยได้' })
    case 'v3.recovery.already_running': return translate({ en: 'A recovery job is already running.', th: 'งานกู้สถานการณ์กำลังทำอยู่' })
    case 'v3.recovery.clear_slots': return translate({ en: `Clear ${p?.slots} factory slot(s) first.`, th: `ต้องเคลียร์ช่องโรงงานอีก ${p?.slots} ช่องก่อน` })
    case 'v3.recovery.no_missing_route': return translate({ en: 'The starter route is already complete.', th: 'เส้นการผลิตเริ่มต้นยังอยู่ครบ' })
    case 'v3.demolish.stock_overflow': return translate({ en: 'Move or sell stock before removing this tank.', th: 'ต้องย้ายหรือขายสต็อกก่อนรื้อถังนี้' })
    case 'v3.demolish.building_changed': return translate({ en: 'The building changed; reopen its confirmation.', th: 'อาคารเปลี่ยนแล้ว กรุณาเปิดยืนยันใหม่' })
    case 'v3.demolish.active_project': return translate({ en: 'Finish or cancel the active lab project first.', th: 'ต้องจบหรือยกเลิกงานทดลองใน Lab ก่อน' })
    default: return message.messageId
  }
}

export function guidanceText(step: V3GuidanceStep, translate: (value: BilingualTextValue) => string): string {
  const copy: Record<V3GuidanceStep, BilingualTextValue> = {
    produce_tutorial_stock: { en: 'Produce 20 Standard Gasoline for the first customer.', th: 'ผลิต Standard Gasoline 20 หน่วยให้ลูกค้ารายแรก' },
    accept_tutorial: { en: 'Accept the Tutorial Gasoline order.', th: 'รับงานแนะนำ Gasoline' },
    ship_tutorial: { en: 'Ship the reserved Gasoline to reach C1.', th: 'ส่ง Gasoline ที่จองไว้เพื่อเข้าสู่ C1' },
    build_laboratory: { en: 'Build Laboratory Lv1 in an empty slot.', th: 'สร้าง Laboratory Lv1 ในช่องว่าง' },
    prepare_development: { en: 'Keep 10 Gasoline and $50, then develop a new recipe.', th: 'เตรียม Gasoline 10 หน่วยกับ $50 แล้วพัฒนาสูตรใหม่' },
    run_development: { en: 'Advance the factory while the lab certifies the recipe.', th: 'เดินเวลาโรงงานระหว่าง Lab รับรองสูตร' },
    select_developed_blueprint: { en: 'Install the developed recipe on Distillation.', th: 'เลือกสูตรที่พัฒนาเองให้ Distillation' },
    produce_developed_stock: { en: 'Produce 40 units of your developed Gasoline.', th: 'ผลิต Gasoline สูตรของเราให้ครบ 40 หน่วย' },
    accept_qualifying_job: { en: 'Accept Local Trial and reserve the developed stock.', th: 'รับงาน Local Trial เพื่อจองสต็อกสูตรที่พัฒนาเอง' },
    ship_developed_product: { en: 'Ship 40 developed units to reach C2.', th: 'ส่งสูตรที่พัฒนาเอง 40 หน่วยเพื่อเข้าสู่ C2' },
    chapter_two: { en: 'C2: choose Lube, a Power Plant, modules (plant Lv2) or Lab Lv2 research. C3 needs two clients at Regular + one processing/tank/power upgrade.', th: 'C2: เลือกลงทุน Lube, โรงไฟฟ้า, โมดูล (โรงงาน Lv2) หรือวิจัย Lab Lv2 · ขึ้น C3 ต้องมีลูกค้า 2 รายถึง Regular + อัปเกรดโรงผลิต/ถัง/ไฟ 1 ครั้ง' },
    chapter_three: { en: 'C3: Jet and Airline open; Rush and auto-repeat available. C4 needs one Partner + a certified recipe Q65+.', th: 'C3: เปิด Jet และ Airline มีงานด่วนและทำซ้ำอัตโนมัติ · ขึ้น C4 ต้องมีลูกค้า Partner 1 ราย + สูตรที่รับรอง Q65 ขึ้นไป' },
    chapter_four: { en: 'C4: Petro, Polymer and Materials are open. Clear = 3 Partners (incl. Airline or Materials) + a Showcase + positive 180s profit + #1 industry ranking + an Expo win.', th: 'C4: เปิด Petro, Polymer และ Materials · จบเกม = Partner 3 ราย (มี Airline หรือ Materials) + Showcase + กำไร 180 วินาทีเป็นบวก + อันดับ 1 อุตสาหกรรม + ชนะงานแสดง 1 ครั้ง' },
    cleared: { en: 'Campaign cleared! Freeplay: challenges, awards and the optional 6×6 yard.', th: 'จบแคมเปญแล้ว! เล่นต่อได้: ภารกิจเสริม รางวัลประจำรอบ และขยาย 6×6' },
  }
  return translate(copy[step])
}

