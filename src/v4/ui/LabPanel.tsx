import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { ArrowRight } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { B, FORMULA_GRADES, FORMULA_LAB as F } from '../data/balance'
import { startCatalyst } from '../sim/actions'
import {
  labs,
  productLabs,
  labJob,
  labLevel,
  labChem,
  gameYear,
  catalystBlock,
  catalystRd,
  catalystTicks,
  mixTicks,
  formulaName,
} from '../sim/systems/research'
import { catalystWeights, maxCatalystGrade, gradeIndex } from '../sim/systems/formulaLab'
import { type, ui } from './theme'
import { PanelTabs } from './controls'
import { Row, SmallButton, Muted, GradeChip, Bar } from './cards'
import { Stock, Book, firstYear } from './labParts'
import { ProductLabPanel } from './ProductLabPanel'
import { text } from '../i18n'
import type { Building, GameState, Grade } from '../sim/types'

export type LabTab = 'research' | 'develop'

/** Lab menu: every lab in one place. Research catalysts at Formula Labs, then develop product
 *  cards at Product Labs. */
export function LabPanel({
  initialTab = 'research',
  initialLab,
  upgrade,
}: {
  initialTab?: LabTab
  /** Product Lab to open on (when a lab building was tapped). */
  initialLab?: string
  /** Product card to upgrade (from the Products menu). */
  upgrade?: string
}) {
  const { state: s } = useGame()
  const [tab, setTab] = useState<LabTab>(initialTab)
  return (
    <>
      <Flow tab={tab} />
      <PanelTabs<LabTab>
        options={[
          {
            id: 'research',
            label: { en: `Research (${labs(s).length})`, th: `วิจัยสารเร่ง (${labs(s).length})` },
          },
          {
            id: 'develop',
            label: {
              en: `Develop (${productLabs(s).length})`,
              th: `พัฒนาสินค้า (${productLabs(s).length})`,
            },
          },
        ]}
        value={tab}
        color="#9C5BD6"
        onChange={setTab}
      />
      {tab === 'research' ? (
        <Research s={s} />
      ) : (
        <Develop s={s} initialLab={initialLab} upgrade={upgrade} />
      )}
    </>
  )
}

/** The whole chain in one line, current step highlighted. */
function Flow({ tab }: { tab: LabTab }) {
  const steps = [
    { id: 'research', en: 'Catalysts', th: 'สารเร่ง' },
    { id: 'develop', en: 'Product card', th: 'การ์ดสินค้า' },
    { id: 'line', en: 'Line', th: 'สายการผลิต' },
    { id: 'sell', en: 'Sell', th: 'ขาย' },
  ]
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
      {steps.map((st, i) => (
        <View key={st.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 1,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: st.id === tab ? ui.ink : ui.steel,
              backgroundColor: st.id === tab ? '#E9DDFB' : 'transparent',
            }}
          >
            <Text style={[type.small, { fontSize: 12 }, st.id === tab && { color: ui.ink }]}>
              {text(st)}
            </Text>
          </View>
          {i < steps.length - 1 && <ArrowRight size={12} color={ui.steel} />}
        </View>
      ))}
    </View>
  )
}

const blockText = {
  busy: { en: 'Busy', th: 'กำลังทำงาน' },
  none: { en: 'No catalysts', th: 'ยังไม่มีสารเร่ง' },
  rd: { en: 'Need RD', th: 'RD ไม่พอ' },
  money: { en: 'Need money', th: 'เงินไม่พอ' },
}

