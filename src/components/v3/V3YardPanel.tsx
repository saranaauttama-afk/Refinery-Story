import { useMemo, useState } from 'react'
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

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
import { getV3BuildingArt } from './v3Art'
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
  const [page, setPage] = useState<'menu' | 'build' | 'decor' | 'land'>('menu')
  const [detail, setDetail] = useState<BuildingType | null>(null)

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
  // Every supported building is listed; ones not buildable yet are faded with a lock.
  const palette = [...V3_SUPPORTED_BUILDINGS].sort((a, b) => V3_BUILDINGS[a].buildChapter - V3_BUILDINGS[b].buildChapter || V3_BUILDINGS[a].buildCostDollars - V3_BUILDINGS[b].buildCostDollars)
  const buildLock = (building: BuildingType): string | null => {
    if (V3_BUILDINGS[building].buildChapter > chapter) return t({ en: `Unlocks C${V3_BUILDINGS[building].buildChapter}`, th: `ปลดล็อก C${V3_BUILDINGS[building].buildChapter}` })
    const limit = getV3BuildingLimit(state, building)
    if (limit !== null && countV3Buildings(state, building) >= limit) return t({ en: `Limit ${limit}/${limit}`, th: `ครบจำนวน ${limit}/${limit}` })
    return null
  }
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

  const backHeader = (title: string) => (
    <View style={styles.titleRow}>
      <Pressable onPress={() => { setPage('menu'); setDetail(null); setParcelId(null) }} hitSlop={10} accessibilityRole="button" accessibilityLabel={t({ en: 'Back', th: 'กลับ' })}>
        <Text style={styles.back}>‹ {t({ en: 'Menu', th: 'เมนู' })}</Text>
      </Pressable>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  )

  const appeal = getV3Appeal(state)
  const decorCount = listV3Decorations(state).length
  const decorPalette = (
    <View style={styles.card}>
      {backHeader(t({ en: 'Decorations', th: 'ของแต่ง' }))}
      <Text style={styles.row}>{t({
        en: `Appeal ${appeal.points.toFixed(0)} → fame gain +${(appeal.bonus * 100).toFixed(1)}% (max 10%) · ${decorCount}/${V3_DECOR_CAP}`,
        th: `ความน่าอยู่ ${appeal.points.toFixed(0)} → ชื่อเสียงเพิ่มเร็วขึ้น +${(appeal.bonus * 100).toFixed(1)}% (สูงสุด 10%) · ${decorCount}/${V3_DECOR_CAP} ชิ้น`,
      })}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {V3_DECOR_KINDS.map((kind) => {
          const spec = V3_DECOR[kind]
          const lock = getV3DecorLock(state, kind)
          return (
            <Pressable
              key={kind}
              disabled={Boolean(lock)}
              accessibilityState={{ disabled: Boolean(lock) }}
              style={[styles.tile, lock && styles.tileLocked]}
              onPress={() => { setSelectedId(null); setDecorId(null); setMode({ kind: 'decor', decor: kind, rotated: false }); onClose?.() }}
            >
              {lock && <Text style={styles.lockBadge}>🔒</Text>}
              <Text style={styles.tileName} numberOfLines={2}>{t(spec.label)}</Text>
              <Text style={styles.muted}>{lock
                ? (lock.blocker === 'locked' ? t({ en: `Unlocks C${lock.chapter}`, th: `ปลดล็อก C${lock.chapter}` }) : t({ en: 'Win the Expo', th: 'ชนะเอ็กซ์โป' }))
                : `${spec.w}×${spec.h} · $${spec.costDollars} · +${spec.appeal}`}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )


  const detailModal = detail ? (() => {
    const config = BUILDINGS[detail]
    const footprint = getV3Footprint(detail, 1)
    const limit = getV3BuildingLimit(state, detail)
    const count = countV3Buildings(state, detail)
    const lock = buildLock(detail)
    const cost = V3_BUILDINGS[detail].buildCostDollars
    const art = getV3BuildingArt(detail, 1)
    return (
      <Modal transparent animationType="fade" visible onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDetail(null)}>
          <Pressable style={styles.popup} onPress={() => undefined}>
            <View style={styles.popupHead}>
              <Text style={styles.popupTitle}>{t(config.name)}</Text>
              <Pressable onPress={() => setDetail(null)} hitSlop={12} accessibilityLabel={t({ en: 'Close', th: 'ปิด' })}><Text style={styles.close}>✕</Text></Pressable>
            </View>
            <View style={styles.detailArt}>{art ? <Image source={art} style={styles.detailImage} resizeMode="contain" /> : <Text style={styles.placeholder}>🏭</Text>}</View>
            <Text style={styles.detailDescription}>{t(config.description)}</Text>
            <View style={styles.detailStats}>
              <View style={styles.detailStat}><Text style={styles.detailStatLabel}>{t({ en: 'SIZE', th: 'ขนาด' })}</Text><Text style={styles.detailStatValue}>{footprint ? `${footprint.w}×${footprint.h}` : '-'}</Text></View>
              <View style={styles.detailStat}><Text style={styles.detailStatLabel}>{t({ en: 'COST', th: 'ราคา' })}</Text><Text style={styles.detailStatValue}>${cost.toLocaleString()}</Text></View>
              {limit !== null && <View style={styles.detailStat}><Text style={styles.detailStatLabel}>{t({ en: 'BUILT', th: 'สร้างแล้ว' })}</Text><Text style={styles.detailStatValue}>{count}/{limit}</Text></View>}
            </View>
            {state.world.moneyCents < cost * 100 && !lock && <Text style={styles.reason}>{t({ en: 'Not enough cash yet.', th: 'เงินยังไม่พอ' })}</Text>}
            {lock && <Text style={styles.reason}>🔒 {lock}</Text>}
            <Pressable
              disabled={Boolean(lock)}
              accessibilityState={{ disabled: Boolean(lock) }}
              style={[styles.button, styles.placeButton, lock && styles.disabled]}
              onPress={() => { setDetail(null); setSelectedId(null); setMode({ kind: 'build', building: detail, anchor: null }); onClose?.() }}
            >
              <Text style={styles.placeText}>{t({ en: 'Place on map', th: 'วางบนแผนที่' })}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    )
  })() : null

  const buildPage = (
    <View style={styles.card}>
      {backHeader(t({ en: 'Build', th: 'สร้าง' }))}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {palette.map((building) => {
          const footprint = getV3Footprint(building, 1)
          const lock = buildLock(building)
          const art = getV3BuildingArt(building, 1)
          return (
            <Pressable
              key={building}
              accessibilityState={{ selected: detail === building }}
              style={[styles.tile, lock && styles.tileLocked, detail === building && styles.tileSelected]}
              onPress={() => setDetail(detail === building ? null : building)}
            >
              {lock && <Text style={styles.lockBadge}>🔒</Text>}
              <View style={styles.tileArt}>{art ? <Image source={art} style={styles.tileImage} resizeMode="contain" /> : <Text style={styles.placeholder}>🏭</Text>}</View>
              <Text style={styles.tileName} numberOfLines={2}>{t(BUILDINGS[building].name)}</Text>
              {lock ? <Text style={styles.tileLockText} numberOfLines={1}>{lock}</Text> : (
                <View style={styles.tileMeta}>
                  <Text style={styles.tileFootprint}>{footprint ? `${footprint.w}×${footprint.h}` : ''}</Text>
                  <Text style={styles.tilePrice}>${V3_BUILDINGS[building].buildCostDollars.toLocaleString()}</Text>
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
      {detailModal}
    </View>
  )

  const landPage = (
    <View style={styles.card}>
      {backHeader(t({ en: 'Land', th: 'ที่ดิน' }))}
      {parcels.length === 0 && <Text style={styles.muted}>{t({ en: 'All land is unlocked.', th: 'ปลดที่ดินครบแล้ว' })}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
        {parcels.map((parcel) => (
          <Pressable
            key={parcel.id}
            style={[styles.tile, parcel.state === 'locked' && styles.tileLocked, parcel.id === parcelId && styles.tileSelected]}
            onPress={() => setParcelId(parcel.id === parcelId ? null : parcel.id)}
          >
            {parcel.state === 'locked' && <Text style={styles.lockBadge}>🔒</Text>}
            <Text style={styles.tileName} numberOfLines={2}>{t(v3ParcelLabel(parcel.id))}</Text>
            <Text style={styles.muted}>{parcel.w}×{parcel.h} · ${parcel.costDollars.toLocaleString()} · C{parcel.chapter}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {parcels.filter((parcel) => parcel.id === parcelId).map((parcel) => (
        <Gate key={parcel.id} label={t({ en: 'Unlock this land', th: 'ปลดที่ดินแปลงนี้' })} action={{ type: 'unlock_land_parcel', parcelId: parcel.id }} onDone={() => setParcelId(null)} />
      ))}
    </View>
  )

  const decorPage = decorPalette

  const buildableCount = palette.filter((building) => !buildLock(building)).length
  const menuItems: Array<{ key: 'build' | 'decor' | 'land'; title: string; sub: string; glyph: string }> = [
    { key: 'build', glyph: '🏗️', title: t({ en: 'Build', th: 'สร้าง' }), sub: t({ en: `${buildableCount}/${palette.length} ready`, th: `สร้างได้ ${buildableCount}/${palette.length}` }) },
    { key: 'decor', glyph: '🌳', title: t({ en: 'Decorations', th: 'ของแต่ง' }), sub: t({ en: `Appeal ${appeal.points.toFixed(0)} · ${decorCount}/${V3_DECOR_CAP}`, th: `ความน่าอยู่ ${appeal.points.toFixed(0)} · ${decorCount}/${V3_DECOR_CAP}` }) },
    { key: 'land', glyph: '🗺️', title: t({ en: 'Land', th: 'ที่ดิน' }), sub: parcels.length ? t({ en: `${parcels.length} to unlock`, th: `ปลดได้ ${parcels.length}` }) : t({ en: 'All unlocked', th: 'ปลดครบแล้ว' }) },
  ]
  const menuPage = (
    <View style={styles.card}>
      <View style={styles.menuRow}>
        {menuItems.map((item) => (
          <Pressable key={item.key} accessibilityRole="button" style={styles.menuTile} onPress={() => setPage(item.key)}>
            <Text style={styles.menuGlyph}>{item.glyph}</Text>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.muted} numberOfLines={1}>{item.sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
  const sheetPage = page === 'build' ? buildPage : page === 'decor' ? decorPage : page === 'land' ? landPage : menuPage

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
      {section === 'sheet' && mode.kind === 'inspect' && sheetPage}
    </>
  )
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { color: '#D5E2E9', fontSize: 18, paddingHorizontal: 4 },
  card: { backgroundColor: '#082A48', borderWidth: 2, borderColor: '#0E5E96', borderRadius: 4, padding: 12, gap: 8 },
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
  back: { color: '#8FD3FF', fontFamily: fonts.heading, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hRow: { gap: 8, paddingRight: 8 },
  tile: { width: 124, backgroundColor: '#0B365B', borderWidth: 2, borderColor: '#245F83', borderRadius: 3, padding: 6, gap: 4, alignItems: 'center', justifyContent: 'center', minHeight: 126 },
  tileLocked: { opacity: 0.4 },
  tileSelected: { borderColor: '#FFD447', borderBottomWidth: 4 },
  tileArt: { width: '100%', height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: '#092B49', borderWidth: 1, borderColor: '#19496A' },
  tileImage: { width: '100%', height: 62 },
  tileName: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 12, textAlign: 'center', minHeight: 30, textAlignVertical: 'center' },
  tileMeta: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#245F83', paddingTop: 4 },
  tileFootprint: { color: '#9DBED2', fontFamily: fonts.body, fontSize: 11 },
  tilePrice: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 11 },
  tileLockText: { color: '#A9C0CD', fontSize: 10, textAlign: 'center' },
  lockBadge: { position: 'absolute', top: 4, right: 4, fontSize: 14, zIndex: 1 },
  placeholder: { fontSize: 32 },
  backdrop: { flex: 1, backgroundColor: 'rgba(3,10,18,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  popup: { width: '100%', maxWidth: 420, backgroundColor: '#082A48', borderWidth: 3, borderBottomWidth: 5, borderColor: '#0E5E96', borderRadius: 4, padding: 14, gap: 12 },
  popupHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popupTitle: { color: '#FFD447', fontFamily: fonts.brandHeading, fontSize: 19, flexShrink: 1 },
  detailArt: { height: 138, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A3451', borderWidth: 1, borderColor: '#245F83' },
  detailImage: { width: '100%', height: 132 },
  detailDescription: { color: '#E8F0F4', fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  detailStats: { flexDirection: 'row', gap: 6 },
  detailStat: { flex: 1, minWidth: 0, backgroundColor: '#061827', borderWidth: 1, borderColor: '#245F83', paddingHorizontal: 8, paddingVertical: 6 },
  detailStatLabel: { color: '#8FA9BA', fontFamily: fonts.brandHeading, fontSize: 10 },
  detailStatValue: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 14 },
  placeButton: { backgroundColor: '#FFD447', borderColor: '#FFE27F', borderBottomColor: '#C98A0A', borderBottomWidth: 4, borderRadius: 3 },
  placeText: { color: '#082A48', fontFamily: fonts.brandHeading, fontSize: 15, textAlign: 'center' },
  menuRow: { flexDirection: 'row', gap: 8 },
  menuTile: { flex: 1, backgroundColor: '#0B365B', borderWidth: 2, borderColor: '#245F83', borderRadius: 3, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 2, minHeight: 78 },
  menuGlyph: { fontSize: 22 },
  menuTitle: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 13, textAlign: 'center' },
})
