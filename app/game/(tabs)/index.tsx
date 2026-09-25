import { useState, useEffect, useCallback } from 'react'
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native'
import type { ImageSourcePropType } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}
import { Bell, Clock3, Hammer, LocateFixed, Menu, Zap } from 'lucide-react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
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
import { colors, radii, spacing, fonts, modernUi, pixelRadii, pixelUi, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { STARTER_PLANT_ART_BY_LEVEL } from '../../../src/starterPlantArt'
import GameIcon from '../../../src/components/GameIcon'
import HistoryGraph from '../../../src/components/HistoryGraph'
import { text } from '../../../src/game/translations'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { ENDGAME_GOALS } from '../../../src/game/data/endgameGoals'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { WORKERS } from '../../../src/game/data/workers'
import { BUILDING_UPGRADE_BALANCE, PLANT_PRODUCTION, GRID_EDIT_BALANCE, EXPANSION_BALANCE, PRESTIGE_BALANCE, PRODUCTION_BALANCE, POWER_PLANT_BALANCE, MAX_REFINERY_LEVEL } from '../../../src/game/data/balance'
import type { BilingualTextValue, BuildingType } from '../../../src/game/types'
import {
  getBuildingEffectLines,
  getCellAssignedToEmployee,
  getCellStaffBonus,
  getEmployeeSkills,
  getPowerBreakdown,
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
  formatCompactNumber,
  TICK_MS,
} from '../../../src/game/utils/gameCalculations'
import StaffSkillList from '../../../src/components/StaffSkillList'
import { isBoostActive, canActivateBoost } from '../../../src/hooks/useGameLoop'
import FactoryDiamondGroundView from '../../../src/components/FactoryDiamondGroundView'
import FactorySkiaView from '../../../src/components/FactorySkiaView'
// Direction C: the GPU (Skia) scene renderer for smooth pan/zoom. Native only —
// Skia needs CanvasKit on web, so the web build keeps the View renderer. Flip
// the flag to false to fall back to the old renderer on device too.
const USE_SKIA_SCENE = Platform.OS !== 'web'
import { FACTORY_BG, BG_OFFSET_X, BG_OFFSET_Y, BG_PARALLAX, BG_ZOOM_PARALLAX, GRID_DROP } from '../../../src/config/factoryScene'


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
const PLANT_THUMB_BY_LEVEL: Partial<Record<BuildingType, Record<number, ImageSourcePropType>>> = {
  crudeTank:           STARTER_PLANT_ART_BY_LEVEL.crudeTank,
  distillationUnit:    STARTER_PLANT_ART_BY_LEVEL.distillationUnit,
  gasolineTank:        STARTER_PLANT_ART_BY_LEVEL.gasolineTank,
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
  crudeTank:           STARTER_PLANT_ART_BY_LEVEL.crudeTank![1],
  distillationUnit:    STARTER_PLANT_ART_BY_LEVEL.distillationUnit![1],
  gasolineTank:        STARTER_PLANT_ART_BY_LEVEL.gasolineTank![1],
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

type BuildCategory = 'storage' | 'production' | 'power' | 'waste' | 'research' | 'support'
const BUILD_CATEGORIES: readonly BuildCategory[] = ['storage', 'production', 'power', 'waste', 'research', 'support']

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
  'gasolineTank',
  'laboratory',
  'maintenanceWorkshop',
  'salesOffice',
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
  'polymerPlant',
]

// ── Scene geometry constants ──────────────────────────────────────────────────
const SKY_RATIO    = 0.08   // สัดส่วนความสูงฟ้า (0.0–1.0) → กำหนดตำแหน่ง HUD + Grid
const HORIZON_H    = 8    // px — ความสูง horizon strip (ถ้าไม่ใช้ bg รูปก็ set 0 ได้)
const RESOURCE_H   = 40    // px — compact resource dock height
const FLOW_H       = 22    // px — slim flow-rate strip (net $/min + output/min)
const GOAL_H       = 26    // retained for the legacy goal style
const RESOURCE_DOCK_H = 40 // px — compact resource dock card height
const ACTION_DOCK_H = 48   // retained by legacy style definitions

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
    placeBuilding, demolishBuilding, moveBuilding, swapBuildings,
    claimHiddenEvent, upgradeBuilding, upgradeRefinery,
    activateBoost,
    adjustFeedstockPriority, assignEmployeeToCell, unassignCell,
    speed, cycleSpeed, flowRates, moneyHistory,
  } = useGame()
  const { fixCrisis, ignoreCrisis } = useGame()
  const { t } = useLang()

  // All hooks before any early returns
  const { width, height } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const [pickerCell, setPickerCell] = useState<number | null>(null)
  const [buildModeOpen, setBuildModeOpen] = useState(false)
  const [infoCell,   setInfoCell]   = useState<number | null>(null)
  const [hoveredBuildingKey, setHoveredBuildingKey] = useState<BuildingType | null>(null)
  const [buildCategory, setBuildCategory] = useState<BuildCategory>('storage')
  const [selectedBuildKey, setSelectedBuildKey] = useState<BuildingType | null>(null)
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
  const [powerPanelOpen, setPowerPanelOpen] = useState(false)
  const [secondaryOpen, setSecondaryOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)

  // Background parallax shared values + style. MUST stay above the early
  // return below so the hook order is identical on every render (React #310).
  // The grid view writes its live pan offset into these; the bg follows at
  // BG_PARALLAX so the whole scene pans together.
  const bgPanX      = useSharedValue(0)
  const bgPanY      = useSharedValue(0)
  const bgZoom      = useSharedValue(1)
  const [cameraResetKey, setCameraResetKey] = useState(0)
  // Background derives from the same camera as the playable world. Reduced
  // pan/zoom factors preserve depth without allowing the two layers to drift.
  const bgAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + (bgZoom.value - 1) * BG_ZOOM_PARALLAX },
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
    const cell = game.grid[index]
    if (cell === null) {
      // Empty build lots are the primary Build entry point. Opening the picker
      // directly restores the original `+` interaction and also guarantees an
      // empty lot can never fall through to a blank Building Info sheet.
      setBuildModeOpen(true)
      setPickerCell(index)
      setSelectedBuildKey(null)
      return
    }
    setInfoCell(index)
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
  const bgOverscan = Math.abs(BG_OFFSET_X) + Math.abs(BG_OFFSET_Y) + 140
  // Where the yard background starts (absolute y within scene)
  const yardTop     = skyH + HORIZON_H
  // Resource strip straddles the sky / yard boundary
  const resourceTop = yardTop - Math.floor(RESOURCE_H / 2) - HUD_OFFSET_UP
  // Flow-rate strip sits directly under the resource dock...
  const flowTop     = resourceTop + RESOURCE_H + 6
  // ...and the goal panel sits just below that, inside the yard

  // ── Derived game values ───────────────────────────────────────────────────
  const seasonLabel        = getSeasonLabel(game.tickCount, game.yearStartTick)
  const seasonPct          = Math.round(derived.seasonalGasolineMultiplier * 100)
  // Forecast the seasonal gasoline-demand wave so the player can time stockpiling
  // vs selling (pairs with the crude price wave on the Supply tab).
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
  const timeLabel          = `${formatGameClockTime(derived.gameClock)} · D${derived.gameClock.dayOfMonth + 1}`
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


  // Combo hint cells — tiles that would complete an undiscovered combo
  const comboHintCells = hoveredBuildingKey && pickerCell !== null
    ? getComboHintCells(game.grid, game.discoveredCombos, pickerCell, hoveredBuildingKey)
    : []

  // Secondary destination badges. Primary destinations now live in the
  // persistent four-tab navigation shared by every screen.
  const researchReady = derived.activeResearchItems.filter(
    (i) => !i.isUnlocked && i.isVisible && game.researchPoints >= i.cost
  ).length
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

  const safeGame    = game
  const safeDerived = derived

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER — Layered scene composition
  //
  // Layer 0 (z:0)  — Background: absoluteFill, sky + yard split, pointerEvents none
  // Layer 1 (z:10) — Grid: absolute, top=yardTop, ScrollView inside
  // Layer 2 (z:20) — HUD: name/level top-left; time/events top-right
  // Layer 3 (z:20) — Resource strip + goal panel, straddle sky/yard boundary
  // Operations owns Buy/Sell and Auto Trade; the Factory has no bottom dock.
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      <View style={styles.scene}>

        {/* ── Layer 0: Background (absoluteFill, no pointer events) ─────── */}
        {!USE_SKIA_SCENE && (
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
        )}

        {/* Night veil */}
        {!isDaytime && (
          <View style={[StyleSheet.absoluteFill, styles.nightOverlay]} pointerEvents="none" />
        )}

        {/* ── Layer 1: Grid (absolute, pushed down from HUD by GRID_DROP) ── */}
        <View style={[styles.gridLayer, { top: USE_SKIA_SCENE ? 0 : yardTop }]}>
          {USE_SKIA_SCENE ? (
            <FactorySkiaView
              grid={game.grid}
              gridLevels={game.gridLevels}
              backgroundSource={FACTORY_BG}
              containerWidth={width}
              viewportHeight={sceneHeight}
              contentOffsetY={yardTop + GRID_DROP}
              displayGridSize={5}
              anchorGridSize={EXPANSION_BALANCE[0].size}
              onCellPress={handleCellPress}
              selectedCellIndex={pickerCell}
              showPlacementGrid={buildModeOpen || pickerCell !== null}
              panOutX={bgPanX}
              panOutY={bgPanY}
              zoomOut={bgZoom}
              cameraResetKey={cameraResetKey}
            />
          ) : (
            <FactoryDiamondGroundView
              game={game}
              derived={derived}
              grid={game.grid}
              gridLevels={game.gridLevels}
              containerWidth={width}
              viewportHeight={sceneHeight - yardTop}
              contentOffsetY={GRID_DROP}
              displayGridSize={5}
              anchorGridSize={EXPANSION_BALANCE[0].size}
              onCellPress={handleCellPress}
              isActive={game.crudeOil > 0}
              panOutX={bgPanX}
              panOutY={bgPanY}
            />
          )}
          {USE_SKIA_SCENE && (
            <View style={styles.cameraControlStack}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open build mode"
                disabled={firstEmptyCellIndex < 0}
                style={[styles.buildModeButton, buildModeOpen && styles.buildModeButtonActive]}
                onPress={() => {
                  if (firstEmptyCellIndex < 0) return
                  const next = !buildModeOpen
                  setBuildModeOpen(next)
                  setSelectedBuildKey(null)
                  setPickerCell(null)
                  setHoveredBuildingKey(null)
                }}
              >
                <Hammer size={20} color={buildModeOpen ? '#071E31' : '#FFD447'} strokeWidth={2.8} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Center factory camera"
                style={styles.centerCameraButton}
                onPress={() => setCameraResetKey((key) => key + 1)}
              >
                <LocateFixed size={19} color="#EAF1F8" strokeWidth={2.5} />
              </Pressable>
            </View>
          )}
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

        {/* ── Layer 2 + 3: Company block + Resource Dock + Goal ─────────── */}

        {/* Company identity stays quiet so the world remains the focus. */}
        <View style={styles.companyBlock}>
          <View style={styles.companyNameRow}>
            <Text style={styles.companyName} numberOfLines={1}>{game.refineryName}</Text>
            <AnimatedPressable
              style={[styles.lvBadge, canUpgrade && styles.lvBadgeReady, isMaxLevel && styles.lvBadgeMaxed]}
              onPress={() => setUpgradeModalOpen(true)}
            >
              <Text style={styles.lvBadgeText}>
                {isMaxLevel ? 'Lv20' : `Lv${game.refineryLevel}${canUpgrade ? ' ↑' : ''}`}
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        {/* Compact controls: time, speed, alerts and one More menu. */}
        <View style={styles.topRightHud}>
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More menu"
            style={styles.menuBtn}
            onPress={() => router.push('/game/management')}
          >
            <Menu size={17} color={modernUi.text} strokeWidth={2.4} />
            {researchReady > 0 && <View style={styles.menuAlertDot} />}
          </Pressable>
        </View>

        {/* Resource dock — dark card straddling sky/yard boundary */}
        <View style={[styles.resourceDock, { top: resourceTop }]}>
          <View style={styles.dockStat}>
            <GameIcon name="money" size={22} />
            <Text style={styles.dockVal}>${formatCompactNumber(game.money)}</Text>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockStat}>
            <GameIcon name="crude" size={22} />
            <Text style={[styles.dockVal, game.crudeOil === 0 && styles.dockValWarn]}>{game.crudeOil}</Text>
          </View>
          <View style={styles.dockDivider} />
          <View style={styles.dockStat}>
            <GameIcon name="gas" size={22} />
            <Text style={styles.dockVal}>{game.gasoline}</Text>
          </View>
          <View style={styles.dockDivider} />
          <Pressable style={styles.dockStat} onPress={() => setSecondaryOpen(true)}>
            <View style={styles.dockToggleIconWrap}>
              <GameIcon name="reputation" size={22} />
              {secondaryAlert && <View style={styles.dockAlertDot} />}
            </View>
            <Text style={styles.dockVal}>{Math.floor(game.reputation)}</Text>
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
          {/* Boost lives in the status rail so its countdown can never collide
              with the refinery name on compact phones. */}
          <Pressable
            style={[styles.flowBoostButton, boostActive ? styles.boostPillActive : boostReady ? styles.boostPillReady : styles.boostPillCooldown]}
            disabled={!boostReady}
            onPress={() => { haptics.confirm(); sound.play('tap'); activateBoost() }}
          >
            <Text style={[styles.boostPillText, !boostReady && !boostActive && styles.boostPillTextDim]}>
              🔥{boostActive ? ` ${boostSecs}s` : boostReady ? ' BOOST' : ` ${boostSecs}s`}
            </Text>
          </Pressable>
        </View>

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
        {nextGoal && (
          <Pressable style={styles.moreGoalCard} onPress={() => { setSecondaryOpen(false); router.push('/achievements') }}>
            <Text style={styles.moreGoalLabel}>CURRENT GOAL</Text>
            <Text style={styles.moreGoalTitle}>{t(nextGoal.name)}</Text>
            {nextGoal.progress && (
              <Text style={styles.moreGoalProgress}>
                {formatCompactNumber(nextGoal.progress.current)}/{formatCompactNumber(nextGoal.progress.target)}
              </Text>
            )}
          </Pressable>
        )}
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
                  if (firstEmptyCellIndex >= 0) {
                    setBuildModeOpen(true)
                    setSelectedBuildKey(null)
                    setPickerCell(firstEmptyCellIndex)
                  }
                }}
              />
            )
          })
        )}
      </Sheet>

      {/* Buy/Sell and Auto Trade now live on Operations. */}

      {/* ── Build picker ─────────────────────────────────────────────────── */}
      <Sheet
        visible={pickerCell !== null}
        title="Build"
        maxHeight="66%"
        onClose={() => {
          setPickerCell(null)
          setSelectedBuildKey(null)
          setHoveredBuildingKey(null)
        }}
      >
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

        {/* One category at a time keeps the picker compact and scannable. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buildTabs}>
          {BUILD_CATEGORIES.map((category) => {
            const active = buildCategory === category
            return (
              <Pressable
                key={category}
                style={[styles.buildTab, active && styles.buildTabActive]}
                onPress={() => {
                  setBuildCategory(category)
                  setSelectedBuildKey(null)
                  setHoveredBuildingKey(null)
                }}
              >
                <Text style={[styles.buildTabText, active && styles.buildTabTextActive]}>{CATEGORY_LABEL[category]}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {(() => {
          const categoryBuildings = BUILDING_KEYS.filter((key) => BUILDING_CATEGORY_BY_TYPE[key] === buildCategory)
          const accentColor = BUILDING_CATEGORY_ACCENT[buildCategory]
          return (
            <View style={styles.buildCategory}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.buildGrid}>
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
                  const surfaceColor   = BUILDING_CATEGORY_SURFACE[buildCategory]
                  const builtCount     = derived.buildingCounts[key] ?? 0
                  const selected       = selectedBuildKey === key

                  return (
                    <Pressable
                      key={key}
                      style={[
                        styles.buildCard,
                        { borderColor: selected ? pixelUi.accent : canBuild ? accentColor : pixelUi.textMuted },
                        locked && styles.buildCardLocked,
                        canBuild && affordable && styles.buildCardAffordable,
                        selected && styles.buildCardSelected,
                      ]}
                      onPressIn={() => {
                        if (canBuild) setHoveredBuildingKey(key)
                      }}
                      onPressOut={() => setHoveredBuildingKey(null)}
                      onPress={() => {
                        if (locked || !affordable) return
                        haptics.tap()
                        setSelectedBuildKey(key)
                        setHoveredBuildingKey(key)
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
              </ScrollView>
            </View>
          )
        })()}

        <View style={styles.buildFooter}>
          <View style={styles.buildSelectionCopy}>
            <Text style={styles.buildSelectionLabel}>{selectedBuildKey ? 'SELECTED' : 'CHOOSE A BUILDING'}</Text>
            <Text style={styles.buildSelectionName} numberOfLines={1}>
              {selectedBuildKey ? t(BUILDINGS[selectedBuildKey].name) : CATEGORY_LABEL[buildCategory]}
            </Text>
          </View>
          <Pressable
            style={styles.buildCancelButton}
            onPress={() => {
              setPickerCell(null)
              setSelectedBuildKey(null)
              setHoveredBuildingKey(null)
              setBuildModeOpen(false)
            }}
          >
            <Text style={styles.buildCancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            disabled={!selectedBuildKey}
            style={[styles.buildPlaceButton, !selectedBuildKey && styles.buildPlaceButtonDisabled]}
            onPress={() => {
              if (pickerCell === null || !selectedBuildKey) return
              placeBuilding(pickerCell, selectedBuildKey)
              haptics.confirm()
              sound.play('build')
              setPickerCell(null)
              setSelectedBuildKey(null)
              setHoveredBuildingKey(null)
              setBuildModeOpen(false)
            }}
          >
            <Text style={styles.buildPlaceText}>Place</Text>
          </Pressable>
        </View>
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
          const isUpgradeable = Boolean(UPGRADEABLE.includes(cell))
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
                  {isUpgradeable ? (
                    <View style={styles.infoLevelDots}>
                      {Array.from({ length: maxLevel }).map((_, i) => (
                        <View key={i} style={[styles.infoDot, i < level ? { backgroundColor: accent } : styles.infoDotEmpty]} />
                      ))}
                    </View>
                  ) : null}

                  {/* Next level art preview (if not maxed) */}
                  {isUpgradeable && !maxed && Boolean(thumbNext) && (
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
  cameraControlStack: {
    position: 'absolute',
    right: spacing.md,
    bottom: FLOATING_TAB_BAR_CLEARANCE + 72,
    alignItems: 'center',
    gap: 4,
    zIndex: 4,
  },
  buildModeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(10,35,56,0.94)',
    borderWidth: 2,
    borderColor: '#176197',
  },
  buildModeButtonActive: {
    backgroundColor: '#FFD447',
    borderColor: '#FFF0A3',
  },
  buildModeButtonText: {
    fontFamily: fonts.display,
    fontSize: 12,
    color: '#FFD447',
    letterSpacing: 0.8,
  },
  buildModeButtonTextActive: {
    color: '#071E31',
  },
  centerCameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(19,29,42,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
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
  buildTabs: {
    gap: 6,
    paddingVertical: 8,
    paddingRight: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: pixelUi.borderSoft,
  },
  buildTab: {
    minHeight: 36,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: pixelUi.surface,
    borderWidth: 2,
    borderColor: pixelUi.borderSoft,
    borderRadius: pixelRadii.control,
  },
  buildTabActive: {
    backgroundColor: pixelUi.surfaceRaised,
    borderColor: pixelUi.accent,
    borderBottomWidth: 4,
  },
  buildTabText: {
    fontSize: 9,
    fontFamily: fonts.heading,
    color: pixelUi.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  buildTabTextActive: {
    color: pixelUi.accent,
  },
  buildCategory: {
    marginBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  buildGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  buildCard: {
    width: 126,
    backgroundColor: pixelUi.surfaceRaised,
    borderRadius: pixelRadii.control,
    borderWidth: 2,
    overflow: 'hidden',
  },
  buildCardLocked: {
    backgroundColor: pixelUi.surface,
    opacity: 0.52,
  },
  buildCardAffordable: {
    borderBottomWidth: 4,
  },
  buildCardSelected: {
    backgroundColor: pixelUi.surfacePressed,
    borderBottomWidth: 5,
  },
  buildThumbWrap: {
    height: 68,
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
    borderRadius: pixelRadii.control,
    borderWidth: 2,
    backgroundColor: pixelUi.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildCountBadgeText: {
    fontSize: 11,
    fontFamily: fonts.heading,
  },
  buildThumb: {
    width: 60,
    height: 60,
  },
  buildThumbCode: {
    fontSize: 22,
    fontFamily: fonts.heading,
    letterSpacing: 1,
  },
  buildLockOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(3,17,29,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buildLockIcon: {
    fontSize: 22,
  },
  buildCardBody: {
    padding: 7,
    gap: 4,
    minHeight: 76,
  },
  buildCardName: {
    fontSize: 12,
    fontFamily: fonts.heading,
    color: pixelUi.text,
    lineHeight: 16,
  },
  buildCardNameLocked: {
    color: pixelUi.textMuted,
  },
  buildTag: {
    borderRadius: pixelRadii.control,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  buildTagText: {
    fontSize: 10,
    fontFamily: fonts.heading,
    color: pixelUi.text,
  },
  buildReqHint: {
    fontSize: 9,
    color: pixelUi.textMuted,
    lineHeight: 13,
  },
  buildFooter: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderTopWidth: 2,
    borderTopColor: pixelUi.borderSoft,
    paddingTop: 9,
  },
  buildSelectionCopy: {
    flex: 1,
    minWidth: 72,
  },
  buildSelectionLabel: {
    fontFamily: fonts.heading,
    fontSize: 8,
    color: pixelUi.textMuted,
    letterSpacing: 0.5,
  },
  buildSelectionName: {
    marginTop: 2,
    fontFamily: fonts.heading,
    fontSize: 10,
    color: pixelUi.text,
  },
  buildCancelButton: {
    minWidth: 68,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: pixelUi.surface,
    borderWidth: 2,
    borderColor: pixelUi.border,
    borderRadius: pixelRadii.control,
  },
  buildCancelText: {
    fontFamily: fonts.heading,
    fontSize: 10,
    color: pixelUi.text,
  },
  buildPlaceButton: {
    minWidth: 74,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: pixelUi.accent,
    borderWidth: 2,
    borderColor: pixelUi.warning,
    borderRadius: pixelRadii.control,
  },
  buildPlaceButtonDisabled: {
    backgroundColor: pixelUi.surfacePressed,
    borderColor: pixelUi.borderSoft,
    opacity: 0.48,
  },
  buildPlaceText: {
    fontFamily: fonts.heading,
    fontSize: 11,
    color: pixelUi.canvas,
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
  topHudPlate: {
    position: 'absolute',
    top: 4,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: 19,
    backgroundColor: pixelUi.surface,
    borderWidth: 2,
    borderColor: pixelUi.border,
    borderRadius: pixelRadii.panel,
  },
  companyBlock: {
    position: 'absolute',
    top: spacing.sm + 2,
    left: spacing.md,
    zIndex: 20,
  },
  companyNameRow: {
    maxWidth: 132,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  companyName: {
    fontSize: 16,
    fontFamily: fonts.display,
    color: '#FFFFFF',
    letterSpacing: 0.2,
    flexShrink: 1,
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
    backgroundColor: pixelUi.surfaceRaised,
    borderRadius: pixelRadii.control,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: pixelUi.border,
  },
  lvBadgeReady: {
    backgroundColor: colors.green,
  },
  lvBadgeMaxed: {
    backgroundColor: colors.gold,
  },
  lvBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
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
    backgroundColor: pixelUi.canvas,
    borderRadius: pixelRadii.control,
    borderWidth: 2,
    borderColor: pixelUi.borderSoft,
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
    borderRadius: pixelRadii.control,
    backgroundColor: pixelUi.accent,
    borderWidth: 2,
    borderColor: '#FFE77C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedPillPaused: {
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    borderRadius: pixelRadii.control,
    backgroundColor: pixelUi.canvas,
    borderWidth: 2,
    borderColor: pixelUi.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtn: {
    width: 30,
    height: 28,
    borderRadius: pixelRadii.control,
    backgroundColor: pixelUi.surfaceRaised,
    borderWidth: 2,
    borderColor: pixelUi.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuAlertDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: modernUi.warning,
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
    left: spacing.sm + 2,
    right: spacing.sm + 2,
    height: RESOURCE_DOCK_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,35,56,0.88)',
    borderRadius: pixelRadii.control,
    paddingHorizontal: 4,
    zIndex: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  dockStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
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
    fontSize: 14,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  dockValWarn: {
    color: colors.orange,
  },
  dockDivider: {
    width: 1,
    height: 22,
    backgroundColor: pixelUi.borderSoft,
  },
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
    backgroundColor: 'rgba(10,35,56,0.82)',
    borderRadius: pixelRadii.control,
    borderWidth: 2,
    borderColor: pixelUi.borderSoft,
    paddingHorizontal: spacing.sm,
    zIndex: 20,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowBoostButton: {
    minWidth: 38,
    height: 18,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: pixelRadii.control,
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
    backgroundColor: pixelUi.surface,
    borderRadius: pixelRadii.control,
    borderWidth: 2,
    borderColor: pixelUi.borderSoft,
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
  moreGoalCard: {
    backgroundColor: 'rgba(255,212,71,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,212,71,0.42)',
    borderRadius: pixelRadii.control,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  moreGoalLabel: {
    fontSize: 9,
    fontFamily: fonts.heading,
    color: '#FFD447',
    letterSpacing: 1,
  },
  moreGoalTitle: {
    marginTop: 3,
    fontSize: 13,
    fontFamily: fonts.heading,
    color: '#FFFFFF',
  },
  moreGoalProgress: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: fonts.heading,
    color: '#FFD447',
  },

  // ── Layer 4: Floating action buttons ──────────────────────────────────────
  // ── Unified Trade panel (Buy/Sell + Auto-trade, collapsible) ───────────
  // ── Action Dock (bottom, above tab bar) ──────────────────────────────────
  actionDock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.sm,
    height: ACTION_DOCK_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: pixelUi.surface,
    borderRadius: pixelRadii.panel,
    paddingHorizontal: spacing.md,
    zIndex: 20,
    borderWidth: 2,
    borderColor: pixelUi.border,
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
