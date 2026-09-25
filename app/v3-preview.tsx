import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { BUILDINGS } from '../src/game/data/buildings'
import { reduceV3Action } from '../src/game/v3/actions'
import { getV3GuidanceStep, type V3GuidanceStep } from '../src/game/v3/campaign'
import { V3_BUILDINGS } from '../src/game/v3/data'
import { V3_INITIAL_PAUSE_STATE, acquireV3Pause, getV3EffectiveSpeed, releaseV3Pause, setV3Backgrounded } from '../src/game/v3/pause'
import { getV3CrudeCapacity, getV3ProductCapacity, getV3ProductQuantity, getV3StockAllocations } from '../src/game/v3/productInventory'
import { evaluateV3GasolineProduction, runV3ProductionTick } from '../src/game/v3/production'
import { getV3RecoveryOffer, isV3LoanerCell } from '../src/game/v3/recovery'
import { createInitialV3GameState, V3_DEFAULT_BLUEPRINT_ID } from '../src/game/v3/state'
import {
  clearV3GameState,
  loadV3GameState,
  saveV3GameState,
  type V3LoadResult,
} from '../src/game/v3/storage'
import type { BilingualTextValue } from '../src/game/types'
import type { V3ActionEvent, V3GameState } from '../src/game/v3/types'
import { getV3LineEmployee, getV3LocalCrewRate } from '../src/game/v3/workforce'
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
    case 'v3.duty.occupied': return translate({ en: 'This line already has an Operator.', th: 'ไลน์นี้มี Operator ประจำอยู่แล้ว' })
    case 'v3.duty.ineligible': return translate({ en: 'This employee is not eligible for the line.', th: 'พนักงานคนนี้ทำงานในไลน์นี้ไม่ได้' })
    case 'v3.duty.resume_unaffordable': return translate({ en: 'Cash cannot cover the next wage cycle.', th: 'เงินยังไม่พอจ่ายค่าจ้างรอบถัดไป' })
    case 'v3.duty.invalid_target': return translate({ en: 'That duty is not available yet.', th: 'หน้าที่นี้ยังไม่เปิดใช้งาน' })
    case 'v3.development.chapter_locked': return translate({ en: 'Product development unlocks in C1.', th: 'ระบบพัฒนาสินค้าปลดล็อกในบท C1' })
    case 'v3.development.invalid_lab': return translate({ en: 'Build and select a Laboratory first.', th: 'ต้องสร้างและเลือก Laboratory ก่อน' })
    case 'v3.development.insufficient_cash': return translate({ en: 'Development needs $50.', th: 'การพัฒนาต้องใช้เงิน $50' })
    case 'v3.development.insufficient_samples': return translate({ en: 'Need 10 unreserved Gasoline samples.', th: 'ต้องมี Gasoline ที่ไม่ถูกจอง 10 หน่วย' })
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
    chapter_two: { en: 'C2 reached — the first strategic branch is ready.', th: 'ถึง C2 แล้ว — พร้อมเข้าสู่ทางเลือกธุรกิจแรก' },
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

  const confirmDemolish = (cellIndex: number) => {
    if (!state) return
    const building = state.world.grid[cellIndex]
    if (!building) return
    const loaner = isV3LoanerCell(state, cellIndex)
    const refundCents = loaner ? 0 : Math.round(V3_BUILDINGS[building].buildCostDollars * 50)
    setPauseState((current) => acquireV3Pause(current, 'demolish-confirm'))
    const release = () => setPauseState((current) => releaseV3Pause(current, 'demolish-confirm'))
    Alert.alert(
      t({ en: `Remove ${building}?`, th: `รื้อ ${building}?` }),
      t({
        en: `Refund $${(refundCents / 100).toFixed(0)}. Assigned staff move to Reserve. Tanks must be emptied below remaining capacity.`,
        th: `คืนเงิน $${(refundCents / 100).toFixed(0)} พนักงานจะย้ายไปทีมสำรอง และต้องลดสต็อกให้ไม่เกินความจุที่เหลือก่อน`,
      }),
      [
        { text: t({ en: 'Cancel', th: 'ยกเลิก' }), style: 'cancel', onPress: release },
        {
          text: t({ en: 'Remove', th: 'รื้อ' }), style: 'destructive',
          onPress: () => { release(); void apply({ type: 'demolish', sequence: state.nextActionSequence, cellIndex, expectedBuilding: building }) },
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

  const emptyCell = state.world.grid.findIndex((cell) => cell === null)
  const buildings = state.world.grid.filter(Boolean).length
  const crudeCapacity = getV3CrudeCapacity(state)
  const gasoline = getV3ProductQuantity(state, 'gasoline')
  const gasolineCapacity = getV3ProductCapacity(state, 'gasoline')
  const productionPreview = evaluateV3GasolineProduction(state, 25)
  const potentialRate = productionPreview.reduce((sum, line) => sum + line.potentialGasolinePerMinute, 0)
  const actualRate = productionPreview.reduce((sum, line) => sum + line.actualGasolinePerMinute, 0)
  const starterOperator = state.world.employees[0]
  const starterDuty = state.employeeDuties[starterOperator.id] ?? { kind: 'reserve' as const }
  const distillationCellIndex = state.world.grid.findIndex((cell) => cell === 'distillationUnit')
  const activeProgram = state.plantPrograms[distillationCellIndex]
  const activeBlueprint = activeProgram ? state.productBlueprints[activeProgram.blueprintId] : null
  const lineOperator = getV3LineEmployee(state, distillationCellIndex)
  const crewRate = getV3LocalCrewRate(state, distillationCellIndex)
  const operatorUnpaid = state.unpaidEmployeeIds.includes(starterOperator.id)
  const labCellIndex = state.world.grid.findIndex((cell) => cell === 'laboratory')
  const gasolineBlueprints = Object.values(state.productBlueprints)
    .filter((blueprint) => blueprint.family === 'gasoline')
    .sort((a, b) => a.quality - b.quality || a.id.localeCompare(b.id))
  const activeJob = state.acceptedJob
  const gasolineAllocations = getV3StockAllocations(state, 'gasoline')
  const jobReserved = gasolineAllocations.reduce((sum, allocation) => sum + allocation.jobReserved, 0)
  const jobEligibleBlueprints = activeJob ? gasolineAllocations.filter((allocation) =>
    allocation.quality >= activeJob.minimumQuality && allocation.quantity - allocation.kept > 0,
  ) : []
  const defaultGasPolicy = state.stockPolicies[V3_DEFAULT_BLUEPRINT_ID.gasoline] ?? { keepQuantity: 0, autoSell: false, autoDispatch: false }
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
          {guidance === 'build_laboratory' && emptyCell >= 0 && (
            <Pressable style={styles.primary} onPress={() => apply({ type: 'build', sequence: state.nextActionSequence, cellIndex: emptyCell, building: 'laboratory' })}>
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
                    <Text style={styles.warning}>{t({ en: `Clear ${recoveryOffer.emptySlotsNeeded} slot(s). Nothing is removed automatically.`, th: `เคลียร์อีก ${recoveryOffer.emptySlotsNeeded} ช่อง ระบบจะไม่รื้อให้อัตโนมัติ` })}</Text>
                    {state.world.grid.map((building, cellIndex) => building ? (
                      <Pressable key={`clear-${cellIndex}`} style={styles.secondary} onPress={() => confirmDemolish(cellIndex)}>
                        <Text style={styles.secondaryText}>{t({ en: `Review removal · cell ${cellIndex + 1} · ${building}`, th: `ตรวจสอบการรื้อ · ช่อง ${cellIndex + 1} · ${building}` })}</Text>
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
          {distillationCellIndex >= 0 && (
            <Pressable style={styles.secondary} onPress={() => apply({
              type: 'set_pause', sequence: state.nextActionSequence, cellIndex: distillationCellIndex,
              paused: !state.plantPrograms[distillationCellIndex]?.paused,
            })}>
              <Text style={styles.secondaryText}>{state.plantPrograms[distillationCellIndex]?.paused ? t({ en: 'Resume Distillation', th: 'เดิน Distillation ต่อ' }) : t({ en: 'Pause Distillation', th: 'พัก Distillation' })}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Customers & shipments', th: 'ลูกค้าและการจัดส่ง' })}</Text>
          {activeJob ? (
            <>
              <Text style={styles.row}>{activeJob.templateId} · Q{activeJob.minimumQuality}+ · {activeJob.deliveredQuantity}/{activeJob.quantity}</Text>
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
                blueprintId: V3_DEFAULT_BLUEPRINT_ID.gasoline,
                autoDispatch: !defaultGasPolicy.autoDispatch,
              })}>
                <Text style={styles.secondaryText}>Auto-dispatch Standard Q40: {defaultGasPolicy.autoDispatch ? 'ON' : 'OFF'}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => apply({ type: 'cancel_job', sequence: state.nextActionSequence })}>
                <Text style={styles.secondaryText}>{t({ en: 'Cancel job', th: 'ยกเลิกงาน' })}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable style={styles.secondary} onPress={() => apply({ type: 'accept_job', sequence: state.nextActionSequence, templateId: 'tutorial:gasoline' })}>
                <Text style={styles.secondaryText}>{t({ en: 'Accept Tutorial · Q0 · 20 Gas', th: 'รับ Tutorial · Q0 · Gas 20' })}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => apply({ type: 'accept_job', sequence: state.nextActionSequence, templateId: 'local:trial' })}>
                <Text style={styles.secondaryText}>{t({ en: 'Accept Local Trial · Q35 · 40 Gas', th: 'รับ Local Trial · Q35 · Gas 40' })}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => apply({ type: 'accept_job', sequence: state.nextActionSequence, templateId: 'performance:trial' })}>
                <Text style={styles.secondaryText}>{t({ en: 'Accept Performance Trial · Q55 · 35 Gas', th: 'รับ Performance Trial · Q55 · Gas 35' })}</Text>
              </Pressable>
              <Text style={styles.row}>{t({ en: 'Completed receipts', th: 'ใบเสร็จงานสำเร็จ' })}: {state.jobReceipts.receipts.filter((receipt) => receipt.status === 'completed').length}</Text>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Factory assignment', th: 'การมอบหมายจาก Factory' })}</Text>
          <Text style={styles.row}>{distillationCellIndex >= 0
            ? `Distillation #${distillationCellIndex + 1}: ${lineOperator?.name ?? t({ en: 'Unstaffed baseline', th: 'ไม่มีคนประจำ · ผลิตพื้นฐาน' })}`
            : t({ en: 'Distillation is missing — use Safe recovery above.', th: 'ไม่มี Distillation — ใช้ระบบกู้สถานการณ์ด้านบน' })}</Text>
          <Text style={styles.row}>{t({ en: 'Local crew bonus', th: 'โบนัสทีมเฉพาะไลน์' })}: +{(crewRate * 100).toFixed(0)}%</Text>
          {distillationCellIndex >= 0 && (
            <Pressable
              style={styles.secondary}
              onPress={() => apply({ type: 'assign_duty', sequence: state.nextActionSequence, employeeId: starterOperator.id, duty: { kind: 'line', cellIndex: distillationCellIndex } })}
            >
              <Text style={styles.secondaryText}>{t({ en: 'Assign Niran to this line', th: 'มอบหมาย Niran ให้ไลน์นี้' })}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Team roster', th: 'รายชื่อทีม' })}</Text>
          <Text style={styles.row}>{starterOperator.name} · Operator Lv{starterOperator.level} · XP {starterOperator.xp.toFixed(2)}</Text>
          <Text style={styles.row}>{t({ en: 'Duty', th: 'หน้าที่' })}: {starterDuty.kind === 'line' ? `Distillation #${starterDuty.cellIndex}` : starterDuty.kind === 'development' ? t({ en: 'Product development', th: 'พัฒนาผลิตภัณฑ์' }) : t({ en: 'Reserve', th: 'สำรอง' })}</Text>
          <Text style={[styles.row, operatorUnpaid && styles.warning]}>{t({ en: 'Pay status', th: 'สถานะค่าจ้าง' })}: {operatorUnpaid ? t({ en: 'UNPAID STANDBY', th: 'พักงานเพราะค่าจ้างค้าง' }) : t({ en: 'Active', th: 'พร้อมทำงาน' })}</Text>
          <Pressable
            style={styles.secondary}
            onPress={() => apply({ type: 'assign_duty', sequence: state.nextActionSequence, employeeId: starterOperator.id, duty: { kind: 'reserve' } })}
          >
            <Text style={styles.secondaryText}>{t({ en: 'Move Niran to reserve', th: 'ย้าย Niran ไปทีมสำรอง' })}</Text>
          </Pressable>
          {operatorUnpaid && (
            <Pressable
              style={styles.primary}
              onPress={() => apply({ type: 'resume_employee', sequence: state.nextActionSequence, employeeId: starterOperator.id })}
            >
              <Text style={styles.primaryText}>{t({ en: 'Resume after funding wages', th: 'กลับเข้าทำงานหลังเตรียมค่าจ้าง' })}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Gasoline development', th: 'พัฒนาสูตร Gasoline' })}</Text>
          <Text style={styles.row}>{t({ en: 'Certified recipes', th: 'สูตรที่รับรองแล้ว' })}: {gasolineBlueprints.map((blueprint) => `${blueprint.name} Q${blueprint.quality}`).join(' · ')}</Text>
          {distillationCellIndex >= 0 && gasolineBlueprints.map((blueprint) => (
            <Pressable key={blueprint.id} style={styles.secondary} onPress={() => apply({
              type: 'set_program', sequence: state.nextActionSequence, cellIndex: distillationCellIndex, blueprintId: blueprint.id,
            })}>
              <Text style={styles.secondaryText}>{state.plantPrograms[distillationCellIndex]?.blueprintId === blueprint.id ? '✓ ' : ''}{t({ en: `Use ${blueprint.name} Q${blueprint.quality}`, th: `ใช้ ${blueprint.name} Q${blueprint.quality}` })}</Text>
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
                type: 'start_development', sequence: state.nextActionSequence, family: 'gasoline', profile: 'volume', module: 'none', knowledgeRank: 0, leadEmployeeId: null, labCellIndex,
              })}>
                <Text style={styles.secondaryText}>{t({ en: 'Develop Volume Q35 · 10 Gas + $50', th: 'พัฒนา Volume Q35 · Gas 10 + $50' })}</Text>
              </Pressable>
              <Pressable style={styles.secondary} onPress={() => apply({
                type: 'start_development', sequence: state.nextActionSequence, family: 'gasoline', profile: 'precision', module: 'none', knowledgeRank: 0, leadEmployeeId: starterOperator.id, labCellIndex,
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
            disabled={emptyCell < 0}
            onPress={() => apply({ type: 'build', sequence: state.nextActionSequence, cellIndex: emptyCell, building: 'gasolineTank' })}
          >
            <Text style={styles.primaryText}>Build {t(BUILDINGS.gasolineTank.name)} · $150</Text>
          </Pressable>
          {distillationCellIndex >= 0 && (
            <Pressable
              style={styles.secondary}
              onPress={() => apply({ type: 'upgrade', sequence: state.nextActionSequence, cellIndex: distillationCellIndex })}
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
          <Text style={styles.row}>{t({ en: 'Buildings', th: 'อาคาร' })}: {buildings}/9</Text>
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
