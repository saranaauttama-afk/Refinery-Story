import { customerPortrait } from './art'
import { useState } from 'react'
import { Text, View, Pressable, Image } from 'react-native'
import { type } from './theme'
import { useGame } from '../store/useGame'
import { customers } from '../data/customers'
import { bases } from '../data/bases'
import { customerUnlocked, roadPath, salePrice } from '../sim/systems/customers'
import { acceptContract, adSellBoost } from '../sim/actions'
import { adAvailable } from '../sim/systems/rewards'
import { AdButton } from './AdButton'
import { SALES, B } from '../data/balance'
import { styles, PanelTabs } from './controls'
import { Card, Section, Row, ProductChip, GradeChip, Bar, SmallButton, Muted } from './cards'
import { text } from '../i18n'
import { AdsSection } from './AdsSection'
import type { Contract, GameState } from '../sim/types'

const baseName = (id: string) => text(bases.find(b => b.id === id)!.name)
const weeksLeft = (s: GameState, c: Contract) =>
  Math.max(0, Math.ceil((c.deadline - s.tick) / B.ticksPerWeek))
const reward = (s: GameState, c: Contract) =>
  Math.round(salePrice(s, { base: c.base, grade: c.minGrade }) * c.units * SALES.reward)

export function CustomersPanel() {
  const { state: s, dispatch } = useGame()
  const [tab, setTab] = useState<'contracts' | 'market' | 'regulars'>('contracts')
  const regulars = customers
    .filter(c => customerUnlocked(s, c))
    .map(c => ({ c, rec: s.customers[c.id] ?? { hearts: 0, giftGiven: false } }))
    .sort(
      (a, b) => Number(a.rec.giftGiven) - Number(b.rec.giftGiven) || b.rec.hearts - a.rec.hearts,
    )
  return (
    <>
      {!roadPath(s).length && (
        <Card tone="warn">
          <Text style={styles.text}>
            {text({
              en: 'No road from the gate to the loading bay. Trucks cannot come in.',
              th: 'ยังไม่มีถนนจากประตูถึงลานจ่ายสินค้า รถลูกค้าเข้ามาไม่ได้',
            })}
          </Text>
        </Card>
      )}
      {s.rewards?.boostArmed ? (
        <Card>
          <Text style={styles.text}>
            {text({
              en: 'Bonus ready: the next truck pays double.',
              th: 'โบนัสพร้อมแล้ว: รถลูกค้าคันถัดไปจ่าย 2 เท่า',
            })}
          </Text>
        </Card>
      ) : (
        adAvailable(s, 'boost') && (
          <AdButton
            label={{
              en: 'Next truck pays ×2 (once a month)',
              th: 'รถคันถัดไปจ่าย ×2 (เดือนละครั้ง)',
            }}
            onReward={() => dispatch(g => adSellBoost(g))}
          />
        )
      )}
      <PanelTabs
        value={tab}
        onChange={setTab}
        color="#2FB38E"
        options={[
          {
            id: 'contracts',
            label: {
              en: `Contracts ${s.contracts.active.length}/${SALES.maxContracts}`,
              th: `สัญญา ${s.contracts.active.length}/${SALES.maxContracts}`,
            },
          },
          { id: 'market', label: { en: 'Market', th: 'ตลาด' } },
          { id: 'regulars', label: { en: 'Regulars', th: 'ลูกค้าประจำ' } },
        ]}
      />
      {tab === 'contracts' && (
        <>
          <Section>
            {text({ en: 'Active contracts', th: 'สัญญาที่รับไว้' })} ({s.contracts.active.length}/
            {SALES.maxContracts})
          </Section>
          {!s.contracts.active.length && (
            <Muted>
              {text({
                en: 'None yet. Accept an offer below.',
                th: 'ยังไม่มี รับจากข้อเสนอด้านล่างได้',
              })}
            </Muted>
          )}
          {s.contracts.active.map(c => (
            <Card key={c.uid}>
              <Row>
                <ProductChip base={c.base} label={baseName(c.base)} />
                <GradeChip grade={c.minGrade} suffix="+" />
                <Text
                  style={[
                    styles.text,
                    { marginLeft: 'auto', color: weeksLeft(s, c) <= 2 ? '#B42318' : '#14110F' },
                  ]}
                >
                  {text({
                    en: `${weeksLeft(s, c)} weeks left`,
                    th: `เหลือ ${weeksLeft(s, c)} สัปดาห์`,
                  })}
                </Text>
              </Row>
              <Row>
                <Bar value={c.delivered / c.units} />
                <Text style={styles.text}>
                  {c.delivered}/{c.units}
                </Text>
              </Row>
              <Muted>
                {text({
                  en: `Reward ~$${reward(s, c).toLocaleString()} +${SALES.contractFame}★ · lots that qualify are sent automatically every week`,
                  th: `รางวัล ~$${reward(s, c).toLocaleString()} +${SALES.contractFame}★ · ล็อตที่ผ่านเกณฑ์ส่งให้อัตโนมัติทุกสัปดาห์`,
                })}
              </Muted>
            </Card>
          ))}
          <Section>{text({ en: 'Offers this month', th: 'ข้อเสนอเดือนนี้' })}</Section>
          {s.contracts.offers.map(c => (
            <Card key={c.uid} dashed>
              <Row>
                <ProductChip base={c.base} label={baseName(c.base)} />
                <GradeChip grade={c.minGrade} suffix="+" />
                <Text style={styles.text}>
                  {text({ en: `${c.units} units`, th: `${c.units} หน่วย` })}
                </Text>
              </Row>
              <Row>
                <Muted>
                  {text({
                    en: `${SALES.deadlineWeeks} weeks · ~$${reward(s, c).toLocaleString()} +${SALES.contractFame}★`,
                    th: `${SALES.deadlineWeeks} สัปดาห์ · ~$${reward(s, c).toLocaleString()} +${SALES.contractFame}★`,
                  })}
                </Muted>
                <SmallButton
                  label={text({ en: 'Accept', th: 'รับ' })}
                  color="#2FB38E"
                  disabled={s.contracts.active.length >= SALES.maxContracts}
                  onPress={() => dispatch(s => acceptContract(s, c.uid))}
                />
              </Row>
            </Card>
          ))}
        </>
      )}
      {tab === 'market' && (
        <>
          <AdsSection />
        </>
      )}
      {tab === 'regulars' && (
        <>
          <Section>{text({ en: 'Regular customers', th: 'ลูกค้าประจำ' })}</Section>
          {regulars.map(({ c, rec }) => (
            <Card key={c.id}>
              <Row>
                {customerPortrait(c.id) && (
                  <Image
                    source={customerPortrait(c.id)}
                    style={{ width: 48, height: 48, borderWidth: 2, borderRadius: 6 }}
                  />
                )}
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={styles.text}>{text(c.name)}</Text>
                  <View style={{ alignSelf: 'flex-start' }}>
                    <ProductChip base={c.base} label={baseName(c.base)} />
                  </View>
                </View>
                <GradeChip grade={c.minGrade} suffix="+" />
              </Row>
              {rec.giftGiven ? (
                <Muted>
                  {text({
                    en: 'Gift received · loyal customer',
                    th: 'ให้ของขวัญแล้ว · ลูกค้าประจำ',
                  })}
                </Muted>
              ) : (
                <Row>
                  <Bar value={rec.hearts / SALES.giftHearts} color="#E2483D" />
                  <Text style={styles.text}>
                    ♥ {rec.hearts}/{SALES.giftHearts}
                  </Text>
                </Row>
              )}
            </Card>
          ))}
        </>
      )}
    </>
  )
}
