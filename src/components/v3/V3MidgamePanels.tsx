import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { BUILDINGS } from '../../game/data/buildings'
import type { BilingualTextValue, BuildingType } from '../../game/types'
import { V3_SUPPORTED_BUILDINGS, getV3ModuleQuote, reduceV3Action } from '../../game/v3/actions'
import { V3_BUILDINGS, V3_DEVELOPMENT_BY_FAMILY, V3_RESEARCH, type V3ResearchEffect, V3_SPOT_PRICE_CENTS, isV3ProcessBuilding } from '../../game/v3/data'
import { getV3BlueprintQuality } from '../../game/v3/development'
import { getV3NextGridExpansion } from '../../game/v3/expansion'
import { getV3ProductCapacity, getV3ProductQuantity, getV3SellableQuantity } from '../../game/v3/productInventory'
import { evaluateV3Production, getV3BatteryCapacity, getV3FeedstockCapacity, type V3LinePlan } from '../../game/v3/production'
import { getV3AvailableKnowledgeRank } from '../../game/v3/research'
import type { V3Action, V3ActionEvent, V3GameState, V3ModuleKey, V3ProcessProfile, V3ProductFamily } from '../../game/v3/types'
import { evaluateV3Maintenance, getV3EmergencyExitCents } from '../../game/v3/maintenance'
import { fonts } from '../../theme'
import { V3OffersPanel } from './V3OffersPanel'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never
type ActionInput = WithoutSequence<V3Action>
type Translate = (value: BilingualTextValue) => string

type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: Translate
  describe: (event: V3ActionEvent | null) => string
}

const FAMILY_LABEL: Record<V3ProductFamily, BilingualTextValue> = {
  gasoline: { en: 'Gasoline', th: 'Gasoline' },
  lubricants: { en: 'Lubricants', th: 'น้ำมันหล่อลื่น' },
  jetFuel: { en: 'Jet Fuel', th: 'น้ำมันเครื่องบิน' },
  petrochemicals: { en: 'Petrochemicals', th: 'ปิโตรเคมี' },
  plasticPellets: { en: 'Plastic Pellets', th: 'เม็ดพลาสติก' },
}
const PORTED: V3ProductFamily[] = ['gasoline', 'lubricants', 'jetFuel', 'petrochemicals', 'plasticPellets']
const COMMODITIES = [
  { key: 'recycledMaterial' as const, label: { en: 'Recycled material', th: 'วัสดุรีไซเคิล' } },
  { key: 'asphalt' as const, label: { en: 'Asphalt', th: 'ยางมะตอย' } },
]
const MODULES: V3ModuleKey[] = ['none', 'throughput', 'economy', 'precision']
const PROFILES: V3ProcessProfile[] = ['volume', 'standard', 'precision']
const LIMIT_TEXT: Record<V3LinePlan['limitedBy'], BilingualTextValue> = {
  none: { en: 'running at potential', th: 'ผลิตเต็มกำลัง' },
  output_space: { en: 'limited by storage space', th: 'ติดพื้นที่ถังเก็บ' },
  input: { en: 'limited by input stock', th: 'ติดวัตถุดิบ' },
  power: { en: 'limited by power', th: 'ติดไฟฟ้า' },
}
const STATUS_TEXT: Record<V3LinePlan['status'], BilingualTextValue> = {
  ready: { en: 'Running', th: 'ทำงาน' },
  paused: { en: 'Paused', th: 'พักไลน์' },
  setup: { en: 'Changing recipe', th: 'กำลังเปลี่ยนสูตร' },
  invalid: { en: 'Recipe/module/level mismatch', th: 'สูตร/โมดูล/เลเวลไม่ตรงกัน' },
}

function researchEffectText(effect: V3ResearchEffect): BilingualTextValue {
  switch (effect.kind) {
    case 'knowledgeRank': return { en: `knowledge rank ${effect.rank} (Q+${effect.rank * 5})`, th: `ความรู้ rank ${effect.rank} (Q+${effect.rank * 5})` }
    case 'globalRate': return { en: `all lines +${effect.value * 100}% rate (cap 20%)`, th: `ทุกไลน์เร็วขึ้น ${effect.value * 100}% (สูงสุด 20%)` }
    case 'coreStorage': return { en: `crude & gasoline storage +${effect.value}`, th: `ถัง crude และ gasoline +${effect.value}` }
    case 'storagePercent': return { en: `storage +${effect.value * 100}% (cap 50%)`, th: `ความจุ +${effect.value * 100}% (สูงสุด 50%)` }
    case 'trade': return { en: `prices +${effect.value * 100}% (cap 15%)`, th: `ราคาขาย +${effect.value * 100}% (สูงสุด 15%)` }
    case 'upkeep': return { en: `maintenance −${effect.value * 100}% (cap 25%)`, th: `ค่าบำรุง −${effect.value * 100}% (สูงสุด 25%)` }
    case 'jobRp': return { en: `job RP +${effect.value * 100}% (cap 50%)`, th: `RP จากงาน +${effect.value * 100}% (สูงสุด 50%)` }
  }
}

