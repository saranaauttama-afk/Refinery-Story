import { Text, View, Pressable } from 'react-native'
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
} from '../sim/systems/blending'
import { salePrice } from '../sim/systems/customers'
import { GRADES, SALES } from '../data/balance'
import { productAccent } from '../render/palette'
import { styles } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted, GradeChip } from './cards'
import { text } from '../i18n'
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
    return { label: 'NEW', color: '#E36BB0' }
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
          numberOfLines={1}
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
        <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 13, color: '#14110F' }}>
          {badge.label}
        </Text>
      </View>
    </Pressable>
  )
}

export function BlendPanel() {
  const { state: s, dispatch } = useGame()
  const score = predictedScore(s)
  const grade = gradeFor(score)
  const stats = lotStats(s)
  const baseName = (id: string) => text(bases.find(b => b.id === id)!.name)
  const perTruck = Math.round(salePrice(s, { base: s.blend.base, grade }) * SALES.units)
  const multiplier = GRADES.find(g => g.id === grade)!.price
  const capacity = tankCapacity(s)
  const used = tankUnits(s)
  const thresholds = [...GRADES].reverse()
  return (
    <>
      <Card>
        <Row gap={12}>
          <View
            style={{
              width: 64,
              height: 64,
              borderWidth: 2,
              borderRadius: 10,
              backgroundColor: gradeFill[grade],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 36, color: '#14110F' }}>
              {grade}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heading}>
              {baseName(s.blend.base)} +{' '}
              {s.blend.additive
                ? text(additives.find(a => a.id === s.blend.additive)!.name)
                : text({ en: 'no additive', th: 'ไม่ใส่สาร' })}
            </Text>
            <Muted>
              {text({
                en: `Score ${Math.round(score)} · sells ×${multiplier} · ~$${perTruck.toLocaleString()} per truck`,
                th: `คะแนน ${Math.round(score)} · ขาย ×${multiplier} · ~$${perTruck.toLocaleString()} ต่อคันรถ`,
              })}
            </Muted>
            <View
              style={{
                flexDirection: 'row',
                height: 12,
                borderWidth: 2,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              {thresholds.map((g, i) => {
                const next = thresholds[i + 1]?.min ?? SCORE_MAX
                return (
                  <View
                    key={g.id}
                    style={{ flex: next - g.min, backgroundColor: gradeFill[g.id] }}
                  />
                )
              })}
              <View
                style={{
                  position: 'absolute',
                  left: `${Math.min(98, (score / SCORE_MAX) * 100)}%`,
                  top: -2,
                  width: 3,
                  height: 14,
                  backgroundColor: '#14110F',
                }}
              />
            </View>
            <View style={{ flexDirection: 'row' }}>
              {thresholds.map((g, i) => (
                <Text
                  key={g.id}
                  style={{
                    flex: (thresholds[i + 1]?.min ?? SCORE_MAX) - g.min,
                    fontFamily: 'PixelifySans_700Bold',
                    fontSize: 11,
                    color: '#5E6470',
                  }}
                >
                  {g.id}
                </Text>
              ))}
            </View>
          </View>
        </Row>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, columnGap: 12 }}>
          {(
            [
              ['Purity', stats.purity, '#3D8FE0'],
              ['Yield', stats.yield, '#F08A24'],
              ['Stability', stats.stability, '#9C5BD6'],
              ['Eco', stats.eco, '#2FB38E'],
            ] as const
          ).map(([name, value, color]) => (
            <View
              key={name}
              style={{ width: '46%', flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <Text style={[styles.text, { width: 64, fontSize: 13 }]}>{name}</Text>
              <Bar value={value / 120} color={color} height={8} />
            </View>
          ))}
        </View>
      </Card>
      <Section>{text({ en: 'Base', th: 'ฐาน' })}</Section>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {bases
          .filter(b => baseAvailable(s, b.id))
          .map(b => (
            <Option
              key={b.id}
              label={text(b.name)}
              sub={text({
                en: `ready ${Math.floor(s.baseStock[b.id])}`,
                th: `พร้อม ${Math.floor(s.baseStock[b.id])}`,
              })}
              selected={s.blend.base === b.id}
              badge={recipeBadge(s, b.id, s.blend.additive)}
              onPress={() => dispatch(s => selectBlend(s, b.id, s.blend.additive))}
            />
          ))}
      </View>
      <Section>
        {text({ en: 'Additive', th: 'สารเติมแต่ง' })}{' '}
        <Text style={[styles.text, { fontSize: 13, color: '#5E6470' }]}>
          {text({
            en: `(letter = how well it suits ${baseName(s.blend.base)}, NEW = first try +10★)`,
            th: `(ตัวอักษร = เข้ากับ${baseName(s.blend.base)}แค่ไหน, NEW = ลองครั้งแรก +10★)`,
          })}
        </Text>
      </Section>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Option
          label={text({ en: 'None', th: 'ไม่ใส่' })}
          selected={s.blend.additive === null}
          badge={recipeBadge(s, s.blend.base, null)}
          onPress={() => dispatch(s => selectBlend(s, s.blend.base, null))}
        />
        {additives
          .filter(a => s.unlockedAdditives.includes(a.id))
          .map(a => (
            <Option
              key={a.id}
              label={text(a.name)}
              selected={s.blend.additive === a.id}
              badge={recipeBadge(s, s.blend.base, a.id)}
              onPress={() => dispatch(s => selectBlend(s, s.blend.base, a.id))}
            />
          ))}
      </View>
      {!s.unlockedAdditives.length && (
        <Muted>
          {text({
            en: 'Unlock additives by training staff or from regular customers’ gifts.',
            th: 'ปลดสารเติมแต่งได้จากการฝึกพนักงาน หรือของขวัญจากลูกค้าประจำ',
          })}
        </Muted>
      )}
      <Section>{text({ en: 'Product tanks', th: 'ถังผลิตภัณฑ์' })}</Section>
      <Card tone={used >= capacity * SALES.clearanceFill ? 'warn' : undefined}>
        <Row>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              height: 14,
              borderWidth: 2,
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
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
          <Text style={styles.text}>
            {Math.round(used).toLocaleString()}/{Math.round(capacity).toLocaleString()}
          </Text>
        </Row>
        {used >= capacity * SALES.clearanceFill && (
          <Muted>
            {text({
              en: 'Nearly full: buyers take low-grade lots at half price. Build more tanks or discard.',
              th: 'เกือบเต็ม: ล็อตเกรดต่ำจะถูกขายลดครึ่งราคา สร้างถังเพิ่มหรือระบายทิ้งได้',
            })}
          </Muted>
        )}
        {s.tanks.map(l => (
          <Row key={l.uid}>
            <Text style={[styles.text, { flex: 1 }]}>
              {baseName(l.base)} · {l.units} {text({ en: 'units', th: 'หน่วย' })}
            </Text>
            <GradeChip grade={l.grade} />
            <SmallButton
              label={text({ en: 'Discard', th: 'ระบาย' })}
              color="#FFF6E3"
              onPress={() => dispatch(s => discardLot(s, l.uid))}
            />
          </Row>
        ))}
      </Card>
    </>
  )
}
