import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native'

import { BUILDINGS } from '../../game/data/buildings'
import { V3_BUILDINGS, isV3ProcessBuilding, type V3ProcessInput } from '../../game/v3/data'
import { V3_LINE_TANK } from '../../game/v3/adjacency'
import { getV3ModuleQuote } from '../../game/v3/actions'
import { evaluateV3Maintenance } from '../../game/v3/maintenance'
import {
  getV3CrudeCapacity, getV3ConsumableQuantity, getV3ProductCapacity, getV3ProductQuantity,
  getV3StockAllocations, isV3JobEligibleVariant,
} from '../../game/v3/productInventory'
import { evaluateV3Production, getV3BatteryCapacity, getV3FeedstockCapacity, type V3LinePlan } from '../../game/v3/production'
import type { BilingualTextValue } from '../../game/types'
import type { V3Action, V3ActionEvent, V3GameState, V3ModuleKey } from '../../game/v3/types'
import { getV3BuildingLevel, listV3Buildings } from '../../game/v3/yard'
import { fonts } from '../../theme'
import { getV3BuildingArt } from './v3Art'

type Translate = (value: BilingualTextValue) => string
type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: Translate
  describe: (event: V3ActionEvent | null) => string
}

const LIMIT_LABEL: Record<V3LinePlan['limitedBy'], BilingualTextValue> = {
  none: { en: 'Running at full rate', th: 'ผลิตเต็มกำลัง' },
  output_space: { en: 'Storage full', th: 'ถังเต็ม' },
  input: { en: 'Low input', th: 'วัตถุดิบน้อย' },
  power: { en: 'Low power', th: 'ไฟไม่พอ' },
}
const MODULES: V3ModuleKey[] = ['none', 'throughput', 'economy', 'precision']
const INPUT_GLYPH: Record<V3ProcessInput, string> = { crude: '🛢️', feedstock: '🧪', petro: '🧴', waste: '🗑️' }

/** A box in the pipeline: real building art if we have it, else a plain placeholder square. */
function FlowBox({ art, glyph, label, sub }: { art?: ImageSourcePropType | null; glyph?: string; label: string; sub?: string }) {
  return (
    <View style={styles.flowBox}>
      <View style={styles.flowArt}>
        {art ? <Image source={art} style={styles.flowImage} resizeMode="contain" /> : <Text style={styles.flowGlyph}>{glyph ?? '📦'}</Text>}
      </View>
      <Text style={styles.flowLabel} numberOfLines={1}>{label}</Text>
      {sub && <Text style={styles.flowSub} numberOfLines={1}>{sub}</Text>}
    </View>
  )
}

const Arrow = ({ rate }: { rate: number }) => (
  <View style={styles.arrowWrap}>
    <Text style={styles.arrowRate}>{rate.toFixed(0)}/min</Text>
    <Text style={styles.arrowGlyph}>»»»</Text>
  </View>
)

