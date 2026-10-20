import { PanelIntro } from './PanelIntro'
import { Text } from 'react-native'
import { useState } from 'react'
import { useGame } from '../store/useGame'
import { combos, type ComboDef } from '../data/combos'
import { buildingDef } from '../data/buildings'
import { buyHint } from '../sim/actions'
import { COMBO } from '../data/balance'
import { styles } from './controls'
import { Card, Row, Chip, SmallButton, Muted } from './cards'
import { text } from '../i18n'
import { View, Pressable } from 'react-native'

const effectLabels: Record<string, { en: string; th: string; pct?: boolean }> = {
  purity: { en: 'Purity', th: 'Purity' },
  yield: { en: 'Yield', th: 'Yield' },
  stability: { en: 'Stability', th: 'Stability' },
  eco: { en: 'Eco', th: 'Eco' },
  score: { en: 'Grade score', th: 'คะแนนเกรด' },
  gasolineScore: { en: 'Gasoline score', th: 'คะแนนเบนซิน' },
  yieldPct: { en: 'Yield', th: 'Yield', pct: true },
  quality: { en: 'Quality', th: 'คุณภาพ', pct: true },
  capacity: { en: 'Tank capacity', th: 'ความจุถัง', pct: true },
  production: { en: 'Output', th: 'กำลังผลิต', pct: true },
  price: { en: 'Price', th: 'ราคาขาย', pct: true },
  regen: { en: 'Staff rest', th: 'ฟื้นพลังพนักงาน', pct: true },
  incident: { en: 'Incidents', th: 'อุบัติเหตุ', pct: true },
  dwell: { en: 'Truck wait', th: 'เวลารถรอ', pct: true },
  monthlyFame: { en: 'Fame/month', th: 'ชื่อเสียง/เดือน' },
  yearlyFame: { en: 'Fame/year', th: 'ชื่อเสียง/ปี' },
}

export const effectText = (c: ComboDef) =>
  Object.entries(c.effect)
    .map(([k, v]) => {
      const l = effectLabels[k] ?? { en: k, th: k }
      const value = l.pct ? `${Math.round(v! * 100)}%` : `${Math.round(v!)}`
      return `${text(l)} ${v! > 0 ? '+' : ''}${value}`
    })
    .join(' · ')

const memberName = (id: string) =>
  id === 'process'
    ? text({ en: 'any process unit', th: 'หน่วยผลิตใดก็ได้' })
    : text(buildingDef(id).name)

export function RecipeBook() {
  const { state: s, dispatch } = useGame()
  const [tab, setTab] = useState<'found' | 'unknown'>('found')
  const known = (c: ComboDef) => s.discoveredCombos.includes(c.id) || s.comboHints.includes(c.id)
  const found = combos.filter(known)
  const unknown = combos.filter(c => !known(c))
  return (
    <>
      <PanelIntro
        label={{ en: 'Layout discoveries', th: 'บันทึกการจัดวาง' }}
        detail={{
          en: 'Discover building combinations around your refinery.',
          th: 'ค้นพบคอมโบจากการจัดอาคารในโรงกลั่น',
        }}
        color="#F2C230"
      />
      <View
        style={{
          flexDirection: 'row',
          borderWidth: 2,
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        {(['found', 'unknown'] as const).map(t => (
          <Pressable
            key={t}
            accessibilityRole="button"
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              padding: 6,
              minHeight: 40,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: tab === t ? '#14110F' : '#FFF6E3',
            }}
          >
            <Text style={[styles.text, tab === t && { color: '#FFF6E3' }]}>
              {t === 'found'
                ? text({ en: `Known ${found.length}`, th: `รู้แล้ว ${found.length}` })
                : text({ en: `Unknown ${unknown.length}`, th: `ยังไม่รู้ ${unknown.length}` })}
            </Text>
          </Pressable>
        ))}
      </View>
      {tab === 'found' && !found.length && (
        <Muted>
          {text({
            en: 'Place buildings near each other to discover combos. The Build sheet shows which pairs to try.',
            th: 'วางตึกใกล้กันเพื่อค้นพบคอมโบ หน้าสร้างจะบอกว่าตึกไหนควรวางใกล้อะไร',
          })}
        </Muted>
      )}
      {tab === 'found' &&
        found.map(c => {
          const active = s.activeCombos.some(a => a.id === c.id)
          const negative = Object.entries(c.effect).some(
            ([k, v]) => v! < 0 && !['incident', 'dwell'].includes(k),
          )
          return (
            <Card key={c.id} tone={negative ? 'warn' : undefined}>
              <Row>
                <Text style={[styles.heading, { flex: 1 }]}>{text(c.name)}</Text>
                <Chip
                  label={
                    c.kind === 'pair'
                      ? text({ en: 'Pair · within 2 tiles', th: 'คู่ · ห่างไม่เกิน 2 ช่อง' })
                      : text({ en: 'Set · 3 in a row', th: 'ชุด · 3 ตึกเรียงติดกัน' })
                  }
                  color={c.kind === 'pair' ? '#E7F1FB' : '#FFE7A3'}
                />
              </Row>
              <Muted>{c.members.map(memberName).join(' + ')}</Muted>
              <Row>
                <Text style={[styles.text, { flex: 1, color: negative ? '#B42318' : '#1E6E57' }]}>
                  {effectText(c)}
                </Text>
                {active && <Chip label={text({ en: 'Active', th: 'ใช้อยู่' })} color="#8ED9C1" />}
              </Row>
            </Card>
          )
        })}
      {tab === 'unknown' &&
        unknown.map(c => (
          <Card key={c.id} dashed>
            <Row>
              <View style={{ flex: 1 }}>
                <Text style={styles.heading}>
                  ???{' '}
                  {c.kind === 'pair'
                    ? text({ en: '(pair)', th: '(คู่)' })
                    : text({ en: '(set)', th: '(ชุด)' })}
                </Text>
                <Muted>
                  {c.hidden
                    ? text({ en: 'Secret · find it by placing', th: 'ลับ · ต้องวางเจอเอง' })
                    : text({
                        en: `Hint: ${memberName(c.members[0])} + ???`,
                        th: `คำใบ้: ${memberName(c.members[0])} + ???`,
                      })}
                </Muted>
              </View>
              {!c.hidden && (
                <SmallButton
                  label={text({
                    en: `Reveal $${COMBO.hintCost}`,
                    th: `เปิดสูตร $${COMBO.hintCost}`,
                  })}
                  color="#FFF6E3"
                  disabled={s.money < COMBO.hintCost}
                  onPress={() => dispatch(s => buyHint(s, c.id))}
                />
              )}
            </Row>
          </Card>
        ))}
    </>
  )
}