export function V3MidgamePanels({ state, apply, t, describe }: Props) {
  const [devFamily, setDevFamily] = useState<V3ProductFamily>('gasoline')
  const [devModule, setDevModule] = useState<V3ModuleKey>('none')

  // Dry-run the same reducer the action will use; the UI never re-implements rules.
  const check = (action: ActionInput): V3ActionEvent | null => {
    const result = reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
    return result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
  }
  const run = (action: ActionInput) => apply({ ...action, sequence: state.nextActionSequence } as V3Action)

  const Gate = ({ label, action, primary }: { label: string; action: ActionInput; primary?: boolean }) => {
    const blocked = check(action)
    return (
      <View>
        <Pressable
          accessibilityState={{ disabled: Boolean(blocked) }}
          disabled={Boolean(blocked)}
          onPress={() => run(action)}
          style={[primary ? styles.primary : styles.secondary, blocked && styles.disabled]}
        >
          <Text style={primary ? styles.primaryText : styles.secondaryText}>{label}</Text>
        </Pressable>
        {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
      </View>
    )
  }

  const plan = evaluateV3Production(state, 25)
  const maintenance = evaluateV3Maintenance(state, 25)
  const power = plan.power
  const emptyCell = state.world.grid.findIndex((cell) => cell === null)
  const chapter = state.campaignProgress.chapter
  const labCellIndex = state.world.grid.findIndex((cell) => cell === 'laboratory')
  const expansion = getV3NextGridExpansion(state)
  const gridSize = Math.round(Math.sqrt(state.world.grid.length))
  const rank = labCellIndex >= 0 ? getV3AvailableKnowledgeRank(state, labCellIndex) : 0
  const buildable = [...V3_SUPPORTED_BUILDINGS].filter((building) => V3_BUILDINGS[building].buildChapter <= chapter + 1)

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Products & storage', th: 'สินค้าและถังเก็บ' })}</Text>
        {PORTED.map((family) => (
          <Text key={family} style={styles.row}>
            {t(FAMILY_LABEL[family])}: {getV3ProductQuantity(state, family).toFixed(1)}/{getV3ProductCapacity(state, family)}
            {' · '}{t({ en: 'free', th: 'ขายได้' })} {getV3SellableQuantity(state, family).toFixed(1)}
          </Text>
        ))}
        {COMMODITIES.map(({ key, label }) => (
          <Text key={key} style={styles.row}>{t(label)}: {getV3ProductQuantity(state, key).toFixed(1)}/{getV3ProductCapacity(state, key)} · ${V3_SPOT_PRICE_CENTS[key] / 100}/{t({ en: 'unit', th: 'หน่วย' })}</Text>
        ))}
        <Text style={styles.row}>Feedstock: {state.world.feedstock.toFixed(1)}/{getV3FeedstockCapacity(state)} · Waste: {state.world.waste.toFixed(1)}/200</Text>
        {PORTED.map((family) => {
          const free = Math.floor(getV3SellableQuantity(state, family) + 1e-8)
          const quantity = Math.max(1, Math.min(10, free))
          return (
            <Gate
              key={`sell-${family}`}
              label={t({
                en: `Sell ${quantity} ${FAMILY_LABEL[family].en} · $${(quantity * V3_SPOT_PRICE_CENTS[family] / 100).toFixed(0)}`,
                th: `ขาย ${FAMILY_LABEL[family].th} ${quantity} หน่วย · $${(quantity * V3_SPOT_PRICE_CENTS[family] / 100).toFixed(0)}`,
              })}
              action={{ type: 'trade', direction: 'sell', product: family, quantity }}
            />
          )
        })}
        {COMMODITIES.map(({ key, label }) => {
          const quantity = Math.max(1, Math.min(10, Math.floor(getV3ProductQuantity(state, key) + 1e-8)))
          return (
            <Gate
              key={`sell-${key}`}
              label={t({ en: `Sell ${quantity} ${label.en}`, th: `ขาย${label.th} ${quantity} หน่วย` })}
              action={{ type: 'trade', direction: 'sell', product: key, quantity }}
            />
          )
        })}
        <Gate
          label={t({ en: 'Convert 10 crude → 10 asphalt (side product)', th: 'แปลง crude 10 → ยางมะตอย 10 (สินค้ารอง)' })}
          action={{ type: 'convert_asphalt', quantity: 10 }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Maintenance', th: 'ค่าบำรุงรักษา' })}</Text>
        {state.maintenanceEmergency ? (
          <>
            <Text style={styles.warning}>{t({
              en: 'EMERGENCY: maintenance could not be paid. Only the first Distillation runs Standard at Lv1 (no crew/module/bonus); other lines are paused and maintenance is suspended. Your saved programs are kept.',
              th: 'โหมดฉุกเฉิน: จ่ายค่าบำรุงไม่พอ มีเพียง Distillation แรกที่ทำงานแบบ Standard Lv1 (ไม่มีทีม/โมดูล/โบนัส) ไลน์อื่นหยุด และพักการเก็บค่าบำรุง โปรแกรมที่ตั้งไว้ยังอยู่ครบ',
            })}</Text>
            <Gate
              primary
              label={t({ en: `Restore normal operation (needs $${(getV3EmergencyExitCents(state) / 100).toFixed(2)} = 1 min of maintenance)`, th: `กลับสู่การทำงานปกติ (ต้องมี $${(getV3EmergencyExitCents(state) / 100).toFixed(2)} = ค่าบำรุง 1 นาที)` })}
              action={{ type: 'restore_operations' }}
            />
          </>
        ) : (
          <Text style={styles.row}>{t({ en: 'Paid per 5s', th: 'จ่ายทุก 5 วินาที' })}: ${(maintenance.dueCents / 100).toFixed(2)} · ${(maintenance.perMinuteCents / 100).toFixed(2)}/min · {t({ en: 'cut', th: 'ลด' })} {(maintenance.globalCut * 100).toFixed(0)}% / 25%</Text>
        )}
        {state.campaignProgress.chapter < 2 && (
          <Text style={styles.row}>{t({ en: 'Starter Distillation and core tanks are free until C2.', th: 'Distillation และถังหลักเริ่มต้นไม่เสียค่าบำรุงจนถึงบท C2' })}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Power', th: 'ระบบไฟฟ้า' })}</Text>
        <Text style={styles.row}>{t({ en: 'Battery', th: 'แบตเตอรี่' })}: {state.world.electricity.toFixed(1)}/{getV3BatteryCapacity(state)}</Text>
        <Text style={styles.row}>{t({ en: 'Max supply', th: 'กำลังจ่ายสูงสุด' })}: {power.potentialSupplyPerMinute.toFixed(0)}/min</Text>
        <Text style={styles.row}>{t({ en: 'Demand requested / actual', th: 'ความต้องการ / ใช้จริง' })}: {power.requestedDemandPerMinute.toFixed(1)} / {power.actualDemandPerMinute.toFixed(1)} per min</Text>
        <Text style={styles.row}>{t({ en: 'Crude reserved for active distillation', th: 'crude ที่สำรองให้ Distillation' })}: {power.crudeReservedForDistillation.toFixed(1)}</Text>
        <Text style={styles.row}>{t({ en: 'Generator fuel next cycle', th: 'เชื้อเพลิงโรงไฟฟ้ารอบถัดไป' })}: {power.generatorFuel.toFixed(2)} crude</Text>
        {power.requestedDemandPerMinute > power.potentialSupplyPerMinute + 1e-6 && (
          <Text style={styles.warning}>{t({ en: 'Demand exceeds supply: build or upgrade a Power Plant.', th: 'ใช้ไฟเกินกำลังจ่าย: สร้างหรืออัปเกรดโรงไฟฟ้า' })}</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Production lines', th: 'ไลน์การผลิต' })}</Text>
        {plan.lines.map((line) => {
          const program = state.plantPrograms[line.cellIndex]
          const blueprint = state.productBlueprints[program.blueprintId]
          const level = state.world.gridLevels[line.cellIndex] ?? 1
          const recipes = Object.values(state.productBlueprints)
            .filter((entry) => entry.family === line.family && !entry.archived)
            .sort((a, b) => a.quality - b.quality || a.id.localeCompare(b.id))
          return (
            <View key={line.cellIndex} style={styles.line}>
              <Text style={styles.lineTitle}>
                #{line.cellIndex + 1} {t(BUILDINGS[line.building].name)} Lv{level} · {blueprint ? `${blueprint.name} Q${blueprint.quality} · ${t({ en: 'module', th: 'โมดูล' })} ${program.installedModule}` : t({ en: 'waste 4 → recycled 2', th: 'ของเสีย 4 → รีไซเคิล 2' })}
              </Text>
              <Text style={styles.row}>{t(STATUS_TEXT[line.status])} · {t(LIMIT_TEXT[line.limitedBy])}</Text>
              <Text style={styles.row}>
                {t({ en: 'Output potential / actual', th: 'ผลิตได้สูงสุด / จริง' })}: {line.potentialOutputPerMinute.toFixed(1)} / {line.actualOutputPerMinute.toFixed(1)} per min
                {line.energyPerWork > 0 ? ` · ${t({ en: 'power', th: 'ไฟ' })} ${line.potentialEnergyPerMinute.toFixed(1)}/min` : ''}
                {line.crewRate > 0 ? ` · crew +${(line.crewRate * 100).toFixed(0)}%` : ''}
              </Text>
              <Gate
                label={program.paused ? t({ en: 'Resume line', th: 'เดินไลน์ต่อ' }) : t({ en: 'Pause line', th: 'พักไลน์' })}
                action={{ type: 'set_pause', cellIndex: line.cellIndex, paused: !program.paused }}
              />
              <Gate
                label={t({
                  en: `Upgrade to Lv${level + 1}${V3_BUILDINGS[line.building].upgradeCostDollars?.[level - 1] ? ` · $${V3_BUILDINGS[line.building].upgradeCostDollars![level - 1]}` : ''}`,
                  th: `อัปเกรดเป็น Lv${level + 1}${V3_BUILDINGS[line.building].upgradeCostDollars?.[level - 1] ? ` · $${V3_BUILDINGS[line.building].upgradeCostDollars![level - 1]}` : ''}`,
                })}
                action={{ type: 'upgrade', cellIndex: line.cellIndex }}
              />
              {line.building !== 'wasteTreatmentPlant' && <View style={styles.chips}>
                {MODULES.map((module) => {
                  const quote = getV3ModuleQuote(state, line.cellIndex, module)
                  if (quote.blocker === 'no_change') return <Text key={module} style={styles.chipActive}>✓ {module}</Text>
                  return (
                    <View key={module} style={styles.chipWrap}>
                      <Gate
                        label={`${module}${quote.costCents ? ` $${quote.costCents / 100}` : ''}`}
                        action={{ type: 'set_module', cellIndex: line.cellIndex, module }}
                      />
                    </View>
                  )
                })}
              </View>}
              {recipes.map((recipe) => recipe.id === program.blueprintId ? null : (
                <Gate
                  key={recipe.id}
                  label={t({ en: `Use ${recipe.name} Q${recipe.quality}`, th: `ใช้ ${recipe.name} Q${recipe.quality}` })}
                  action={{ type: 'set_program', cellIndex: line.cellIndex, blueprintId: recipe.id }}
                />
              ))}
            </View>
          )
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Build & expand', th: 'สร้างและขยาย' })}</Text>
        <Text style={styles.row}>{t({ en: 'Yard', th: 'พื้นที่' })}: {gridSize}×{gridSize} · {t({ en: 'empty slots', th: 'ช่องว่าง' })} {state.world.grid.filter((cell) => cell === null).length}</Text>
        {expansion && (
          <Gate
            label={t({ en: `Expand to ${expansion.toSize}×${expansion.toSize} · $${expansion.costCents / 100}`, th: `ขยายเป็น ${expansion.toSize}×${expansion.toSize} · $${expansion.costCents / 100}` })}
            action={{ type: 'expand_grid' }}
          />
        )}
        {buildable.map((building: BuildingType) => (
          <Gate
            key={building}
            label={`${t(BUILDINGS[building].name)} · $${V3_BUILDINGS[building].buildCostDollars.toLocaleString()}`}
            action={{ type: 'build', cellIndex: emptyCell < 0 ? state.world.grid.length : emptyCell, building }}
          />
        ))}
        {state.world.grid.map((building, cellIndex) => building && !isV3ProcessBuilding(building) && V3_BUILDINGS[building].upgradeCostDollars ? (
          <Gate
            key={`upgrade-${cellIndex}`}
            label={t({
              en: `Upgrade #${cellIndex + 1} ${BUILDINGS[building].name.en} Lv${state.world.gridLevels[cellIndex]}→${(state.world.gridLevels[cellIndex] ?? 1) + 1}`,
              th: `อัปเกรด #${cellIndex + 1} ${BUILDINGS[building].name.th} Lv${state.world.gridLevels[cellIndex]}→${(state.world.gridLevels[cellIndex] ?? 1) + 1}`,
            })}
            action={{ type: 'upgrade', cellIndex }}
          />
        ) : null)}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Research', th: 'งานวิจัย' })} · {state.world.researchPoints.toFixed(1)} RP</Text>
        {(Object.keys(V3_RESEARCH) as Array<keyof typeof V3_RESEARCH>).map((researchId) => (
          <Gate
            key={researchId}
            label={`${state.world.unlockedResearchIds.includes(researchId) ? '✓ ' : ''}${researchId} · ${V3_RESEARCH[researchId].rp} RP · ${t(researchEffectText(V3_RESEARCH[researchId].effect))}`}
            action={{ type: 'buy_research', researchId }}
          />
        ))}
      </View>

      <V3OffersPanel state={state} apply={apply} t={t} describe={describe} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t({ en: 'Product development', th: 'พัฒนาสูตรสินค้า' })}</Text>
        <View style={styles.chips}>
          {PORTED.map((family) => (
            <Pressable key={family} onPress={() => setDevFamily(family)} style={[styles.chip, devFamily === family && styles.chipSelected]}>
              <Text style={styles.chipText}>{t(FAMILY_LABEL[family])}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chips}>
          {MODULES.map((module) => (
            <Pressable key={module} onPress={() => setDevModule(module)} style={[styles.chip, devModule === module && styles.chipSelected]}>
              <Text style={styles.chipText}>{module}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.row}>
          {t({ en: 'Fee', th: 'ค่าพัฒนา' })} ${V3_DEVELOPMENT_BY_FAMILY[devFamily].feeCents / 100} · {V3_DEVELOPMENT_BY_FAMILY[devFamily].ticks / 5}s · 10 {t({ en: 'samples', th: 'ตัวอย่าง' })} · {t({ en: 'knowledge rank', th: 'ระดับความรู้' })} {rank}
        </Text>
        {state.developmentProject ? (
          <Text style={styles.row}>{state.developmentProject.family} {state.developmentProject.profile}/{state.developmentProject.module} Q{state.developmentProject.quality} · {(state.developmentProject.remainingTicks / 5).toFixed(0)}s</Text>
        ) : PROFILES.map((profile) => (
          <Gate
            key={profile}
            label={t({
              en: `Develop ${profile} → Q${getV3BlueprintQuality(profile, devModule, rank, 0)} (no lead)`,
              th: `พัฒนา ${profile} → Q${getV3BlueprintQuality(profile, devModule, rank, 0)} (ไม่มีหัวหน้า)`,
            })}
            action={{
              type: 'start_development', family: devFamily, profile, module: devModule,
              knowledgeRank: rank, leadEmployeeId: null, labCellIndex,
            }}
          />
        ))}
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  warning: { color: '#FFAD8A', fontSize: 13 },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
  line: { borderTopWidth: 1, borderTopColor: '#274B63', paddingTop: 8, gap: 6 },
  lineTitle: { color: '#A9F3D9', fontFamily: fonts.heading, fontSize: 13 },
  primary: { backgroundColor: '#FFD447', borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  primaryText: { color: '#0A2943', fontFamily: fonts.heading, fontSize: 13 },
  secondary: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  secondaryText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chipWrap: { minWidth: '45%', flexGrow: 1 },
  chip: { borderWidth: 1, borderColor: '#3F6680', borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, minHeight: 36 },
  chipSelected: { backgroundColor: '#2E6C63', borderColor: '#6ACDB4' },
  chipText: { color: '#E8F0F4', fontSize: 12 },
  chipActive: { color: '#6ACDB4', fontSize: 12, paddingVertical: 8, paddingHorizontal: 6 },
})
