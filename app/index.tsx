import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { reduceV3Action, validateV3Demolish } from '../src/game/v3/actions'
import { getV3GuidanceStep } from '../src/game/v3/campaign'
import { eventText, guidanceText } from '../src/components/v3/v3EventText'
import { V3_BUILDINGS } from '../src/game/v3/data'
import { V3_INITIAL_PAUSE_STATE, acquireV3Pause, getV3EffectiveSpeed, releaseV3Pause, setV3Backgrounded, setV3SelectedSpeed } from '../src/game/v3/pause'
import { V3_AUTOSAVE_MS, stepV3Clock, type V3Clock } from '../src/game/v3/realtime'
import { onV3ResetRequested } from '../src/game/v3/session'
import { getV3CrudeCapacity, getV3ProductCapacity, getV3ProductQuantity } from '../src/game/v3/productInventory'
import { runV3ProductionTick } from '../src/game/v3/production'
import { isV3LoanerBuilding } from '../src/game/v3/recovery'
import { createInitialV3GameState } from '../src/game/v3/state'
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
import { findV3PlacementSpot, getV3BuildingType } from '../src/game/v3/yard'
import { V3CampaignPanel } from '../src/components/v3/V3CampaignPanel'
import { V3YardPanel, useV3YardController } from '../src/components/v3/V3YardPanel'
import V3YardView, { type V3Floater } from '../src/components/v3/V3YardView'
import { V3OffersPanel } from '../src/components/v3/V3OffersPanel'
import { V3SupplyPanel } from '../src/components/v3/V3SupplyPanel'
import { V3FamePanel } from '../src/components/v3/V3FamePanel'
import { V3MarketPanel } from '../src/components/v3/V3MarketPanel'
import { V3RankingPanel } from '../src/components/v3/V3RankingPanel'
import { V3ExpoPanel } from '../src/components/v3/V3ExpoPanel'
import { getV3PlayerRank } from '../src/game/v3/rivals'
import { getV3Fame } from '../src/game/v3/fame'
import { getV3Calendar } from '../src/game/v3/yardView'
import { evaluateV3Production } from '../src/game/v3/production'
import { V3InboxPanel } from '../src/components/v3/V3InboxPanel'
import { V3ActiveJobCard, V3GasolineDevelopmentCard, V3GasolineLineCard, V3LedgerCard, V3RecoveryCard, V3SpecializationCard } from '../src/components/v3/V3GameCards'
import { V3Segments } from '../src/components/v3/V3Segments'
import { V3ClearChecklist } from '../src/components/v3/V3ClearChecklist'
import { useLang } from '../src/hooks/SettingsContext'
import { colors, fonts, pixelUi, spacing } from '../src/theme'
import { getStarterPlantArt } from '../src/starterPlantArt'

function V3NavGlyph({ kind }: { kind: 'build' | 'production' | 'staff' | 'clients' | 'company' }) {
  if (kind === 'build' || kind === 'production') {
    return <Image source={getStarterPlantArt(kind === 'build' ? 'distillationUnit' : 'gasolineTank', 1)} style={styles.tabPlantGlyph} resizeMode="contain" />
  }
  if (kind === 'staff') return <Image source={require('../assets/staff/portraits/operator.png')} style={styles.tabStaffGlyph} resizeMode="cover" />
  if (kind === 'clients') return <Text style={styles.tabSymbol}>✉</Text>
  return <View style={styles.tabChart}>{[9, 16, 23].map((height) => <View key={height} style={[styles.tabChartBar, { height }]} />)}</View>
}

type V3Tab = 'build' | 'production' | 'staff' | 'clients' | 'company'
type ProductionSection = 'lines' | 'stock' | 'rnd' | 'market'
type ClientSection = 'job' | 'offers' | 'expo'
type CompanySection = 'overview' | 'ranking' | 'inbox' | 'finance'
type TimedFloater = Omit<V3Floater, 'age'> & { born: number }
const FLOATER_MS = 1_600