function Research({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const all = labs(s)
  const year = gameYear(s)
  const best = [...all].sort((a, b) => labLevel(s, b) - labLevel(s, a))[0]
  const odds = best ? catalystWeights(labLevel(s, best), labChem(s, best), year) : []
  const total = odds.reduce((a, b) => a + b, 0)
  const cap = maxCatalystGrade(year)
  const next = FORMULA_GRADES[gradeIndex(cap) + 1]
  const nextYear = next
    ? firstYear(F.catalyst.maxGradeByYear, g => gradeIndex(g as Grade) > gradeIndex(cap))
    : null
  if (!all.length)
    return (
      <Muted>
        {text({
          en: 'Build a Formula Lab to research catalysts.',
          th: 'สร้างแล็บสร้างสูตรก่อน เพื่อวิจัยสารเร่ง',
        })}
      </Muted>
    )
  return (
    <>
      <Muted>
        {text({
          en: `Each research gives one random catalyst with a grade · ${catalystRd(s)} RD + $${F.catalyst.money / 1000}k`,
          th: `วิจัยแต่ละครั้งได้สารเร่งสุ่ม 1 ชนิดพร้อมเกรด · ใช้ ${catalystRd(s)} RD + $${F.catalyst.money / 1000}k`,
        })}
      </Muted>
      {all.map((lab, i) => (
        <LabRow
          key={lab.uid}
          s={s}
          lab={lab}
          name={text({
            en: `Formula Lab ${i + 1} · Lv${lab.level}`,
            th: `แล็บสร้างสูตร ${i + 1} · Lv${lab.level}`,
          })}
          total={catalystTicks(s, lab)}
          busyText={text({ en: 'Researching…', th: 'กำลังวิจัย…' })}
          action={(() => {
            const block = catalystBlock(s, lab.uid)
            return (
              <SmallButton
                label={
                  block && block !== 'busy'
                    ? text(blockText[block])
                    : text({ en: 'Research', th: 'วิจัย' })
                }
                disabled={!!block}
                onPress={() => dispatch(s => startCatalyst(s, lab.uid))}
              />
            )
          })()}
        />
      ))}
      <Row>
        <Text style={type.small}>{text({ en: 'Odds', th: 'โอกาส' })}</Text>
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
          {FORMULA_GRADES.map((g, i) =>
            odds[i] > 0 ? (
              <GradeChip key={g} grade={g} suffix={` ${Math.round((odds[i] / total) * 100)}%`} />
            ) : null,
          )}
        </View>
      </Row>
      <Muted>
        {text({
          en: `Best this year: ${cap}${next && nextYear ? ` · ${next} from year ${nextYear}` : ''} · higher lab level and chemists raise the odds`,
          th: `ปีนี้ได้สูงสุด ${cap}${next && nextYear ? ` · ${next} เริ่มปีที่ ${nextYear}` : ''} · เลเวลแล็บและนักเคมีช่วยเพิ่มโอกาส`,
        })}
      </Muted>
      <Stock s={s} defaultOpen />
      <Book s={s} />
    </>
  )
}

function Develop({
  s,
  initialLab,
  upgrade,
}: {
  s: GameState
  initialLab?: string
  upgrade?: string
}) {
  const all = productLabs(s)
  const firstIdle = all.find(l => !labJob(s, l.uid))
  const [picked, setPicked] = useState(
    all.some(l => l.uid === initialLab) ? initialLab : (firstIdle ?? all[0])?.uid,
  )
  const lab = all.find(l => l.uid === picked) ?? all[0]
  if (!lab)
    return (
      <Muted>
        {text({
          en: 'Build a Product Lab to develop product cards.',
          th: 'สร้างแล็บสร้างสินค้าก่อน เพื่อพัฒนาการ์ดสินค้า',
        })}
      </Muted>
    )
  return (
    <>
      {all.length > 1 &&
        all.map((l, i) => (
          <LabRow
            key={l.uid}
            s={s}
            lab={l}
            name={text({
              en: `Product Lab ${i + 1} · Lv${l.level}`,
              th: `แล็บสร้างสินค้า ${i + 1} · Lv${l.level}`,
            })}
            total={mixTicks(s, l)}
            busyText={(() => {
              const j = labJob(s, l.uid)
              return j?.kind === 'mix'
                ? text({
                    en: `Developing ${formulaName(j.formula).en}…`,
                    th: `กำลังพัฒนา ${formulaName(j.formula).th}…`,
                  })
                : ''
            })()}
            selected={l.uid === lab.uid}
            onPress={() => setPicked(l.uid)}
          />
        ))}
      <ProductLabPanel key={lab.uid} labUid={lab.uid} upgrade={upgrade} />
    </>
  )
}

/** One lab: name, and either its job progress or an action. */
function LabRow({
  s,
  lab,
  name,
  total,
  busyText,
  action,
  selected,
  onPress,
}: {
  s: GameState
  lab: Building
  name: string
  total: number
  busyText: string
  action?: React.ReactNode
  selected?: boolean
  onPress?: () => void
}) {
  const job = labJob(s, lab.uid)
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: selected ? 2.5 : 1.5,
        borderColor: ui.ink,
        borderRadius: 8,
        backgroundColor: selected ? '#F1E8FD' : '#FFFFFF',
      }}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[type.body, { fontSize: 14, fontFamily: 'Kanit_600SemiBold' }]}>{name}</Text>
        {job ? (
          <>
            <Text style={[type.small, { fontSize: 12 }]} numberOfLines={1}>
              {busyText} ·{' '}
              {text({
                en: `${Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))} wk left`,
                th: `เหลือ ${Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))} สัปดาห์`,
              })}
            </Text>
            <Bar value={1 - (job.endTick - s.tick) / total} color="#9C5BD6" height={9} />
          </>
        ) : (
          <Text style={[type.small, { fontSize: 12, color: '#2F7D32' }]}>
            {text({ en: 'Idle', th: 'ว่าง' })}
          </Text>
        )}
      </View>
      {!job && action}
    </View>
  )
  return onPress ? (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  )
}
