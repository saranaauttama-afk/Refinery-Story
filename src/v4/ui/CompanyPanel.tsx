import { PanelIntro } from './PanelIntro'
import { Text, View } from 'react-native'
import { awardList, marketNames, unlockName } from '../i18nLabels'
import { useGame } from '../store/useGame'
import { investments } from '../data/investments'
import { ranks } from '../data/ranks'
import { invest, newGamePlus } from '../sim/actions'
import { styles } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted, Chip } from './cards'
import { text } from '../i18n'

const short = (n: number) =>
  Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1000).toLocaleString()}K`

export function CompanyPanel({ onLand, onCombos }: { onLand: () => void; onCombos: () => void }) {
  const { state: s, dispatch, saveError, retrySave } = useGame()
  const current = ranks[s.rank - 1]
  const next = ranks[s.rank]
  const marketColor =
    s.market.phase === 'boom' ? '#8ED9C1' : s.market.phase === 'bust' ? '#F2A49B' : '#FFF6E3'
  return (
    <>
      <PanelIntro
        label={{ en: 'Company office', th: 'สำนักงานบริษัท' }}
        detail={{
          en: 'Plan investments and the next refinery expansion.',
          th: 'วางแผนลงทุนและขยายโรงกลั่นขั้นต่อไป',
        }}
        color="#B184E3"
      />
      {saveError && (
        <Card tone="warn">
          <Text style={styles.text}>{text(saveError)}</Text>
          <SmallButton
            label={text({ en: 'Retry save', th: 'ลองบันทึกอีกครั้ง' })}
            onPress={retrySave}
          />
        </Card>
      )}
      <Card>
        <Row gap={12}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 6,
              borderWidth: 2,
              backgroundColor: '#F2C230',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 24, color: '#14110F' }}>
              {s.rank}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.heading}>
              {next
                ? text({
                    en: `Rank ${s.rank} → ${s.rank + 1}`,
                    th: `แรงก์ ${s.rank} → ${s.rank + 1}`,
                  })
                : text({ en: `Rank ${s.rank} (max)`, th: `แรงก์ ${s.rank} (สูงสุด)` })}
            </Text>
            {next && (
              <Row>
                <Bar value={(s.fame - current.fame) / (next.fame - current.fame)} color="#F2C230" />
              </Row>
            )}
            {next && (
              <Muted>
                ★ {Math.round(s.fame).toLocaleString()} / {next.fame.toLocaleString()} ·{' '}
                {text({ en: 'next: ', th: 'ปลดถัดไป: ' })}
                {next.unlocks.map(u => text(unlockName(u))).join(', ')}
              </Muted>
            )}
          </View>
        </Row>
      </Card>
      <Row gap={8}>
        {(
          [
            [{ en: 'Income this year', th: 'รายได้ปีนี้' }, short(s.year.income)],
            [{ en: 'Expenses', th: 'รายจ่าย' }, short(s.year.expenses)],
          ] as const
        ).map(([label, value]) => (
          <View key={label.en} style={{ flex: 1 }}>
            <Card>
              <Muted>{text(label)}</Muted>
              <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 17, color: '#14110F' }}>
                {value}
              </Text>
            </Card>
          </View>
        ))}
        <View style={{ flex: 1 }}>
          <Card>
            <Muted>{text({ en: 'Market', th: 'ตลาด' })}</Muted>
            <Chip label={text(marketNames[s.market.phase])} color={marketColor} />
          </Card>
        </View>
      </Row>
      {s.loan > 0 && (
        <Card>
          <Text style={styles.text}>
            {text({
              en: `Bank loan left $${Math.ceil(s.loan).toLocaleString()} (repaid from sales)`,
              th: `หนี้ธนาคารคงเหลือ $${Math.ceil(s.loan).toLocaleString()} (หักจากยอดขายอัตโนมัติ)`,
            })}
          </Text>
        </Card>
      )}
      <Section>{text({ en: 'Invest around the refinery', th: 'ลงทุนรอบโรงกลั่น' })}</Section>
      {investments.map(d => {
        const level = s.investments[d.id] ?? 0
        const step = d.steps[level]
        const locked = s.rank < d.rank
        return (
          <Card key={d.id} dashed={locked}>
            <Row>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.heading}>{text(d.name)}</Text>
                <Row gap={4}>
                  {d.steps.map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 22,
                        height: 10,
                        borderWidth: 2,
                        borderRadius: 3,
                        backgroundColor: i < level ? '#2FB38E' : '#E9E2D2',
                      }}
                    />
                  ))}
                </Row>
                <Muted>
                  {locked
                    ? text({ en: `Unlocks at rank ${d.rank}`, th: `ปลดที่แรงก์ ${d.rank}` })
                    : step
                      ? text({ en: `Next: ${step.name.en}`, th: `ถัดไป: ${step.name.th}` })
                      : text({ en: 'Complete', th: 'ครบแล้ว' })}
                </Muted>
              </View>
              {!locked && step && (
                <SmallButton
                  label={short(step.cost)}
                  disabled={s.money < step.cost}
                  onPress={() => dispatch(s => invest(s, d.id))}
                />
              )}
            </Row>
          </Card>
        )
      })}
      <Row gap={8}>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={text({ en: 'Buy land', th: 'ซื้อที่ดิน' })}
            color="#FFF6E3"
            onPress={onLand}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={text({ en: 'Recipe book', th: 'ตำราคอมโบ' })}
            color="#FFF6E3"
            onPress={onCombos}
          />
        </View>
      </Row>
      {s.evaluation !== null && (
        <Card>
          <Text style={styles.heading}>
            {text({ en: 'Final evaluation', th: 'ผลประเมิน 15 ปี' })}: {s.evaluation}
          </Text>
          <SmallButton
            label={text({ en: 'New Game+', th: 'เริ่มเกมใหม่+' })}
            onPress={() => dispatch(newGamePlus)}
          />
        </Card>
      )}
      {s.history.awards.length > 0 && (
        <Section>{text({ en: 'Awards', th: 'รางวัลประจำปี' })}</Section>
      )}
      {s.history.awards.map(a => (
        <Muted key={a.year}>
          {text({ en: `Year ${a.year}`, th: `ปี ${a.year}` })}:{' '}
          {awardList(a.wins) || text({ en: 'no award', th: 'ไม่ได้รางวัล' })} · +{a.fame}★
        </Muted>
      ))}
      <Section>{text({ en: 'Recent events', th: 'เหตุการณ์ล่าสุด' })}</Section>
      {s.log
        .slice(-8)
        .reverse()
        .map((l, i) => (
          <Muted key={i}>• {text(l)}</Muted>
        ))}
      <Section>{text({ en: 'Settings', th: 'ตั้งค่า' })}</Section>
      <Row gap={8}>
        <SmallButton
          label={text(
            s.settings.sound
              ? { en: 'Sound on', th: 'เสียง: เปิด' }
              : { en: 'Sound off', th: 'เสียง: ปิด' },
          )}
          color="#FFF6E3"
          onPress={() =>
            dispatch(s => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }))
          }
        />
        <SmallButton
          label={text(
            s.settings.haptics
              ? { en: 'Haptics on', th: 'สั่น: เปิด' }
              : { en: 'Haptics off', th: 'สั่น: ปิด' },
          )}
          color="#FFF6E3"
          onPress={() =>
            dispatch(s => ({ ...s, settings: { ...s.settings, haptics: !s.settings.haptics } }))
          }
        />
      </Row>
    </>
  )
}