export default function V3GameScreen() {
  const router = useRouter()
  const { t } = useLang()
  const [loadResult, setLoadResult] = useState<V3LoadResult | null>(null)
  const [state, setState] = useState<V3GameState | null>(null)
  const [lastEvent, setLastEvent] = useState<V3ActionEvent | null>(null)
  const [pauseState, setPauseState] = useState(V3_INITIAL_PAUSE_STATE)
  const [tab, setTab] = useState<V3Tab | null>(null)
  const [productionSection, setProductionSection] = useState<ProductionSection>('lines')
  const [clientSection, setClientSection] = useState<ClientSection>('job')
  const [companySection, setCompanySection] = useState<CompanySection>('overview')
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 })
  const [timedFloaters, setTimedFloaters] = useState<TimedFloater[]>([])
  const outputRef = useRef<Record<string, number>>({})
  const floaterSeq = useRef(0)
  const pushFloater = (floater: Omit<TimedFloater, 'id' | 'born'>) => {
    floaterSeq.current += 1
    const entry = { ...floater, id: `f${floaterSeq.current}`, born: Date.now() }
    setTimedFloaters((current) => [...current.filter((item) => Date.now() - item.born < FLOATER_MS), entry].slice(-24))
  }

  useEffect(() => {
    loadV3GameState().then(async (result) => {
      setLoadResult(result)
      if (result.state) {
        setState(result.state)
        if (result.status === 'new') await saveV3GameState(result.state)
      }
    })
  }, [])

  const yard = useV3YardController(state ?? createInitialV3GameState())

  // Latest state for the real-time loop and autosave (the only V3 writer).
  const stateRef = useRef<V3GameState | null>(null)
  stateRef.current = state
  const dirtyRef = useRef(false)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      setPauseState((current) => setV3Backgrounded(current, status !== 'active'))
      if (status !== 'active' && stateRef.current && dirtyRef.current) {
        dirtyRef.current = false
        void saveV3GameState(stateRef.current)
      }
    })
    return () => subscription.remove()
  }, [])

  // Real-time simulation: whole ticks from elapsed time × speed; nothing runs while paused.
  const speed = getV3EffectiveSpeed(pauseState)
  useEffect(() => {
    if (speed === 0) return
    let clock: V3Clock = { carryMs: 0 }
    let last = Date.now()
    let lastSave = last
    const timer = setInterval(() => {
      const now = Date.now()
      const step = stepV3Clock(clock, now - last, speed)
      clock = step.clock
      last = now
      let next = stateRef.current
      if (!next || step.ticks === 0) return
      const cycleBefore = Math.floor(next.world.tickCount / 25)
      for (let remaining = step.ticks; remaining > 0; remaining -= 25) {
        const result = runV3ProductionTick(next, Math.min(25, remaining))
        for (const line of result.lines) outputRef.current[line.buildingId] = (outputRef.current[line.buildingId] ?? 0) + line.outputQuantity
        next = result.state
      }
      // Kairosoft-style "+N" over each producing line once per 5 s cycle.
      if (Math.floor(next.world.tickCount / 25) > cycleBefore) {
        for (const [buildingId, quantity] of Object.entries(outputRef.current)) {
          const building = next.world.buildingsById[buildingId]
          if (building && quantity >= 0.5) pushFloater({ x: building.x, y: building.y, text: `+${quantity.toFixed(0)}`, color: '#FFFFFF' })
        }
        outputRef.current = {}
      }
      stateRef.current = next
      dirtyRef.current = true
      setState(next)
      if (now - lastSave >= V3_AUTOSAVE_MS) {
        lastSave = now
        dirtyRef.current = false
        void saveV3GameState(next)
      }
    }, 250)
    return () => {
      clearInterval(timer)
      if (stateRef.current && dirtyRef.current) {
        dirtyRef.current = false
        void saveV3GameState(stateRef.current)
      }
    }
  }, [speed])

  useEffect(() => onV3ResetRequested(() => { void startFresh() }), [])

  const apply = async (action: Parameters<typeof reduceV3Action>[1]) => {
    if (!state) return
    const current = stateRef.current ?? state
    const result = reduceV3Action(current, action)
    setLastEvent(result.events[0] ?? null)
    if (result.changed) {
      const gained = result.state.world.moneyCents - current.world.moneyCents
      if (gained >= 100) {
        const anchor = Object.values(result.state.world.buildingsById).find((building) => building.type === 'gasolineTank') ?? Object.values(result.state.world.buildingsById)[0]
        if (anchor) pushFloater({ x: anchor.x, y: anchor.y, text: `+$${Math.floor(gained / 100).toLocaleString()}`, color: '#FFD447' })
      }
      stateRef.current = result.state
      setState(result.state)
      dirtyRef.current = false
      await saveV3GameState(result.state)
    }
  }

  const startFresh = async () => {
    const fresh = createInitialV3GameState()
    stateRef.current = fresh
    dirtyRef.current = false
    await clearV3GameState()
    await saveV3GameState(fresh)
    setState(fresh)
    setLoadResult({ status: 'new', state: fresh, reason: null })
    setLastEvent(null)
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
        <View style={styles.header}><Text style={styles.title}>Refinery Story</Text></View>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>{t({ en: 'V3 save cannot be opened', th: 'เปิดเซฟ V3 ไม่ได้' })}</Text>
          <Text style={styles.body}>{loadResult.reason}</Text>
          <Pressable style={styles.primary} onPress={startFresh}><Text style={styles.primaryText}>{t({ en: 'Start fresh V3 save', th: 'เริ่มเซฟ V3 ใหม่' })}</Text></Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/settings')}><Text style={styles.secondaryText}>{t({ en: 'Settings', th: 'ตั้งค่า' })}</Text></Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const labSpot = findV3PlacementSpot(state, 'laboratory')
  const crudeCapacity = getV3CrudeCapacity(state)
  const gasoline = getV3ProductQuantity(state, 'gasoline')
  const gasolineCapacity = getV3ProductCapacity(state, 'gasoline')
  const applyPanel = (action: Parameters<typeof reduceV3Action>[1]) => { void apply(action) }
  const describe = (message: V3ActionEvent | null) => eventText(message, t)
  const cardProps = { state, apply: applyPanel, t, describe }
  const guidance = getV3GuidanceStep(state)
  const effectiveSpeed = getV3EffectiveSpeed(pauseState)

  const now = Date.now()
  const floaters: V3Floater[] = timedFloaters
    .filter((floater) => now - floater.born < FLOATER_MS)
    .map((floater) => ({ ...floater, age: (now - floater.born) / FLOATER_MS }))
  const alerts: Record<string, string> = {}
  for (const line of evaluateV3Production(state, 25).lines) {
    if (line.status === 'invalid' || line.status === 'paused' || line.limitedBy !== 'none') alerts[line.buildingId] = line.limitedBy !== 'none' ? line.limitedBy : line.status
  }
  const calendar = getV3Calendar(state.world.tickCount)
  const money = (cents: number) => `$${Math.floor(cents / 100).toLocaleString()}`
  const tabs: Array<{ key: V3Tab; label: BilingualTextValue }> = [
    { key: 'build', label: { en: 'Build', th: 'สร้าง' } },
    { key: 'production', label: { en: 'Production', th: 'ผลิต' } },
    { key: 'staff', label: { en: 'Staff', th: 'พนักงาน' } },
    { key: 'clients', label: { en: 'Clients', th: 'ลูกค้า' } },
    { key: 'company', label: { en: 'Company', th: 'บริษัท' } },
  ]

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <Text style={styles.hudBrand} numberOfLines={1}>Sunrise Refinery</Text>
          <View style={styles.chapterBadge}><Text style={styles.chapterText}>C{state.campaignProgress.chapter}</Text></View>
          <Text style={styles.hudDate}>{t({ en: `Y${calendar.year} M${calendar.month} W${calendar.week}`, th: `ปี ${calendar.year} ด.${calendar.month} ส.${calendar.week}` })}</Text>
          <Pressable onPress={() => router.push('/settings')} hitSlop={10} style={styles.hudSettings}><Text style={styles.hudSettingsText}>☰</Text></Pressable>
        </View>
        <View style={styles.hudRow}>
          <Text style={styles.hudMoney}>{money(state.world.moneyCents)}</Text>
          <Text style={styles.hudItem}>🔬 {Math.floor(state.world.researchPoints)}</Text>
          <Pressable onPress={() => { setCompanySection('ranking'); setTab('company') }} hitSlop={8}><Text style={styles.hudItem}>★{getV3Fame(state).level}  # {getV3PlayerRank(state)}</Text></Pressable>
        </View>
        <View style={styles.hudRow}>
          <Pressable onPress={() => { setProductionSection('stock'); setTab('production') }} hitSlop={8} style={styles.hudPress}><Text style={styles.hudSmall}>🛢{state.world.crudeOil.toFixed(0)}/{Math.floor(crudeCapacity)} ⛽{gasoline.toFixed(0)}/{Math.floor(gasolineCapacity)} ⚡{state.world.electricity.toFixed(0)}</Text></Pressable>
          <View style={styles.speedRow}>
            {([0, 1, 2, 3] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityState={{ selected: pauseState.selectedSpeed === value }}
                style={[styles.speedChip, pauseState.selectedSpeed === value && styles.speedActive]}
                onPress={() => setPauseState((current) => setV3SelectedSpeed(current, value))}
              >
                <Text style={[styles.speedText, pauseState.selectedSpeed === value && styles.speedTextActive]}>{value === 0 ? 'Ⅱ' : `${value}×`}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.mapArea} onLayout={(event) => setMapSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
        {mapSize.width > 0 && (
          <V3YardView
            state={state}
            width={mapSize.width}
            height={mapSize.height}
            selectedId={yard.mapSelectedId}
            highlightParcelId={yard.parcelId}
            placement={yard.placement}
            upgradeGrowth={yard.upgradeGrowth}
            floaters={floaters}
            alerts={alerts}
            onTapTile={(x, y) => {
              if (yard.mode.kind === 'decor') applyPanel({ type: 'place_decoration', sequence: state.nextActionSequence, kind: yard.mode.decor, x, y, rotated: yard.mode.rotated })
              else yard.onTapTile(x, y)
            }}
          />
        )}
        <View style={styles.goalBanner} pointerEvents="box-none">
          <Text style={styles.goalTitle}>{t({ en: 'Goal', th: 'เป้าหมาย' })}</Text>
          {guidance === 'chapter_four' ? <V3ClearChecklist state={state} t={t} compact /> : <Text style={styles.goalText}>{guidanceText(guidance, t)}</Text>}
          {guidance === 'build_laboratory' && labSpot && (
            <Pressable style={styles.primary} onPress={() => apply({ type: 'build', sequence: state.nextActionSequence, ...labSpot, building: 'laboratory' })}>
              <Text style={styles.primaryText}>{t({ en: 'Build Laboratory Lv1 · $400', th: 'สร้าง Laboratory Lv1 · $400' })}</Text>
            </Pressable>
          )}
          {effectiveSpeed === 0 && pauseState.selectedSpeed !== 0 && <Text style={styles.goalText}>{t({ en: 'Paused while a dialog is open', th: 'หยุดชั่วคราวระหว่างเปิดหน้าต่าง' })}</Text>}
          {lastEvent && lastEvent.tone !== 'success' && <Text style={styles.goalWarning}>{eventText(lastEvent, t)}</Text>}
        </View>
        <View style={styles.overlayBottom} pointerEvents="box-none">
          <ScrollView style={styles.overlayScroll} contentContainerStyle={styles.overlayContent} keyboardShouldPersistTaps="handled">
            <V3YardPanel section="overlay" state={state} yard={yard} apply={(action) => { void apply(action) }} t={t} describe={(message) => eventText(message, t)} onRequestDemolish={confirmDemolish} />
          </ScrollView>
        </View>
      </View>

      {tab && (
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t(tabs.find((entry) => entry.key === tab)!.label)}</Text>
            <Pressable onPress={() => setTab(null)} hitSlop={12} accessibilityLabel={t({ en: 'Close', th: 'ปิด' })}><Text style={styles.sheetClose}>✕</Text></Pressable>
          </View>
          {tab === 'production' && (
            <View style={styles.segments}>
              <V3Segments value={productionSection} onChange={setProductionSection} items={[
                { key: 'lines', label: t({ en: 'Lines', th: 'ไลน์ผลิต' }) },
                { key: 'stock', label: t({ en: 'Stock', th: 'สต็อก' }) },
                { key: 'rnd', label: t({ en: 'Recipes & R&D', th: 'สูตร & R&D' }) },
                { key: 'market', label: t({ en: 'Market', th: 'ตลาด' }) },
              ]} />
            </View>
          )}
          {tab === 'clients' && (
            <View style={styles.segments}>
              <V3Segments value={clientSection} onChange={setClientSection} items={[
                { key: 'job', label: t({ en: 'Current job', th: 'งานปัจจุบัน' }) },
                { key: 'offers', label: t({ en: 'Offers', th: 'ข้อเสนอ' }) },
                { key: 'expo', label: t({ en: 'Expo', th: 'เอ็กซ์โป' }) },
              ]} />
            </View>
          )}
          {tab === 'company' && (
            <View style={styles.segments}>
              <V3Segments value={companySection} onChange={setCompanySection} items={[
                { key: 'overview', label: t({ en: 'Overview', th: 'ภาพรวม' }) },
                { key: 'ranking', label: t({ en: 'Ranking', th: 'อันดับ' }) },
                { key: 'inbox', label: t({ en: 'Inbox', th: 'จดหมาย' }), dot: state.inbox.items.length > 0 },
                { key: 'finance', label: t({ en: 'Finance', th: 'บัญชี' }) },
              ]} />
            </View>
          )}
          <ScrollView contentContainerStyle={styles.content}>
            {tab === 'build' && <V3YardPanel section="sheet" state={state} yard={yard} apply={applyPanel} t={t} describe={describe} onRequestDemolish={confirmDemolish} onClose={() => setTab(null)} />}
            {tab === 'staff' && <V3TeamPanel state={state} apply={applyPanel} t={t} describe={describe} />}
            {tab === 'production' && productionSection === 'lines' && (
              <>
                <V3GasolineLineCard {...cardProps} />
                <V3MidgamePanels section="lines" {...cardProps} />
              </>
            )}
            {tab === 'production' && productionSection === 'stock' && (
              <>
                <V3SupplyPanel {...cardProps} />
                <V3MidgamePanels section="stock" {...cardProps} />
              </>
            )}
            {tab === 'production' && productionSection === 'rnd' && (
              <>
                <V3GasolineDevelopmentCard {...cardProps} />
                <V3MidgamePanels section="rnd" {...cardProps} />
              </>
            )}
            {tab === 'production' && productionSection === 'market' && <V3MarketPanel state={state} t={t} />}
            {tab === 'clients' && clientSection === 'job' && <V3ActiveJobCard {...cardProps} />}
            {tab === 'clients' && clientSection === 'offers' && <V3OffersPanel {...cardProps} />}
            {tab === 'clients' && clientSection === 'expo' && <V3ExpoPanel {...cardProps} />}
            {tab === 'company' && companySection === 'overview' && (
              <>
                <V3RecoveryCard {...cardProps} onReviewRemoval={confirmDemolish} />
                <V3CampaignPanel state={state} t={t} />
                <V3FamePanel state={state} t={t} />
                <V3SpecializationCard {...cardProps} />
              </>
            )}
            {tab === 'company' && companySection === 'ranking' && <V3RankingPanel state={state} t={t} />}
            {tab === 'company' && companySection === 'inbox' && <V3InboxPanel state={state} apply={applyPanel} t={t} />}
            {tab === 'company' && companySection === 'finance' && <V3LedgerCard state={state} t={t} />}
          </ScrollView>
        </View>
      )}

      <View style={styles.tabBar}>
        {tabs.map((entry) => (
          <Pressable key={entry.key} style={[styles.tabButton, tab === entry.key && styles.tabActive]} onPress={() => setTab(tab === entry.key ? null : entry.key)}>
            <V3NavGlyph kind={entry.key} />
            <Text style={styles.tabLabel}>{t(entry.label)}</Text>
            {entry.key === 'company' && state.inbox.items.length > 0 && <View style={styles.badge} />}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  hudBrand: { color: pixelUi.text, fontFamily: fonts.brandDisplay, fontSize: 16, flexShrink: 1 },
  chapterBadge: { paddingHorizontal: 5, backgroundColor: pixelUi.surfaceRaised, borderWidth: 2, borderColor: pixelUi.border },
  chapterText: { color: pixelUi.accent, fontFamily: fonts.brandHeading, fontSize: 11 },
  hudDate: { color: pixelUi.textMuted, fontFamily: fonts.brandHeading, fontSize: 11 },
  hudSettings: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: pixelUi.surfaceRaised, borderWidth: 2, borderColor: pixelUi.border },
  hudSettingsText: { color: pixelUi.text, fontFamily: fonts.brandHeading, fontSize: 18 },
  tabPlantGlyph: { width: 33, height: 29 },
  tabStaffGlyph: { width: 28, height: 28, borderWidth: 1, borderColor: pixelUi.border },
  tabSymbol: { color: pixelUi.accent, fontFamily: fonts.brandDisplay, fontSize: 23, height: 29 },
  tabChart: { width: 30, height: 29, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  tabChartBar: { width: 6, backgroundColor: pixelUi.accent },
  hud: { backgroundColor: pixelUi.canvas, paddingHorizontal: 8, paddingVertical: 5, gap: 3, borderBottomWidth: 3, borderBottomColor: pixelUi.border },
  hudRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, minHeight: 31, borderBottomWidth: 1, borderBottomColor: pixelUi.borderSoft },
  hudMoney: { color: pixelUi.accent, fontFamily: fonts.brandHeading, fontSize: 19 },
  hudItem: { color: pixelUi.text, fontFamily: fonts.brandHeading, fontSize: 12 },
  hudPress: { flexShrink: 1 },
  hudSmall: { color: pixelUi.textMuted, fontFamily: fonts.brandHeading, fontSize: 10, flexShrink: 1 },
  speedChip: { minWidth: 30, minHeight: 28, borderRadius: 2, borderWidth: 2, borderColor: pixelUi.border, alignItems: 'center', justifyContent: 'center', backgroundColor: pixelUi.surfaceRaised },
  speedText: { color: pixelUi.text, fontFamily: fonts.brandHeading, fontSize: 11 },
  mapArea: { flex: 1 },
  goalBanner: { position: 'absolute', top: 8, left: 8, right: 8, backgroundColor: pixelUi.surface, borderRadius: 2, borderWidth: 2, borderColor: pixelUi.border, padding: 8, gap: 3 },
  goalTitle: { color: pixelUi.accent, fontFamily: fonts.brandHeading, fontSize: 12 },
  goalText: { color: '#E8F0F4', fontSize: 13, lineHeight: 18 },
  goalWarning: { color: '#FFAD8A', fontSize: 12 },
  overlayBottom: { position: 'absolute', left: 8, right: 8, bottom: 8, maxHeight: '55%' },
  overlayScroll: { flexGrow: 0 },
  overlayContent: { gap: 8 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 64, height: '62%', backgroundColor: pixelUi.canvas, borderTopWidth: 3, borderColor: pixelUi.border },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  sheetTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 18 },
  sheetClose: { color: '#D5E2E9', fontSize: 20 },
  tabBar: { flexDirection: 'row', backgroundColor: pixelUi.canvas, borderTopWidth: 3, borderTopColor: pixelUi.border, height: 64 },
  tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, borderRightWidth: 1, borderRightColor: pixelUi.borderSoft },
  tabActive: { backgroundColor: pixelUi.surfaceRaised, borderBottomWidth: 3, borderBottomColor: pixelUi.accent },
  tabIcon: { fontSize: 20 },
  tabLabel: { color: pixelUi.textMuted, fontSize: 11, fontFamily: fonts.brandHeading },
  badge: { position: 'absolute', top: 8, right: '28%', width: 9, height: 9, borderRadius: 5, backgroundColor: '#FF6B5B' },
  speedRow: { flexDirection: 'row', gap: 2 },
  speedButton: { flex: 1 },
  speedTextActive: { color: pixelUi.canvas },
  speedActive: { borderColor: '#FFE77C', backgroundColor: pixelUi.accent },
  safe: { flex: 1, backgroundColor: pixelUi.canvas },
  loading: { flex: 1, backgroundColor: '#071C2D', alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#244A63', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { color: '#6ACDB4', fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.5 },
  title: { color: '#F4F7F8', fontFamily: fonts.display, fontSize: 22 },
  back: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 13 },
  segments: { paddingHorizontal: spacing.lg, paddingTop: 8 },
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
  primary: { backgroundColor: pixelUi.accent, borderRadius: 2, borderWidth: 2, borderColor: '#FFE77C', paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  primaryText: { color: '#0A2943', fontFamily: fonts.heading, fontSize: 13 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 11, alignItems: 'center' },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  errorCard: { margin: spacing.lg, backgroundColor: '#2C2230', borderRadius: 10, padding: spacing.lg, gap: spacing.md },
  errorTitle: { color: '#FFB4B4', fontFamily: fonts.heading, fontSize: 17 },
})
