import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BUILDINGS } from '../src/game/data/buildings'
import { reduceV3Action, validateV3Demolish } from '../src/game/v3/actions'
import { getV3GuidanceStep, type V3GuidanceStep } from '../src/game/v3/campaign'
import { V3_BUILDINGS } from '../src/game/v3/data'
import { V3_INITIAL_PAUSE_STATE, acquireV3Pause, getV3EffectiveSpeed, releaseV3Pause, setV3Backgrounded } from '../src/game/v3/pause'
import { getV3CrudeCapacity, getV3ProductCapacity, getV3ProductQuantity, getV3StockAllocations } from '../src/game/v3/productInventory'
import { evaluateV3GasolineProduction, runV3ProductionTick } from '../src/game/v3/production'
import { getV3RecoveryOffer, isV3LoanerBuilding } from '../src/game/v3/recovery'
import { createInitialV3GameState, V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import {
  clearV3GameState,
  loadV3GameState,
  saveV3GameState,
  type V3LoadResult,
} from '../src/game/v3/storage'
import type { BilingualTextValue } from '../src/game/types'
import type { V3ActionEvent, V3GameState } from '../src/game/v3/types'
import { V3MidgamePanels } from '../src/components/v3/V3MidgamePanels'
import { V3TeamPanel } from '../src/components/v3/V3TeamPanel'
import { findV3PlacementSpot, getV3BuildingType, listV3Buildings } from '../src/game/v3/yard'
import { V3CampaignPanel } from '../src/components/v3/V3CampaignPanel'
import { V3YardPanel } from '../src/components/v3/V3YardPanel'
import { useLang } from '../src/hooks/SettingsContext'
import { colors, fonts, spacing } from '../src/theme'

function eventText(message: V3ActionEvent | null, translate: (value: BilingualTextValue) => string): string {
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
    case 'v3.place.overlap': return translate({ en: 'Another building is in the way (move it or pick another spot).', th: 'มีอาคารอื่นขวางอยู่ (ย้ายอาคารหรือเลือกที่ใหม่)' })
    case 'v3.place.no_footprint': return translate({ en: 'This building has no yard footprint.', th: 'อาคารนี้ไม่มีขนาดพื้นที่' })
    case 'v3.place.building_limit': return translate({ en: `Limit reached for this building (${p?.limit}) in this chapter.`, th: `อาคารนี้สร้างได้ครบ ${p?.limit} หลังแล้วในบทนี้` })
    case 'v3.building.missing': return translate({ en: 'That building no longer exists.', th: 'ไม่มีอาคารนี้แล้ว' })
    case 'v3.land.unknown': return translate({ en: 'Unknown land parcel.', th: 'ไม่พบแปลงที่ดินนี้' })
    case 'v3.land.owned': return translate({ en: 'This land is already yours.', th: 'ที่ดินนี้ปลดแล้ว' })
    case 'v3.land.locked': return translate({ en: `This land opens in C${p?.chapter}.`, th: `ที่ดินแปลงนี้เปิดในบท C${p?.chapter}` })
    case 'v3.land.requires_parcel': return translate({ en: `Unlock ${p?.parcel} first.`, th: `ต้องปลดแปลง ${p?.parcel} ก่อน` })
    case 'v3.land.insufficient_cash': return translate({ en: `This land costs $${Number(p?.costCents ?? 0) / 100}.`, th: `ที่ดินแปลงนี้ราคา $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.module.invalid_cell': return translate({ en: 'Modules fit owned production lines only.', th: 'ติดโมดูลได้เฉพาะไลน์ผลิตของเรา' })
    case 'v3.module.locked': return translate({ en: `Modules unlock in C${p?.chapter}.`, th: `โมดูลปลดล็อกในบท C${p?.chapter}` })
    case 'v3.module.plant_level': return translate({ en: `Upgrade this plant to Lv${p?.level} first.`, th: `ต้องอัปเกรดโรงงานเป็น Lv${p?.level} ก่อน` })
    case 'v3.module.no_change': return translate({ en: 'This module is already installed.', th: 'ติดตั้งโมดูลนี้อยู่แล้ว' })
    case 'v3.module.insufficient_cash': return translate({ en: `Module needs $${Number(p?.costCents ?? 0) / 100}.`, th: `โมดูลต้องใช้ $${Number(p?.costCents ?? 0) / 100}` })
    case 'v3.program.module_mismatch': return translate({ en: 'Recipe needs a different installed module.', th: 'สูตรนี้ต้องใช้โมดูลอื่น' })
    case 'v3.program.invalid_blueprint': return translate({ en: 'Recipe does not fit this plant or its level.', th: 'สูตรนี้ไม่ตรงกับโรงงานหรือเลเวล' })
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

function guidanceText(step: V3GuidanceStep, translate: (value: BilingualTextValue) => string): string {
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
    chapter_four: { en: 'C4: Petro, Polymer and Materials are open. Clear = 3 Partners (incl. Airline or Materials) + a Showcase + positive 180s profit.', th: 'C4: เปิด Petro, Polymer และ Materials · จบเกม = Partner 3 ราย (มี Airline หรือ Materials) + Showcase + กำไร 180 วินาทีเป็นบวก' },
    cleared: { en: 'Campaign cleared! Freeplay: challenges, awards and the optional 6×6 yard.', th: 'จบแคมเปญแล้ว! เล่นต่อได้: ภารกิจเสริม รางวัลประจำรอบ และขยาย 6×6' },
  }
  return translate(copy[step])
}

export default function V3PreviewScreen() {
  const router = useRouter()
  const { t } = useLang()
  const [loadResult, setLoadResult] = useState<V3LoadResult | null>(null)
  const [state, setState] = useState<V3GameState | null>(null)
  const [lastEvent, setLastEvent] = useState<V3ActionEvent | null>(null)
  const [pauseState, setPauseState] = useState(V3_INITIAL_PAUSE_STATE)

  useEffect(() => {
    loadV3GameState().then(async (result) => {
      setLoadResult(result)
      if (result.state) {
        setState(result.state)
        if (result.status === 'new') await saveV3GameState(result.state)
      }
    })
  }, [])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      setPauseState((current) => setV3Backgrounded(current, status !== 'active'))
    })
    return () => subscription.remove()
  }, [])

  const apply = async (action: Parameters<typeof reduceV3Action>[1]) => {
    if (!state) return
    const result = reduceV3Action(state, action)
    setLastEvent(result.events[0] ?? null)
    if (result.changed) {
      setState(result.state)
      await saveV3GameState(result.state)
    }
  }

  const startFresh = async () => {
    const fresh = createInitialV3GameState()
    await clearV3GameState()
    await saveV3GameState(fresh)
    setState(fresh)
    setLoadResult({ status: 'new', state: fresh, reason: null })
    setLastEvent(null)
  }

  const runCycle = async () => {
    if (!state || getV3EffectiveSpeed(pauseState) === 0) return
    const result = runV3ProductionTick(state, 25)
    setState(result.state)
    await saveV3GameState(result.state)
  }

  const confirmDemolish = (buildingId: string) => {
    if (!state) return
    const building = getV3BuildingType(state, buildingId)
    if (!building) return
    const blocked = validateV3Demolish(state, buildingId, building)
    if (blocked) {
      Alert.alert(t({ en: 'Cannot remove', th: 'รื้อไม่ได้' }), eventText(blocked, t))
      return
    }
    const loaner = isV3LoanerBuilding(state, buildingId)
    const refundCents = loaner ? 0 : Math.round(V3_BUILDINGS[building].buildCostDollars * 50)
    setPauseState((current) => acquireV3Pause(current, 'demolish-confirm'))
    const release = () => setPauseState((current) => releaseV3Pause(current, 'demolish-confirm'))
    Alert.alert(
      t({ en: `Remove ${building}?`, th: `รื้อ ${building}?` }),
      t({
        en: `Refund $${(refundCents / 100).toFixed(0)}. Assigned staff move to Reserve; this line's program is removed. Stock is kept (capacity was checked).`,
        th: `คืนเงิน $${(refundCents / 100).toFixed(0)} พนักงานประจำจะย้ายไปทีมสำรอง สูตรของไลน์นี้จะถูกลบ สต็อกยังอยู่ครบ (ตรวจความจุแล้ว)`,
      }),
      [
        { text: t({ en: 'Cancel', th: 'ยกเลิก' }), style: 'cancel', onPress: release },
        {
          text: t({ en: 'Remove', th: 'รื้อ' }), style: 'destructive',
          onPress: () => { release(); void apply({ type: 'demolish', sequence: state.nextActionSequence, buildingId, expectedBuilding: building }) },
        },
      ],
      { cancelable: true, onDismiss: release },
    )
  }

  if (!loadResult) {
    return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.orange} /></SafeAreaView>
  }

  if (!state) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}><Text style={styles.title}>Gameplay V3</Text></View>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t({ en: 'V3 save cannot be opened', th: 'เปิดเซฟ V3 ไม่ได้' })}</Text>
          <Text style={styles.body}>{loadResult.reason}</Text>
          <Pressable style={styles.primary} onPress={startFresh}><Text style={styles.primaryText}>{t({ en: 'Start fresh V3 save', th: 'เริ่มเซฟ V3 ใหม่' })}</Text></Pressable>
          <Pressable style={styles.secondary} onPress={() => router.back()}><Text style={styles.secondaryText}>{t({ en: 'Back', th: 'กลับ' })}</Text></Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const labSpot = findV3PlacementSpot(state, 'laboratory')
  const tankSpot = findV3PlacementSpot(state, 'gasolineTank')
  const buildings = Object.keys(state.world.buildingsById).length
  const crudeCapacity = getV3CrudeCapacity(state)
  const gasoline = getV3ProductQuantity(state, 'gasoline')
  const gasolineCapacity = getV3ProductCapacity(state, 'gasoline')
  const productionPreview = evaluateV3GasolineProduction(state, 25)
  const potentialRate = productionPreview.reduce((sum, line) => sum + line.potentialOutputPerMinute, 0)
  const actualRate = productionPreview.reduce((sum, line) => sum + line.actualOutputPerMinute, 0)
  const starterOperator = state.world.employees[0]
  const distillationBuildingId = listV3Buildings(state).find((building) => building.type === 'distillationUnit')?.id ?? null
  const activeProgram = distillationBuildingId ? state.plantPrograms[distillationBuildingId] : undefined
  const activeBlueprint = activeProgram ? state.productBlueprints[activeProgram.blueprintId] : null
  const labBuildingId = listV3Buildings(state).find((building) => building.type === 'laboratory')?.id ?? null
  const gasolineBlueprints = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.family === 'gasoline')
    .sort((a, b) => a.quality - b.quality || a.id.localeCompare(b.id))
  const activeJob = state.acceptedJob
  const gasolineAllocations = getV3StockAllocations(state, activeJob?.family ?? 'gasoline')
  const jobReserved = gasolineAllocations.reduce((sum, allocation) => sum + allocation.jobReserved, 0)
  const jobEligibleBlueprints = activeJob ? gasolineAllocations.filter((allocation) =>
    allocation.quality >= activeJob.minimumQuality && allocation.quantity - allocation.kept > 0,
  ) : []
  const jobDefaultBlueprintId = V3_DEFAULT_BLUEPRINT_ID[activeJob?.family ?? 'gasoline']
  const defaultGasPolicy = state.stockPolicies[jobDefaultBlueprintId] ?? { keepQuantity: 0, autoSell: false, autoDispatch: false }
  const guidance = getV3GuidanceStep(state)
  const recoveryOffer = getV3RecoveryOffer(state)
  const effectiveSpeed = getV3EffectiveSpeed(pauseState)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>NEW RULESET · DEVELOPMENT</Text>
          <Text style={styles.title}>Gameplay V3 Foundation</Text>
        </View>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>{t({ en: 'Back', th: 'กลับ' })}</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{t({ en: 'Fresh V3 game', th: 'เกม V3 เริ่มใหม่ทั้งหมด' })}</Text>
          <Text style={styles.body}>{t({ en: 'This save does not migrate or depend on the old game. Production runs only through the new per-cell V3 rules.', th: 'เซฟนี้ไม่ย้ายหรือพึ่งข้อมูลเกมเดิม การผลิตทำงานผ่านกฎ V3 แบบรายช่องเท่านั้น' })}</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statLabel}>Cash</Text><Text style={styles.statValue}>${(state.world.moneyCents / 100).toLocaleString()}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Crude</Text><Text style={styles.statValue}>{state.world.crudeOil}/{crudeCapacity}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Gas</Text><Text style={styles.statValue}>{gasoline.toFixed(1)}/{gasolineCapacity}</Text></View>
          <View style={styles.stat}><Text style={styles.statLabel}>Chapter</Text><Text style={styles.statValue}>C{state.campaignProgress.chapter}</Text></View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{t({ en: 'Next objective', th: 'เป้าหมายถัดไป' })}</Text>
          <Text style={styles.body}>{guidanceText(guidance, t)}</Text>
          <Text style={styles.row}>{t({ en: 'Simulation', th: 'การจำลอง' })}: {effectiveSpeed === 0 ? t({ en: 'Paused by screen/modal', th: 'พักโดยหน้าจอ/หน้าต่างยืนยัน' }) : `${effectiveSpeed}×`}</Text>
          {guidance === 'build_laboratory' && labSpot && (
            <Pressable style={styles.primary} onPress={() => apply({ type: 'build', sequence: state.nextActionSequence, ...labSpot, building: 'laboratory' })}>
              <Text style={styles.primaryText}>{t({ en: 'Build Laboratory Lv1 · $400', th: 'สร้าง Laboratory Lv1 · $400' })}</Text>
            </Pressable>
          )}
        </View>

        {(recoveryOffer.tollingAvailable || recoveryOffer.missingBuildings.length > 0 || state.recoveryState?.status === 'running') && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t({ en: 'Safe recovery', th: 'กู้สถานการณ์' })}</Text>
            {state.recoveryState?.status === 'running' ? (
              <Text style={styles.row}>{t({ en: 'Customer tolling', th: 'งานกลั่นวัตถุดิบลูกค้า' })}: {(state.recoveryState.remainingTicks / 5).toFixed(0)}s · {t({ en: 'operating debits paused', th: 'พักรายจ่ายดำเนินงาน' })}</Text>
            ) : recoveryOffer.tollingAvailable ? (
              <Pressable style={styles.primary} onPress={() => apply({ type: 'start_recovery', sequence: state.nextActionSequence })}>
                <Text style={styles.primaryText}>{t({ en: `Run 20s tolling · restore up to $${(recoveryOffer.cashDeficitCents / 100).toFixed(0)}`, th: `รับงานช่วยกลั่น 20 วินาที · เติมส่วนขาดสูงสุด $${(recoveryOffer.cashDeficitCents / 100).toFixed(0)}` })}</Text>
              </Pressable>
            ) : null}
            {recoveryOffer.missingBuildings.length > 0 && (
              <>
                <Text style={styles.row}>{t({ en: 'Missing starter route', th: 'เส้นเริ่มต้นที่ขาด' })}: {recoveryOffer.missingBuildings.join(', ')}</Text>
                {recoveryOffer.emptySlotsNeeded > 0 ? (
                  <>
                    <Text style={styles.warning}>{t({ en: 'Not enough free land for the loaners. Nothing is removed automatically.', th: 'ที่ดินว่างไม่พอสำหรับอาคารยืม ระบบจะไม่รื้อให้อัตโนมัติ' })}</Text>
                    {listV3Buildings(state).map((building) => building ? (
                      <Pressable key={`clear-${building.id}`} style={styles.secondary} onPress={() => confirmDemolish(building.id)}>
                        <Text style={styles.secondaryText}>{t({ en: `Review removal · ${building.type} @(${building.x},${building.y})`, th: `ตรวจสอบการรื้อ · ${building.type} @(${building.x},${building.y})` })}</Text>
                      </Pressable>
                    ) : null)}
                  </>
                ) : (
                  <Pressable style={styles.secondary} onPress={() => apply({ type: 'restore_starter_loaners', sequence: state.nextActionSequence })}>
                    <Text style={styles.secondaryText}>{t({ en: 'Restore missing zero-refund loaners', th: 'วางตึกยืมที่ขาด (รื้อแล้วไม่ได้เงิน)' })}</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{activeBlueprint
            ? `${t({ en: 'Gasoline line', th: 'ไลน์ Gasoline' })} · ${activeBlueprint.name} Q${activeBlueprint.quality}`
            : t({ en: 'Gasoline line · missing', th: 'ไลน์ Gasoline · ไม่มีอาคาร' })}</Text>
          <Text style={styles.row}>{t({ en: 'Potential', th: 'กำลังผลิตสูงสุด' })}: {potentialRate.toFixed(1)}/min</Text>
          <Text style={styles.row}>{t({ en: 'Actual with current supply/space', th: 'ผลิตจริงตามวัตถุดิบ/พื้นที่' })}: {actualRate.toFixed(1)}/min</Text>
          <Text style={styles.row}>Feedstock: {state.world.feedstock.toFixed(1)} · Waste: {state.world.waste.toFixed(1)}</Text>
          <Pressable style={styles.primary} onPress={runCycle}>
            <Text style={styles.primaryText}>{t({ en: 'Run one 5-second cycle', th: 'เดินเครื่อง 1 รอบ (5 วินาที)' })}</Text>
          </Pressable>
          {distillationBuildingId && (
            <Pressable style={styles.secondary} onPress={() => apply({
              type: 'set_pause', sequence: state.nextActionSequence, buildingId: distillationBuildingId,
              paused: !state.plantPrograms[distillationBuildingId]?.paused,
            })}>
              <Text style={styles.secondaryText}>{state.plantPrograms[distillationBuildingId]?.paused ? t({ en: 'Resume Distillation', th: 'เดิน Distillation ต่อ' }) : t({ en: 'Pause Distillation', th: 'พัก Distillation' })}</Text>
            </Pressable>
          )}
        </View>

        <V3MidgamePanels state={state} apply={(action) => { void apply(action) }} t={t} describe={(message) => eventText(message, t)} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Customers & shipments', th: 'ลูกค้าและการจัดส่ง' })}</Text>
          {activeJob ? (
            <>
              <Text style={styles.row}>{activeJob.templateId} · Q{activeJob.minimumQuality}+ · {activeJob.deliveredQuantity}/{activeJob.quantity}</Text>
              {activeJob.deadlineTick !== null && (
                <Text style={styles.row}>{t({
                  en: `Rush deadline in ${Math.max(0, Math.ceil((activeJob.deadlineTick - state.world.tickCount) / 5))}s simulated · bonus lost on expiry, shipped units stay paid`,
                  th: `งานด่วนเหลือ ${Math.max(0, Math.ceil((activeJob.deadlineTick - state.world.tickCount) / 5))} วินาทีในเกม · หมดเวลาเสียแค่โบนัส ของที่ส่งแล้วได้เงินแล้ว`,
                })}</Text>
              )}
              <Text style={styles.row}>{t({ en: 'Reserved qualified stock', th: 'สต็อกผ่านสเปกที่จองไว้' })}: {jobReserved.toFixed(1)}</Text>
              <Pressable style={styles.primary} onPress={() => apply({
                type: 'dispatch_job', sequence: state.nextActionSequence,
                quantity: Math.max(1, Math.min(10, Math.floor(jobReserved), activeJob.quantity - activeJob.deliveredQuantity)),
              })}>
                <Text style={styles.primaryText}>{t({ en: 'Ship up to 10 units', th: 'ส่งสินค้าไม่เกิน 10 หน่วย' })}</Text>
              </Pressable>
              {jobEligibleBlueprints.map((allocation) => (
                <Pressable key={`ship-${allocation.blueprintId}`} style={styles.secondary} onPress={() => apply({
                  type: 'dispatch_job', sequence: state.nextActionSequence,
                  quantity: Math.max(1, Math.min(10, Math.floor(allocation.quantity - allocation.kept), activeJob.quantity - activeJob.deliveredQuantity)),
                  blueprintId: allocation.blueprintId,
                })}>
                  <Text style={styles.secondaryText}>{t({
                    en: `Ship ${state.productBlueprints[allocation.blueprintId]?.name} Q${allocation.quality}`,
                    th: `ส่ง ${state.productBlueprints[allocation.blueprintId]?.name} Q${allocation.quality}`,
                  })}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.secondary} onPress={() => apply({
                type: 'set_stock_policy', sequence: state.nextActionSequence,
                blueprintId: jobDefaultBlueprintId,
                autoDispatch: !defaultGasPolicy.autoDispatch,
              })}>
                <Text style={styles.secondaryText}>Auto-dispatch {state.productBlueprints[jobDefaultBlueprintId]?.name}: {defaultGasPolicy.autoDispatch ? 'ON' : 'OFF'}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => apply({ type: 'cancel_job', sequence: state.nextActionSequence })}>
                <Text style={styles.secondaryText}>{t({ en: 'Cancel job', th: 'ยกเลิกงาน' })}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.row}>{t({ en: 'Choose an offer in Customer offers below.', th: 'เลือกงานในหัวข้อข้อเสนอลูกค้าด้านล่าง' })}</Text>
              <Text style={styles.row}>{t({ en: 'Completed receipts', th: 'ใบเสร็จงานสำเร็จ' })}: {state.jobReceipts.receipts.filter((receipt) => receipt.status === 'completed').length}</Text>
            </>
          )}
        </View>

        <V3YardPanel state={state} apply={(action) => { void apply(action) }} t={t} describe={(message) => eventText(message, t)} onRequestDemolish={confirmDemolish} />

        <V3CampaignPanel state={state} t={t} />

        <V3TeamPanel state={state} apply={(action) => { void apply(action) }} t={t} describe={(message) => eventText(message, t)} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Gasoline development', th: 'พัฒนาสูตร Gasoline' })}</Text>
          <Text style={styles.row}>{t({ en: 'Certified recipes', th: 'สูตรที่รับรองแล้ว' })}: {gasolineBlueprints.map((blueprint) => `${blueprint.name} Q${blueprint.quality}`).join(' · ')}</Text>
          {distillationBuildingId && gasolineBlueprints.map((blueprint) => (
            <Pressable key={blueprint.id} style={styles.secondary} onPress={() => apply({
              type: 'set_program', sequence: state.nextActionSequence, buildingId: distillationBuildingId!, blueprintId: blueprint.id,
            })}>
              <Text style={styles.secondaryText}>{state.plantPrograms[distillationBuildingId!]?.blueprintId === blueprint.id ? '✓ ' : ''}{t({ en: `Use ${blueprint.name} Q${blueprint.quality}`, th: `ใช้ ${blueprint.name} Q${blueprint.quality}` })}</Text>
            </Pressable>
          ))}
          <Text style={styles.row}>{t({ en: 'Prototype choices', th: 'สูตรต้นแบบ' })}: Volume Q35 · Standard Q40 · Precision Q55</Text>
          {state.developmentProject ? (
            <>
              <Text style={styles.row}>{state.developmentProject.profile} Q{state.developmentProject.quality} · {(state.developmentProject.remainingTicks / 5).toFixed(0)}s</Text>
              <Pressable style={styles.secondary} onPress={() => apply({ type: 'cancel_development', sequence: state.nextActionSequence })}>
                <Text style={styles.secondaryText}>{t({ en: 'Cancel project (spent inputs stay spent)', th: 'ยกเลิกโครงการ (ไม่คืนของที่ใช้แล้ว)' })}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.secondary} onPress={() => apply({
                type: 'start_development', sequence: state.nextActionSequence, family: 'gasoline', profile: 'volume', module: 'none', knowledgeRank: 0, leadEmployeeId: null, labBuildingId: labBuildingId ?? '',
              })}>
                <Text style={styles.secondaryText}>{t({ en: 'Develop Volume Q35 · 10 Gas + $50', th: 'พัฒนา Volume Q35 · Gas 10 + $50' })}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => apply({
                type: 'start_development', sequence: state.nextActionSequence, family: 'gasoline', profile: 'precision', module: 'none', knowledgeRank: 0, leadEmployeeId: starterOperator.id, labBuildingId: labBuildingId ?? '',
              })}>
                <Text style={styles.secondaryText}>{t({ en: 'Develop Precision Q55 with Niran', th: 'พัฒนา Precision Q55 โดย Niran' })}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Foundation status', th: 'สถานะระบบพื้นฐาน' })}</Text>
          <Text style={styles.row}>✓ Ruleset 3 save and deterministic IDs</Text>
          <Text style={styles.row}>✓ Five Standard Q40 blueprints</Text>
          <Text style={styles.row}>✓ Starter trio and named Operator</Text>
          <Text style={styles.row}>✓ Blueprint, inventory, duty, job, ledger and campaign schema</Text>
          <Text style={styles.row}>✓ Shared build / upgrade / trade validation boundary</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Action boundary smoke test', th: 'ทดสอบคำสั่งกลาง' })}</Text>
          <Text style={styles.body}>{eventText(lastEvent, t)}</Text>
          <Pressable
            style={styles.primary}
            disabled={!tankSpot}
            onPress={() => tankSpot && apply({ type: 'build', sequence: state.nextActionSequence, ...tankSpot, building: 'gasolineTank' })}
          >
            <Text style={styles.primaryText}>Build {t(BUILDINGS.gasolineTank.name)} · $150</Text>
          </Pressable>
          {distillationBuildingId && (
            <Pressable
              style={styles.secondary}
              onPress={() => apply({ type: 'upgrade', sequence: state.nextActionSequence, buildingId: distillationBuildingId })}
            >
              <Text style={styles.secondaryText}>{t({ en: 'Try Distillation upgrade', th: 'ลองอัปเกรด Distillation' })}</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.secondary}
            onPress={() => apply({ type: 'trade', sequence: state.nextActionSequence, direction: 'buy', product: 'crude', quantity: 5 })}
          >
            <Text style={styles.secondaryText}>{t({ en: 'Buy 5 crude · $50', th: 'ซื้อ crude 5 หน่วย · $50' })}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Financial ledger', th: 'บัญชีการเงิน' })}</Text>
          <Text style={styles.row}>{t({ en: 'Buildings', th: 'อาคาร' })}: {buildings}</Text>
          <Text style={styles.row}>{t({ en: 'Operating receipts', th: 'รายรับดำเนินงาน' })}: ${(state.operatingLedger.lifetimeReceiptsCents / 100).toFixed(2)}</Text>
          <Text style={styles.row}>{t({ en: 'Cash outflows', th: 'เงินจ่ายดำเนินงาน' })}: ${(state.operatingLedger.lifetimeCashOutflowsCents / 100).toFixed(2)}</Text>
          <Text style={styles.row}>CAPEX: ${(state.operatingLedger.capexCents / 100).toFixed(2)}</Text>
        </View>

        <Pressable
          style={styles.reset}
          onPress={() => {
            setPauseState((current) => acquireV3Pause(current, 'reset-confirm'))
            const release = () => setPauseState((current) => releaseV3Pause(current, 'reset-confirm'))
            Alert.alert(t({ en: 'Reset V3 development save?', th: 'รีเซ็ตเซฟพัฒนา V3?' }), t({ en: 'Only the new V3 save will be replaced.', th: 'จะล้างเฉพาะเซฟ V3 ใหม่นี้' }), [
              { text: t({ en: 'Cancel', th: 'ยกเลิก' }), style: 'cancel', onPress: release },
              { text: t({ en: 'Reset', th: 'รีเซ็ต' }), style: 'destructive', onPress: () => { release(); void startFresh() } },
            ], { cancelable: true, onDismiss: release })
          }}
        >
          <Text style={styles.resetText}>{t({ en: 'Reset V3 development save', th: 'รีเซ็ตเซฟพัฒนา V3' })}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#071C2D' },
  loading: { flex: 1, backgroundColor: '#071C2D', alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#244A63', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#6ACDB4', fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.5 },
  title: { color: '#F4F7F8', fontFamily: fonts.display, fontSize: 22 },
  back: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 13 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  notice: { backgroundColor: '#12394A', borderWidth: 1, borderColor: '#4F9E8C', borderRadius: 10, padding: spacing.md },
  noticeTitle: { color: '#A9F3D9', fontFamily: fonts.heading, fontSize: 15, marginBottom: 4 },
  body: { color: '#B9CAD5', fontSize: 13, lineHeight: 19 },
  stats: { flexDirection: 'row', gap: 7 },
  stat: { flex: 1, backgroundColor: '#0D2B40', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  statLabel: { color: '#7F9CB0', fontSize: 10 },
  statValue: { color: '#FFF', fontFamily: fonts.heading, fontSize: 15, marginTop: 2 },
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: spacing.md, gap: 9 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  warning: { color: '#FFAD8A' },
  primary: { backgroundColor: '#FFD447', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#0A2943', fontFamily: fonts.heading, fontSize: 13 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  reset: { paddingVertical: 13, alignItems: 'center' },
  resetText: { color: '#E89494', fontSize: 12 },
  errorCard: { margin: spacing.lg, backgroundColor: '#2C2230', borderRadius: 10, padding: spacing.lg, gap: spacing.md },
  errorTitle: { color: '#FFB4B4', fontFamily: fonts.heading, fontSize: 17 },
})
