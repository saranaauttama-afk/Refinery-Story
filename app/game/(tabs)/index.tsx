import { useState, useEffect } from 'react'
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { Bell, Clock3 } from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import DeliveryTruck from '../../../src/components/DeliveryTruck'
import BottomNav from '../../../src/components/BottomNav'
import { type FabNavItem } from '../../../src/components/FabNav'
import OnboardingOverlay from '../../../src/components/OnboardingOverlay'
import CrisisBanner from '../../../src/components/CrisisBanner'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import ListRow from '../../../src/components/ListRow'
import ProgressBar from '../../../src/components/ProgressBar'
import Sheet from '../../../src/components/Sheet'
import { BUILDING_CATEGORY_BY_TYPE, BUILDING_CATEGORY_ACCENT, BUILDING_CATEGORY_SURFACE } from '../../../src/buildingIdentity'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useGame } from '../../../src/hooks/GameContext'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { useSound } from '../../../src/hooks/useSound'
import { useLang } from '../../../src/hooks/SettingsContext'
import { colors, radii, spacing, fonts, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import GameIcon from '../../../src/components/GameIcon'
import { text } from '../../../src/game/translations'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDING_UPGRADE_BALANCE, PLANT_PRODUCTION, GRID_EDIT_BALANCE, EXPANSION_BALANCE, STANDING_ORDER_BALANCE, MAX_REFINERY_LEVEL } from '../../../src/game/data/balance'
import type { BuildingType, DerivedStats } from '../../../src/game/types'
import {
  CRUDE_COST,
  getBuildingEffectLines,
  getCellAssignedToEmployee,
  getContractProgress,
  getComboHintCells,
  getEmployeeAssignedToCell,
  getProductSellPrice,
  formatGameClockTime,
  getSeasonLabel,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  getUpgradeBlockers,
  getUpgradeReputationRequirement,
  getUpgradeResearchRequirement,
  getRefineryTitle,
  TICK_MS,
} from '../../../src/game/utils/gameCalculations'
import FactoryDiamondGroundView from '../../../src/components/FactoryDiamondGroundView'


// The cleaned diamond-ground renderer is now the live review surface for
// Factory on this branch. The original grid and the other experimental
// renderers still remain available in code for fallback and comparison,
// but this review pass uses diamond ground as the default experience.

// Compute what unlocks at the next refinery level
function getNextLevelUnlocks(nextLevel: number): string[] {
  const unlocks: string[] = []
  // Buildings
  const BUILDING_UNLOCK_NAMES: Partial<Record<number, string[]>> = {
    4:  ['Laboratory'],
    5:  ['Lubricant Plant', 'Power Plant'],
    6:  ['Maintenance Workshop'],
    7:  ['Sales Office', 'Jet Fuel Tank', 'Lubricant Tank', 'Petrochem Tank'],
    8:  ['Waste Treatment Plant', 'Recycling Bunker'],
    10: ['Jet Fuel Plant'],
    12: ['Pellet Silo'],
    15: ['Petrochemical Plant'],
    20: ['Polymer Plant'],
  }
  if (BUILDING_UNLOCK_NAMES[nextLevel]) {
    unlocks.push(...BUILDING_UNLOCK_NAMES[nextLevel]!.map((n) => `🏭 ${n}`))
  }
  // Eras
  const ERA_NAMES: Partial<Record<number, string>> = {
    7: 'Expansion Era unlocks',
    13: 'Modern Era unlocks',
    18: 'Energy Transition Era unlocks',
  }
  if (ERA_NAMES[nextLevel]) unlocks.push(`🌍 ${ERA_NAMES[nextLevel]}`)
  // Expansion
  const EXPANSION_UNLOCK: Partial<Record<number, string>> = {
    3: 'Grid expansion to 4×4',
    5: 'Grid expansion to 5×5',
    8: 'Grid expansion to 6×6',
  }
  if (EXPANSION_UNLOCK[nextLevel]) unlocks.push(`📐 ${EXPANSION_UNLOCK[nextLevel]}`)
  // Hiring cap
  if ((nextLevel - 2) % 3 === 0 && nextLevel > 2) unlocks.push('👥 Hiring cap +1 per role')
  return unlocks
}

const BUILDING_KEYS = Object.keys(BUILDINGS) as BuildingType[]

// Plant art thumbnails used in build + info sheets
const PLANT_THUMB_BY_LEVEL: Partial<Record<BuildingType, Record<number, ReturnType<typeof require>>>> = {
  crudeTank:           { 1: require('../../../assets/plants/crude_tank_lv1.png'), 2: require('../../../assets/plants/crude_tank_lv2.png'), 3: require('../../../assets/plants/crude_tank_lv3.png') },
  distillationUnit:    { 1: require('../../../assets/plants/distillation_unit_lv1.png'), 2: require('../../../assets/plants/distillation_unit_lv2.png'), 3: require('../../../assets/plants/distillation_unit_lv3.png') },
  productTank:         { 1: require('../../../assets/plants/product_tank_lv1.png'), 2: require('../../../assets/plants/product_tank_lv2.png'), 3: require('../../../assets/plants/product_tank_lv3.png') },
  laboratory:          { 1: require('../../../assets/plants/laboratory_lv1.png'), 2: require('../../../assets/plants/laboratory_lv2.png'), 3: require('../../../assets/plants/laboratory_lv3.png') },
  maintenanceWorkshop: { 1: require('../../../assets/plants/maintenance_workshop_lv1.png'), 2: require('../../../assets/plants/maintenance_workshop_lv2.png'), 3: require('../../../assets/plants/maintenance_workshop_lv3.png') },
  salesOffice:         { 1: require('../../../assets/plants/sales_office_lv1.png'), 2: require('../../../assets/plants/sales_office_lv2.png'), 3: require('../../../assets/plants/sales_office_lv3.png') },
  lubricantPlant:      { 1: require('../../../assets/plants/lubricant_plant_lv1.png'), 2: require('../../../assets/plants/lubricant_plant_lv2.png'), 3: require('../../../assets/plants/lubricant_plant_lv3.png') },
  jetFuelPlant:        { 1: require('../../../assets/plants/jet_fuel_plant_lv1.png'), 2: require('../../../assets/plants/jet_fuel_plant_lv2.png'), 3: require('../../../assets/plants/jet_fuel_plant_lv3.png') },
  petrochemicalPlant:  { 1: require('../../../assets/plants/petrochemical_plant_lv1.png'), 2: require('../../../assets/plants/petrochemical_plant_lv2.png'), 3: require('../../../assets/plants/petrochemical_plant_lv3.png') },
  powerPlant:          { 1: require('../../../assets/plants/power_plant_lv1.png'), 2: require('../../../assets/plants/power_plant_lv2.png'), 3: require('../../../assets/plants/power_plant_lv3.png') },
  wasteTreatmentPlant: { 1: require('../../../assets/plants/waste_treatment_plant_lv1.png'), 2: require('../../../assets/plants/waste_treatment_plant_lv2.png'), 3: require('../../../assets/plants/waste_treatment_plant_lv3.png') },
  polymerPlant:        { 1: require('../../../assets/plants/polymer_plant_lv1.png'), 2: require('../../../assets/plants/polymer_plant_lv2.png'), 3: require('../../../assets/plants/polymer_plant_lv3.png') },
  lubricantTank:       { 1: require('../../../assets/plants/lubricant_tank_lv1.png'), 2: require('../../../assets/plants/lubricant_tank_lv2.png'), 3: require('../../../assets/plants/lubricant_tank_lv3.png') },
  jetFuelTank:         { 1: require('../../../assets/plants/jet_fuel_tank_lv1.png'), 2: require('../../../assets/plants/jet_fuel_tank_lv2.png'), 3: require('../../../assets/plants/jet_fuel_tank_lv3.png') },
  petrochemicalTank:   { 1: require('../../../assets/plants/petrochemical_tank_lv1.png'), 2: require('../../../assets/plants/petrochemical_tank_lv2.png'), 3: require('../../../assets/plants/petrochemical_tank_lv3.png') },
  recyclingBunker:     { 1: require('../../../assets/plants/recycling_bunker_lv1.png'), 2: require('../../../assets/plants/recycling_bunker_lv2.png'), 3: require('../../../assets/plants/recycling_bunker_lv3.png') },
  pelletSilo:          { 1: require('../../../assets/plants/pellet_silo_lv1.png'), 2: require('../../../assets/plants/pellet_silo_lv2.png'), 3: require('../../../assets/plants/pellet_silo_lv3.png') },
}

