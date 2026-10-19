import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useGame } from '../store/useGame'
import { buildings, buildingDef, type BuildingDef } from '../data/buildings'
import { infoFor } from '../data/buildingInfo'
import { comboLeads } from '../sim/systems/combos'
import { text } from '../i18n'
import { styles as base } from './controls'
import type { GameState } from '../sim/types'

const categories: { id: BuildingDef['category'] | 'all'; en: string; th: string }[] = [
  { id: 'all', en: 'All', th: 'ทั้งหมด' },
  { id: 'process', en: 'Process', th: 'ผลิต' },
  { id: 'storage', en: 'Storage', th: 'ถัง' },
  { id: 'logistics', en: 'Logistics', th: 'ขนส่ง' },
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

export function BuildPanel({ onPick }: { onPick: (id: string) => void }) {
  const { state: s } = useGame()
  const [category, setCategory] = useState<(typeof categories)[number]['id']>('all')
  const [selected, setSelected] = useState<string>()
  const shown = buildings.filter(
    d =>
      listed(s, d) &&
      (category === 'all' ||
        d.category === category ||
        (category === 'process' && d.category === 'blend')),
  )
  const picked = selected ? buildingDef(selected) : undefined
  const leads = picked ? comboLeads(s, picked.id) : []
  return (
    <>
      <View style={styles.chips}>
        {categories.map(c => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            onPress={() => setCategory(c.id)}
            style={[styles.chip, category === c.id && styles.chipOn]}
          >
            <Text style={[base.text, category === c.id && { color: '#FFF6E3' }]}>{text(c)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.grid}>
        {shown.map(d => {
          const open = available(s, d)
          const owned = s.yard.buildings.filter(b => b.defId === d.id).length
          return (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityLabel={text(d.name)}
              onPress={() => setSelected(d.id)}
              style={[styles.card, !open && styles.cardLocked, selected === d.id && styles.cardOn]}
            >
              <View style={[styles.swatch, { backgroundColor: open ? d.accent : '#C9C1AE' }]}>
                {!open && <Text style={styles.lockMark}>?</Text>}
              </View>
              <Text style={styles.cardName} numberOfLines={1}>
                {text(d.name)}
              </Text>
              <Text style={styles.cardMeta}>
                {open
                  ? `${d.w}×${d.h} · ${price(s, d)}`
                  : text({ en: `Rank ${d.rank}`, th: `แรงก์ ${d.rank}` })}
              </Text>
              {owned > 0 && <Text style={styles.owned}>×{owned}</Text>}
            </Pressable>
          )
        })}
      </View>
      {picked && (
        <View style={styles.detail}>
          <Text style={base.heading}>{text(picked.name)}</Text>
          <Text style={base.text}>{text(infoFor(picked.id))}</Text>
          {leads.map(l => (
            <Text key={l.combo.id} style={[base.text, { color: '#1E6E57' }]}>
              {text({
                en: `Place near ${l.partners.map(memberName).join(' + ')} → ${l.known ? l.combo.name.en : 'a combo'}`,
                th: `วางใกล้ ${l.partners.map(memberName).join(' + ')} → ${l.known ? l.combo.name.th : 'เกิดคอมโบ'}`,
              })}
              {l.ready ? '' : text({ en: ' (one more needed)', th: ' (ยังขาดอีกตึก)' })}
            </Text>
          ))}
          {available(s, picked) ? (
            <Pressable
              accessibilityRole="button"
              disabled={!s.carriedBuildings[picked.id] && s.money < picked.cost}
              onPress={() => onPick(picked.id)}
              style={[
                styles.place,
                !s.carriedBuildings[picked.id] && s.money < picked.cost && { opacity: 0.4 },
              ]}
            >
              <Text style={base.heading}>
                {text({ en: 'Place', th: 'วางในลาน' })} · {price(s, picked)}
              </Text>
            </Pressable>
          ) : (
            <Text style={base.text}>
              {text({ en: `Unlocks at rank ${picked.rank}`, th: `ปลดล็อกที่แรงก์ ${picked.rank}` })}
            </Text>
          )}
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 2 },
  chipOn: { backgroundColor: '#14110F' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    gap: 2,
  },
  cardOn: { borderWidth: 3, borderColor: '#F08A24' },
  cardLocked: { backgroundColor: '#E9E2D2', borderStyle: 'dashed', borderColor: '#5E6470' },
  swatch: {
    width: 48,
    height: 40,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockMark: { fontFamily: 'PixelifySans_700Bold', fontSize: 20, color: '#5E6470' },
  cardName: { fontFamily: 'Kanit_600SemiBold', fontSize: 14, color: '#14110F' },
  cardMeta: { fontFamily: 'Kanit_400Regular', fontSize: 12, color: '#3B3F47' },
  owned: {
    position: 'absolute',
    top: 2,
    right: 4,
    fontFamily: 'PixelifySans_700Bold',
    fontSize: 12,
    color: '#3B3F47',
  },
  detail: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 8,
    gap: 4,
  },
  place: {
    marginTop: 6,
    backgroundColor: '#F2C230',
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
})