/** One production line: pipeline diagram, status header, and an expandable details drawer. */
function LineCard({ state, apply, t, describe, line }: Props & { line: V3LinePlan }) {
  const [open, setOpen] = useState(false)
  const program = state.plantPrograms[line.buildingId]
  const blueprint = state.productBlueprints[program.blueprintId]
  const level = getV3BuildingLevel(state, line.buildingId)
  const building = state.world.buildingsById[line.buildingId]
  const paused = Boolean(program.paused)
  const potential = line.potentialOutputPerMinute
  const actual = line.actualOutputPerMinute
  const progress = potential > 0 ? Math.min(1, actual / potential) : 0

  const inputQty = line.input === 'crude' ? state.world.crudeOil
    : line.input === 'feedstock' ? state.world.feedstock
    : line.input === 'waste' ? state.world.waste
    : getV3ConsumableQuantity(state, 'petrochemicals')
  const inputCap = line.input === 'crude' ? getV3CrudeCapacity(state)
    : line.input === 'feedstock' ? getV3FeedstockCapacity(state)
    : line.input === 'petro' ? getV3ProductCapacity(state, 'petrochemicals')
    : null
  const inputArt = line.input === 'crude' ? getV3BuildingArt('crudeTank', 1)
    : line.input === 'petro' ? getV3BuildingArt('petrochemicalTank', 1)
    : null

  const outputTankType = V3_LINE_TANK[line.building]
  const outputArt = outputTankType ? getV3BuildingArt(outputTankType, 1) : null
  const outputQty = getV3ProductQuantity(state, line.family)
  const outputCap = getV3ProductCapacity(state, line.family)

  const upgradeCost = V3_BUILDINGS[line.building].upgradeCostDollars?.[level - 1] ?? null
  const recipes = Object.values(state.productBlueprints)
    .filter((entry) => entry.family === line.family && !entry.archived)
    .sort((a, b) => a.quality - b.quality || a.id.localeCompare(b.id))
  const stockVariants = getV3StockAllocations(state, line.family).filter((allocation) => allocation.quantity > 0.05)
  const jobForFamily = state.acceptedJob?.family === line.family ? state.acceptedJob : null

  return (
    <View style={styles.card}>
      <View style={styles.flowRow}>
        <FlowBox art={inputArt} glyph={INPUT_GLYPH[line.input]} label={t({ en: 'Input', th: 'วัตถุดิบ' })} sub={inputCap !== null ? `${inputQty.toFixed(0)}/${Math.floor(inputCap)}` : inputQty.toFixed(0)} />
        <Arrow rate={line.actualWork > 0 ? line.inputPerWork * line.actualWork * 12 : 0} />
        <FlowBox art={getV3BuildingArt(line.building, level)} label={`${t(BUILDINGS[line.building].name)} Lv${level}`} />
        <Arrow rate={actual} />
        <FlowBox art={outputArt} glyph="🛢️" label={t({ en: 'Output', th: 'ผลผลิต' })} sub={`${outputQty.toFixed(0)}/${Math.floor(outputCap)}`} />
      </View>

      {stockVariants.length > 0 && (
        <View style={styles.variantRow}>
          {stockVariants.map((allocation) => {
            const meetsJob = jobForFamily ? isV3JobEligibleVariant(state, allocation.blueprintId, allocation.quality) : null
            const recipe = state.productBlueprints[allocation.blueprintId]
            return (
              <View key={allocation.blueprintId} style={[styles.variantChip, meetsJob === false && styles.variantChipShort]}>
                <Text style={styles.variantChipText}>{recipe?.name ?? '?'} Q{allocation.quality} · {allocation.quantity.toFixed(1)}</Text>
                {jobForFamily && <Text style={meetsJob ? styles.variantOk : styles.variantShort}>{meetsJob ? '✓' : `< Q${jobForFamily.minimumQuality}`}</Text>}
              </View>
            )
          })}
        </View>
      )}

      <View style={styles.statusRow}>
        <View style={[styles.pill, paused ? styles.pillPaused : styles.pillLive]}>
          <Text style={styles.pillText}>{paused ? t({ en: 'PAUSED', th: 'พักอยู่' }) : t({ en: 'LIVE', th: 'ทำงาน' })}</Text>
        </View>
        <Text style={styles.lineName} numberOfLines={1}>{blueprint ? `${blueprint.name} · Q${blueprint.quality}` : t({ en: 'No recipe', th: 'ยังไม่ตั้งสูตร' })}</Text>
      </View>

      <View style={styles.outputRow}>
        <Text style={styles.bigNumber}>{actual.toFixed(0)}<Text style={styles.bigUnit}> /min</Text></Text>
        {line.limitedBy !== 'none' && (
          <View style={styles.warnPill}><Text style={styles.warnText}>⚠ {t(LIMIT_LABEL[line.limitedBy])}</Text></View>
        )}
      </View>
      <View style={styles.bar}><View style={[styles.fill, { width: `${Math.round(progress * 100)}%` }]} /></View>

      <View style={styles.row2}>
        <Pressable
          style={[styles.button, styles.primaryButton]}
          onPress={() => apply({ type: 'set_pause', sequence: state.nextActionSequence, buildingId: line.buildingId, paused: !paused })}
        >
          <Text style={styles.primaryButtonText}>{paused ? `▶ ${t({ en: 'Resume', th: 'เดินต่อ' })}` : `⏸ ${t({ en: 'Pause', th: 'พัก' })}`}</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => setOpen((value) => !value)}>
          <Text style={styles.buttonText}>☰ {t({ en: 'Details', th: 'รายละเอียด' })} {open ? '▲' : '▼'}</Text>
        </Pressable>
      </View>

      {open && (
        <View style={styles.details}>
          <Text style={styles.row}>{t(LIMIT_LABEL[line.limitedBy])}{line.energyPerWork > 0 ? ` · ${t({ en: 'power', th: 'ไฟ' })} ${line.potentialEnergyPerMinute.toFixed(1)}/min` : ''}{line.crewRate > 0 ? ` · crew +${(line.crewRate * 100).toFixed(0)}%` : ''}</Text>
          {upgradeCost !== null && (
            <Pressable
              style={styles.secondary}
              onPress={() => apply({ type: 'upgrade', sequence: state.nextActionSequence, buildingId: line.buildingId })}
            >
              <Text style={styles.secondaryText}>{t({ en: `Upgrade to Lv${level + 1} · $${upgradeCost.toLocaleString()}`, th: `อัปเกรดเป็น Lv${level + 1} · $${upgradeCost.toLocaleString()}` })}</Text>
            </Pressable>
          )}
          {line.building !== 'wasteTreatmentPlant' && (
            <View style={styles.row2}>
              {MODULES.map((module) => {
                const quote = getV3ModuleQuote(state, line.buildingId, module)
                if (quote.blocker === 'no_change') return <Text key={module} style={styles.chipActive}>✓ {module}</Text>
                return (
                  <Pressable
                    key={module}
                    disabled={Boolean(quote.blocker)}
                    accessibilityState={{ disabled: Boolean(quote.blocker) }}
                    style={[styles.chip, quote.blocker && styles.disabled]}
                    onPress={() => apply({ type: 'set_module', sequence: state.nextActionSequence, buildingId: line.buildingId, module })}
                  >
                    <Text style={styles.chipText}>{module}{quote.costCents ? ` $${quote.costCents / 100}` : ''}</Text>
                  </Pressable>
                )
              })}
            </View>
          )}
          {recipes.filter((recipe) => recipe.id !== program.blueprintId).map((recipe) => (
            <Pressable
              key={recipe.id}
              style={styles.secondary}
              onPress={() => apply({ type: 'set_program', sequence: state.nextActionSequence, buildingId: line.buildingId, blueprintId: recipe.id })}
            >
              <Text style={styles.secondaryText}>{recipe.name} · Q{recipe.quality}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

/** Every plant program as a pipeline card, plus a compact power/upkeep footer. */
export function V3ProductionFlow({ state, apply, t, describe }: Props) {
  const plan = evaluateV3Production(state, 25)
  const maintenance = evaluateV3Maintenance(state)
  const battery = getV3BatteryCapacity(state)
  const processCount = listV3Buildings(state).filter((building) => isV3ProcessBuilding(building.type)).length

  return (
    <>
      {plan.lines.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.row}>{t({ en: 'No production lines yet — build a Distillation Unit to start.', th: 'ยังไม่มีไลน์ผลิต — สร้าง Distillation Unit ก่อน' })}</Text>
        </View>
      )}
      {plan.lines.map((line) => <LineCard key={line.buildingId} state={state} apply={apply} t={t} describe={describe} line={line} />)}
      {processCount > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>⚡ {t({ en: 'Power', th: 'ไฟฟ้า' })}</Text>
            <View style={styles.footerBar}><View style={[styles.footerFill, { width: `${battery > 0 ? Math.round(Math.min(1, state.world.electricity / battery) * 100) : 0}%` }]} /></View>
            <Text style={styles.footerValue}>{state.world.electricity.toFixed(0)}/{battery.toFixed(0)}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Text style={styles.footerLabel}>🔧 {t({ en: 'Upkeep', th: 'ค่าบำรุง' })}</Text>
            <Text style={styles.footerValue}>${(maintenance.perMinuteCents / 100).toFixed(0)}/min</Text>
          </View>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8 },
  flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flowBox: { alignItems: 'center', gap: 2, width: 74 },
  flowArt: { width: 62, height: 52, borderRadius: 8, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', alignItems: 'center', justifyContent: 'center' },
  flowImage: { width: '100%', height: '100%' },
  flowGlyph: { fontSize: 26 },
  flowLabel: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 10, textAlign: 'center' },
  flowSub: { color: '#8FA9BA', fontSize: 10 },
  arrowWrap: { alignItems: 'center', gap: 1, flexShrink: 1 },
  arrowRate: { color: '#6ACDB4', fontFamily: fonts.heading, fontSize: 10 },
  arrowGlyph: { color: '#6ACDB4', fontSize: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  pillLive: { backgroundColor: '#1E5B45' },
  pillPaused: { backgroundColor: '#5B3A1E' },
  pillText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 10 },
  lineName: { color: '#D5E2E9', fontFamily: fonts.heading, fontSize: 13, flexShrink: 1 },
  outputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bigNumber: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 26 },
  bigUnit: { color: '#8FA9BA', fontSize: 13 },
  warnPill: { backgroundColor: '#5B241E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  warnText: { color: '#FFAD8A', fontSize: 11 },
  bar: { height: 8, borderRadius: 4, backgroundColor: '#163A52', overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#6ACDB4' },
  row2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  variantChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 6, paddingVertical: 3, paddingHorizontal: 6 },
  variantChipShort: { borderColor: '#8A4A3A' },
  variantChipText: { color: '#D5E2E9', fontSize: 11 },
  variantOk: { color: '#6ACDB4', fontSize: 11, fontFamily: fonts.heading },
  variantShort: { color: '#FFAD8A', fontSize: 11, fontFamily: fonts.heading },
  row: { color: '#D5E2E9', fontSize: 12, lineHeight: 17 },
  button: { flex: 1, backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  primaryButton: { backgroundColor: '#2E6C63', borderColor: '#6ACDB4' },
  buttonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12 },
  primaryButtonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12 },
  details: { gap: 6, borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 8 },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12, textAlign: 'center' },
  chip: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8 },
  chipText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 11 },
  chipActive: { color: '#6ACDB4', fontFamily: fonts.heading, fontSize: 11, paddingVertical: 6, paddingHorizontal: 8 },
  disabled: { opacity: 0.4 },
  footer: { flexDirection: 'row', backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, alignItems: 'center' },
  footerDivider: { width: 1, height: 28, backgroundColor: '#274B63', marginHorizontal: 12 },
  footerItem: { flex: 1, gap: 4 },
  footerLabel: { color: '#8FA9BA', fontFamily: fonts.heading, fontSize: 11 },
  footerBar: { height: 6, borderRadius: 3, backgroundColor: '#163A52', overflow: 'hidden' },
  footerFill: { height: 6, backgroundColor: '#FFD447' },
  footerValue: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
})
