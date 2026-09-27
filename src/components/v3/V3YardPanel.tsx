import { useMemo, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { BUILDINGS } from '../../game/data/buildings'
import type { BilingualTextValue, BuildingType } from '../../game/types'
import { V3_SUPPORTED_BUILDINGS, reduceV3Action } from '../../game/v3/actions'
import { V3_BUILDINGS, V3_GENERATOR_BY_LEVEL, isV3ProcessBuilding } from '../../game/v3/data'
import { evaluateV3Production } from '../../game/v3/production'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { getV3Building, getV3BuildingAt, getV3BuildingLimit, countV3Buildings, getV3Footprint, getV3UnlockedArea } from '../../game/v3/yard'
import { getV3ParcelViews, getV3PlacementPreview, getV3UpgradePreview } from '../../game/v3/yardView'
import { fonts } from '../../theme'
import { v3ParcelLabel } from './v3Labels'
import { getV3AdjacencyPreview, getV3LineAdjacency } from '../../game/v3/adjacency'
import { getV3Appeal, getV3DecorAt, getV3DecorLock, listV3Decorations } from '../../game/v3/decor'
import { V3_DECOR, V3_DECOR_CAP, V3_DECOR_KINDS, type V3DecorKind } from '../../game/v3/decorData'

type WithoutSequence<T> = T extends unknown ? Omit<T, 'sequence'> : never
type ActionInput = WithoutSequence<V3Action>
type Translate = (value: BilingualTextValue) => string

type Mode =
  | { kind: 'inspect' }
  | { kind: 'build'; building: BuildingType; anchor: { x: number; y: number } | null }
  | { kind: 'move'; buildingId: string; anchor: { x: number; y: number } | null }
  /** Decor painting: every map tap places one item (the screen applies it). */
  | { kind: 'decor'; decor: V3DecorKind; rotated: boolean }

export type V3YardController = ReturnType<typeof useV3YardController>

/** Map interaction state shared by the full-screen map and the sheets. */
export function useV3YardController(state: V3GameState) {
  const [mode, setMode] = useState<Mode>({ kind: 'inspect' })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [parcelId, setParcelId] = useState<string | null>(null)
  const [decorId, setDecorId] = useState<string | null>(null)
  const placement = useMemo(() => {
    if (mode.kind === 'build' && mode.anchor) return getV3PlacementPreview(state, mode.building, 1, mode.anchor.x, mode.anchor.y)
    if (mode.kind === 'move' && mode.anchor) {
      const building = getV3Building(state, mode.buildingId)
      return building ? getV3PlacementPreview(state, building.type, building.level, mode.anchor.x, mode.anchor.y, building.id) : null
    }
    return null
  }, [mode, state])
  const selected = getV3Building(state, selectedId)
  const upgrade = selected && mode.kind === 'inspect' ? getV3UpgradePreview(state, selected.id) : null
  const onTapTile = (x: number, y: number) => {
    if (mode.kind === 'build' || mode.kind === 'move') return setMode({ ...mode, anchor: { x, y } })
    if (mode.kind === 'decor') return
    const building = getV3BuildingAt(state, x, y)
    setSelectedId(building?.id ?? null)
    setDecorId(building ? null : getV3DecorAt(state, x, y)?.id ?? null)
  }
  return {
    mode, setMode, selectedId, setSelectedId, parcelId, setParcelId, placement, upgrade, onTapTile, decorId, setDecorId,
    mapSelectedId: mode.kind === 'inspect' ? selectedId ?? decorId : mode.kind === 'move' ? mode.buildingId : null,
    upgradeGrowth: upgrade && upgrade.status !== 'max' ? { cells: upgrade.growth, ok: upgrade.status === 'valid' } : null,
  }
}

type Props = {
  state: V3GameState
  yard: V3YardController
  apply: (action: V3Action) => void
  t: Translate
  describe: (event: V3ActionEvent | null) => string
  /** Opens the pause-owning confirmation owned by the screen. */
  onRequestDemolish: (buildingId: string) => void
  onClose?: () => void
  /** 'overlay' = build/move bar + selected-building card; 'sheet' = build palette and land. */
  section: 'overlay' | 'sheet'
}

/** Selected-building card, the build/move confirmation bar, and the build/land sheet. */
export function V3YardPanel({ state, yard, apply, t, describe, onRequestDemolish, onClose, section }: Props) {
  const { mode, setMode, selectedId, setSelectedId, parcelId, setParcelId, upgrade, decorId, setDecorId } = yard
  const selected = getV3Building(state, selectedId)

  const check = (action: ActionInput): V3ActionEvent | null => {
    const result = reduceV3Action(state, { ...action, sequence: state.nextActionSequence } as V3Action)
    return result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
  }
  const run = (action: ActionInput) => apply({ ...action, sequence: state.nextActionSequence } as V3Action)

  const Gate = ({ label, action, onDone }: { label: string; action: ActionInput; onDone?: () => void }) => {
    const blocked = check(action)
    return (
      <View style={styles.gate}>
        <Pressable
          accessibilityState={{ disabled: Boolean(blocked) }}
          disabled={Boolean(blocked)}
          onPress={() => { run(action); onDone?.() }}
          style={[styles.button, blocked && styles.disabled]}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </Pressable>
        {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
      </View>
    )
  }

  const plan = evaluateV3Production(state, 25)
  const chapter = state.campaignProgress.chapter
  const palette = [...V3_SUPPORTED_BUILDINGS].filter((building) => V3_BUILDINGS[building].buildChapter <= chapter)
  const parcels = getV3ParcelViews(state).filter((parcel) => parcel.state !== 'owned')

  const info = selected ? (() => {
    const footprint = getV3Footprint(selected.type, selected.level)!
    const line = plan.lines.find((entry) => entry.buildingId === selected.id)
    const generator = selected.type === 'powerPlant' ? V3_GENERATOR_BY_LEVEL[selected.level] : null
    return (
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.cardTitle}>{t(BUILDINGS[selected.type].name)} Lv{selected.level}</Text>
          <Pressable onPress={() => setSelectedId(null)} hitSlop={12}><Text style={styles.close}>✕</Text></Pressable>
        </View>
        <Text style={styles.row}>{t({ en: 'Footprint', th: 'พื้นที่' })}: {footprint.w}×{footprint.h}{upgrade && upgrade.status !== 'max' ? ` → +${upgrade.growth.length} ${t({ en: 'tiles for next level', th: 'ช่องสำหรับเลเวลถัดไป' })}` : ''}</Text>
        {line && <Text style={styles.row}>{t({ en: 'Power demand', th: 'ใช้ไฟ' })}: {line.potentialEnergyPerMinute.toFixed(1)}/min · {t({ en: 'output', th: 'ผลผลิต' })} {line.actualOutputPerMinute.toFixed(1)}/{line.potentialOutputPerMinute.toFixed(1)} min · {line.limitedBy}</Text>}
        {isV3ProcessBuilding(selected.type) && (() => {
          const adjacency = getV3LineAdjacency(state, selected.id)
          return (
            <Text style={adjacency.tank || adjacency.workshop ? styles.good : styles.muted}>{t({
              en: `Layout: matching tank ${adjacency.tank ? '✓ +5% rate' : '— place one touching this line for +5%'} · workshop ${adjacency.workshop ? '✓ -10% upkeep' : '—'}`,
              th: `ผัง: ถังตรงชนิด ${adjacency.tank ? '✓ เร็วขึ้น 5%' : '— วางให้ติดไลน์นี้เพื่อ +5%'} · โรงซ่อม ${adjacency.workshop ? '✓ ค่าบำรุงลด 10%' : '—'}`,
            })}</Text>
          )
        })()}
        {generator && <Text style={styles.row}>{t({ en: 'Power supply', th: 'ผลิตไฟ' })}: {generator.energyPerCycle * 12}/min · battery +{generator.battery}</Text>}
        {!isV3ProcessBuilding(selected.type) && !generator && <Text style={styles.muted}>{t({ en: 'Storage/support building — see Stock for live capacity.', th: 'อาคารเก็บ/สนับสนุน — ดูความจุจริงที่หน้าสต็อก' })}</Text>}
        {upgrade && upgrade.status !== 'max' && upgrade.status !== 'valid' && (
          <Text style={styles.reason}>{t({ en: 'Next level does not fit here: move this building or neighbours, or unlock land.', th: 'เลเวลถัดไปไม่พอพื้นที่: ย้ายอาคารนี้/อาคารข้างเคียง หรือปลดที่ดินเพิ่ม' })}</Text>
        )}
        <View style={styles.row2}>
          <Gate label={t({ en: 'Upgrade', th: 'อัปเกรด' })} action={{ type: 'upgrade', buildingId: selected.id }} />
          <Pressable style={styles.button} onPress={() => { setMode({ kind: 'move', buildingId: selected.id, anchor: null }); onClose?.() }}>
            <Text style={styles.buttonText}>{t({ en: 'Move', th: 'ย้าย' })}</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.danger]} onPress={() => onRequestDemolish(selected.id)}>
            <Text style={styles.buttonText}>{t({ en: 'Demolish…', th: 'รื้อ…' })}</Text>
          </Pressable>
        </View>
      </View>
    )
  })() : null

  const decoration = decorId ? state.world.decorations[decorId] ?? null : null
  const decorInfo = decoration ? (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.cardTitle}>{t(V3_DECOR[decoration.kind].label)}</Text>
        <Pressable onPress={() => setDecorId(null)} hitSlop={12}><Text style={styles.close}>✕</Text></Pressable>
      </View>
      <Text style={styles.muted}>{t({ en: `Appeal +${V3_DECOR[decoration.kind].appeal} (less for repeats)`, th: `ความน่าอยู่ +${V3_DECOR[decoration.kind].appeal} (ชิ้นซ้ำได้น้อยลง)` })}</Text>
      <Gate
        label={t({ en: `Remove · refund $${V3_DECOR[decoration.kind].costDollars}`, th: `เก็บคืน · ได้เงินคืน $${V3_DECOR[decoration.kind].costDollars}` })}
        action={{ type: 'remove_decoration', decorationId: decoration.id }}
        onDone={() => setDecorId(null)}
      />
    </View>
  ) : null

  const decorBar = mode.kind === 'decor' ? (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: `Placing ${V3_DECOR[mode.decor].label.en}`, th: `กำลังวาง${V3_DECOR[mode.decor].label.th}` })} · ${V3_DECOR[mode.decor].costDollars}</Text>
      <Text style={styles.muted}>{t({ en: 'Tap tiles to place, one per tap. Tap a placed item later to remove it (full refund).', th: 'แตะช่องเพื่อวาง แตะหนึ่งครั้งได้หนึ่งชิ้น วางแล้วแตะที่ชิ้นนั้นเพื่อเก็บคืนได้ (คืนเงินเต็ม)' })}</Text>
      <View style={styles.row2}>
        {V3_DECOR[mode.decor].w !== V3_DECOR[mode.decor].h && (
          <Pressable style={styles.button} onPress={() => setMode({ ...mode, rotated: !mode.rotated })}>
            <Text style={styles.buttonText}>{t({ en: 'Rotate', th: 'หมุน' })} {mode.rotated ? '↕' : '↔'}</Text>
          </Pressable>
        )}
        <Pressable style={styles.button} onPress={() => setMode({ kind: 'inspect' })}>
          <Text style={styles.buttonText}>{t({ en: 'Done', th: 'เสร็จ' })}</Text>
        </Pressable>
      </View>
    </View>
  ) : null

  const appeal = getV3Appeal(state)
  const decorCount = listV3Decorations(state).length
  const decorPalette = (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{t({ en: 'Decorations', th: 'ของแต่ง' })}</Text>
      <Text style={styles.row}>{t({
        en: `Appeal ${appeal.points.toFixed(0)} → fame gain +${(appeal.bonus * 100).toFixed(1)}% (max 10%) · ${decorCount}/${V3_DECOR_CAP}`,
        th: `ความน่าอยู่ ${appeal.points.toFixed(0)} → ชื่อเสียงเพิ่มเร็วขึ้น +${(appeal.bonus * 100).toFixed(1)}% (สูงสุด 10%) · ${decorCount}/${V3_DECOR_CAP} ชิ้น`,
      })}</Text>
      <Text style={styles.muted}>{t({ en: 'Variety counts: repeats of the same item give less.', th: 'ของหลากหลายได้ค่ามากกว่า ชิ้นซ้ำชนิดเดิมได้น้อยลงเรื่อย ๆ' })}</Text>
      <View style={styles.row2}>
        {V3_DECOR_KINDS.map((kind) => {
          const spec = V3_DECOR[kind]
          const lock = getV3DecorLock(state, kind)
          return (
            <Pressable
              key={kind}
              disabled={Boolean(lock)}
              accessibilityState={{ disabled: Boolean(lock) }}
              style={[styles.chip, lock && styles.disabled]}
              onPress={() => { setSelectedId(null); setDecorId(null); setMode({ kind: 'decor', decor: kind, rotated: false }); onClose?.() }}
            >
              <Text style={styles.buttonText}>{t(spec.label)}</Text>
              <Text style={styles.muted}>{lock
                ? (lock.blocker === 'locked' ? t({ en: `Unlocks C${lock.chapter}`, th: `ปลดล็อก C${lock.chapter}` }) : t({ en: 'Win the Expo', th: 'ชนะเอ็กซ์โป' }))
                : `${spec.w}×${spec.h} · $${spec.costDollars} · +${spec.appeal}`}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )

  const modeBar = mode.kind === 'inspect' || mode.kind === 'decor' ? null : (() => {
    const anchor = mode.anchor
    const action: ActionInput | null = !anchor ? null : mode.kind === 'build'
      ? { type: 'build', building: mode.building, x: anchor.x, y: anchor.y }
      : { type: 'move_building', buildingId: mode.buildingId, x: anchor.x, y: anchor.y }
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {mode.kind === 'build'
            ? t({ en: `Place ${BUILDINGS[mode.building].name.en}`, th: `วาง ${BUILDINGS[mode.building].name.th}` })
            : t({ en: 'Move building', th: 'ย้ายอาคาร' })}
        </Text>
        <Text style={styles.muted}>{anchor ? `@(${anchor.x},${anchor.y})` : t({ en: 'Tap a tile for the top-left corner.', th: 'แตะช่องที่จะเป็นมุมซ้ายบน' })}</Text>
        {anchor && (() => {
          const moving = mode.kind === 'move' ? getV3Building(state, mode.buildingId) : null
          const type = mode.kind === 'build' ? mode.building : moving?.type
          if (!type) return null
          const effects = getV3AdjacencyPreview(state, type, moving?.level ?? 1, anchor.x, anchor.y, moving?.id ?? null)
          return effects.length ? (
            <Text style={styles.good}>{t({
              en: `Layout bonus: ${effects.map((effect) => effect.kind === 'tank' ? '+5% line rate' : '-10% line upkeep').join(', ')}`,
              th: `โบนัสผัง: ${effects.map((effect) => effect.kind === 'tank' ? 'ไลน์เร็วขึ้น 5%' : 'ค่าบำรุงไลน์ลด 10%').join(', ')}`,
            })}</Text>
          ) : null
        })()}
        <View style={styles.row2}>
          {action && <Gate label={t({ en: 'Confirm', th: 'ยืนยัน' })} action={action} onDone={() => setMode({ kind: 'inspect' })} />}
          <Pressable style={styles.button} onPress={() => setMode({ kind: 'inspect' })}>
            <Text style={styles.buttonText}>{t({ en: 'Cancel', th: 'ยกเลิก' })}</Text>
          </Pressable>
        </View>
      </View>
    )
  })()

  return (
    <>
      {section === 'overlay' && modeBar}
      {section === 'overlay' && decorBar}
      {section === 'overlay' && mode.kind === 'inspect' && info}
      {section === 'overlay' && mode.kind === 'inspect' && !info && decorInfo}
      {section === 'sheet' && mode.kind === 'inspect' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Build', th: 'สร้าง' })}</Text>
          <View style={styles.row2}>
            {palette.map((building) => {
              const footprint = getV3Footprint(building, 1)
              const limit = getV3BuildingLimit(state, building)
              const count = countV3Buildings(state, building)
              return (
                <Pressable key={building} style={styles.chip} onPress={() => { setSelectedId(null); setMode({ kind: 'build', building, anchor: null }); onClose?.() }}>
                  <Text style={styles.buttonText}>{t(BUILDINGS[building].name)}</Text>
                  <Text style={styles.muted}>{footprint ? `${footprint.w}×${footprint.h}` : ''} · ${V3_BUILDINGS[building].buildCostDollars.toLocaleString()}{limit !== null ? ` · ${count}/${limit}` : ''}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      )}
      {section === 'sheet' && mode.kind === 'inspect' && decorPalette}
      {section === 'sheet' && mode.kind === 'inspect' && parcels.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t({ en: 'Land', th: 'ที่ดิน' })}</Text>
          {parcels.map((parcel) => (
            <View key={parcel.id}>
              <Pressable onPress={() => setParcelId(parcel.id === parcelId ? null : parcel.id)}>
                <Text style={[styles.row, parcel.id === parcelId && styles.highlight]}>
                  {t(v3ParcelLabel(parcel.id))} · {parcel.w}×{parcel.h} · ${parcel.costDollars.toLocaleString()} · C{parcel.chapter}
                </Text>
              </Pressable>
              {parcel.id === parcelId && <Gate label={t({ en: 'Unlock this land', th: 'ปลดที่ดินแปลงนี้' })} action={{ type: 'unlock_land_parcel', parcelId: parcel.id }} onDone={() => setParcelId(null)} />}
            </View>
          ))}
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { color: '#D5E2E9', fontSize: 18, paddingHorizontal: 4 },
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 8 },
  cardTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { color: '#D5E2E9', fontSize: 13, lineHeight: 19 },
  row2: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
  highlight: { color: '#FFD447' },
  good: { color: '#A9F3D9', fontSize: 12 },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
  gate: { minWidth: '30%', flexGrow: 1 },
  button: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center', flexGrow: 1 },
  danger: { borderColor: '#A0524A' },
  chip: { backgroundColor: '#163A52', borderWidth: 1, borderColor: '#3F6680', borderRadius: 8, padding: 8, minWidth: '30%', flexGrow: 1 },
  buttonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12, textAlign: 'center' },
  disabled: { opacity: 0.45 },
})
