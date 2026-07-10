import { useState, useEffect, useCallback } from 'react'
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
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { Bell, Clock3 } from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import DeliveryTruck from '../../../src/components/DeliveryTruck'
import BottomNav from '../../../src/components/BottomNav'
import CardHUD from '../../../src/components/CardHUD'
import CardResourceBar, { getMeterColor } from '../../../src/components/CardResourceBar'
import { type FabNavItem } from '../../../src/components/FabNav'
import SideMenu, { type SideMenuSection } from '../../../src/components/SideMenu'
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
import HistoryGraph from '../../../src/components/HistoryGraph'
import SaturationBars from '../../../src/components/SaturationBars'
import { text } from '../../../src/game/translations'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { ENDGAME_GOALS } from '../../../src/game/data/endgameGoals'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDING_UPGRADE_BALANCE, PLANT_PRODUCTION, GRID_EDIT_BALANCE, EXPANSION_BALANCE, PRESTIGE_BALANCE, STANDING_ORDER_BALANCE, PRODUCTION_BALANCE, POWER_PLANT_BALANCE, MAX_REFINERY_LEVEL } from '../../../src/game/data/balance'
import type { BilingualTextValue, BuildingType, DerivedStats } from '../../../src/game/types'
import {
  CRUDE_COST,
  getBuildingEffectLines,
  getCellAssignedToEmployee,
  getCellStaffBonus,
  getEmployeeSkills,
  getPowerBreakdown,
  isNearRetirement,
  getContractProgress,
  getComboHintCells,
  getEmployeeAssignedToCell,
  getProductMarketLevel,
  getProductSellPrice,
  formatGameClockTime,
  getSeasonLabel,
  getUpgradeCost,
  getUpgradeProductionRequirement,
  getUpgradeBlockers,
  getUpgradeReputationRequirement,
  getUpgradeResearchRequirement,
  getRefineryTitle,
  getSeasonForecast,
  formatCompactNumber,
  TICK_MS,
} from '../../../src/game/utils/gameCalculations'
import StaffSkillList from '../../../src/components/StaffSkillList'
import { isBoostActive, canActivateBoost } from '../../../src/hooks/useGameLoop'
import FactoryDiamondGroundView from '../../../src/components/FactoryDiamondGroundView'
import { FACTORY_BG, BG_OFFSET_X, BG_OFFSET_Y, BG_PARALLAX, GRID_DROP } from '../../../src/config/factoryScene'


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
const SKY_RATIO    = 0.18   // สัดส่วนความสูงฟ้า (0.0–1.0) → กำหนดตำแหน่ง HUD + Grid
const HORIZON_H    = 8    // px — ความสูง horizon strip (ถ้าไม่ใช้ bg รูปก็ set 0 ได้)
const RESOURCE_H   = 48    // px — resource dock height
const FLOW_H       = 22    // px — slim flow-rate strip (net $/min + output/min)
const GOAL_H       = 26    // px — slim goal banner height
const RESOURCE_DOCK_H = 52 // px — dark resource dock card height
const ACTION_DOCK_H   = 48 // px — bottom action dock height

// ── Layout tweaks (ปรับ UI position ตรงนี้ได้เลย) ───────────────────────────
const HUD_OFFSET_UP  = 4  // px — HUD (resource dock) ขยับขึ้นจาก yardTop
const GOAL_LEFT      = 18  // px — "Growing Refinery" banner ห่างจากขอบซ้าย/ขวา
// Scene framing + grid placement are tunable in src/config/factoryScene.ts
// (FACTORY_BG, BG_CROP_PCT, BG_OVERSCAN_PCT, BG_OFFSET_X, GRID_DROP).

