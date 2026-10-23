import { BuildingSprite } from '../render/BuildingSprite'
import { LockKeyhole } from 'lucide-react-native'
import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { type, ui } from './theme'
import { useGame } from '../store/useGame'
import { buildings, buildingDef, type BuildingDef } from '../data/buildings'
import { infoFor } from '../data/buildingInfo'
import { comboLeads } from '../sim/systems/combos'
import { text } from '../i18n'
import type { GameState } from '../sim/types'

const categories: { id: BuildingDef['category']; en: string; th: string }[] = [
  { id: 'process', en: 'Process', th: 'ผลิต' },
  { id: 'storage', en: 'Storage', th: 'ถัง' },
  { id: 'logistics', en: 'Logistics', th: 'ถนน / ขนส่ง' },
  { id: 'support', en: 'Support', th: 'สนับสนุน' },
  { id: 'deco', en: 'Decor', th: 'ตกแต่ง' },
]

const available = (s: GameState, d: BuildingDef) =>
  d.rank <= s.rank ||
  s.blueprints.includes(d.id) ||
  s.decos.includes(d.id) ||
  !!s.carriedBuildings[d.id]

// Hide one-off award decor until earned, and buildings far beyond the current rank.
const listed = (s: GameState, d: BuildingDef) =>
  available(s, d) || (d.rank <= s.rank + 2 && d.rank < 50)

const price = (s: GameState, d: BuildingDef) =>
  s.carriedBuildings[d.id] ? text({ en: 'Free', th: 'ฟรี' }) : `$${d.cost.toLocaleString()}`

const memberName = (id: string) =>
  id === 'process'
    ? text({ en: 'any process unit', th: 'หน่วยผลิตใดก็ได้' })
    : text(buildingDef(id).name)

/** A short tray: category chips, then one row of cards that scrolls sideways. Tap = place. */
export function BuildPanel({ onPick }: { onPick: (id: string) => void }) {
  const { state: s } = useGame()
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('process')
  const [info, setInfo] = useState<string>()
  const shown = buildings
    .filter(
      d =>
        listed(s, d) &&
        (d.category === category || (category === 'process' && d.category === 'blend')),
    )
    // Open ones first, then locked ones by rank.
    .sort((a, b) => Number(available(s, b)) - Number(available(s, a)) || a.rank - b.rank)
  const picked = info ? buildingDef(info) : undefined
  const leads = picked ? comboLeads(s, picked.id) : []
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {categories.map(c => (
          <Pressable
            key={c.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: category === c.id }}
            onPress={() => {
              setCategory(c.id)
              setInfo(undefined)
            }}
            style={[styles.chip, category === c.id && styles.chipOn]}
          >
            <Text style={[type.body, { fontSize: 14 }, category === c.id && { color: ui.paper }]}>
              {text(c)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {picked ? (
        <View style={styles.detail}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BuildingSprite id={picked.id} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={type.title}>{text(picked.name)}</Text>
              <Text style={type.small}>
                {picked.w}×{picked.h} · {price(s, picked)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setInfo(undefined)}
              style={{
                minHeight: 44,
                minWidth: 44,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={type.body}>{text({ en: 'Back', th: 'กลับ' })}</Text>
            </Pressable>
          </View>
          <Text style={[type.body, { fontSize: 14 }]} numberOfLines={3}>
            {text(infoFor(picked.id))}
          </Text>
          {leads.slice(0, 2).map(l => (
            <Text key={l.combo.id} style={[type.small, { color: '#1E6E57' }]} numberOfLines={1}>
              {text({
                en: `Near ${l.partners.map(memberName).join(' + ')} → ${l.known ? l.combo.name.en : 'a combo'}`,
                th: `ใกล้ ${l.partners.map(memberName).join(' + ')} → ${l.known ? l.combo.name.th : 'เกิดคอมโบ'}`,
              })}
            </Text>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingRight: 24 }}
        >
          {shown.map(d => {
            const open = available(s, d)
            const afford = !!s.carriedBuildings[d.id] || s.money >= d.cost
            const owned = s.yard.buildings.filter(b => b.defId === d.id).length
            return (
              <Pressable
                key={d.id}
                accessibilityRole="button"
                accessibilityLabel={text(d.name)}
                accessibilityHint={text({
                  en: 'Tap to place, hold for details',
                  th: 'แตะเพื่อวาง กดค้างดูรายละเอียด',
                })}
                onPress={() => (open && afford ? onPick(d.id) : setInfo(d.id))}
                onLongPress={() => setInfo(d.id)}
                style={({ pressed }) => [
                  styles.card,
                  !open && styles.cardLocked,
                  open && !afford && { opacity: 0.55 },
                  pressed && { backgroundColor: '#FFE7A3' },
                ]}
              >
                <View style={[styles.swatch, !open && { opacity: 0.4 }]}>
                  <BuildingSprite id={d.id} size={88} />
                </View>
                <Text style={styles.cardName} numberOfLines={1}>
                  {text(d.name)}
                </Text>
                <Text style={type.small}>
                  {open
                    ? `${price(s, d)} · ${d.w}×${d.h}`
                    : text({ en: `Rank ${d.rank}`, th: `แรงก์ ${d.rank}` })}
                </Text>
                {!open && (
                  <LockKeyhole size={14} style={{ position: 'absolute', top: 8, left: 8 }} />
                )}
                {owned > 0 && <Text style={styles.owned}>×{owned}</Text>}
              </Pressable>
            )
          })}
        </ScrollView>
      )}
      {!picked && (
        <Text style={type.small}>
          {text({
            en: 'Tap to place · hold for details',
            th:
              category === 'logistics'
                ? 'ถนนเชื่อมทางตรง โค้ง และแยกอัตโนมัติ'
                : category === 'deco'
                  ? 'วางแต่งได้ต่อเนื่อง · ทุกชิ้นใช้พื้นที่ 1×1'
                  : 'แตะการ์ดเพื่อวางทันที · กดค้างดูรายละเอียด',
          })}
        </Text>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 2,
    borderRadius: 7,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  chipOn: { backgroundColor: ui.navy },
  card: {
    width: 136,
    height: 176,
    backgroundColor: '#FFFDF5',
    borderWidth: 2,
    borderRadius: 10,
    padding: 6,
    alignItems: 'center',
    gap: 2,
    borderColor: ui.ink,
    boxShadow: '0px 2px 0px #D5D0BF',
  },
  cardLocked: { backgroundColor: '#E9E2D2', borderStyle: 'dashed', borderColor: '#9E978A' },
  swatch: {
    height: 92,
    width: '100%',
    backgroundColor: '#E8EEEA',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontFamily: 'Kanit_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
    color: '#14110F',
  },
  owned: {
    position: 'absolute',
    top: 4,
    right: 6,
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 12,
    color: '#3B3F47',
  },
  detail: {
    minHeight: 156,
    padding: 10,
    backgroundColor: '#FFFDF5',
    borderWidth: 2,
    borderRadius: 10,
    gap: 4,
  },
})
