import { Text, View, Pressable, ScrollView } from 'react-native'
import { type, ui } from './theme'
import { baseAvailable } from '../sim/systems/investments'
import { bases, type BaseId } from '../data/bases'
import { additives, type AdditiveId } from '../data/additives'
import { pairCompat, type Compat } from '../data/compatibility'
import { useGame } from '../store/useGame'
import { selectBlend, discardLot } from '../sim/actions'
import {
  predictedScore,
  gradeFor,
  lotStats,
  tankCapacity,
  tankUnits,
  blendStations,
  recipeOf,
  gradeScale,
  gradeMin,
} from '../sim/systems/blending'
import { useState } from 'react'
import { recipeKnown, researchCandidates } from '../sim/systems/research'
import { demandOf, trending } from '../sim/systems/market'
import { salePrice } from '../sim/systems/customers'
import { GRADES, SALES } from '../data/balance'
import { productAccent } from '../render/palette'
import { styles } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted, GradeChip } from './cards'
import { text } from '../i18n'
import { featureOn } from '../data/features'
import type { GameState } from '../sim/types'

const compatColors: Record<Compat, string> = {
  S: '#F7DC7A',
  A: '#8ED9C1',
  B: '#9CC9EA',
  C: '#D8D2C4',
  D: '#F5B37A',
  F: '#F2A49B',
}
const gradeFill: Record<string, string> = {
  SS: '#F5B37A',
  S: '#F7DC7A',
  A: '#8ED9C1',
  B: '#9CC9EA',
  C: '#D8D2C4',
}
const SCORE_MAX = 450

// Badge for a recipe: its compatibility letter once tried, otherwise NEW.
function recipeBadge(s: GameState, base: BaseId, additive: AdditiveId | null) {
  if (!s.triedPairs.includes(`${base}:${additive ?? 'none'}`))
    return { label: text({ en: 'NEW', th: 'ใหม่' }), color: '#E36BB0' }
  const compat = pairCompat(base, additive)
  return { label: compat, color: compatColors[compat] }
}

function Option({
  label,
  sub,
  selected,
  badge,
  onPress,
}: {
  label: string
  sub?: string
  selected: boolean
  badge: { label: string; color: string }
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        width: '48%',
        minHeight: 64,
        borderWidth: selected ? 3 : 2,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: selected ? 5 : 6,
        backgroundColor: selected ? '#FFE7A3' : '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.text, selected && { fontFamily: 'Kanit_600SemiBold' }]}
          numberOfLines={2}
        >
          {selected ? '✓ ' : ''}
          {label}
        </Text>
        {sub && <Muted>{sub}</Muted>}
      </View>
      <View
        style={{
          backgroundColor: badge.color,
          borderWidth: 2,
          borderRadius: 4,
          paddingHorizontal: 5,
        }}
      >
        <Text
          style={{
            fontFamily:
              badge.label === text({ en: 'NEW', th: 'ใหม่' })
                ? 'Kanit_600SemiBold'
                : 'PixelifySans_700Bold',
            fontSize: 13,
            color: '#14110F',
          }}
        >
          {badge.label}
        </Text>
      </View>
    </Pressable>
  )
}

