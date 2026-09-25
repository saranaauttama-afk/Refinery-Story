import { useState } from 'react'
import type { ImageSourcePropType } from 'react-native'
import {
  ActivityIndicator, Image, ImageBackground, Pressable, ScrollView, StyleSheet,
  Switch, Text, useWindowDimensions, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  AlertTriangle, ArrowRight, ChevronDown, ChevronUp, Gauge, Pause, Play,
  Settings2, UserRound, Wrench,
} from 'lucide-react-native'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import ListRow from '../../../src/components/ListRow'
import MarketGraph from '../../../src/components/MarketGraph'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import {
  BUILDING_UPGRADE_BALANCE, FEEDSTOCK_BALANCE, PRODUCTION_BALANCE,
  SHIPMENT_BALANCE, STANDING_ORDER_BALANCE,
} from '../../../src/game/data/balance'
import { CRUDE_COST, TICK_MS, formatCompactNumber } from '../../../src/game/utils/gameCalculations'
import { text } from '../../../src/game/translations'
import { colors, fonts, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { STARTER_PLANT_ART_BY_LEVEL } from '../../../src/starterPlantArt'

const CONTROL_ROOM = require('../../../assets/bg/operations_control_room_v1.png')
const CRUDE_TANK = STARTER_PLANT_ART_BY_LEVEL.crudeTank![1]
const DISTILLATION_LEVELS = STARTER_PLANT_ART_BY_LEVEL.distillationUnit!
// Keep the Operations flow diagram on the original spherical Gas Storage art.
// The newer levelled Product Tank set remains available in Factory/Build/Info.
const PRODUCT_TANK = require('../../../assets/plants/product_tank_lv1_v3.png')

type Tone = 'good' | 'warn' | 'bad' | 'idle'

type AutomationRowProps = {
  enabled: boolean
  label: string
  value: number
  onToggle: (value: boolean) => void
  onMinus: () => void
  onPlus: () => void
}

function AutomationRow({ enabled, label, value, onToggle, onMinus, onPlus }: AutomationRowProps) {
  return (
    <View style={styles.automationRow}>
      <Switch style={styles.rowSwitch} value={enabled} onValueChange={onToggle}
        trackColor={{ false: '#39495C', true: colors.green }} />
      <Text style={[styles.automationRowLabel, !enabled && styles.off]} numberOfLines={2}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable style={styles.stepperButton} onPress={onMinus}><Text style={styles.stepperButtonText}>−</Text></Pressable>
        <Text style={styles.stepperValue}>{value}%</Text>
        <Pressable style={styles.stepperButton} onPress={onPlus}><Text style={styles.stepperButtonText}>+</Text></Pressable>
      </View>
    </View>
  )
}

function PlantFlowNode({ image, title, stock, status, tone, large = false }: {
  image: ImageSourcePropType
  title: string
  stock: string
  status: string
  tone: Tone
  large?: boolean
}) {
  return (
    <View style={[styles.plantNode, large && styles.plantNodeLarge, styles[`plantNode_${tone}`]]}>
      <Image source={image} resizeMode="contain" style={[styles.plantImage, large && styles.plantImageLarge]} />
      <Text style={styles.plantTitle} numberOfLines={1}>{title}</Text>
      <Text style={styles.plantStock}>{stock}</Text>
      <Text style={[styles.plantStatus, styles[`toneText_${tone}`]]}>{status}</Text>
    </View>
  )
}

export default function SupplyScreen() {
  const {
    game, loaded, derived, buyCrude, sellGasoline, buyShipment, fulfillStandingOrder,
    autoTrade, updateAutoTrade, speed, cycleSpeed, flowRates, upgradeBuilding,
  } = useGame()
  const { t } = useLang()
  const ss = text.supplyScreen
  const { width: screenWidth } = useWindowDimensions()
  const [activeTab, setActiveTab] = useState<'process' | 'automation'>('process')
  const [supplyOpen, setSupplyOpen] = useState(false)

  if (!loaded || !game || !derived) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

  const readyOrders = STANDING_ORDER_BALANCE.filter((order) => {
    if (game.refineryLevel < order.unlockLevel) return false
    const cooldownAt = game.standingOrderCooldowns[order.key as keyof typeof game.standingOrderCooldowns]
    const have = game.productInventory[order.productKey as keyof typeof game.productInventory] as number
    return !(cooldownAt !== undefined && cooldownAt > game.tickCount) && have >= order.required
  }).length

  const distillationIndex = game.grid.findIndex((cell) => cell === 'distillationUnit')
  const distillationCount = derived.buildingCounts.distillationUnit
  const distillationLevel = distillationIndex >= 0 ? game.gridLevels[distillationIndex] ?? 1 : 1
  const distillationImage = DISTILLATION_LEVELS[distillationLevel] ?? DISTILLATION_LEVELS[1]
  const crudePct = derived.maxCrudeStorage > 0 ? game.crudeOil / derived.maxCrudeStorage : 0
  const gasPct = derived.maxGasolineStorage > 0 ? game.gasoline / derived.maxGasolineStorage : 0
  const powerStarved = derived.buildingCounts.powerPlant > 0 &&
    game.electricity < PRODUCTION_BALANCE.electricityPerGasolineBatch &&
    game.crudeOil > 0 && game.gasoline < derived.maxGasolineStorage

  const bottleneck = speed === 0
    ? { title: 'Production paused', detail: 'Resume the refinery clock to restart the line.', tone: 'idle' as const }
    : distillationCount === 0
      ? { title: 'Distillation unit required', detail: 'Build the first process unit on the Factory screen.', tone: 'bad' as const }
      : game.crudeOil <= 0
        ? { title: 'Low crude — production stopped', detail: 'Open Supply & Orders below to restock crude.', tone: 'bad' as const }
        : game.gasoline >= derived.maxGasolineStorage
          ? { title: 'Gas storage full', detail: 'Sell gasoline or increase Product Tank capacity.', tone: 'warn' as const }
          : powerStarved
            ? { title: 'Electricity too low', detail: 'The production line is waiting for more power.', tone: 'warn' as const }
            : { title: 'Production line running', detail: 'Crude is moving through the refinery normally.', tone: 'good' as const }

  const crudeTone: Tone = game.crudeOil <= 0 ? 'bad' : crudePct < 0.25 ? 'warn' : 'good'
  const processTone: Tone = speed === 0 || distillationCount === 0 ? 'idle' :
    powerStarved ? 'warn' : game.crudeOil <= 0 || gasPct >= 1 ? 'bad' : 'good'
  const storageTone: Tone = gasPct >= 1 ? 'bad' : gasPct >= 0.8 ? 'warn' : 'good'
  const processStatus = speed === 0 ? 'PAUSED' : distillationCount === 0 ? 'MISSING' :
    powerStarved ? 'LOW POWER' : game.crudeOil <= 0 || gasPct >= 1 ? 'BLOCKED' : 'RUNNING'
  const lineEfficiency = speed === 0 || distillationCount === 0 || game.crudeOil <= 0 || gasPct >= 1 ? 0 :
    powerStarved ? 60 : game.productionPenalty && game.tickCount < game.productionPenalty.untilTick
      ? Math.round(game.productionPenalty.multiplier * 100) : 100
  const crudeInputPerMin = processStatus === 'RUNNING'
    ? distillationCount * FEEDSTOCK_BALANCE.crudePerDistillationCycle * 60 * Math.max(1, speed) : 0
  const operator = game.employees.find((employee) => employee.type === 'operator')
  const upgradeCost = distillationLevel === 1
    ? BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost : BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost
  const maxed = distillationLevel >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel
  const canUpgrade = distillationIndex >= 0 && !maxed && game.money >= upgradeCost
  const nextBonus = BUILDING_UPGRADE_BALANCE.distillationUnitBonusRateByLevel[Math.min(3, distillationLevel + 1)] ?? 0

  const secondaryProducts = [
    { key: 'lubricants' as const, label: 'Lubricants', building: 'lubricantPlant' as const },
    { key: 'jetFuel' as const, label: 'Jet Fuel', building: 'jetFuelPlant' as const },
    { key: 'petrochemicals' as const, label: 'Petrochem', building: 'petrochemicalPlant' as const },
    { key: 'recycledMaterial' as const, label: 'Recycled', building: 'wasteTreatmentPlant' as const },
    { key: 'plasticPellets' as const, label: 'Pellets', building: 'polymerPlant' as const },
  ].filter((product) => derived.buildingCounts[product.building] > 0)

  const adjustProductThreshold = (key: typeof secondaryProducts[number]['key'], delta: number) => {
    const current = autoTrade.productSellThresholds[key] ?? 80
    updateAutoTrade({ productSellThresholds: {
      ...autoTrade.productSellThresholds,
      [key]: Math.min(100, Math.max(0, current + delta)),
    } })
  }

  const statusColor = bottleneck.tone === 'good' ? '#78ED87' : bottleneck.tone === 'warn' ? '#FFD447' :
    bottleneck.tone === 'bad' ? '#FF8976' : '#A1B4C8'

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.list}>
        <ImageBackground source={CONTROL_ROOM} resizeMode="cover" style={styles.controlRoom} imageStyle={styles.controlRoomImage}>
          <View style={styles.sceneShade} />
          <View style={styles.sceneTopRow}>
            <View>
              <Text style={styles.sceneEyebrow}>REFINERY CONTROL ROOM</Text>
              <Text style={styles.sceneTitle}>Operations</Text>
            </View>
            <View style={styles.liveBadge}>
              <View style={[styles.liveDot, { backgroundColor: statusColor }]} />
              <Text style={styles.liveText}>{processStatus}</Text>
            </View>
          </View>
          <View style={styles.sceneStats}>
            <View><Text style={styles.sceneStatLabel}>OUTPUT</Text><Text style={styles.sceneStatValue}>{flowRates.gasPerMin}/min</Text></View>
            <View style={styles.sceneStatDivider} />
            <View><Text style={styles.sceneStatLabel}>EFFICIENCY</Text><Text style={[styles.sceneStatValue, { color: statusColor }]}>{lineEfficiency}%</Text></View>
            <View style={styles.sceneStatDivider} />
          </View>
        </ImageBackground>

        <View style={styles.operationsPanel}>
          <View style={styles.panelHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.panelTitle}>Production Flow</Text>
              <Text style={styles.panelSubtitle}>{bottleneck.title}</Text>
            </View>
            <Pressable style={[styles.speedButton, speed === 0 && styles.speedButtonPaused]} onPress={cycleSpeed}>
              {speed === 0 ? <Play size={16} color="#0A3152" fill="#0A3152" /> : <Gauge size={17} color="#0A3152" />}
              <Text style={styles.speedButtonText}>{speed === 0 ? 'RESUME' : `${speed}×`}</Text>
            </Pressable>
          </View>

          <View style={[styles.alertStrip, styles[`alertStrip_${bottleneck.tone}`]]}>
            {bottleneck.tone === 'good' ? <View style={[styles.alertDot, { backgroundColor: statusColor }]} /> :
              <AlertTriangle size={16} color={statusColor} />}
            <Text style={styles.alertText}>{bottleneck.detail}</Text>
          </View>

          <View style={styles.flowRow}>
            <PlantFlowNode image={CRUDE_TANK} title="Crude Tank"
              stock={`${game.crudeOil}/${derived.maxCrudeStorage}`}
              status={game.crudeOil <= 0 ? 'EMPTY' : crudePct < 0.25 ? 'LOW' : 'READY'} tone={crudeTone} />
            <View style={styles.flowArrow}><ArrowRight size={18} color={crudeTone === 'bad' ? '#FF8976' : '#FFD447'} /><Text style={styles.flowRate}>{crudeInputPerMin}/m</Text></View>
            <PlantFlowNode image={distillationImage} title="Distillation"
              stock={distillationCount > 0 ? `Lv ${distillationLevel}` : '—'}
              status={processStatus} tone={processTone} large />
            <View style={styles.flowArrow}><ArrowRight size={18} color={storageTone === 'bad' ? '#FF8976' : '#78ED87'} /><Text style={styles.flowRate}>{flowRates.gasPerMin}/m</Text></View>
            <PlantFlowNode image={PRODUCT_TANK} title="Gas Storage"
              stock={`${game.gasoline}/${derived.maxGasolineStorage}`}
              status={gasPct >= 1 ? 'FULL' : gasPct >= 0.8 ? 'NEAR FULL' : 'SPACE OK'} tone={storageTone} />
          </View>

          <View style={styles.tabRow}>
            <Pressable style={[styles.tabButton, activeTab === 'process' && styles.tabButtonActive]} onPress={() => setActiveTab('process')}>
              <Wrench size={15} color={activeTab === 'process' ? '#0A3152' : '#8DA6BD'} />
              <Text style={[styles.tabText, activeTab === 'process' && styles.tabTextActive]}>Process</Text>
            </Pressable>
            <Pressable style={[styles.tabButton, activeTab === 'automation' && styles.tabButtonActive, game.refineryLevel < 3 && styles.tabButtonLocked]} onPress={() => setActiveTab('automation')}>
              <Settings2 size={15} color={activeTab === 'automation' ? '#0A3152' : '#8DA6BD'} />
              <Text style={[styles.tabText, activeTab === 'automation' && styles.tabTextActive]}>Automation{game.refineryLevel < 3 ? ' · Lv3' : ''}</Text>
            </Pressable>
          </View>

          {activeTab === 'process' ? (
            <View style={styles.unitCard}>
              <View style={styles.unitTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.unitTitle}>{distillationCount > 0 ? `Distillation Unit · Lv ${distillationLevel}` : 'No Distillation Unit'}</Text>
                  <Text style={styles.unitSubtitle}>{distillationCount > 1 ? `${distillationCount} units operating across the refinery` : 'Primary gasoline process line'}</Text>
                </View>
                <View style={[styles.unitStatus, styles[`unitStatus_${processTone}`]]}>
                  <Text style={[styles.unitStatusText, { color: statusColor }]}>{processStatus}</Text>
                </View>
              </View>
              <View style={styles.ioRow}>
                <View style={styles.ioBox}><Text style={styles.ioLabel}>INPUT</Text><Text style={styles.ioValue}>{crudeInputPerMin} crude/min</Text></View>
                <ArrowRight size={17} color="#59748E" />
                <View style={styles.ioBox}><Text style={styles.ioLabel}>OUTPUT</Text><Text style={styles.ioValue}>{flowRates.gasPerMin} gas/min</Text></View>
              </View>
              <View style={styles.staffRow}>
                <View style={styles.avatar}><UserRound size={29} color="#D8E7F3" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.staffName}>{operator ? `${operator.name} · Operator` : 'Operations Crew'}</Text>
                  <Text style={styles.staffBonus}>{operator ? `Level ${operator.level} · supporting refinery output` : 'Hire an Operator to strengthen production'}</Text>
                </View>
              </View>
              <View style={styles.efficiencyRow}>
                <Text style={styles.efficiencyLabel}>Line efficiency</Text>
                <View style={styles.efficiencyTrack}><View style={[styles.efficiencyFill, { width: `${lineEfficiency}%`, backgroundColor: statusColor }]} /></View>
                <Text style={[styles.efficiencyValue, { color: statusColor }]}>{lineEfficiency}%</Text>
              </View>
              <View style={styles.actionRow}>
                <Pressable style={styles.pauseButton} onPress={cycleSpeed}>
                  {speed === 0 ? <Play size={18} color="#FFF" fill="#FFF" /> : <Pause size={18} color="#FFF" fill="#FFF" />}
                  <Text style={styles.pauseButtonText}>{speed === 0 ? 'Resume' : 'Pause'}</Text>
                </Pressable>
                <Pressable style={[styles.upgradeButton, (!canUpgrade || maxed) && styles.actionDisabled]}
                  disabled={!canUpgrade || maxed} onPress={() => distillationIndex >= 0 && upgradeBuilding(distillationIndex)}>
                  <Text style={styles.upgradeButtonText}>{maxed ? 'MAX LEVEL' : `Upgrade · $${formatCompactNumber(upgradeCost)}`}</Text>
                  {!maxed && <Text style={styles.upgradeHint}>Next: +{Math.round(nextBonus * 100)}% throughput</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.automationCard}>
              {game.refineryLevel < 3 ? (
                <View style={styles.automationLocked}>
                  <Text style={styles.automationLockedIcon}>🔒</Text>
                  <Text style={styles.automationLockedTitle}>LEARN THE LINE FIRST</Text>
                  <Text style={styles.automationLockedText}>Reach Refinery Lv3 to unlock Auto Trade. Until then, time crude purchases and gasoline sales in Supply & Orders.</Text>
                </View>
              ) : (<>
              <View style={styles.automationHeader}>
                <View style={{ flex: 1 }}><Text style={styles.automationTitle}>Auto Trade</Text><Text style={styles.automationSub}>Keep crude stocked and sell full storage automatically.</Text></View>
                <Switch value={autoTrade.enabled} onValueChange={(enabled) => updateAutoTrade({ enabled })}
                  trackColor={{ false: '#39495C', true: colors.green }} />
              </View>
              {autoTrade.enabled && <View style={styles.automationRows}>
                <AutomationRow enabled={autoTrade.crudeBuyEnabled} label="Buy crude below" value={autoTrade.buyThreshold}
                  onToggle={(crudeBuyEnabled) => updateAutoTrade({ crudeBuyEnabled })}
                  onMinus={() => updateAutoTrade({ buyThreshold: Math.max(0, autoTrade.buyThreshold - 5) })}
                  onPlus={() => updateAutoTrade({ buyThreshold: Math.min(95, autoTrade.buyThreshold + 5) })} />
                <AutomationRow enabled={autoTrade.gasolineSellEnabled} label="Sell gasoline above" value={autoTrade.sellThreshold}
                  onToggle={(gasolineSellEnabled) => updateAutoTrade({ gasolineSellEnabled })}
                  onMinus={() => updateAutoTrade({ sellThreshold: Math.max(0, autoTrade.sellThreshold - 5) })}
                  onPlus={() => updateAutoTrade({ sellThreshold: Math.min(100, autoTrade.sellThreshold + 5) })} />
                {secondaryProducts.map((product) => {
                  const enabled = autoTrade.productSellEnabled[product.key] !== false
                  const value = autoTrade.productSellThresholds[product.key] ?? 80
                  return <AutomationRow key={product.key} enabled={enabled} label={`Sell ${product.label} above`} value={value}
                    onToggle={(next) => updateAutoTrade({ productSellEnabled: { ...autoTrade.productSellEnabled, [product.key]: next } })}
                    onMinus={() => adjustProductThreshold(product.key, -5)} onPlus={() => adjustProductThreshold(product.key, 5)} />
                })}
              </View>}
              </>)}
            </View>
          )}
        </View>

        <View style={styles.inventoryCard}>
          <View style={styles.inventoryItem}><Text style={styles.inventoryValue}>{game.feedstock}/{derived.maxFeedstockStorage}</Text><Text style={styles.inventoryLabel}>FEEDSTOCK</Text></View>
          <View style={styles.inventoryDivider} />
          <View style={styles.inventoryItem}><Text style={styles.inventoryValue}>{game.electricity}/{derived.maxElectricityStorage}</Text><Text style={styles.inventoryLabel}>POWER</Text></View>
          <View style={styles.inventoryDivider} />
          <View style={styles.inventoryItem}><Text style={styles.inventoryValue}>{Math.floor(game.waste)}/{derived.maxWasteStorage}</Text><Text style={styles.inventoryLabel}>WASTE</Text></View>
        </View>

        <View style={styles.supplyDrawer}>
          <Pressable style={styles.supplyDrawerHeader} onPress={() => setSupplyOpen((open) => !open)}>
            <View style={{ flex: 1 }}><Text style={styles.supplyDrawerTitle}>Supply & Orders</Text><Text style={styles.supplyDrawerSub}>Spot trade, shipments and standing orders</Text></View>
            {readyOrders > 0 && <View style={styles.readyBadge}><Text style={styles.readyBadgeText}>{readyOrders} READY</Text></View>}
            {supplyOpen ? <ChevronUp size={20} color="#FFD447" /> : <ChevronDown size={20} color="#FFD447" />}
          </Pressable>

          {supplyOpen && <View style={styles.supplyBody}>
            <Text style={styles.sectionLabel}>Spot Trade</Text>
            <View style={styles.tradeRow}>
              <AnimatedPressable style={[styles.tradeButton, styles.buyButton]} onPress={() => buyCrude(10)}><Text style={styles.tradeButtonTitle}>Buy 10 Crude</Text><Text style={styles.tradeButtonSub}>${derived.crudePrice}/unit</Text></AnimatedPressable>
              <AnimatedPressable style={[styles.tradeButton, styles.sellButton]} onPress={() => sellGasoline(10)}><Text style={styles.tradeButtonTitle}>Sell 10 Gas</Text><Text style={styles.tradeButtonSub}>${derived.sellPrice}/unit</Text></AnimatedPressable>
            </View>
            <View style={styles.marketCard}>
              <View style={styles.marketTop}><Text style={styles.marketTitle}>{t(ss.marketTitle)}</Text><Text style={[styles.marketPrice, derived.crudePrice <= CRUDE_COST ? styles.marketPriceCheap : styles.marketPriceHigh]}>${derived.crudePrice}/u</Text></View>
              <MarketGraph tickCount={game.tickCount} width={screenWidth - spacing.lg * 2 - spacing.md * 4} height={92} nowLabel={t(ss.now)} />
            </View>
            {game.pendingShipments.length > 0 && <View style={styles.pendingBox}>
              <Text style={styles.pendingTitle}>{t(ss.incoming)}</Text>
              {game.pendingShipments.map((s) => {
                const secsLeft = Math.max(0, Math.ceil((s.arrivesAt - game.tickCount) / 5))
                return <Text key={s.id} style={styles.pendingRow}>{t(ss.crudeIn(s.amount, secsLeft))}</Text>
              })}
            </View>}
            <Text style={styles.sectionLabel}>{t(ss.orderCrude)}</Text>
            {SHIPMENT_BALANCE.map((option) => <ListRow key={option.key} dark
              title={t(text.shipments.names[option.key]) + t(ss.plusCrude(option.amount))}
              subtitle={t(ss.shipmentSub(formatCompactNumber(option.cost), option.delayMs / 1000))}
              actionLabel={t(ss.order)} disabled={game.money < option.cost} onPress={() => buyShipment(option)} />)}
            <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>{t(ss.standingOrders)}</Text>
            {STANDING_ORDER_BALANCE.filter((order) => game.refineryLevel >= order.unlockLevel).map((order) => {
              const key = order.key as keyof typeof game.standingOrderCooldowns
              const cooldownAt = game.standingOrderCooldowns[key]
              const onCooldown = cooldownAt !== undefined && cooldownAt > game.tickCount
              const ticksLeft = onCooldown ? cooldownAt! - game.tickCount : 0
              const have = game.productInventory[order.productKey as keyof typeof game.productInventory] as number
              const ready = have >= order.required && !onCooldown
              return <ListRow key={order.key} dark title={t(text.standingOrders.orders[order.key].name)}
                subtitle={onCooldown ? t(ss.cooldown(Math.ceil((ticksLeft * TICK_MS) / 1000))) : `${have}/${order.required} ${order.productKey} +$${formatCompactNumber(order.reward)} +${order.rpReward}RP`}
                actionLabel={t(ss.fulfill)} disabled={!ready} onPress={() => fulfillStandingOrder(order.key)} />
            })}
          </View>}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09131E' },
  loadingScreen: { flex: 1, backgroundColor: '#09131E', alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 10 },
  controlRoom: { height: 238, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: 16, paddingBottom: 20 },
  controlRoomImage: { opacity: 0.95 },
  sceneShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(2,15,30,0.20)' },
  sceneTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  sceneEyebrow: { fontSize: 8, fontFamily: fonts.heading, letterSpacing: 1.4, color: '#A7D6FA', textShadowColor: '#06192B', textShadowRadius: 2 },
  sceneTitle: { marginTop: 3, fontSize: 28, fontFamily: fonts.heading, color: '#FFF', textShadowColor: '#06192B', textShadowRadius: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.36)', backgroundColor: 'rgba(5,31,54,0.82)', paddingHorizontal: 9, paddingVertical: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 8, fontFamily: fonts.heading, color: '#FFF' },
  sceneStats: { alignSelf: 'center', minWidth: '84%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(118,184,232,0.55)', backgroundColor: 'rgba(3,29,52,0.88)', paddingVertical: 10, paddingHorizontal: 12 },
  sceneStatLabel: { textAlign: 'center', fontSize: 7, fontFamily: fonts.heading, color: '#82AAC8', letterSpacing: 0.7 },
  sceneStatValue: { marginTop: 3, textAlign: 'center', fontSize: 13, fontFamily: fonts.heading, color: '#FFF' },
  sceneStatDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.16)' },
  operationsPanel: { marginHorizontal: spacing.md, marginTop: -12, borderRadius: 14, borderWidth: 2, borderColor: '#176AA4', backgroundColor: '#092844', padding: 12, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { fontSize: 19, fontFamily: fonts.heading, color: '#FFF' },
  panelSubtitle: { marginTop: 3, fontSize: 9.5, color: '#93B1C9' },
  speedButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 8, backgroundColor: '#FFD447', paddingHorizontal: 10, paddingVertical: 8 },
  speedButtonPaused: { backgroundColor: '#78ED87' },
  speedButtonText: { fontSize: 9, fontFamily: fonts.heading, color: '#0A3152' },
  alertStrip: { marginTop: 10, minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 7, borderWidth: 1, paddingHorizontal: 10 },
  alertStrip_good: { backgroundColor: 'rgba(58,151,82,0.17)', borderColor: 'rgba(120,237,135,0.35)' },
  alertStrip_warn: { backgroundColor: 'rgba(255,212,71,0.12)', borderColor: 'rgba(255,212,71,0.38)' },
  alertStrip_bad: { backgroundColor: 'rgba(255,88,72,0.12)', borderColor: 'rgba(255,137,118,0.42)' },
  alertStrip_idle: { backgroundColor: 'rgba(136,160,185,0.10)', borderColor: 'rgba(161,180,200,0.30)' },
  alertDot: { width: 9, height: 9, borderRadius: 5 },
  alertText: { flex: 1, fontSize: 9.5, color: '#D9E7F2' },
  flowRow: { marginTop: 11, flexDirection: 'row', alignItems: 'center' },
  plantNode: { flex: 1, minHeight: 128, alignItems: 'center', justifyContent: 'flex-end', borderRadius: 9, borderWidth: 1, paddingHorizontal: 3, paddingBottom: 7, overflow: 'hidden' },
  plantNodeLarge: { flex: 1.13, minHeight: 138 },
  plantNode_good: { backgroundColor: 'rgba(31,91,75,0.26)', borderColor: 'rgba(120,237,135,0.46)' },
  plantNode_warn: { backgroundColor: 'rgba(106,85,23,0.24)', borderColor: 'rgba(255,212,71,0.48)' },
  plantNode_bad: { backgroundColor: 'rgba(102,38,38,0.24)', borderColor: 'rgba(255,137,118,0.48)' },
  plantNode_idle: { backgroundColor: 'rgba(60,78,96,0.24)', borderColor: 'rgba(161,180,200,0.36)' },
  plantImage: { width: 74, height: 74, marginBottom: -3 },
  plantImageLarge: { width: 88, height: 88, marginBottom: -7 },
  plantTitle: { fontSize: 8.5, fontFamily: fonts.heading, color: '#FFF' },
  plantStock: { marginTop: 3, fontSize: 10, fontFamily: fonts.heading, color: '#DCEAF4' },
  plantStatus: { marginTop: 3, fontSize: 6.5, fontFamily: fonts.heading, letterSpacing: 0.45 },
  toneText_good: { color: '#78ED87' }, toneText_warn: { color: '#FFD447' }, toneText_bad: { color: '#FF8976' }, toneText_idle: { color: '#A1B4C8' },
  flowArrow: { width: 25, alignItems: 'center', gap: 2 },
  flowRate: { fontSize: 6.5, fontFamily: fonts.heading, color: '#88A4BC' },
  tabRow: { marginTop: 11, flexDirection: 'row', borderWidth: 1, borderColor: '#1D5C8B', borderRadius: 8, overflow: 'hidden' },
  tabButton: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#0B3557' },
  tabButtonActive: { backgroundColor: '#FFD447' },
  tabButtonLocked: { opacity: 0.7 },
  tabText: { fontSize: 10, fontFamily: fonts.heading, color: '#8DA6BD' },
  tabTextActive: { color: '#0A3152' },
  unitCard: { marginTop: 9, borderRadius: 9, borderWidth: 1, borderColor: '#215D89', backgroundColor: '#081F35', padding: 10 },
  unitTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  unitTitle: { fontSize: 13, fontFamily: fonts.heading, color: '#FFF' },
  unitSubtitle: { marginTop: 2, fontSize: 8.5, color: '#82A3BD' },
  unitStatus: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 5 },
  unitStatus_good: { backgroundColor: 'rgba(63,153,78,0.14)', borderColor: 'rgba(120,237,135,0.38)' },
  unitStatus_warn: { backgroundColor: 'rgba(255,212,71,0.12)', borderColor: 'rgba(255,212,71,0.36)' },
  unitStatus_bad: { backgroundColor: 'rgba(255,88,72,0.12)', borderColor: 'rgba(255,137,118,0.38)' },
  unitStatus_idle: { backgroundColor: 'rgba(136,160,185,0.10)', borderColor: 'rgba(161,180,200,0.30)' },
  unitStatusText: { fontSize: 7.5, fontFamily: fonts.heading },
  ioRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ioBox: { flex: 1, borderRadius: 7, borderWidth: 1, borderColor: '#1D547D', backgroundColor: '#0B2B48', padding: 8 },
  ioLabel: { fontSize: 7, fontFamily: fonts.heading, color: '#7D9DB8' },
  ioValue: { marginTop: 3, fontSize: 9.5, fontFamily: fonts.heading, color: '#FFF' },
  staffRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 9 },
  avatar: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 7, borderWidth: 1, borderColor: '#2872A7', backgroundColor: '#0E3B60' },
  staffName: { fontSize: 10.5, fontFamily: fonts.heading, color: '#FFF' },
  staffBonus: { marginTop: 3, fontSize: 8.5, color: '#90ADC4' },
  efficiencyRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  efficiencyLabel: { fontSize: 8.5, color: '#A2B7C9' },
  efficiencyTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#17364E', overflow: 'hidden' },
  efficiencyFill: { height: '100%', borderRadius: 4 },
  efficiencyValue: { width: 32, textAlign: 'right', fontSize: 9, fontFamily: fonts.heading },
  actionRow: { marginTop: 10, flexDirection: 'row', gap: 8 },
  pauseButton: { flex: 0.8, minHeight: 47, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 7, backgroundColor: '#176FC1' },
  pauseButtonText: { fontSize: 11, fontFamily: fonts.heading, color: '#FFF' },
  upgradeButton: { flex: 1.45, minHeight: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 7, backgroundColor: '#FFD447' },
  upgradeButtonText: { fontSize: 10.5, fontFamily: fonts.heading, color: '#0A3152' },
  upgradeHint: { marginTop: 2, fontSize: 7.5, color: '#42536A' },
  actionDisabled: { opacity: 0.42 },
  automationCard: { marginTop: 9, borderRadius: 9, borderWidth: 1, borderColor: '#215D89', backgroundColor: '#081F35', padding: 10 },
  automationLocked: { alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12 },
  automationLockedIcon: { fontSize: 26, marginBottom: 5 },
  automationLockedTitle: { fontSize: 11, fontFamily: fonts.heading, color: '#FFD447', letterSpacing: 0.8 },
  automationLockedText: { marginTop: 5, fontSize: 10, lineHeight: 15, color: '#91ABC1', textAlign: 'center' },
  automationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  automationTitle: { fontSize: 13, fontFamily: fonts.heading, color: '#FFF' },
  automationSub: { marginTop: 2, fontSize: 8.5, color: '#82A3BD' },
  automationRows: { marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  automationRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowSwitch: { transform: [{ scaleX: 0.76 }, { scaleY: 0.76 }], marginHorizontal: -5 },
  automationRowLabel: { flex: 1, fontSize: 9.5, color: '#DCE7F2', fontWeight: '700' },
  off: { color: 'rgba(255,255,255,0.32)' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#26364A', borderWidth: 1, borderColor: '#41566F' },
  stepperButtonText: { fontSize: 16, fontFamily: fonts.heading, color: '#EAF1F8' },
  stepperValue: { width: 34, textAlign: 'center', fontSize: 9, fontFamily: fonts.heading, color: '#FFD447' },
  inventoryCard: { marginHorizontal: spacing.md, marginTop: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D3655', borderWidth: 1, borderColor: '#176197', borderRadius: 10, paddingVertical: 10 },
  inventoryItem: { flex: 1, alignItems: 'center' },
  inventoryValue: { fontSize: 12, fontFamily: fonts.heading, color: '#FFF' },
  inventoryLabel: { marginTop: 2, fontSize: 7, fontFamily: fonts.heading, color: '#8FB2CE', letterSpacing: 0.5 },
  inventoryDivider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.18)' },
  supplyDrawer: { marginHorizontal: spacing.md, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: '#27455F', backgroundColor: '#101F2E', overflow: 'hidden' },
  supplyDrawerHeader: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 },
  supplyDrawerTitle: { fontSize: 13, fontFamily: fonts.heading, color: '#FFF' },
  supplyDrawerSub: { marginTop: 3, fontSize: 8.5, color: '#8099AE' },
  readyBadge: { borderRadius: 5, backgroundColor: '#29784A', paddingHorizontal: 6, paddingVertical: 4 },
  readyBadgeText: { fontSize: 7, fontFamily: fonts.heading, color: '#FFF' },
  supplyBody: { borderTopWidth: 1, borderTopColor: '#27455F', padding: 12, gap: 7 },
  sectionLabel: { fontSize: 9, fontFamily: fonts.heading, color: '#7F99AF', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 3 },
  tradeRow: { flexDirection: 'row', gap: 8 },
  tradeButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1 },
  buyButton: { backgroundColor: 'rgba(91,141,191,0.18)', borderColor: 'rgba(91,141,191,0.65)' },
  sellButton: { backgroundColor: 'rgba(127,174,116,0.18)', borderColor: 'rgba(127,174,116,0.65)' },
  tradeButtonTitle: { fontSize: 10.5, fontFamily: fonts.heading, color: '#EAF1F8' },
  tradeButtonSub: { marginTop: 3, fontSize: 9, color: 'rgba(255,255,255,0.55)' },
  marketCard: { backgroundColor: '#172333', borderRadius: 9, padding: 10 },
  marketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  marketTitle: { fontSize: 10.5, fontFamily: fonts.heading, color: '#EAF1F8', textTransform: 'uppercase', letterSpacing: 0.5 },
  marketPrice: { fontSize: 13, fontFamily: fonts.heading },
  marketPriceCheap: { color: colors.green },
  marketPriceHigh: { color: colors.orange },
  pendingBox: { backgroundColor: 'rgba(91,141,191,0.14)', borderRadius: 9, borderWidth: 1, borderColor: 'rgba(91,141,191,0.5)', padding: 9, gap: 4 },
  pendingTitle: { fontSize: 10.5, fontFamily: fonts.heading, color: '#9CC2EC' },
  pendingRow: { fontSize: 10, color: '#B9D4F2' },
})
