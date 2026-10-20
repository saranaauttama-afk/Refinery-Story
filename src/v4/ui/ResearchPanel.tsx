import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { bases } from '../data/bases'
import { B } from '../data/balance'
import { startResearch } from '../sim/actions'
import {
  labJob,
  researchBlock,
  researchCandidates,
  researchChance,
  researchCost,
  researchTicks,
  researchWeights,
} from '../sim/systems/research'
import { baseAvailable } from '../sim/systems/investments'
import { styles } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted } from './cards'
import { text } from '../i18n'
import type { BaseId } from '../data/bases'

const blockText = {
  busy: { en: 'Busy', th: 'กำลังวิจัย' },
  base: { en: 'Locked', th: 'ยังไม่ปลด' },
  none: { en: 'All found', th: 'เจอครบแล้ว' },
  rd: { en: 'Not enough RD', th: 'RD ไม่พอ' },
  money: { en: 'Not enough money', th: 'เงินไม่พอ' },
}

/** Lab research: pick a base, pay RD + money, wait a few weeks, maybe find a new pair. */
export function ResearchPanel({ labUid }: { labUid: string }) {
  const { state: s, dispatch } = useGame()
  const lab = s.yard.buildings.find(b => b.uid === labUid)
  if (!lab) return null
  const job = labJob(s, labUid)
  const name = (id: string) => text(bases.find(b => b.id === id)!.name)
  const odds = researchWeights(lab.level)
  const total = odds.reduce((a, b) => a + b, 0)
  return (
    <>
      <Section>{text({ en: 'Research', th: 'วิจัยสูตร' })}</Section>
      {job ? (
        <Card>
          <Text style={styles.heading}>
            {text({ en: `Researching ${name(job.base)}`, th: `กำลังวิจัย${name(job.base)}` })}
          </Text>
          <Row>
            <Bar
              value={1 - (job.endTick - s.tick) / researchTicks(lab)}
              color="#4FA3D9"
              height={10}
            />
          </Row>
          <Muted>
            {text({
              en: `${Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))} weeks left · ${Math.round(researchChance(s, lab, job.base) * 100)}% to find a recipe`,
              th: `เหลือ ${Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))} สัปดาห์ · โอกาสเจอสูตร ${Math.round(researchChance(s, lab, job.base) * 100)}%`,
            })}
          </Muted>
        </Card>
      ) : (
        <Muted>
          {text({
            en: 'Pick a base. The additive you find is random; a better lab finds better pairs.',
            th: 'เลือกน้ำมันฐานที่จะวิจัย สารเติมแต่งที่เจอเป็นการสุ่ม แล็บเลเวลสูงเจอคู่ที่ดีกว่า',
          })}
        </Muted>
      )}
      <Muted>
        {text({
          en: `Odds at Lv${lab.level}: S ${Math.round((odds[3] / total) * 100)}% · A ${Math.round((odds[2] / total) * 100)}% · B ${Math.round((odds[1] / total) * 100)}% · other ${Math.round((odds[0] / total) * 100)}%`,
          th: `โอกาสที่ Lv${lab.level}: S ${Math.round((odds[3] / total) * 100)}% · A ${Math.round((odds[2] / total) * 100)}% · B ${Math.round((odds[1] / total) * 100)}% · อื่น ${Math.round((odds[0] / total) * 100)}%`,
        })}
      </Muted>
      {!job &&
        bases
          .filter(b => baseAvailable(s, b.id))
          .map(b => {
            const id = b.id as BaseId
            const block = researchBlock(s, labUid, id)
            const left = researchCandidates(s, id).length
            const cost = researchCost(s, id)
            const clue = s.clues[id] ?? 0
            return (
              <Card key={id}>
                <Row>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.text}>{name(id)}</Text>
                    <Muted>
                      {left
                        ? text({
                            en: `${left} unknown · ${Math.round(researchChance(s, lab, id) * 100)}%${clue ? ` · clue ×${clue}` : ''}`,
                            th: `ยังไม่รู้ ${left} สูตร · โอกาส ${Math.round(researchChance(s, lab, id) * 100)}%${clue ? ` · เบาะแส ×${clue}` : ''}`,
                          })
                        : text({
                            en: 'No unknown pairs with your additives',
                            th: 'สารที่มีอยู่จับคู่ครบแล้ว',
                          })}
                    </Muted>
                  </View>
                  <SmallButton
                    label={
                      block && block !== 'rd' && block !== 'money'
                        ? text(blockText[block])
                        : `${cost.rd} RD · $${(cost.money / 1000).toFixed(0)}k`
                    }
                    disabled={!!block}
                    onPress={() => dispatch(s => startResearch(s, labUid, id))}
                  />
                </Row>
              </Card>
            )
          })}
      {!s.unlockedAdditives.length && (
        <Muted>
          {text({
            en: 'No additives yet: unlock them by training staff or from regular customers’ gifts.',
            th: 'ยังไม่มีสารเติมแต่ง ปลดได้จากการฝึกพนักงาน หรือของขวัญจากลูกค้าประจำ',
          })}
        </Muted>
      )}
    </>
  )
}