export default function RefineryScreen() {
  const router = useRouter()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const sound = useSound()
  const {
    game, loaded, derived,
    buyCrude, sellGasoline,
    placeBuilding, demolishBuilding, moveBuilding, swapBuildings,
    claimHiddenEvent, upgradeBuilding, upgradeRefinery,
    autoTrade, updateAutoTrade, activateBoost,
    adjustFeedstockPriority, assignEmployeeToCell, unassignCell,
    speed, cycleSpeed, flowRates, moneyHistory,
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
  const [powerPanelOpen, setPowerPanelOpen] = useState(false)
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
  const [menuOpen, setMenuOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  // Drives the delivery-truck flyby on the yard: bump the counter on a trade
  // and stamp the direction (crude in / gasoline out).
  const [truck, setTruck] = useState<{ key: number; direction: 'in' | 'out' }>({ key: 0, direction: 'in' })
  const sendTruck = (direction: 'in' | 'out') =>
    setTruck((t) => ({ key: t.key + 1, direction }))

  // Background parallax shared values + style. MUST stay above the early
  // return below so the hook order is identical on every render (React #310).
  // The grid view writes its live pan offset into these; the bg follows at
  // BG_PARALLAX so the whole scene pans together.
  const bgPanX      = useSharedValue(0)
  const bgPanY      = useSharedValue(0)
  // Background transform: static framing offset + live parallax pan (no scale).
  const bgAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: BG_OFFSET_X + bgPanX.value * BG_PARALLAX },
      { translateY: BG_OFFSET_Y + bgPanY.value * BG_PARALLAX },
    ],
  }))

  // Stable across ticks (game.grid ref only changes on a build op) so the
  // memoised grid cells don't re-render every tick just because this callback
  // was recreated. MUST stay above the early return below (hook order / #310).
  const gameGrid = game?.grid
  const handleCellPress = useCallback((index: number) => {
    if (!game) return
    if (gridEditMode) {
      if (gridEditMode.type === 'move') moveBuilding(gridEditMode.fromIndex, index)
      else                               swapBuildings(gridEditMode.fromIndex, index)
      setGridEditMode(null)
      return
    }
    if (game.grid[index] === null) setPickerCell(index)
    else                           setInfoCell(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridEditMode, gameGrid, moveBuilding, swapBuildings])

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
  // Extra % the bg box must extend past every edge so that, after BG_SCALE
  // shrinks the (cover-fitted) image, it still fully covers the screen. 0 at
  // scale 1; grows as you zoom out. Added on top of the crop/overscan framing.
  // ── Background overscan ──
  // The painting fills an over-sized box (each edge pushed out by bgOverscan px)
  // with resizeMode:cover, so it always covers the screen. The box is nudged by
  // BG_OFFSET_X/Y and the parallax pan via a translate — bgOverscan is sized to
  // absorb the offset + a healthy pan range so no edge is ever exposed. NO
  // scale transform (that was what shrank the image below cover, leaving the
  // black band on device).
  const bgOverscan = Math.abs(BG_OFFSET_X) + Math.abs(BG_OFFSET_Y) + 180
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
  // Forecast the seasonal gasoline-demand wave so the player can time stockpiling
  // vs selling (pairs with the crude price wave on the Supply tab).
  const seasonFc           = getSeasonForecast(game.tickCount, game.yearStartTick)
  const seasonFcMins       = Math.max(1, Math.round((seasonFc.ticksToExtreme * TICK_MS) / 60000))
  // 🔥 Boost button state: active (running), ready (tappable), or cooling down.
  const boostActive        = isBoostActive(game)
  const boostReady         = canActivateBoost(game) && !boostActive
  const boostSecs          = Math.max(
    0,
    Math.ceil(((boostActive ? game.boostActiveUntilTick : game.boostAvailableAtTick) - game.tickCount) * TICK_MS / 1000),
  )
  // Colour a 0–100 meter (ESG / morale) by health: red danger, orange warning.
  const meterColorStyle = (v: number) =>
    v < 40 ? styles.meterDanger : v < 60 ? styles.meterWarn : styles.meterGood
  // Power (electricity) supply-vs-demand breakdown for the power sheet.
  const powerBd = getPowerBreakdown(derived.buildingCounts)
  const hasPowerInfo = powerBd.supply > 0 || powerBd.demand > 0
  // A real deficit only bites once a Power Plant exists and can't cover demand;
  // pre-plant the demand is just informational (plants run unpowered).
  const powerDeficit = derived.buildingCounts.powerPlant > 0 && powerBd.supply < powerBd.demand
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
    return `${sign}$${formatCompactNumber(Math.abs(n))}`
  }
  const flowState: 'profit' | 'loss' | 'idle' =
    gasRate <= 0 && moneyRate === 0 ? 'idle' : moneyRate >= 0 ? 'profit' : 'loss'
  // Gasoline batches are electricity-gated once a Power Plant exists, and the
  // downstream plants draw electricity first — so an under-built power grid
  // silently starves the gasoline line (and the lifetime-gasoline goal) with no
  // feedback. Flag it: gasoline *could* run (crude + tank room) but there isn't
  // even one batch of electricity left.
  const gasPowerStarved =
    derived.buildingCounts.powerPlant > 0 &&
    game.electricity < PRODUCTION_BALANCE.electricityPerGasolineBatch &&
    game.crudeOil > 0 &&
    game.gasoline < derived.maxGasolineStorage
  // When idle, say *why* the primary loop stalled instead of a vague "Idle" —
  // the real gasoline bottlenecks are no crude, a full tank, or no electricity.
  const idleReason =
    game.crudeOil <= 0 ? t(text.hud.idleNoCrude)
    : game.gasoline >= derived.maxGasolineStorage ? t(text.hud.idleTankFull)
    : gasPowerStarved ? t(text.hud.idleNoPower)
    : t(text.hud.flowIdle)
  const flowStateLabel =
    flowState === 'profit' ? t(text.hud.flowProfit)
    : flowState === 'loss' ? t(text.hud.flowLoss)
    : idleReason

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
  // Staff tab badge = employees near retirement (needs attention), distinct from
  // the recruit-pool badge which now lives on the floating Recruit button.
  const retiringStaff = game.employees.filter((e) => isNearRetirement(e, game.businessYear)).length
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

  // Bottom nav = the core always-visible tabs + a Menu button that opens the
  // full grouped drawer. Less-used destinations (R&D, Company, Recruit) live in
  // the drawer so the bar stays uncluttered.
  const FAB_ITEMS: FabNavItem[] = [
    { route: '/game',             icon: '🏭', label: t(text.nav.factory) },
    { route: '/game/contracts',   icon: '📋', label: t(text.nav.contracts), badge: contractsReady || undefined },
    { route: '/game/supply',      icon: '🛢',  label: t(text.nav.supply),    badge: standaloneReady || undefined },
    { route: '/game/staff',       icon: '👥', label: t(text.nav.staff),     badge: retiringStaff || undefined },
    { route: '__menu', icon: '☰', label: t(text.nav.menu), badge: researchReady || undefined, onPress: () => setMenuOpen(true) },
  ]
  // Full navigation map for the side drawer — grouped and collapsible.
  const MENU_SECTIONS: SideMenuSection[] = [
    {
      key: 'operations',
      title: t(text.nav.groupOperations),
      items: [
        { route: '/game',           icon: '🏭', label: t(text.nav.factory), desc: t(text.nav.factoryDesc) },
        { route: '/game/supply',    icon: '🛢',  label: t(text.nav.supply),  desc: t(text.nav.supplyDesc), badge: standaloneReady || undefined },
      ],
    },
    {
      key: 'business',
      title: t(text.nav.groupBusiness),
      items: [
        { route: '/game/contracts', icon: '📋', label: t(text.nav.contracts), desc: t(text.nav.contractsDesc), badge: contractsReady || undefined },
        { route: '/game/company',   icon: '🏢', label: t(text.nav.company),   desc: t(text.nav.companyDesc) },
      ],
    },
    {
      key: 'people',
      title: t(text.nav.groupPeople),
      items: [
        { route: '/game/staff',     icon: '👥', label: t(text.nav.staff),   desc: t(text.nav.staffDesc), badge: retiringStaff || undefined },
        { route: '/game/recruit',   icon: '🧑‍💼', label: t(text.nav.recruit), desc: t(text.nav.recruitDesc), badge: staffReady ? game.recruitmentPool.length : undefined },
      ],
    },
    {
      key: 'progress',
      title: t(text.nav.groupProgress),
      items: [
        { route: '/game/research',  icon: '🔬', label: t(text.nav.research), desc: t(text.nav.researchDesc), badge: researchReady || undefined },
      ],
    },
  ]
  // The slow-moving meters live in the "More Info" sheet (one tap on the Rep
  // stat) so the always-on dock can stay focused on the core economic loop.
  // Their *effect* is still visible at a glance via the flow-rate bar.
  const specValue = game.specialization
    ? (game.specialization === 'green' ? t(text.hud.green) : t(text.hud.industrial))
    : t(text.hud.specNone)
  const secondaryStats = [
    { label: t(text.hud.specialization), value: specValue },
    { label: t(text.hud.feedstock),      value: `${game.feedstock}/${derived.maxFeedstockStorage}` },
    // Power balance: generation vs downstream demand per cycle. Surplus feeds the
    // gasoline line; a deficit means gasoline (and maybe plants) are starved — the
    // hidden trap behind a stalled gasoline goal. Only shown once a Power Plant exists.
    ...(derived.buildingCounts.powerPlant > 0
      ? [{
          label: t(text.hud.power),
          value: (() => {
            const gen = derived.buildingCounts.powerPlant * POWER_PLANT_BALANCE.electricityPerCycle
            const use = derived.electricityDemandPerCycle
            return `${gen}⚡/${use} per cyc${gen <= use ? ' ⚠️' : ` · +${gen - use} free`}`
          })(),
        }]
      : []),
    { label: t(text.hud.season),         value: `${t(seasonLabel)} · ${seasonPct}%` },
    { label: t(text.hud.era),            value: t(derived.currentEra.name) },
    ...(game.prestigeLevel > 0
      ? [{ label: t(text.hud.prestige), value: `Lv${game.prestigeLevel} · +${Math.round(game.prestigeLevel * PRESTIGE_BALANCE.bonusPerLevel * 100)}%` }]
      : []),
  ]
  // Nudge dot on the More Info toggle when a hidden meter needs attention.
  const secondaryAlert = game.esgScore < 40 || game.staffMorale < 40


  const upgradeCost                = getUpgradeCost(game.refineryLevel)
  const upgradeProductionRequired  = getUpgradeProductionRequirement(game.refineryLevel)
  const hasEnoughMoney             = game.money >= upgradeCost
  const hasEnoughProduction        = game.totalGasolineProduced >= upgradeProductionRequired
  const upgradeBlockers            = getUpgradeBlockers(game)
  const isMaxLevel                 = game.refineryLevel >= MAX_REFINERY_LEVEL
  const canUpgrade                 = !isMaxLevel && upgradeBlockers.length === 0
  // Progression nudge: show the next unmet MILESTONE while any remain; once the
  // milestone ladder is exhausted (late game) fall back to the next unmet
  // ENDGAME goal so the player always knows what's left toward Industry Legend
  // instead of the banner just vanishing.
  const activeMilestone            = derived.activeMilestones.find((m) => !m.isCompleted)
  const nextEndgameGoal            = !activeMilestone && !game.legendAchieved
    ? ENDGAME_GOALS.find((gl) => !gl.isComplete(game))
    : undefined
  const nextGoal: { name: BilingualTextValue; progress?: { current: number; target: number } | null } | undefined =
    activeMilestone ?? (nextEndgameGoal ? { name: nextEndgameGoal.name, progress: nextEndgameGoal.progress(game) } : undefined)

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

  // Inventory strip (bottom dock): crude + gas + every product the player has a
  // plant for, each shown as have/max — so quantities are visible at a glance
  // and a new product's row appears the moment its plant is built.
  const inventoryItems: { key: string; label: string; color: string; have: number; max: number }[] = [
    { key: 'crude', label: 'Crude', color: colors.goldDark, have: game.crudeOil, max: derived.maxCrudeStorage },
    { key: 'gasoline', label: 'Gas', color: colors.orange, have: game.gasoline, max: derived.maxGasolineStorage },
    ...products
      .filter((p) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
      .map((p) => ({ key: p.key, label: p.label, color: p.color, have: game.productInventory[p.key] ?? 0, max: PRODUCT_MAX_STORAGE(derived, p.key) })),
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
          <Animated.Image
            source={FACTORY_BG}
            style={[
              { position: 'absolute', top: -bgOverscan, left: -bgOverscan, right: -bgOverscan, bottom: -bgOverscan },
              bgAnimStyle,
            ]}
            resizeMode="cover"
          />
        </View>

        {/* Night veil */}
        {!isDaytime && (
          <View style={[StyleSheet.absoluteFill, styles.nightOverlay]} pointerEvents="none" />
        )}

        {/* ── Layer 1: Grid (absolute, pushed down from HUD by GRID_DROP) ── */}
        <View style={[styles.gridLayer, { top: yardTop }]}>
          <FactoryDiamondGroundView
            game={game}
            derived={derived}
            grid={game.grid}
            gridLevels={game.gridLevels}
            containerWidth={width}
            viewportHeight={sceneHeight - yardTop}
            contentOffsetY={GRID_DROP}
            displayGridSize={11}
            anchorGridSize={EXPANSION_BALANCE[0].size}
            onCellPress={handleCellPress}
            isActive={game.crudeOil > 0}
            panOutX={bgPanX}
            panOutY={bgPanY}
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

        {/* ── Layer 2 + 3: Card-Based HUD ────────────────────────────────── */}

        {/* Top HUD Card — consolidated company info + controls */}
        <View style={styles.hudCardWrap}>
          <CardHUD
            companyName={game.refineryName}
            companyTitle={refineryTitle}
            level={game.refineryLevel}
            canUpgrade={canUpgrade}
            isMaxLevel={isMaxLevel}
            onUpgradePress={() => setUpgradeModalOpen(true)}
            timeLabel={timeLabel}
            isDaytime={isDaytime}
            speed={speed}
            onSpeedPress={() => { haptics.tap(); cycleSpeed() }}
            boostActive={boostActive}
            boostReady={boostReady}
            boostSeconds={boostSecs}
            onBoostPress={() => { haptics.confirm(); sound.play('tap'); activateBoost() }}
            eventsCount={claimableHiddenEvents.length}
            onEventsPress={() => setEventModalOpen(true)}
          />

          {/* Resource Cards — grouped stats below the header */}
          <View style={styles.resourceCardsWrap}>
            <CardResourceBar
              stats={[
                {
                  icon: '💰',
                  label: t(text.hud.money),
                  value: `$${formatCompactNumber(game.money)}`,
                  subtitle: fmtMoneyRate(moneyRate),
                  color: moneyRate > 0 ? colors.green : moneyRate < 0 ? colors.red : undefined,
                },
                {
                  icon: '🛢️',
                  label: t(text.hud.crude),
                  value: game.crudeOil,
                  subtitle: game.crudeOil === 0 ? '⚠️ Empty' : `${Math.round((game.crudeOil / derived.maxCrudeStorage) * 100)}%`,
                  warn: game.crudeOil === 0,
                },
                {
                  icon: '⛽',
                  label: t(text.hud.gas),
                  value: game.gasoline,
                  subtitle: gasRate > 0 ? `+${gasRate}/min` : undefined,
                },
                {
                  icon: '⭐',
                  label: `${t(text.hud.rep)} ⋯`,
                  value: Math.floor(game.reputation),
                  subtitle: secondaryAlert ? '⚠️ Check meters' : undefined,
                  onPress: () => setSecondaryOpen((v) => !v),
                },
              ]}
            />
          </View>

          {/* Health meters — ESG + Morale in a compact row */}
          <View style={styles.meterCardsWrap}>
            <View style={styles.meterChip}>
              <Text style={styles.meterIcon}>🌱</Text>
              <Text style={[styles.meterValue, { color: getMeterColor(game.esgScore) }]}>
                {Math.round(game.esgScore)}
              </Text>
              <Text style={styles.meterLabel}>{t(text.hud.esg)}</Text>
            </View>
            <View style={styles.meterChip}>
              <Text style={styles.meterIcon}>🙂</Text>
              <Text style={[styles.meterValue, { color: getMeterColor(game.staffMorale) }]}>
                {Math.round(game.staffMorale)}
              </Text>
              <Text style={styles.meterLabel}>{t(text.hud.morale)}</Text>
            </View>
          </View>
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
          <Pressable
            style={styles.flowItem}
            disabled={!hasPowerInfo}
            onPress={() => setPowerPanelOpen(true)}
          >
            <GameIcon name="gas" size={15} />
            {gasPowerStarved ? (
              <Text style={styles.flowWarn} numberOfLines={1}>⚡ {t(text.hud.lowPower)} {powerBd.supply}/{powerBd.demand} ⓘ</Text>
            ) : (
              <>
                <Text style={styles.flowVal}>{gasRate > 0 ? `+${gasRate}` : gasRate}</Text>
                {hasPowerInfo ? (
                  <Text style={styles.flowUnit} numberOfLines={1}>
                    {'· ⚡'}
                    <Text style={[styles.flowPowerNum, powerDeficit && styles.flowUnitDeficit]}>{powerBd.supply}/{powerBd.demand}</Text>
                    {' ⓘ'}
                  </Text>
                ) : (
                  <Text style={styles.flowUnit}>{t(text.hud.output)}{t(text.hud.perMin)}</Text>
                )}
              </>
            )}
          </Pressable>
          {/* Season price forecast — gasoline's seasonal price direction + ETA
              to the next peak/trough, so buy/sell timing is readable at a glance. */}
          <View style={styles.flowItem}>
            <Text style={styles.flowIcon}>{seasonFc.rising ? '📈' : '📉'}</Text>
            <Text style={[styles.flowVal, seasonFc.rising ? styles.flowValUp : styles.flowValDown]}>
              {seasonFc.rising ? '+' : '−'}{seasonFc.swingPct}%
            </Text>
            <Text style={styles.flowUnit}>~{seasonFcMins}m</Text>
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
                {formatCompactNumber(nextGoal.progress.current)}/{formatCompactNumber(nextGoal.progress.target)}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.invStrip}
            contentContainerStyle={styles.invStripContent}
          >
            {inventoryItems.map((item) => {
              const full = item.max > 0 && item.have >= item.max
              return (
                <View key={item.key} style={styles.invChip}>
                  <View style={[styles.invDot, { backgroundColor: item.color }]} />
                  <View>
                    <Text style={[styles.invVal, full && styles.invValFull]}>{item.have}/{item.max}</Text>
                    <Text style={styles.invLabel}>{item.label}</Text>
                  </View>
                </View>
              )
            })}
          </ScrollView>
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
                  <Text style={styles.tradeActionSub}>
                    ${derived.sellPrice}/unit{' '}
                    {getProductMarketLevel(game, 'gasoline') < 0.9 ? (
                      <Text style={styles.pricePricey}>↓ low</Text>
                    ) : null}
                  </Text>
                </AnimatedPressable>
              </View>

              <View style={styles.tradeDivider} />

              {/* Demand saturation — which products are flooded (low = dumping
                  it further just tanks its own price). */}
              <Text style={styles.tradeSectionTitle}>{t(text.hud.demandTitle)}</Text>
              <SaturationBars
                rows={[
                  { label: 'Gasoline', level: getProductMarketLevel(game, 'gasoline') },
                  ...products
                    .filter((p) => derived.buildingCounts[PRODUCT_PLANT_BUILDING[p.key]] > 0)
                    .map((p) => ({ label: p.label, level: getProductMarketLevel(game, p.key) })),
                ]}
              />

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
                    <Switch
                      style={styles.rowSwitch}
                      value={autoTrade.crudeBuyEnabled}
                      onValueChange={(v) => updateAutoTrade({ crudeBuyEnabled: v })}
                      trackColor={{ false: colors.creamBorder, true: colors.green }}
                    />
                    <Text style={[styles.thresholdLabel, !autoTrade.crudeBuyEnabled && styles.thresholdLabelOff]}>Buy crude below {autoTrade.buyThreshold}%</Text>
                    <View style={styles.stepper}>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}>
                        <Text style={styles.stepperLabel}>−</Text>
                      </Pressable>
                      <Text style={styles.stepperValue}>{autoTrade.buyThreshold}%</Text>
                      <Pressable style={styles.stepperButton} onPress={() => updateAutoTrade({ buyThreshold: Math.min(95, autoTrade.buyThreshold + 5) })}>
                        <Text style={styles.stepperLabel}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.thresholdRow}>
                    <Switch
                      style={styles.rowSwitch}
                      value={autoTrade.gasolineSellEnabled}
                      onValueChange={(v) => updateAutoTrade({ gasolineSellEnabled: v })}
                      trackColor={{ false: colors.creamBorder, true: colors.green }}
                    />
                    <Text style={[styles.thresholdLabel, !autoTrade.gasolineSellEnabled && styles.thresholdLabelOff]}>Sell gasoline above {autoTrade.sellThreshold}%</Text>
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
                      const on = autoTrade.productSellEnabled[p.key] !== false
                      return (
                        <View key={p.key} style={styles.thresholdRow}>
                          <Switch
                            style={styles.rowSwitch}
                            value={on}
                            onValueChange={(v) => updateAutoTrade({ productSellEnabled: { ...autoTrade.productSellEnabled, [p.key]: v } })}
                            trackColor={{ false: colors.creamBorder, true: colors.green }}
                          />
                          <Text style={[styles.thresholdLabel, !on && styles.thresholdLabelOff]}>
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

        {/* ── Power breakdown sheet — where the electricity goes ──────────── */}
        <Modal visible={powerPanelOpen} transparent animationType="fade" onRequestClose={() => setPowerPanelOpen(false)}>
          <Pressable style={styles.tradeModalBackdrop} onPress={() => setPowerPanelOpen(false)}>
            <View style={styles.tradeModalAnchor}>
              <Pressable style={styles.tradePanel} onPress={(e) => e.stopPropagation()}>
                <Text style={styles.powerTitle}>{t(text.hud.powerSheetTitle)}</Text>
                {/* Supply vs demand summary */}
                <View style={styles.powerSummaryRow}>
                  <View style={styles.powerSummaryCol}>
                    <Text style={styles.powerSummaryVal}>{powerBd.supply}</Text>
                    <Text style={styles.powerSummaryLbl}>{t(text.hud.powerSupply)}</Text>
                  </View>
                  <Text style={styles.powerSummaryVs}>vs</Text>
                  <View style={styles.powerSummaryCol}>
                    <Text style={[styles.powerSummaryVal, powerBd.demand > powerBd.supply && powerBd.supply > 0 && styles.meterDanger]}>{powerBd.demand}</Text>
                    <Text style={styles.powerSummaryLbl}>{t(text.hud.powerDemand)}</Text>
                  </View>
                </View>
                {powerBd.supply > 0 && powerBd.demand > powerBd.supply ? (
                  <Text style={styles.powerDeficit}>{t(text.hud.powerDeficit(Math.round((powerBd.supply / powerBd.demand) * 100)))}</Text>
                ) : powerBd.supply > 0 ? (
                  <Text style={styles.powerCovered}>{t(text.hud.powerCovered)}</Text>
                ) : (
                  <Text style={styles.powerHint}>{t(text.hud.powerNoPlant)}</Text>
                )}
                <View style={styles.tradeDivider} />
                {/* Per-plant-type consumption, biggest draw first */}
                {powerBd.rows.length === 0 ? (
                  <Text style={styles.powerHint}>{t(text.hud.powerNoDraw)}</Text>
                ) : (
                  powerBd.rows.map((row) => {
                    const share = powerBd.demand > 0 ? row.total / powerBd.demand : 0
                    return (
                      <View key={row.buildingKey} style={styles.powerRow}>
                        <Text style={styles.powerRowName} numberOfLines={1}>
                          {t(BUILDINGS[row.buildingKey].name)} ×{row.count}
                        </Text>
                        <View style={styles.powerBarTrack}>
                          <View style={[styles.powerBarFill, { width: `${Math.round(share * 100)}%` }]} />
                        </View>
                        <Text style={styles.powerRowVal}>{row.total}⚡</Text>
                      </View>
                    )
                  })
                )}
                {powerBd.gasolineDraws && (
                  <Text style={styles.powerGasNote}>{t(text.hud.powerGasNote)}</Text>
                )}
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
        <Text style={[styles.tradeSectionTitle, { marginTop: spacing.md }]}>{t(text.hud.cashOverTime)}</Text>
        <HistoryGraph data={moneyHistory} width={width - spacing.lg * 2} height={90} />
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
                dark
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
            dark
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
                  const builtCount     = derived.buildingCounts[key] ?? 0

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
                        {/* How many of this building are already placed */}
                        {builtCount > 0 && (
                          <View style={[styles.buildCountBadge, { borderColor: accentColor }]}>
                            <Text style={[styles.buildCountBadgeText, { color: accentColor }]}>{builtCount}</Text>
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
          const staffBonus        = getCellStaffBonus(game, infoCell)
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
                            ${formatCompactNumber(upgradeCost)} · {canAffordUpgrade ? `have $${formatCompactNumber(game.money)}` : `need $${formatCompactNumber(upgradeCost - game.money)} more`}
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
                    <>
                      <ListRow
                        title={assignedEmployee.name}
                        subtitle={`Lv${assignedEmployee.level}${assignedEmployee.trait === 'veteran' ? ' · Veteran' : ''}`}
                        badge={t(text.plantInfo.assignedBadge)}
                        actionLabel={t(text.plantInfo.unassign)}
                        onPress={() => unassignCell(infoCell)}
                      />
                      {staffBonus && staffBonus.bonusPct > 0 && (
                        <Text style={styles.staffBoostLine}>{t(text.plantInfo.staffBoost(staffBonus.bonusPct))}</Text>
                      )}
                      <View style={styles.plantSkillRow}>
                        <StaffSkillList skills={getEmployeeSkills(assignedEmployee)} isAce={assignedEmployee.isAce} compact />
                      </View>
                    </>
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
                      actionLabel={t(text.plantInfo.assign)}
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
              display: `$${formatCompactNumber(upgradeCost)} (have $${formatCompactNumber(game.money)})`,
            },
            {
              label: 'Gasoline output',
              met: hasEnoughProduction,
              display: `${formatCompactNumber(game.totalGasolineProduced)} / ${formatCompactNumber(upgradeProductionRequired)}`,
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
                    <Text style={styles.upgMaxSub}>Lv{MAX_REFINERY_LEVEL} — All buildings and eras unlocked.</Text>
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
                  <Text style={[styles.upgLevelNum, { color: canUpgrade ? colors.green : 'rgba(255,255,255,0.5)' }]}>Lv{nextLevel}</Text>
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
                    spawnFloat(`-$${formatCompactNumber(upgradeCost)}`, 'expense')
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

      {/* ── Floating Recruit button (bottom-right) — quick access to the
          hiring pool without taking a bottom-nav slot. ──────────────────── */}
      <Pressable
        style={[styles.recruitFab, { bottom: 66 + insets.bottom + ACTION_DOCK_H + 10 }]}
        onPress={() => router.push('/game/recruit')}
      >
        <Text style={styles.recruitFabIcon}>🧑‍💼</Text>
        {staffReady ? <View style={styles.recruitFabBadge}><Text style={styles.recruitFabBadgeText}>{game.recruitmentPool.length}</Text></View> : null}
        <Text style={styles.recruitFabLabel}>{t(text.nav.recruit)}</Text>
      </Pressable>

      {/* ── Persistent bottom navigation ──────────────────────────────── */}
      <BottomNav items={FAB_ITEMS} />

      {/* ── Grouped, collapsible side drawer (opened from the Menu tab) ── */}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} sections={MENU_SECTIONS} />

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
  buildCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildCountBadgeText: {
    fontSize: 11,
    fontWeight: '900',
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
    backgroundColor: 'rgba(242,193,46,0.12)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(242,193,46,0.5)',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  upgMaxIcon: { fontSize: 32 },
  upgMaxTitle: { fontSize: 15, fontWeight: '900', color: '#EAF1F8' },
  upgMaxSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  upgLevelStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, gap: 0 },
  upgLevelBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: radii.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  upgLevelBoxNext: { borderColor: colors.green },
  upgLevelNum: { fontSize: 24, fontWeight: '900', color: '#EAF1F8' },
  upgLevelLabel: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
  upgArrowWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  upgArrowLine: { height: 2, width: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  upgArrowLineReady: { backgroundColor: colors.green },
  upgArrowHead: { fontSize: 14, color: 'rgba(255,255,255,0.3)', marginLeft: -4 },
  upgArrowHeadReady: { color: colors.green },
  upgUnlockBox: { backgroundColor: 'rgba(127,174,116,0.12)', borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(127,174,116,0.5)', padding: spacing.sm, marginBottom: spacing.sm, gap: 3 },
  upgUnlockTitle: { fontSize: 10, fontWeight: '900', color: '#9BD590', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  upgUnlockItem: { fontSize: 12, color: '#B6DDAE', fontWeight: '600' },
  upgSectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.xs },
  upgReqRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  upgReqCheck: { fontSize: 16, fontWeight: '900', width: 22, textAlign: 'center' },
  upgReqCheckMet: { color: colors.green },
  upgReqCheckUnmet: { color: '#E77',  },
  upgReqTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  upgReqLabel: { fontSize: 13, color: '#EAF1F8', fontWeight: '600' },
  upgReqLabelUnmet: { color: 'rgba(255,255,255,0.5)' },
  upgReqValue: { fontSize: 12, fontWeight: '700', color: '#EAF1F8' },
  upgReqValueUnmet: { color: '#E77' },
  upgReqBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radii.pill, overflow: 'hidden', marginTop: 4 },
  upgReqBarFill: { height: '100%', borderRadius: radii.pill },
  upgButton: { marginTop: spacing.sm, backgroundColor: colors.green, borderRadius: radii.md, paddingVertical: 13, alignItems: 'center' },
  upgButtonOff: { backgroundColor: 'rgba(255,255,255,0.1)' },
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
  boostPill: {
    height: 28,
    minWidth: 30,
    paddingHorizontal: 8,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  boostPillReady: {
    backgroundColor: 'rgba(232,131,58,0.9)',
    borderColor: '#FFB27A',
  },
  boostPillActive: {
    backgroundColor: '#E8833A',
    borderColor: '#FFD9B0',
  },
  boostPillCooldown: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderColor: 'rgba(255,255,255,0.15)',
  },
  boostPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
  boostPillTextDim: {
    color: 'rgba(255,255,255,0.55)',
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

  // ── Layer 2+3: Card-Based HUD ─────────────────────────────────────────
  hudCardWrap: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.md,
    right: spacing.md,
    zIndex: 20,
    gap: spacing.sm,
  },
  resourceCardsWrap: {
    // Padding handled by CardResourceBar
  },
  meterCardsWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  meterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(20, 28, 40, 0.85)',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
  },
  meterIcon: {
    fontSize: 14,
  },
  meterValue: {
    fontSize: 14,
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  meterLabel: {
    fontSize: 9,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // ── Layer 3 (Legacy): Resource Dock + Goal Banner ────────────────────────────────
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dockText: {
    alignItems: 'flex-start',
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
  dockEmoji: { fontSize: 17 },
  meterGood: { color: '#7CE38B' },
  meterWarn: { color: '#F2C12E' },
  meterDanger: { color: '#FF6B5A' },
  // Power breakdown sheet
  powerTitle: { fontSize: 16, fontWeight: '900', color: '#F2F6FB', textAlign: 'center', marginBottom: spacing.sm },
  powerSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.xs },
  powerSummaryCol: { alignItems: 'center' },
  powerSummaryVal: { fontSize: 22, fontWeight: '900', color: '#F2F6FB' },
  powerSummaryLbl: { fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.4 },
  powerSummaryVs: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '700' },
  powerDeficit: { fontSize: 12, fontWeight: '800', color: '#EDA76A', textAlign: 'center', marginBottom: spacing.xs },
  powerCovered: { fontSize: 12, fontWeight: '800', color: '#8FD08A', textAlign: 'center', marginBottom: spacing.xs },
  powerHint: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginVertical: spacing.xs },
  powerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 6 },
  powerRowName: { fontSize: 12, fontWeight: '700', color: '#EAF1F8', width: 120 },
  powerBarTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  powerBarFill: { height: '100%', borderRadius: 4, backgroundColor: colors.orange },
  powerRowVal: { fontSize: 12, fontWeight: '900', color: '#EAF1F8', width: 44, textAlign: 'right' },
  powerGasNote: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: spacing.xs },
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
  flowWarn: {
    fontSize: 10.5,
    fontFamily: fonts.heading,
    color: colors.gold,
    letterSpacing: 0.2,
  },
  flowUnit: {
    fontSize: 8.5,
    fontFamily: fonts.body,
    color: '#90A6BE',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  // Inline power supply/demand readout (x/x) in the gas flow item.
  flowPowerNum: {
    fontSize: 10,
    fontFamily: fonts.heading,
    color: '#DDE6F0',
    letterSpacing: 0.2,
  },
  flowUnitDeficit: {
    color: colors.orange,
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
  recruitFab: {
    position: 'absolute',
    right: spacing.md,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  recruitFabIcon: { fontSize: 22 },
  recruitFabLabel: { fontSize: 7.5, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: -1 },
  recruitFabBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.orange,
    borderWidth: 1.5,
    borderColor: '#1C2634',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recruitFabBadgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
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
  invStrip: {
    flex: 1,
    marginRight: spacing.sm,
  },
  invStripContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.sm,
  },
  invChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  invDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  invVal: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  invValFull: {
    color: '#F2C12E',
  },
  invLabel: {
    fontSize: 8,
    color: '#6B8099',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
    backgroundColor: '#161D28',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    padding: spacing.md,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
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
    backgroundColor: 'rgba(91,141,191,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(91,141,191,0.55)',
  },
  sellBtn: {
    backgroundColor: 'rgba(127,174,116,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(127,174,116,0.6)',
  },
  tradeActionLabel: {
    fontWeight: '800',
    color: '#EAF1F8',
    fontSize: 13,
  },
  tradeActionSub: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 10,
    marginTop: 2,
  },
  priceCheap: {
    color: '#8FD08A',
    fontWeight: '800',
  },
  pricePricey: {
    color: '#EDA76A',
    fontWeight: '800',
  },
  tradeDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: spacing.sm,
  },
  autoTradeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autoTradeRowTitle: {
    fontWeight: '800',
    color: '#EAF1F8',
    fontSize: 13,
  },
  tradeSectionTitle: {
    fontWeight: '800',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  // ── More Info sheet rows ──────────────────────────────────────────────────
  infoStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  infoStatLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  infoStatValue: {
    color: '#EAF1F8',
    fontWeight: '800',
    fontSize: 13,
  },

  // ── Events sheet ─────────────────────────────────────────────────────────
  eventEmpty: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  // ── Building info sheet ───────────────────────────────────────────────────
  infoLevel: {
    fontWeight: '800',
    color: '#EAF1F8',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  infoDescription: {
    color: 'rgba(255,255,255,0.6)',
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
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  infoEffectLabel: {
    color: '#EAF1F8',
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
  staffBoostLine: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  plantSkillRow: {
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
    color: 'rgba(255,255,255,0.6)',
    paddingRight: spacing.sm,
  },
  thresholdLabelOff: {
    opacity: 0.4,
  },
  rowSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    marginRight: 2,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontWeight: '800',
    color: '#EAF1F8',
    fontSize: 16,
  },
  stepperValue: {
    fontWeight: '800',
    color: '#EAF1F8',
    fontSize: 13,
    minWidth: 40,
    textAlign: 'center',
  },
})