// Plant art thumbnails (lv1) used in build sheet
const PLANT_THUMB: Partial<Record<BuildingType, ReturnType<typeof require>>> = {
  crudeTank:           require('../../../assets/plants/crude_tank_lv1.png'),
  distillationUnit:    require('../../../assets/plants/distillation_unit_lv1.png'),
  productTank:         require('../../../assets/plants/product_tank_lv1.png'),
  laboratory:          require('../../../assets/plants/laboratory_lv1.png'),
  maintenanceWorkshop: require('../../../assets/plants/maintenance_workshop_lv1.png'),
  salesOffice:         require('../../../assets/plants/sales_office_lv1.png'),
  lubricantPlant:      require('../../../assets/plants/lubricant_plant_lv1.png'),
  jetFuelPlant:        require('../../../assets/plants/jet_fuel_plant_lv1.png'),
  petrochemicalPlant:  require('../../../assets/plants/petrochemical_plant_lv1.png'),
  powerPlant:          require('../../../assets/plants/power_plant_lv1.png'),
  wasteTreatmentPlant: require('../../../assets/plants/waste_treatment_plant_lv1.png'),
  polymerPlant:        require('../../../assets/plants/polymer_plant_lv1.png'),
  lubricantTank:       require('../../../assets/plants/lubricant_tank_lv1.png'),
  jetFuelTank:         require('../../../assets/plants/jet_fuel_tank_lv1.png'),
  petrochemicalTank:   require('../../../assets/plants/petrochemical_tank_lv1.png'),
  recyclingBunker:     require('../../../assets/plants/recycling_bunker_lv1.png'),
  pelletSilo:          require('../../../assets/plants/pellet_silo_lv1.png'),
}

// Category display config
const CATEGORY_LABEL: Record<string, string> = {
  storage: 'Storage', production: 'Production', research: 'Research',
  support: 'Support', power: 'Power', waste: 'Recycling',
}

// Extra build requirements (beyond level and cost)
const BUILD_REQUIRES: Partial<Record<BuildingType, string>> = {
  lubricantPlant:      'Needs feedstock from Distillation Unit',
  jetFuelPlant:        'Needs feedstock + electricity',
  petrochemicalPlant:  'Needs feedstock + electricity',
  powerPlant:          'Consumes crude oil',
  wasteTreatmentPlant: 'Converts waste → recycled material',
  polymerPlant:        'Needs petrochemicals + electricity',
  lubricantTank:       'Stores lubricants overflow',
  jetFuelTank:         'Stores jet fuel overflow',
  petrochemicalTank:   'Stores petrochemicals overflow',
  recyclingBunker:     'Stores recycled material overflow',
  pelletSilo:          'Stores plastic pellets overflow',
}
const UPGRADEABLE: BuildingType[] = [
  'crudeTank',
  'distillationUnit',
  'productTank',
  'laboratory',
  'maintenanceWorkshop',
  'salesOffice',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
  'polymerPlant',
]

const PRODUCT_PLANT_BUILDING: Record<
  'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets',
  BuildingType
> = {
  lubricants: 'lubricantPlant',
  jetFuel: 'jetFuelPlant',
  petrochemicals: 'petrochemicalPlant',
  recycledMaterial: 'wasteTreatmentPlant',
  plasticPellets: 'polymerPlant',
}

function PRODUCT_MAX_STORAGE(
  derived: DerivedStats,
  key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets',
): number {
  switch (key) {
    case 'lubricants':      return derived.maxLubricantsStorage
    case 'jetFuel':         return derived.maxJetFuelStorage
    case 'petrochemicals':  return derived.maxPetrochemicalsStorage
    case 'recycledMaterial':return derived.maxRecycledMaterialStorage
    case 'plasticPellets':  return derived.maxPlasticPelletsStorage
  }
}

// ── Scene geometry constants ──────────────────────────────────────────────────
const SKY_RATIO    = 0.08   // สัดส่วนความสูงฟ้า (0.0–1.0) → กำหนดตำแหน่ง HUD + Grid
const HORIZON_H    = 8    // px — ความสูง horizon strip (ถ้าไม่ใช้ bg รูปก็ set 0 ได้)
const RESOURCE_H   = 48    // px — resource dock height
const FLOW_H       = 22    // px — slim flow-rate strip (net $/min + output/min)
const GOAL_H       = 26    // px — slim goal banner height
const RESOURCE_DOCK_H = 52 // px — dark resource dock card height
const ACTION_DOCK_H   = 48 // px — bottom action dock height

// ── Layout tweaks (ปรับ UI position ตรงนี้ได้เลย) ───────────────────────────
const HUD_OFFSET_UP  = 4  // px — HUD (resource dock) ขยับขึ้นจาก yardTop
const GOAL_LEFT      = 18  // px — "Growing Refinery" banner ห่างจากขอบซ้าย/ขวา
const BG_CROP_PCT    = 12  // % — crop ขอบบน/ล่างของ bg image (แสดงส่วนกลางรูป)
const GRID_DROP      = 90  // px — ดัน factory grid ลงจาก HUD (กันไม่ให้ลอยสูงไป)