/** Blend: pick a station, see grade and price, pick base and additive. Tanks fold into one bar. */
export function BlendPanel({ station: initial }: { station?: string }) {
  const { state: s, dispatch } = useGame()
  const stations = blendStations(s)
  const [picked, setPicked] = useState(initial)
  const [showLots, setShowLots] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const station = stations.find(b => b.uid === picked) ?? stations[0]
  const r = station ? recipeOf(s, station) : s.blend
  const pick = (base: BaseId, additive: AdditiveId | null) =>
    dispatch(s => selectBlend(s, base, additive, station?.uid))
  const score = predictedScore(s, r.base, r.additive)
  const grade = gradeFor(score, s.rank)
  const stats = lotStats(s)
  const baseName = (id: string) => text(bases.find(b => b.id === id)!.name)
  const perTruck = Math.round(salePrice(s, { base: r.base, grade }) * SALES.units)
  const capacity = tankCapacity(s)
  const used = tankUnits(s)
  const gi = GRADES.findIndex(g => g.id === grade)
  const better = gi > 0 ? GRADES[gi - 1] : undefined
  const toNext = better ? Math.max(0, gradeMin(s.rank, better.min) - Math.round(score)) : 0
  const unknown = researchCandidates(s, r.base).length
  const market = featureOn(s, 'market')
  return (
    <>
      {stations.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {stations.map((b, i) => {
            const on = b.uid === station?.uid
            const sr = recipeOf(s, b)
            return (
              <Pressable
                key={b.uid}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setPicked(b.uid)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderWidth: 2,
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  minHeight: 40,
                  backgroundColor: on ? ui.ink : '#FFFFFF',
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: productAccent[sr.base] ?? '#D8D2C4',
                  }}
                />
                <Text style={[type.body, { fontSize: 14 }, on && { color: ui.paper }]}>
                  {i + 1} · {baseName(sr.base)}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showStats }}
        onPress={() => setShowStats(v => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 10,
          borderWidth: 2,
          borderColor: ui.ink,
          borderRadius: 8,
          backgroundColor: '#FFFFFF',
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderWidth: 2,
            borderRadius: 8,
            backgroundColor: gradeFill[grade],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={[type.numBig, { fontSize: 30 }]}>{grade}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.numBig}>
            ${perTruck.toLocaleString()}
            <Text style={type.small}> {text({ en: 'per truck', th: 'ต่อคันรถ' })}</Text>
          </Text>
          <Text style={type.small}>
            {better
              ? text({
                  en: `${toNext} more points to ${better.id}`,
                  th: `อีก ${toNext} คะแนนถึง ${better.id}`,
                })
              : text({ en: 'Top grade', th: 'เกรดสูงสุดแล้ว' })}
          </Text>
        </View>
      </Pressable>
      {showStats && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 4, columnGap: 12 }}>
          {(
            [
              [{ en: 'Purity', th: 'บริสุทธิ์' }, stats.purity, '#3D8FE0'],
              [{ en: 'Yield', th: 'ผลผลิต' }, stats.yield, '#F08A24'],
              [{ en: 'Stability', th: 'คงตัว' }, stats.stability, '#9C5BD6'],
              [{ en: 'Eco', th: 'รักษ์โลก' }, stats.eco, '#2FB38E'],
            ] as const
          ).map(([name, value, color]) => (
            <View
              key={name.en}
              style={{ width: '46%', flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={[type.small, { width: 64, color: ui.ink }]}>{text(name)}</Text>
              <Bar value={value / 120} color={color} height={8} />
            </View>
          ))}
          <Text style={type.small}>
            {text({
              en: `Score ${Math.round(score)} · SS needs ${gradeMin(s.rank, GRADES[0].min)} at rank ${s.rank}`,
              th: `คะแนน ${Math.round(score)} · SS ต้องได้ ${gradeMin(s.rank, GRADES[0].min)} ที่แรงก์ ${s.rank}`,
            })}
          </Text>
        </View>
      )}

      <Text style={type.small}>{text({ en: 'Base', th: 'ฐาน' })}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {bases
          .filter(b => baseAvailable(s, b.id))
          .map(b => {
            const on = r.base === b.id
            const d = demandOf(s, b.id)
            const sub = trending(s, b.id)
              ? { text: text({ en: 'trend ×1.5', th: 'กระแส ×1.5' }), color: '#8A5A00' }
              : market && d < 0.95
                ? {
                    text: text({
                      en: `demand ${Math.round(d * 100)}%`,
                      th: `ตลาด ${Math.round(d * 100)}%`,
                    }),
                    color: d < 0.75 ? '#B42318' : ui.muted,
                  }
                : { text: `${Math.floor(s.baseStock[b.id]).toLocaleString()}`, color: ui.muted }
            return (
              <Pressable
                key={b.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => pick(b.id, recipeKnown(s, b.id, r.additive) ? r.additive : null)}
                style={{
                  minWidth: 96,
                  height: 54,
                  paddingHorizontal: 10,
                  borderWidth: on ? 3 : 2,
                  borderRadius: 8,
                  backgroundColor: on ? '#FFE7A3' : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[type.body, on && { fontFamily: 'Kanit_600SemiBold' }]}>
                  {text(b.name)}
                </Text>
                <Text style={[type.small, { fontSize: 11, color: sub.color }]}>{sub.text}</Text>
              </Pressable>
            )
          })}
      </ScrollView>

      <Text style={type.small}>{text({ en: 'Additive', th: 'สารเติมแต่ง' })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Option
          label={text({ en: 'None', th: 'ไม่ใส่' })}
          selected={r.additive === null}
          badge={recipeBadge(s, r.base, null)}
          onPress={() => pick(r.base, null)}
        />
        {additives
          .filter(a => s.unlockedAdditives.includes(a.id) && recipeKnown(s, r.base, a.id))
          .map(a => (
            <Option
              key={a.id}
              label={text(a.name)}
              selected={r.additive === a.id}
              badge={recipeBadge(s, r.base, a.id)}
              onPress={() => pick(r.base, a.id)}
            />
          ))}
        {unknown > 0 && (
          <View
            style={{
              width: '48%',
              minHeight: 44,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: ui.navy,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            <Text style={[type.small, { color: ui.navy, textAlign: 'center' }]}>
              {text({
                en: `+${unknown} more at a Lab`,
                th: `+ วิจัยอีก ${unknown} สูตรที่ห้องทดลอง`,
              })}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: showLots }}
        onPress={() => setShowLots(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
      >
        <Text style={type.small}>{text({ en: 'Tanks', th: 'ถัง' })}</Text>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            height: 14,
            borderWidth: 2,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            borderColor: used >= capacity * SALES.clearanceFill ? '#B42318' : ui.ink,
          }}
        >
          {s.tanks.map(l => (
            <View
              key={l.uid}
              style={{
                width: `${(l.units / Math.max(capacity, 1)) * 100}%`,
                backgroundColor: productAccent[l.base] ?? '#D8D2C4',
                borderRightWidth: 1,
              }}
            />
          ))}
        </View>
        <Text style={type.num}>
          {Math.round(used).toLocaleString()}/{Math.round(capacity).toLocaleString()}
        </Text>
        <Text style={type.body}>{showLots ? '▴' : '▾'}</Text>
      </Pressable>
      {showLots && (
        <>
          {used >= capacity * SALES.clearanceFill && (
            <Muted>
              {text({
                en: 'Nearly full: buyers take low-grade lots at half price. Build tanks or discard.',
                th: 'เกือบเต็ม: ล็อตเกรดต่ำจะถูกขายลดครึ่งราคา สร้างถังเพิ่มหรือระบายทิ้งได้',
              })}
            </Muted>
          )}
          {s.tanks.map(l => (
            <Row key={l.uid}>
              <Text style={[type.body, { flex: 1 }]}>
                {baseName(l.base)} · {l.units}
              </Text>
              <GradeChip grade={l.grade} />
              <SmallButton
                label={text({ en: 'Discard', th: 'ระบาย' })}
                color="#FFF6E3"
                onPress={() => dispatch(s => discardLot(s, l.uid))}
              />
            </Row>
          ))}
        </>
      )}
    </>
  )
}
