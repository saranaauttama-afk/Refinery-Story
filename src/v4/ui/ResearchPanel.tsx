import { View } from 'react-native'
import { useGame } from '../store/useGame'
import { B, FORMULA_GRADES, FORMULA_LAB as F } from '../data/balance'
import { startCatalyst } from '../sim/actions'
import {
  labJob,
  labLevel,
  labChem,
  gameYear,
  catalystBlock,
  catalystRd,
  catalystTicks,
} from '../sim/systems/research'
import { catalystWeights, maxCatalystGrade, gradeIndex } from '../sim/systems/formulaLab'
import { Section, SmallButton, Muted, GradeChip } from './cards'
import { Stock, Book, JobCard, firstYear } from './labParts'
import { text } from '../i18n'
import type { Grade } from '../sim/types'

const blockText = {
  busy: { en: 'Busy', th: 'กำลังทำงาน' },
  none: { en: 'No catalysts unlocked', th: 'ยังไม่มีสารเร่ง' },
  rd: { en: 'Not enough RD', th: 'RD ไม่พอ' },
  money: { en: 'Not enough money', th: 'เงินไม่พอ' },
}

/** Formula Lab (building `lab`): research one random catalyst with a grade. */
export function ResearchPanel({ labUid }: { labUid: string }) {
  const { state: s, dispatch } = useGame()
  const lab = s.yard.buildings.find(b => b.uid === labUid)
  if (!lab) return null
  const job = labJob(s, labUid)
  const year = gameYear(s)
  const odds = catalystWeights(labLevel(s, lab), labChem(s, lab), year)
  const total = odds.reduce((a, b) => a + b, 0)
  const cap = maxCatalystGrade(year)
  const next = FORMULA_GRADES[gradeIndex(cap) + 1]
  const nextYear = next
    ? firstYear(F.catalyst.maxGradeByYear, g => gradeIndex(g as Grade) > gradeIndex(cap))
    : null
  const block = catalystBlock(s, labUid)
  return (
    <>
      <Section>{text({ en: 'Research catalysts', th: 'วิจัยสารเร่ง' })}</Section>
      {job ? (
        <JobCard
          title={text({ en: 'Researching a catalyst…', th: 'กำลังวิจัยสารเร่ง…' })}
          progress={1 - (job.endTick - s.tick) / catalystTicks(s, lab)}
          weeks={Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))}
        />
      ) : (
        <Muted>
          {text({
            en: 'Each research gives one random catalyst you have unlocked, with a grade. Take them to a Product Lab to make products. A higher level and chemists on duty give better grades.',
            th: 'วิจัยแต่ละครั้งได้สารเร่งสุ่ม 1 ชนิดจากที่ปลดแล้ว พร้อมเกรด เอาไปใช้ที่แล็บสร้างสินค้า เลเวลสูงและมีนักเคมีประจำได้เกรดดีขึ้น',
          })}
        </Muted>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {FORMULA_GRADES.map((g, i) =>
          odds[i] > 0 ? (
            <GradeChip key={g} grade={g} suffix={` ${Math.round((odds[i] / total) * 100)}%`} />
          ) : null,
        )}
      </View>
      <Muted>
        {text({
          en: `Best possible this year: ${cap}${next && nextYear ? ` · ${next} from year ${nextYear}` : ''}`,
          th: `ปีนี้ได้สูงสุด ${cap}${next && nextYear ? ` · ${next} เริ่มได้ปีที่ ${nextYear}` : ''}`,
        })}
      </Muted>
      {!job && (
        <SmallButton
          label={
            block === 'busy' || block === 'none'
              ? text(blockText[block])
              : text({
                  en: `Research · ${catalystRd(s)} RD · $${F.catalyst.money / 1000}k`,
                  th: `วิจัย · ${catalystRd(s)} RD · $${F.catalyst.money / 1000}k`,
                })
          }
          disabled={!!block}
          onPress={() => dispatch(s => startCatalyst(s, labUid))}
        />
      )}
      {block === 'none' && (
        <Muted>
          {text({
            en: 'No catalysts yet: unlock them by training staff or from regular customers’ gifts.',
            th: 'ยังไม่มีสารเร่ง ปลดได้จากการฝึกพนักงาน หรือของขวัญจากลูกค้าประจำ',
          })}
        </Muted>
      )}
      <Stock s={s} defaultOpen />
      <Book s={s} />
    </>
  )
}