export default function RefineryScreen() {
  const router = useRouter()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const sound = useSound()
  const {
    game, loaded, derived,
    buyCrude, sellGasoline, sellProduct,
    placeBuilding, demolishBuilding, moveBuilding, swapBuildings,
    claimHiddenEvent, upgradeBuilding, upgradeRefinery,
    autoTrade, updateAutoTrade, activateBoost,
    adjustFeedstockPriority, assignEmployeeToCell, unassignCell,
    speed, cycleSpeed, flowRates,
  } = useGame()
  const { fixCrisis, ignoreCrisis } = useGame()
  const { t } = useLang()

  // All hooks before any early returns
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [pickerCell, setPickerCell] = useState<number | null>(null)
  const [infoCell,   setInfoCell]   = useState<number | null>(null)
  const [hoveredBuildingKey, setHoveredBuildingKey] = useState<BuildingType | null>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('onboarding_done').then((val) => {
      if (!val) setShowOnboarding(true)
    })
  }, [])

  const handleDismissOnboarding = () => {
    setShowOnboarding(false)
    AsyncStorage.setItem('onboarding_done', '1')
  }
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [gridEditMode, setGridEditMode] = useState<{ type: 'move' | 'swap'; fromIndex: number } | null>(null)
  // Drives the unified Trade panel's expand/collapse (Buy/Sell + Auto-
  // trade combined into one floating panel above the tab bar -- replaces
  // the old separate "Automation" sheet, which was dead code ({false &&
  // ...}) on this branch, and the old always-expanded Buy/Sell button
  // pair). Starts collapsed.
  const [tradePanelOpen, setTradePanelOpen] = useState(false)
  const toggleTradePanel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setTradePanelOpen((v) => !v)
  }

  // updateAutoTrade does a shallow merge ({ ...current, ...partial }), so
  // passing a fresh productSellThresholds object would WIPE OUT every
  // other product's customized threshold, not just set this one -- this
  // helper merges into the existing per-product map first.
  const adjustProductSellThreshold = (
    key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets',
    delta: number,
  ) => {
    const current = autoTrade.productSellThresholds[key] ?? 80
    const next = Math.min(100, Math.max(0, current + delta))
    updateAutoTrade({ productSellThresholds: { ...autoTrade.productSellThresholds, [key]: next } })
  }
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  // Drives the delivery-truck flyby on the yard: bump the counter on a trade
  // and stamp the direction (crude in / gasoline out).
  const [truck, setTruck] = useState<{ key: number; direction: 'in' | 'out' }>({ key: 0, direction: 'in' })
  const sendTruck = (direction: 'in' | 'out') =>
    setTruck((t) => ({ key: t.key + 1, direction }))

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  // ── Scene geometry (computed once per render) ─────────────────────────────
  // The SafeAreaView with edges={['top']} adds paddingTop = insets.top, so
  // the scene View fills exactly (screenHeight - insets.top).
  const sceneHeight = height - insets.top
  const skyH        = Math.round(sceneHeight * SKY_RATIO)
  // Where the yard background starts (absolute y within scene)
  const yardTop     = skyH + HORIZON_H
  // Resource strip straddles the sky / yard boundary
  const resourceTop = yardTop - Math.floor(RESOURCE_H / 2) - HUD_OFFSET_UP
  // Flow-rate strip sits directly under the resource dock...
  const flowTop     = resourceTop + RESOURCE_H + 6
  // ...and the goal panel sits just below that, inside the yard
  const goalTop     = flowTop + FLOW_H + 6

  // ── Derived game values ───────────────────────────────────────────────────
  const seasonLabel        = getSeasonLabel(game.tickCount, game.yearStartTick)
  const seasonPct          = Math.round(derived.seasonalGasolineMultiplier * 100)
  const claimableHiddenEvents = HIDDEN_EVENTS.filter((e) => game.hiddenEventStatus[e.key] === 'unlocked')
  const firstEmptyCellIndex   = game.grid.findIndex((cell) => cell === null)
  const timeLabel          = `${formatGameClockTime(derived.gameClock)} · Day ${derived.gameClock.dayOfMonth + 1}`
  const isDaytime          = derived.gameClock.isDaytime

  // ── Flow-rate strip (net $/min + output/min) ──────────────────────────────
  // Surfaces the *trend* the rich sim produces — without this the HUD only
  // ever showed stocks, so the market/morale/specialization systems were
  // invisible. Both numbers come from real state deltas (see useGameLoop).
  const moneyRate = flowRates.moneyPerMin
  const gasRate   = flowRates.gasPerMin
  const fmtMoneyRate = (n: number) => {
    const sign = n > 0 ? '+' : n < 0 ? '−' : ''
    const abs = Math.abs(n)
    const v = abs >= 1000 ? `${(abs / 1000).toFixed(1)}k` : `${abs}`
    return `${sign}$${v}`
  }
  const flowState: 'profit' | 'loss' | 'idle' =
    gasRate <= 0 && moneyRate === 0 ? 'idle' : moneyRate >= 0 ? 'profit' : 'loss'
  const flowStateLabel =
    flowState === 'profit' ? t(text.hud.flowProfit)
    : flowState === 'loss' ? t(text.hud.flowLoss)
    : t(text.hud.flowIdle)

  const refineryTitle = t(getRefineryTitle(game.refineryLevel))

  // Combo hint cells — tiles that would complete an undiscovered combo
  const comboHintCells = hoveredBuildingKey && pickerCell !== null
    ? getComboHintCells(game.grid, game.discoveredCombos, pickerCell, hoveredBuildingKey)
    : []

  // FAB badge counts
  const contractsReady = derived.activeContracts.filter((c) => {
    if (!c.isUnlocked || c.isCompleted) return false
    const { have, need } = getContractProgress(c, game)
    return have >= need
  }).length
  const staffReady = game.recruitmentPool.length > 0 ? 1 : 0
  const researchReady = derived.activeResearchItems.filter(
    (i) => !i.isUnlocked && i.isVisible && game.researchPoints >= i.cost
  ).length

  const standaloneReady = STANDING_ORDER_BALANCE.filter((order) => {
    if (game.refineryLevel < order.unlockLevel) return false
    const key = order.key as keyof typeof game.standingOrderCooldowns
    const pKey = order.productKey as keyof typeof game.productInventory
    const cooldownAt = game.standingOrderCooldowns[key]
    return !(cooldownAt !== undefined && cooldownAt > game.tickCount) &&
      (game.productInventory[pKey] as number) >= order.required
  }).length

  const FAB_ITEMS: FabNavItem[] = [
    { route: '/game',             icon: '🏭', label: t(text.nav.factory) },
    { route: '/game/contracts',   icon: '📋', label: t(text.nav.contracts), badge: contractsReady || undefined },
    { route: '/game/supply',      icon: '🛢',  label: t(text.nav.supply),    badge: standaloneReady || undefined },
    { route: '/game/recruit',     icon: '👥', label: t(text.nav.recruit),   badge: staffReady || undefined },
    { route: '/game/research',    icon: '🔬', label: t(text.nav.research),  badge: researchReady || undefined },
    { route: '/game/company',     icon: '🏢', label: t(text.nav.company) },
  ]
  // The slow-moving meters live in the "More Info" sheet (one tap on the Rep
  // stat) so the always-on dock can stay focused on the core economic loop.
  // Their *effect* is still visible at a glance via the flow-rate bar.
  const specValue = game.specialization
    ? (game.specialization === 'green' ? t(text.hud.green) : t(text.hud.industrial))
    : t(text.hud.specNone)
  const secondaryStats = [
    { label: t(text.hud.esg),            value: `${Math.round(game.esgScore)}/100` },
    { label: t(text.hud.morale),         value: `${Math.round(game.staffMorale)}/100` },
    { label: t(text.hud.specialization), value: specValue },
    { label: t(text.hud.feedstock),      value: `${game.feedstock}/${derived.maxFeedstockStorage}` },
    { label: t(text.hud.season),         value: `${t(seasonLabel)} · ${seasonPct}%` },
    { label: t(text.hud.era),            value: t(derived.currentEra.name) },
  ]
  // Nudge dot on the More Info toggle when a hidden meter needs attention.
  const secondaryAlert = game.esgScore < 40 || game.staffMorale < 40

  const handleCellPress = (index: number) => {
    if (gridEditMode) {
      if (gridEditMode.type === 'move') moveBuilding(gridEditMode.fromIndex, index)
      else                               swapBuildings(gridEditMode.fromIndex, index)
      setGridEditMode(null)
      return
    }
    if (game.grid[index] === null) setPickerCell(index)
    else                           setInfoCell(index)
  }

  const upgradeCost                = getUpgradeCost(game.refineryLevel)
  const upgradeProductionRequired  = getUpgradeProductionRequirement(game.refineryLevel)
  const hasEnoughMoney             = game.money >= upgradeCost
  const hasEnoughProduction        = game.totalGasolineProduced >= upgradeProductionRequired
  const upgradeBlockers            = getUpgradeBlockers(game)
  const isMaxLevel                 = game.refineryLevel >= MAX_REFINERY_LEVEL
  const canUpgrade                 = !isMaxLevel && upgradeBlockers.length === 0
  const nextGoal                   = derived.activeMilestones.find((m) => !m.isCompleted)

  const products: {
    key: 'lubricants' | 'jetFuel' | 'petrochemicals' | 'recycledMaterial' | 'plasticPellets'
    label: string; color: string
  }[] = [
    { key: 'lubricants',       label: 'Lubricants',  color: colors.goldDark },
    { key: 'jetFuel',          label: 'Jet Fuel',    color: colors.blue },
    { key: 'petrochemicals',   label: 'Petrochem',   color: colors.purple },
    { key: 'recycledMaterial', label: 'Recycled',    color: colors.greenDark },
    { key: 'plasticPellets',   label: 'Pellets',     color: colors.teal },
  ]

  const safeGame    = game
  const safeDerived = derived

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Layered scene composition
  //
  // Layer 0 (z:0)  — Background: absoluteFill, sky + yard split, pointerEvents none
  // Layer 1 (z:10) — Grid: absolute, top=yardTop, ScrollView inside
  // Layer 2 (z:20) — HUD: name/level top-left; time/events top-right
  // Layer 3 (z:20) — Resource strip + goal panel, straddle sky/yard boundary
  // Layer 4 (z:20) — Buy/Sell floating above bottom nav
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      <View style={styles.scene}>

        {/* ── Layer 0: Background (absoluteFill, no pointer events) ─────── */}
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Image
            source={require('../../../assets/bg/ground_day_1.png')}
            style={{ position: 'absolute', top: `-${BG_CROP_PCT}%`, bottom: `-${BG_CROP_PCT}%`, left: 0, right: 0 }}
            resizeMode="cover"
          />
        </View>

        {/* Night veil */}
        {!isDaytime && (
          <View style={[StyleSheet.absoluteFill, styles.nightOverlay]} pointerEvents="none" />
        )}

        {/* ── Layer 1: Grid (absolute, pushed down from HUD by GRID_DROP) ── */}
        <View style={[styles.gridLayer, { top: yardTop + GRID_DROP }]}>
          <FactoryDiamondGroundView
            game={game}
            derived={derived}
            grid={game.grid}
            gridLevels={game.gridLevels}
            containerWidth={width}
            viewportHeight={sceneHeight - yardTop - GRID_DROP}
            displayGridSize={11}
            anchorGridSize={EXPANSION_BALANCE[0].size}
            onCellPress={handleCellPress}
            isActive={game.crudeOil > 0}
          />
          {gridEditMode && (
            <Pressable style={styles.hintOverlay} onPress={() => setGridEditMode(null)}>
              <Text style={styles.hintActive}>
                {gridEditMode.type === 'move'
                  ? 'Tap empty tile to move there'
                  : 'Tap a building to swap with'}
                {' · tap here to cancel'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Delivery truck flyby — crude in / gasoline out on each trade */}
        <DeliveryTruck
          triggerKey={truck.key}
          direction={truck.direction}
          sceneWidth={width}
          y={sceneHeight * 0.6}
        />

        {/* ── Layer 2 + 3: Company block + Resource Dock + Goal ─────────── */}

        {/* Company block — top left: name + title */}
        <View style={styles.companyBlock}>
          <Text style={styles.companyName} numberOfLines={1}>{game.refineryName}</Text>
          <Text style={styles.companyTitle}>{refineryTitle}</Text>
        </View>

        {/* Top right: Lv badge (tappable upgrade) + time + events bell */}
        <View style={styles.topRightHud}>
          <AnimatedPressable
            style={[styles.lvBadge, canUpgrade && styles.lvBadgeReady, isMaxLevel && styles.lvBadgeMaxed]}
            onPress={() => setUpgradeModalOpen(true)}
          >
            <Text style={styles.lvBadgeText}>
              {isMaxLevel ? '🏆 Lv20' : `Lv${game.refineryLevel}${canUpgrade ? ' ↑' : ''}`}
            </Text>
          </AnimatedPressable>
          <View style={styles.timePill}>
            <Clock3 size={11} color={isDaytime ? colors.orangeDark : colors.blueDark} />
            <Text style={styles.timePillText}>{timeLabel}</Text>
          </View>
          {/* Speed / pause control (Kairosoft-style): cycles 1× → 2× → 3× → ⏸ */}
          <Pressable
            style={[styles.speedPill, speed === 0 && styles.speedPillPaused]}
            onPress={() => { haptics.tap(); cycleSpeed() }}
          >
            <Text style={[styles.speedPillText, speed === 0 && styles.speedPillTextPaused]}>{speed === 0 ? '⏸' : `${speed}×`}</Text>
          </Pressable>
          <Pressable style={styles.eventsBtn} onPress={() => setEventModalOpen(true)}>
            <Bell size={13} color={colors.white} />
            {claimableHiddenEvents.length > 0 && (
              <View style={styles.eventsBadge}>
                <Text style={styles.eventsBadgeLabel}>{claimableHiddenEvents.length}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Resource dock — dark card straddling sky/yard boundary */}
        <View style={[styles.resourceDock, { top: resourceTop }]}>
          <View style={styles.dockStat}>
            <GameIcon name="money" size={22} />
            <Text style={styles.dockVal}>${(game.money >= 1000 ? `${(game.money/1000).toFixed(1)}k` : Math.floor(game.money).toString())}</Text>
            <Text style={styles.dockLabel}>{t(text.hud.money)}</Text>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockStat}>
            <GameIcon name="crude" size={22} />
            <Text style={[styles.dockVal, game.crudeOil === 0 && styles.dockValWarn]}>{game.crudeOil}</Text>
            <Text style={styles.dockLabel}>{t(text.hud.crude)}</Text>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockStat}>
            <GameIcon name="gas" size={22} />
            <Text style={styles.dockVal}>{game.gasoline}</Text>
            <Text style={styles.dockLabel}>{t(text.hud.gas)}</Text>
          </View>
          <View style={styles.dockDivider} />
          {/* Rep doubles as the "More Info" toggle — ESG / Morale / Specialization
              and the rest of the slow meters live one tap away to keep the dock
              focused on the core loop. Alert dot flags a meter that needs eyes. */}
          <Pressable style={styles.dockStat} onPress={() => setSecondaryOpen((v) => !v)}>
            <View style={styles.dockToggleIconWrap}>
              <GameIcon name="reputation" size={22} />
              {secondaryAlert && <View style={styles.dockAlertDot} />}
            </View>
            <Text style={styles.dockVal}>{Math.floor(game.reputation)}</Text>
            <Text style={styles.dockLabel}>{t(text.hud.rep)} ⋯</Text>
          </Pressable>
        </View>

        {/* Flow-rate strip — net $/min + output/min, the "is my factory
            working / profitable" glance the stock-only dock never gave. */}
        <View style={[styles.flowStrip, { top: flowTop }]}>
          <View style={styles.flowItem}>
            <View style={[styles.flowDot, flowState === 'profit' ? styles.flowDotProfit : flowState === 'loss' ? styles.flowDotLoss : styles.flowDotIdle]} />
            <Text style={styles.flowState} numberOfLines={1}>{flowStateLabel}</Text>
          </View>
          <View style={styles.flowItem}>
            <Text style={[styles.flowVal, moneyRate > 0 ? styles.flowValUp : moneyRate < 0 ? styles.flowValDown : styles.flowValFlat]}>
              {fmtMoneyRate(moneyRate)}
            </Text>
            <Text style={styles.flowUnit}>{t(text.hud.net)}{t(text.hud.perMin)}</Text>
          </View>
          <View style={styles.flowItem}>
            <GameIcon name="gas" size={15} />
            <Text style={styles.flowVal}>{gasRate > 0 ? `+${gasRate}` : gasRate}</Text>
            <Text style={styles.flowUnit}>{t(text.hud.output)}{t(text.hud.perMin)}</Text>
          </View>
        </View>

        {/* Goal banner — slim, sits just inside yard */}
        {nextGoal && (
          <Pressable
            style={[styles.goalBanner, { top: goalTop }]}
            onPress={() => router.push('/achievements')}
          >
            <Text style={styles.goalBannerText} numberOfLines={1}>
              🎯 {t(nextGoal.name)}
            </Text>
            {nextGoal.progress ? (
              <Text style={styles.goalBannerProgress}>
                {nextGoal.progress.current.toLocaleString()}/{nextGoal.progress.target.toLocaleString()}
              </Text>
            ) : null}
          </Pressable>
        )}

        {/* ── Layer 4: Unified Trade panel (Buy/Sell + Auto-trade) ──────────
            Replaces the old always-full-size Buy/Sell button pair. Per
            feedback: those buttons are only really needed in the first
            few minutes before Auto-trade gets turned on, after which
            they're just large dead space sitting above the tab bar. Now
            collapses to a small pill (shows the Auto-trade on/off status
            even collapsed, so that's still glanceable) and expands
            upward into the full panel -- smaller Buy/Sell buttons plus
            the Auto-trade toggle/thresholds in the same place, instead
            of a separate Automation sheet.

            The expanded panel renders inside a Modal (not just another
            absolutely-positioned View) -- per feedback that expanding it
            covered up other floating buttons/menus behind it. React
            Navigation's tab bar (and possibly other screen-level
            absolutely-positioned HUD) doesn't reliably respect zIndex
            against a plain View, a known cross-platform RN/React
            Navigation quirk; Modal always renders in its own top-level
            layer above the navigator, which is why Sheet.tsx already
            uses one for the build/info sheets. Made transparent with no
            backdrop dimming (unlike Sheet's full-screen takeover) and
            its content positioned to visually sit right above the pill,
            so it still reads as "this panel belongs to that pill" rather
            than a disconnected modal. */}
        {/* ── Action Dock — gasoline context + AUTO badge + trade toggle ── */}
        {/* Sits just above the persistent BottomNav (height 56 + safe-area). */}
        <View style={[styles.actionDock, { bottom: 66 + insets.bottom }]} pointerEvents="box-none">
          <View style={styles.actionDockLeft}>
            <Text style={styles.actionDockVal}>⛽ {game.gasoline}/{derived.maxGasolineStorage}</Text>
            <Text style={styles.actionDockLabel}>Gasoline</Text>
          </View>
          <View style={styles.actionDockRight}>
            {autoTrade.enabled && (
              <View style={styles.autoBadge}>
                <Text style={styles.autoBadgeText}>AUTO</Text>
              </View>
            )}
            <Pressable style={styles.tradeDockBtn} onPress={toggleTradePanel}>
              <Text style={styles.tradeDockBtnText}>Trade {tradePanelOpen ? '▾' : '▴'}</Text>
            </Pressable>
          </View>
        </View>

        <Modal visible={tradePanelOpen} transparent animationType="fade" onRequestClose={toggleTradePanel}>
          <Pressable style={styles.tradeModalBackdrop} onPress={toggleTradePanel}>
            <View style={styles.tradeModalAnchor}>
              <Pressable style={styles.tradePanel} onPress={(e) => e.stopPropagation()}>
                <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.tradeActionsRow}>
                <AnimatedPressable
                  style={[styles.tradeActionBtn, styles.buyBtn]}
                  onPress={() => {
                    const actualBuy = Math.min(
                      10,
                      Math.floor(game.money / derived.crudePrice),
                      derived.maxCrudeStorage - game.crudeOil,
                    )
                    if (actualBuy > 0) {
                      spawnFloat(`-$${(actualBuy * derived.crudePrice).toLocaleString()}`, 'expense')
                      haptics.tap()
                      sound.play('tap')
                      sendTruck('in')
                    }
                    buyCrude(10)
                  }}
                >
                  <Text style={styles.tradeActionLabel}>Buy 10 Crude</Text>
                  {/* Dynamic Market: live spot price + cheap/pricey hint vs base */}
                  <Text style={styles.tradeActionSub}>
                    ${derived.crudePrice}/unit{' '}
                    <Text style={derived.crudePrice <= CRUDE_COST ? styles.priceCheap : styles.pricePricey}>
                      {derived.crudePrice <= CRUDE_COST ? '↓ cheap' : '↑ high'}
                    </Text>
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={[styles.tradeActionBtn, styles.sellBtn]}
                  onPress={() => {
                    const actualSell = Math.min(10, game.gasoline)
                    if (actualSell > 0) {
                      spawnFloat(`+$${(actualSell * derived.sellPrice).toLocaleString()}`, 'income')
                      haptics.tap()
                      sound.play('sell')
                      sendTruck('out')
                    }
                    sellGasoline(10)
                  }}
                >
                  <Text style={styles.tradeActionLabel}>Sell 10 Gas</Text>
                  <Text style={styles.tradeActionSub}>${derived.sellPrice}/unit</Text>
                </AnimatedPressable>
              </View>

              <View style={styles.tradeDivider} />

              <View style={styles.autoTradeHeaderRow}>
                <Text style={styles.autoTradeRowTitle}>🔄 Auto-trade</Text>
                <Switch
                  value={autoTrade.enabled}
                  onValueChange={(v) => updateAutoTrade({ enabled: v })}
                  trackColor={{ false: colors.creamBorder, true: colors.green }}
                />
              </View>
              {autoTrade.enabled && (
                <>
                  <View style={styles.thresholdRow}>
                    <Text style={styles.thresholdLabel}>Buy crude below {autoTrade.buyThreshold}%</Text>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}>
                        <Text style={styles.stepperLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{autoTrade.buyThreshold}%</Text>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ buyThreshold: Math.min(100, autoTrade.buyThreshold + 5) })}>
                        <Text style={styles.stepperLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.thresholdRow}>
                    <Text style={styles.thresholdLabel}>Sell gasoline above {autoTrade.sellThreshold}%</Text>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}>
                        <Text style={styles.stepperLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{autoTrade.sellThreshold}%</Text>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })}>
                        <Text style={styles.stepperLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* One row per secondary product the player has a plant
                      for -- e.g. building a Lubricant Plant adds a
                      "Sell lubricants above X%" row here, so Auto-trade
                      covers it without a separate manual sell-chip tap
                      every few minutes. Hidden entirely for products with
                      no plant built yet (nothing to gate a threshold on). */}
                  {products
                    .filter((p) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
                    .map((p) => {
                      const threshold = autoTrade.productSellThresholds[p.key] ?? 80
                      return (
                        <View key={p.key} style={styles.thresholdRow}>
                          <Text style={styles.thresholdLabel}>
                            Sell {p.label.toLowerCase()} above {threshold}%
                          </Text>
                          <View style={styles.stepper}>
                            <Pressable style={styles.stepperButton} onPress={() => adjustProductSellThreshold(p.key, -5)}>
                              <Text style={styles.stepperLabel}>−</Text>
                            </Pressable>
                            <Text style={styles.stepperValue}>{threshold}%</Text>
                            <Pressable style={styles.stepperButton} onPress={() => adjustProductSellThreshold(p.key, 5)}>
                              <Text style={styles.stepperLabel}>+</Text>
                            </Pressable>
                          </View>
                        </View>
                      )
                    })}
                </>
              )}
                </ScrollView>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

      </View>{/* end scene */}

      {/* ── More Info sheet ──────────────────────────────────────────────── */}
      <Sheet visible={secondaryOpen} title={t(text.hud.moreInfo)} onClose={() => setSecondaryOpen(false)}>
        {secondaryStats.map((stat) => (
          <View key={stat.label} style={styles.infoStatRow}>
            <Text style={styles.infoStatLabel}>{stat.label}</Text>
            <Text style={styles.infoStatValue}>{stat.value}</Text>
          </View>
        ))}
      </Sheet>

      {/* ── Events sheet ─────────────────────────────────────────────────── */}
      <Sheet visible={eventModalOpen} title={t(text.eventsSheet.title)} onClose={() => setEventModalOpen(false)}>
        {claimableHiddenEvents.length === 0 ? (
          <Text style={styles.eventEmpty}>
            {t(text.eventsSheet.empty)}
          </Text>
        ) : (
          claimableHiddenEvents.map((event) => {
            const isBuildingReward = event.reward.kind === 'building'
            const actionLabel =
              event.reward.kind === 'staff'    ? t(text.eventsSheet.openRecruit)   :
              event.reward.kind === 'contract' ? t(text.eventsSheet.openContracts) : t(text.eventsSheet.openBuild)
            const subtitle =
              event.reward.kind === 'staff'
                ? t(text.eventsSheet.subStaff)
                : event.reward.kind === 'contract'
                  ? t(text.eventsSheet.subContract)
                  : firstEmptyCellIndex >= 0
                    ? t(text.eventsSheet.subBuilding)
                    : t(text.eventsSheet.subBuildingNeedTile)
            return (
              <ListRow
                key={event.key}
                title={
                  event.reward.kind === 'staff'    ? t(text.eventsSheet.mysteryApplicant) :
                  event.reward.kind === 'contract' ? t(text.eventsSheet.mysteryContract)  : t(text.eventsSheet.mysteryDelivery)
                }
                subtitle={subtitle}
                badge="???"
                actionLabel={actionLabel}
                disabled={isBuildingReward && firstEmptyCellIndex < 0}
                onPress={() => {
                  setEventModalOpen(false)
                  if (event.reward.kind === 'staff')    { router.push('/game/recruit');   return }
                  if (event.reward.kind === 'contract') { router.push('/game/contracts'); return }
                  if (firstEmptyCellIndex >= 0)         setPickerCell(firstEmptyCellIndex)
                }}
              />
            )
          })
        )}
      </Sheet>

      {/* The old "Automation" sheet (Auto-trade toggle/thresholds +
          Feedstock Priority) lived here as dead code ({false && ...} --
          never rendered). Auto-trade now lives in the unified Trade
          panel above (Layer 4); Feedstock Priority already has a home in
          the Production tab (app/game/(tabs)/production.tsx), so nothing
          was lost by removing this duplicate. */}

      {/* ── Build picker ─────────────────────────────────────────────────── */}
      <Sheet visible={pickerCell !== null} title="Build" onClose={() => setPickerCell(null)}>
        {/* Mystery building events */}
        {HIDDEN_EVENTS.filter(
          (e) => e.reward.kind === 'building' && game.hiddenEventStatus[e.key] === 'unlocked',
        ).map((event) => (
          <ListRow
            key={event.key}
            title="??? Mystery Delivery"
            subtitle="Something unusual happened. Tap to find out what."
            badge="???"
            actionLabel="Reveal"
            onPress={() => claimHiddenEvent(event.key)}
          />
        ))}

        {/* Group buildings by category */}
        {(['storage', 'production', 'power', 'waste', 'research', 'support'] as const).map((category) => {
          const categoryBuildings = BUILDING_KEYS.filter(
            (key) => BUILDING_CATEGORY_BY_TYPE[key] === category,
          )
          if (categoryBuildings.length === 0) return null
          const accentColor = BUILDING_CATEGORY_ACCENT[category]
          return (
            <View key={category} style={styles.buildCategory}>
              <Text style={[styles.buildCategoryLabel, { color: accentColor }]}>
                {CATEGORY_LABEL[category]}
              </Text>
              <View style={styles.buildGrid}>
                {categoryBuildings.map((key) => {
                  const b = BUILDINGS[key]
                  const unlockLevel    = b.unlockLevel ?? 1
                  const hiddenUses     = game.hiddenBuildingUsesRemaining[key] ?? 0
                  const hasHiddenGrant = hiddenUses > 0
                  const locked         = !hasHiddenGrant && game.refineryLevel < unlockLevel
                  const affordable     = hasHiddenGrant || game.money >= b.cost
                  const canBuild       = !locked && affordable
                  const thumb          = PLANT_THUMB[key]
                  const extraReq       = BUILD_REQUIRES[key]
                  const surfaceColor   = BUILDING_CATEGORY_SURFACE[category]

                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.buildCard,
                        { borderColor: canBuild ? accentColor : locked ? '#D0C8BC' : '#C5D5B0' },
                        locked && styles.buildCardLocked,
                        canBuild && affordable && styles.buildCardAffordable,
                      ]}
                      onPressIn={() => setHoveredBuildingKey(key)}
                      onPressOut={() => setHoveredBuildingKey(null)}
                      onPress={() => {
                        if (locked || !affordable) return
                        if (pickerCell !== null) placeBuilding(pickerCell, key)
                        haptics.confirm()
                        sound.play('build')
                        setPickerCell(null)
                        setHoveredBuildingKey(null)
                      }}
                    >
                      {/* Thumbnail */}
                      <View style={[styles.buildThumbWrap, { backgroundColor: locked ? '#EDE8E0' : surfaceColor }]}>
                        {thumb ? (
                          <Image source={thumb} style={styles.buildThumb} resizeMode="contain" />
                        ) : (
                          <Text style={[styles.buildThumbCode, { color: accentColor }]}>{b.shortName}</Text>
                        )}
                        {locked && (
                          <View style={styles.buildLockOverlay}>
                            <Text style={styles.buildLockIcon}>🔒</Text>
                          </View>
                        )}
                      </View>

                      {/* Info */}
                      <View style={styles.buildCardBody}>
                        <Text style={[styles.buildCardName, locked && styles.buildCardNameLocked]} numberOfLines={2}>
                          {t(b.name)}
                        </Text>

                        {/* Status tag */}
                        {hasHiddenGrant ? (
                          <View style={[styles.buildTag, { backgroundColor: colors.gold }]}>
                            <Text style={styles.buildTagText}>✨ FREE × {hiddenUses}</Text>
                          </View>
                        ) : locked ? (
                          <View style={[styles.buildTag, { backgroundColor: '#C8BEB0' }]}>
                            <Text style={styles.buildTagText}>Lv{unlockLevel} required</Text>
                          </View>
                        ) : !affordable ? (
                          <View style={[styles.buildTag, { backgroundColor: colors.orange }]}>
                            <Text style={styles.buildTagText}>Need ${b.cost.toLocaleString()}</Text>
                          </View>
                        ) : (
                          <View style={[styles.buildTag, { backgroundColor: colors.green }]}>
                            <Text style={styles.buildTagText}>${b.cost.toLocaleString()}</Text>
                          </View>
                        )}

                        {/* Extra requirement hint */}
                        {extraReq && !locked && (
                          <Text style={styles.buildReqHint} numberOfLines={2}>{extraReq}</Text>
                        )}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )
        })}
      </Sheet>

      {/* ── Building info ─────────────────────────────────────────────────── */}
      <Sheet
        visible={infoCell !== null}
        title={infoCell !== null && game.grid[infoCell] ? t(BUILDINGS[game.grid[infoCell]!].name) : t(text.hud.info)}
        onClose={() => setInfoCell(null)}
      >
        {(() => {
          if (infoCell === null) return null
          const cell = game.grid[infoCell]
          if (!cell) return null
          const level       = game.gridLevels[infoCell] ?? 1
          const config      = BUILDINGS[cell]
          const effectLines = getBuildingEffectLines(cell, level, game, derived, infoCell)
          const nextEffectLines = getBuildingEffectLines(cell, level + 1, game, derived, infoCell)
          const isUpgradeable = UPGRADEABLE.includes(cell)
          const maxed       = level >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel
          const upgradeCost = level === 1 ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
          const canAffordUpgrade = game.money >= upgradeCost
          const plant           = PLANT_PRODUCTION.find((p) => p.buildingKey === cell)
          const specialistType  = cell === 'polymerPlant' ? 'polymerEngineer' : plant?.specialistWorker
          const specialistWorker = specialistType ? WORKERS.find((w) => w.key === specialistType) : undefined
          const specialistName  = specialistWorker ? t(specialistWorker.name) : specialistType ?? null
          const assignedEmployee  = specialistType ? getEmployeeAssignedToCell(game, infoCell) : null
          const eligibleEmployees = specialistType ? game.employees.filter((e) => e.type === specialistType && getCellAssignedToEmployee(game, e.id) === null) : []
          const category   = BUILDING_CATEGORY_BY_TYPE[cell]
          const accent     = BUILDING_CATEGORY_ACCENT[category]
          const surface    = BUILDING_CATEGORY_SURFACE[category]
          const thumbNow   = PLANT_THUMB_BY_LEVEL[cell]?.[level]
          const thumbNext  = PLANT_THUMB_BY_LEVEL[cell]?.[level + 1]
          const maxLevel   = BUILDING_UPGRADE_BALANCE.maxBuildingLevel

          return (
            <>
              {/* ── Plant hero header ── */}
              <View style={[styles.infoHero, { backgroundColor: surface }]}>
                {/* Current level art */}
                <View style={styles.infoHeroArt}>
                  {thumbNow
                    ? <Image source={thumbNow} style={styles.infoHeroImage} resizeMode="contain" />
                    : <Text style={[styles.infoHeroCode, { color: accent }]}>{config.shortName}</Text>
                  }
                  <View style={[styles.infoHeroLvBadge, { backgroundColor: accent }]}>
                    <Text style={styles.infoHeroLvText}>Lv{level}</Text>
                  </View>
                </View>

                {/* Level dots + upgrade preview */}
                <View style={styles.infoHeroRight}>
                  {/* Category badge */}
                  <View style={[styles.infoCatBadge, { backgroundColor: accent }]}>
                    <Text style={styles.infoCatText}>{CATEGORY_LABEL[category]}</Text>
                  </View>

                  {/* Level progress dots */}
                  {isUpgradeable && (
                    <View style={styles.infoLevelDots}>
                      {Array.from({ length: maxLevel }).map((_, i) => (
                        <View key={i} style={[styles.infoDot, i < level ? { backgroundColor: accent } : styles.infoDotEmpty]} />
                      ))}
                    </View>
                  )}

                  {/* Next level art preview (if not maxed) */}
                  {isUpgradeable && !maxed && thumbNext && (
                    <View style={styles.infoNextPreview}>
                      <Text style={styles.infoNextArrow}>→</Text>
                      <View style={styles.infoNextArtWrap}>
                        <Image source={thumbNext} style={styles.infoNextImage} resizeMode="contain" />
                        <View style={[styles.infoNextLvBadge, { backgroundColor: accent }]}>
                          <Text style={styles.infoHeroLvText}>Lv{level + 1}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Description */}
              <Text style={styles.infoDescription}>{t(config.description)}</Text>

              {/* ── Current stats ── */}
              <Text style={styles.infoSectionTitle}>Current stats</Text>
              {effectLines.map((line, i) => (
                <View key={i}>
                  <View style={styles.infoEffectRow}>
                    <Text style={styles.infoEffectLabel}>{line.label}</Text>
                    <View style={styles.infoEffectRight}>
                      <Text style={styles.infoEffectValue}>{line.value}</Text>
                      {/* Show next level value if different */}
                      {!maxed && nextEffectLines[i] && nextEffectLines[i].value !== line.value && (
                        <Text style={[styles.infoEffectNext, { color: accent }]}>
                          {' '}→ {nextEffectLines[i].value}
                        </Text>
                      )}
                      {line.bonus && <Text style={styles.infoEffectBonus}> {line.bonus}</Text>}
                    </View>
                  </View>
                  {line.warning && <Text style={styles.infoWarning}>⚠️ {line.warning}</Text>}
                </View>
              ))}

              {/* ── Upgrade panel ── */}
              {isUpgradeable && (
                <View style={[styles.upgradePanel, maxed ? styles.upgradePanelMaxed : canAffordUpgrade ? styles.upgradePanelReady : styles.upgradePanelLocked]}>
                  {maxed ? (
                    <View style={styles.upgradePanelContent}>
                      <Text style={styles.upgradePanelEmoji}>🏆</Text>
                      <View>
                        <Text style={styles.upgradePanelTitle}>Maximum level reached</Text>
                        <Text style={styles.upgradePanelSub}>This building is fully upgraded.</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.upgradePanelContent}>
                        <Text style={styles.upgradePanelEmoji}>{canAffordUpgrade ? '⬆️' : '💸'}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.upgradePanelTitle}>Upgrade to Lv{level + 1}</Text>
                          <Text style={[styles.upgradePanelSub, !canAffordUpgrade && { color: colors.orange }]}>
                            ${upgradeCost.toLocaleString()} · {canAffordUpgrade ? `have $${Math.floor(game.money).toLocaleString()}` : `need $${(upgradeCost - game.money).toLocaleString()} more`}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        style={[styles.upgradeActionBtn, !canAffordUpgrade && styles.upgradeActionBtnOff]}
                        disabled={!canAffordUpgrade}
                        onPress={() => upgradeBuilding(infoCell)}
                      >
                        <Text style={styles.upgradeActionBtnLabel}>
                          {canAffordUpgrade ? 'Upgrade' : 'Not enough'}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
              {specialistType && (
                <>
                  <Text style={styles.infoSectionTitle}>{specialistName} assigned to this plant</Text>
                  {assignedEmployee ? (
                    <ListRow
                      title={assignedEmployee.name}
                      subtitle={`Lv${assignedEmployee.level}${assignedEmployee.trait === 'veteran' ? ' · Veteran' : ''}`}
                      badge="ASSIGNED"
                      actionLabel="Unassign"
                      onPress={() => unassignCell(infoCell)}
                    />
                  ) : (
                    <Text style={styles.infoHint}>
                      No one assigned — pick a {specialistName} below to boost THIS plant's output.
                    </Text>
                  )}
                  {!assignedEmployee && eligibleEmployees.length === 0 && (
                    <Text style={styles.infoHint}>
                      Hire a {specialistName} from the Staff tab to assign here, or unassign one from another plant first.
                    </Text>
                  )}
                  {!assignedEmployee && eligibleEmployees.map((employee) => (
                    <ListRow
                      key={employee.id}
                      title={employee.name}
                      subtitle={`Lv${employee.level}${employee.trait === 'veteran' ? ' · Veteran' : ''}`}
                      actionLabel="Assign"
                      onPress={() => assignEmployeeToCell(employee.id, infoCell)}
                    />
                  ))}
                </>
              )}
              <Text style={styles.infoSectionTitle}>Rearrange</Text>
              <ListRow
                title="Move"
                subtitle={`Relocate to an empty cell · $${GRID_EDIT_BALANCE.moveCost.toLocaleString()} · level & staff travel with it`}
                actionLabel="Move"
                disabled={game.money < GRID_EDIT_BALANCE.moveCost}
                onPress={() => { setGridEditMode({ type: 'move', fromIndex: infoCell }); setInfoCell(null) }}
              />
              <ListRow
                title="Swap"
                subtitle={`Trade places with another building · $${GRID_EDIT_BALANCE.swapCost.toLocaleString()} · both levels & staff travel`}
                actionLabel="Swap"
                disabled={game.money < GRID_EDIT_BALANCE.swapCost}
                onPress={() => { setGridEditMode({ type: 'swap', fromIndex: infoCell }); setInfoCell(null) }}
              />
              <ListRow
                title="Demolish"
                subtitle={`Remove this building · +$${Math.round(config.cost * GRID_EDIT_BALANCE.demolishRefundRate).toLocaleString()} refund`}
                actionLabel="Demolish"
                onPress={() => { demolishBuilding(infoCell); setInfoCell(null) }}
              />
            </>
          )
        })()}
      </Sheet>

      {/* ── Upgrade Modal ──────────────────────────────────────────────── */}
      <Sheet visible={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} title="Upgrade Refinery">
        {(() => {
          const nextLevel = game.refineryLevel + 1
          const repReq    = getUpgradeReputationRequirement(game.refineryLevel)
          const resReq    = getUpgradeResearchRequirement(game.refineryLevel)
          const prodPct   = upgradeProductionRequired > 0
            ? Math.min(100, Math.round((game.totalGasolineProduced / upgradeProductionRequired) * 100))
            : 100
          const nextUnlocks = getNextLevelUnlocks(nextLevel)

          const requirements: { label: string; met: boolean; display: string; showBar?: boolean; barPct?: number }[] = [
            {
              label: 'Cost',
              met: hasEnoughMoney,
              display: `$${upgradeCost.toLocaleString()} (have $${Math.floor(game.money).toLocaleString()})`,
            },
            {
              label: 'Gasoline output',
              met: hasEnoughProduction,
              display: `${game.totalGasolineProduced.toLocaleString()} / ${upgradeProductionRequired.toLocaleString()}`,
              showBar: true,
              barPct: prodPct,
            },
            ...(repReq > 0 ? [{
              label: 'Reputation',
              met: game.reputation >= repReq,
              display: `${Math.floor(game.reputation)} / ${repReq}`,
            }] : []),
            ...(resReq > 0 ? [{
              label: 'Research items',
              met: game.unlockedResearchIds.length >= resReq,
              display: `${game.unlockedResearchIds.length} / ${resReq}`,
            }] : []),
          ]

          return (
            <>
              {/* Max level state */}
              {isMaxLevel && (
                <View style={styles.upgMaxBox}>
                  <Text style={styles.upgMaxIcon}>🏆</Text>
                  <View>
                    <Text style={styles.upgMaxTitle}>Maximum Level Reached</Text>
                    <Text style={styles.upgMaxSub}>Lv20 — All buildings and eras unlocked.</Text>
                  </View>
                </View>
              )}

              {/* Level progression strip */}
              {!isMaxLevel && <View style={styles.upgLevelStrip}>
                <View style={styles.upgLevelBox}>
                  <Text style={styles.upgLevelNum}>Lv{game.refineryLevel}</Text>
                  <Text style={styles.upgLevelLabel}>Current</Text>
                </View>
                <View style={styles.upgArrowWrap}>
                  <View style={[styles.upgArrowLine, canUpgrade && styles.upgArrowLineReady]} />
                  <Text style={[styles.upgArrowHead, canUpgrade && styles.upgArrowHeadReady]}>▶</Text>
                </View>
                <View style={[styles.upgLevelBox, styles.upgLevelBoxNext]}>
                  <Text style={[styles.upgLevelNum, { color: canUpgrade ? colors.green : colors.inkMuted }]}>Lv{nextLevel}</Text>
                  <Text style={styles.upgLevelLabel}>Next</Text>
                </View>
              </View>}

              {/* What unlocks */}
              {!isMaxLevel && nextUnlocks.length > 0 && (
                <View style={styles.upgUnlockBox}>
                  <Text style={styles.upgUnlockTitle}>Unlocks at Lv{nextLevel}</Text>
                  {nextUnlocks.map((u, i) => (
                    <Text key={i} style={styles.upgUnlockItem}>{u}</Text>
                  ))}
                </View>
              )}

              {/* Requirements checklist */}
              {!isMaxLevel && (
              <><Text style={styles.upgSectionLabel}>Requirements</Text>
              {requirements.map((req, i) => (
                <View key={i} style={styles.upgReqRow}>
                  <Text style={[styles.upgReqCheck, req.met ? styles.upgReqCheckMet : styles.upgReqCheckUnmet]}>
                    {req.met ? '✓' : '✗'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.upgReqTop}>
                      <Text style={[styles.upgReqLabel, !req.met && styles.upgReqLabelUnmet]}>{req.label}</Text>
                      <Text style={[styles.upgReqValue, !req.met && styles.upgReqValueUnmet]}>{req.display}</Text>
                    </View>
                    {req.showBar && (
                      <View style={styles.upgReqBar}>
                        <View style={[styles.upgReqBarFill, { width: `${req.barPct}%` as any, backgroundColor: req.met ? colors.green : colors.orange }]} />
                      </View>
                    )}
                  </View>
                </View>
              ))}

              </>)}
              {/* Upgrade button — hidden at max level */}
              {!isMaxLevel && (
                <AnimatedPressable
                  style={[styles.upgButton, !canUpgrade && styles.upgButtonOff]}
                  onPress={() => {
                    if (!canUpgrade) return
                    spawnFloat(`-$${upgradeCost.toLocaleString()}`, 'expense')
                    haptics.confirm()
                    upgradeRefinery()
                    setUpgradeModalOpen(false)
                  }}
                >
                  <Text style={styles.upgButtonLabel}>
                    {canUpgrade ? `⬆ Upgrade to Lv${nextLevel}` : 'Requirements not met'}
                  </Text>
                </AnimatedPressable>
              )}
            </>
          )
        })()}
      </Sheet>

      {/* ── Crisis Banner ──────────────────────────────────────────────── */}
      {game && game.activeCrisis && (
        <CrisisBanner
          crisis={game.activeCrisis}
          currentTick={game.tickCount}
          money={game.money}
          onFix={fixCrisis}
          onIgnore={ignoreCrisis}
        />
      )}

      {/* ── Onboarding ─────────────────────────────────────────────────── */}
      {showOnboarding && (
        <OnboardingOverlay onDismiss={handleDismissOnboarding} />
      )}

      {/* ── Persistent bottom navigation ──────────────────────────────── */}
      <BottomNav items={FAB_ITEMS} />

    </SafeAreaView>
  )
}

// ── Palette ───────────────────────────────────────────────────────────────────
const SKY_NIGHT    = '#0D1B2E'

const styles = StyleSheet.create({
  // ── Root ─────────────────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: SKY_NIGHT, // fallback visible during load
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Scene (single flex container, all children are absolutely positioned) ─
  scene: {
    flex: 1,
  },

  // Night veil (absoluteFill, applied conditionally)
  nightOverlay: {
    backgroundColor: '#050D1A',
    opacity: 0.22,
    zIndex: 5,
  },

  // ── Layer 0: Background ───────────────────────────────────────────────────


  // ── Layer 1: Grid ─────────────────────────────────────────────────────────
  // top is set dynamically (= yardTop)
  gridLayer: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    zIndex: 10,
  },
  hintOverlay: {
    position: 'absolute',
    bottom: FLOATING_TAB_BAR_CLEARANCE + 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // ── Building Info Sheet ─────────────────────────────────────────────────────
  infoHero: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  infoHeroArt: {
    width: 80, height: 80,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  infoHeroImage: { width: 76, height: 76 },
  infoHeroCode: { fontSize: 28, fontWeight: '900' },
  infoHeroLvBadge: {
    position: 'absolute', bottom: -4, right: -4,
    borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 3,
  },
  infoHeroLvText: { fontSize: 10, fontWeight: '900', color: '#fff' },
  infoHeroRight: { flex: 1, gap: spacing.sm, alignItems: 'flex-start' },
  infoCatBadge: {
    borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4,
  },
  infoCatText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoLevelDots: { flexDirection: 'row', gap: 5 },
  infoDot: { width: 10, height: 10, borderRadius: 5 },
  infoDotEmpty: { backgroundColor: colors.creamBorder, borderWidth: 1.5, borderColor: colors.inkMuted },
  infoNextPreview: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoNextArrow: { fontSize: 16, color: colors.inkMuted, fontWeight: '700' },
  infoNextArtWrap: { width: 52, height: 52, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  infoNextImage: { width: 48, height: 48, opacity: 0.7 },
  infoNextLvBadge: {
    position: 'absolute', bottom: -3, right: -3,
    borderRadius: radii.pill, paddingHorizontal: 5, paddingVertical: 2,
  },
  infoEffectRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  infoEffectNext: { fontSize: 12, fontWeight: '700' },

  // Upgrade panel
  upgradePanel: {
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.md,
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  upgradePanelMaxed:  { backgroundColor: '#F5F9F0', borderColor: colors.green },
  upgradePanelReady:  { backgroundColor: '#F0F7FF', borderColor: colors.blue },
  upgradePanelLocked: { backgroundColor: '#FFF8F0', borderColor: colors.creamBorder },
  upgradePanelContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  upgradePanelEmoji: { fontSize: 24 },
  upgradePanelTitle: { fontSize: 14, fontWeight: '800', color: colors.ink },
  upgradePanelSub:   { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  upgradeActionBtn: {
    backgroundColor: colors.blue,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  upgradeActionBtnOff: { backgroundColor: colors.creamBorder },
  upgradeActionBtnLabel: { fontSize: 14, fontWeight: '900', color: '#fff' },

  // ── Build Sheet ─────────────────────────────────────────────────────────────
  buildCategory: {
    marginBottom: spacing.md,
  },
  buildCategoryLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  buildGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  buildCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    overflow: 'hidden',
  },
  buildCardLocked: {
    backgroundColor: '#F5F0E8',
    opacity: 0.6,
  },
  buildCardAffordable: {
    shadowColor: colors.green,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buildThumbWrap: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buildThumb: {
    width: 64,
    height: 64,
  },
  buildThumbCode: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  buildLockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(200,190,175,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildLockIcon: {
    fontSize: 22,
  },
  buildCardBody: {
    padding: spacing.sm,
    gap: 4,
  },
  buildCardName: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 16,
  },
  buildCardNameLocked: {
    color: colors.inkMuted,
  },
  buildTag: {
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  buildTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
  },
  buildReqHint: {
    fontSize: 9,
    color: colors.inkMuted,
    lineHeight: 13,
  },

  // Upgrade refinery modal
  upgMaxBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFF8E6',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  upgMaxIcon: { fontSize: 32 },
  upgMaxTitle: { fontSize: 15, fontWeight: '900', color: colors.ink },
  upgMaxSub: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  upgLevelStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, gap: 0 },
  upgLevelBox: { alignItems: 'center', backgroundColor: colors.cream, borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1.5, borderColor: colors.creamBorder },
  upgLevelBoxNext: { borderColor: colors.green },
  upgLevelNum: { fontSize: 24, fontWeight: '900', color: colors.ink },
  upgLevelLabel: { fontSize: 9, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1 },
  upgArrowWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  upgArrowLine: { height: 2, width: 28, backgroundColor: colors.creamBorder },
  upgArrowLineReady: { backgroundColor: colors.green },
  upgArrowHead: { fontSize: 14, color: colors.creamBorder, marginLeft: -4 },
  upgArrowHeadReady: { color: colors.green },
  upgUnlockBox: { backgroundColor: '#EBF5E8', borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.green, padding: spacing.sm, marginBottom: spacing.sm, gap: 3 },
  upgUnlockTitle: { fontSize: 10, fontWeight: '900', color: colors.greenDark, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  upgUnlockItem: { fontSize: 12, color: colors.greenDark, fontWeight: '600' },
  upgSectionLabel: { fontSize: 10, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs },
  upgReqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  upgReqCheck: { fontSize: 16, fontWeight: '900', width: 22, textAlign: 'center' },
  upgReqCheckMet: { color: colors.green },
  upgReqCheckUnmet: { color: colors.red },
  upgReqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgReqLabel: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  upgReqLabelUnmet: { color: colors.inkMuted },
  upgReqValue: { fontSize: 12, fontWeight: '700', color: colors.ink },
  upgReqValueUnmet: { color: colors.red },
  upgReqBar: { height: 4, backgroundColor: colors.creamBorder, borderRadius: radii.pill, overflow: 'hidden', marginTop: 4 },
  upgReqBarFill: { height: '100%', borderRadius: radii.pill },
  upgButton: { marginTop: spacing.sm, backgroundColor: colors.green, borderRadius: radii.md, paddingVertical: 13, alignItems: 'center' },
  upgButtonOff: { backgroundColor: colors.creamBorder },
  upgButtonLabel: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  hintActive: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: colors.orangeDark,
    marginTop: spacing.xs,
  },

  // ── Layer 2: Company block + top-right HUD ───────────────────────────────
  companyBlock: {
    position: 'absolute',
    top: spacing.sm + 2,
    left: spacing.md,
    zIndex: 20,
  },
  companyName: {
    fontSize: 16,
    fontFamily: fonts.display,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    letterSpacing: 0.2,
  },
  companyTitle: {
    fontSize: 9,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 1,
  },
  // Lv badge — standalone tappable pill, now in top-right
  lvBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lvBadgeReady: {
    backgroundColor: colors.green,
  },
  lvBadgeMaxed: {
    backgroundColor: colors.gold,
  },
  lvBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 0.3,
  },
  topRightHud: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    zIndex: 20,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  timePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  speedPill: {
    minWidth: 30,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillPaused: {
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  speedPillText: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: colors.ink,
  },
  speedPillTextPaused: {
    color: '#FFFFFF',
  },
  eventsBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 14,
    height: 14,
    borderRadius: radii.pill,
    paddingHorizontal: 3,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsBadgeLabel: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
  },

  // ── Layer 3: Resource Dock + Goal Banner ────────────────────────────────
  // top set dynamically (= resourceTop)
  resourceDock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: RESOURCE_DOCK_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C2634',
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#2E3D50',
  },
  dockStat: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  dockToggleIconWrap: {
    position: 'relative',
  },
  dockAlertDot: {
    position: 'absolute',
    top: -1,
    right: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
    borderWidth: 1,
    borderColor: '#1C2634',
  },
  dockIcon: {
    // Dock trimmed to 4 core stats (Money/Crude/Gas/Rep), so each gets more
    // room — bumped a touch over the cramped 7-stat layout.
    fontSize: 15,
  },
  dockVal: {
    fontSize: 15,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dockValWarn: {
    color: colors.orange,
  },
  dockLabel: {
    fontSize: 8,
    fontFamily: fonts.body,
    // Brighter than the old #6B8099 — the 7px labels were nearly
    // illegible on a real phone; bumped size + contrast together.
    color: '#90A6BE',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dockDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#2E3D50',
  },
  // Flow-rate strip — slim translucent bar under the resource dock
  // top set dynamically (= flowTop)
  flowStrip: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    height: FLOW_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(28,38,52,0.62)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    zIndex: 20,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  flowDotProfit: { backgroundColor: colors.green },
  flowDotLoss:   { backgroundColor: colors.orange },
  flowDotIdle:   { backgroundColor: '#6B8099' },
  flowState: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: 'rgba(255,255,255,0.9)',
  },
  flowIcon: {
    fontSize: 12,
  },
  flowVal: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  flowValUp:   { color: colors.green },
  flowValDown: { color: colors.orange },
  flowValFlat: { color: 'rgba(255,255,255,0.7)' },
  flowUnit: {
    fontSize: 8.5,
    fontFamily: fonts.body,
    color: '#90A6BE',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // Goal banner — slim dark strip inside yard
  // top set dynamically (= goalTop)
  goalBanner: {
    position: 'absolute',
    left: GOAL_LEFT,
    right: GOAL_LEFT,
    height: GOAL_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28,38,52,0.72)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    zIndex: 20,
  },
  goalBannerText: {
    fontSize: 11,
    fontFamily: fonts.heading,
    color: 'rgba(255,255,255,0.90)',
    flex: 1,
  },
  goalBannerProgress: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.gold,
    marginLeft: spacing.xs,
  },

  // ── Layer 4: Floating action buttons ──────────────────────────────────────
  // ── Unified Trade panel (Buy/Sell + Auto-trade, collapsible) ───────────
  // ── Action Dock (bottom, above tab bar) ──────────────────────────────────
  actionDock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: FLOATING_TAB_BAR_CLEARANCE - 4,
    height: ACTION_DOCK_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(28,38,52,0.92)',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  actionDockLeft: {
    gap: 1,
  },
  actionDockVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionDockLabel: {
    fontSize: 9,
    color: '#6B8099',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionDockRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  autoBadge: {
    backgroundColor: colors.green,
    borderRadius: radii.sm,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  autoBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tradeDockBtn: {
    backgroundColor: colors.orange,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  tradeDockBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Legacy tradePanelWrap kept for Modal anchor reference
  tradePanelWrap: {
    position: 'absolute',
    bottom: FLOATING_TAB_BAR_CLEARANCE + 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  tradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(28,38,52,0.92)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  tradePillIcon: { fontSize: 14 },
  tradePillLabel: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  tradePillChevron: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
    tradeModalBackdrop: {
    flex: 1,
  },
  // Positions the panel to visually sit right above where the pill is
  // on the real screen underneath the modal (same right/bottom offsets
  // as tradePanelWrap) -- the Modal itself doesn't know about the pill's
  // position, so this duplicates the offset rather than trying to share
  // it, which is simpler than measuring the pill's actual layout.
  tradeModalAnchor: {
    position: 'absolute',
    right: spacing.md,
    bottom: FLOATING_TAB_BAR_CLEARANCE + 56,
  },
  tradePanel: {
    width: 260,
    maxHeight: 420,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  tradeActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tradeActionBtn: {
    flex: 1,
    borderRadius: radii.md,
    paddingVertical: 6,
    alignItems: 'center',
  },
  buyBtn: {
    backgroundColor: colors.steelLight,
    borderWidth: 2,
    borderColor: colors.steelDark,
  },
  sellBtn: {
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.greenDark,
  },
  tradeActionLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
  },
  tradeActionSub: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: 2,
  },
  priceCheap: {
    color: colors.greenDark,
    fontWeight: '800',
  },
  pricePricey: {
    color: colors.orangeDark,
    fontWeight: '800',
  },
  tradeDivider: {
    height: 1,
    backgroundColor: colors.creamBorder,
    marginVertical: spacing.sm,
  },
  autoTradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoTradeRowTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
  },

  // ── More Info sheet rows ──────────────────────────────────────────────────
  infoStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  infoStatLabel: {
    color: colors.inkMuted,
    fontSize: 13,
  },
  infoStatValue: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Events sheet ─────────────────────────────────────────────────────────
  eventEmpty: {
    color: colors.inkMuted,
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // ── Building info sheet ───────────────────────────────────────────────────
  infoLevel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  infoDescription: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  infoEffectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.creamBorder,
  },
  infoEffectLabel: {
    color: colors.ink,
    fontSize: 13,
    flex: 1,
    marginRight: spacing.sm,
  },
  infoEffectValue: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 13,
    textAlign: 'right',
  },
  infoEffectBonus: {
    color: colors.greenDark,
    fontWeight: '800',
  },
  infoWarning: {
    color: colors.orangeDark,
    fontSize: 11,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  infoSectionTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  infoHint: {
    color: colors.inkMuted,
    fontSize: 12,
    marginBottom: spacing.sm,
  },

  // ── Automation sheet (kept for future use) ────────────────────────────────
  feedstockPriorityHint: {
    color: colors.inkMuted,
    fontSize: 11,
    marginBottom: spacing.sm,
  },
  autoTradeCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  autoTradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoTradeTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  thresholdLabel: {
    flex: 1,
    fontSize: 12,
    color: colors.inkMuted,
    paddingRight: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.ink,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 16,
  },
  stepperValue: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 13,
    minWidth: 40,
    textAlign: 'center',
  },
})
