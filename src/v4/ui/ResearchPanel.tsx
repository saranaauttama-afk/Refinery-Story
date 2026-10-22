import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { bases, type BaseId } from '../data/bases'
import { additives, type AdditiveId } from '../data/additives'
import { B, FORMULA_GRADES, FORMULA_LAB as F } from '../data/balance'
import { pairCompat } from '../data/compatibility'
import { synergies, synergyKey, secretFormulas } from '../data/formulaLab'
import { startCatalyst, startMix, setLabRole } from '../sim/actions'
import {
  labJob,
  labRole,
  labLevel,
  labChem,
  gameYear,
  catalystBlock,
  catalystRd,
  catalystTicks,
  mixTicks,
  labMixBlock,
  mixInput,
  formulaName,
  hintText,
  type MixRequest,
} from '../sim/systems/research'
import {
  catalystWeights,
  maxCatalystGrade,
  slotsFor,
  mixOdds,
  gradeIndex,
  stockOf,
} from '../sim/systems/formulaLab'
import { baseAvailable } from '../sim/systems/investments'
import { type, ui } from './theme'
import { PanelTabs } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted, GradeChip, Chip } from './cards'
import { text } from '../i18n'
import type { GameState, Grade, LabRole } from '../sim/types'

const addName = (id: string) => text(additives.find(a => a.id === id)!.name)
const baseName = (id: string) => text(bases.find(b => b.id === id)!.name)
/** First year a table reaches a value (year tables repeat their last entry). */
const firstYear = <T,>(table: readonly T[], ok: (v: T) => boolean) => {
  const i = table.findIndex(ok)
  return i < 0 ? null : i + 1
}

const catalystBlockText = {
  busy: { en: 'Busy', th: 'กำลังทำงาน' },
  role: { en: 'Formula Lab', th: 'แล็บผสมสูตร' },
  none: { en: 'No catalysts unlocked', th: 'ยังไม่มีสารเร่ง' },
  rd: { en: 'Not enough RD', th: 'RD ไม่พอ' },
  money: { en: 'Not enough money', th: 'เงินไม่พอ' },
}
const mixBlockText: Record<string, { en: string; th: string }> = {
  busy: { en: 'Busy', th: 'กำลังทำงาน' },
  role: { en: 'Catalyst Lab', th: 'แล็บสารเร่ง' },
  base: { en: 'Base locked', th: 'ยังไม่ปลดน้ำมันฐาน' },
  empty: { en: 'Pick a catalyst', th: 'เลือกสารเร่งก่อน' },
  slots: { en: 'Too many slots', th: 'ช่องเกิน' },
  duplicate: { en: 'Same catalyst twice', th: 'ใส่สารซ้ำ' },
  formula: { en: 'Pick a formula of this base', th: 'เลือกสูตรของน้ำมันฐานนี้' },
  stock: {
    en: `Need ${F.mix.unitsPerSlot} units each`,
    th: `ต้องมีสารละ ${F.mix.unitsPerSlot} หน่วย`,
  },
  full: {
    en: `A formula holds ${F.mix.maxCatalysts} catalysts`,
    th: `สูตรหนึ่งใส่สารได้ ${F.mix.maxCatalysts} ชนิด`,
  },
  money: { en: 'Not enough money', th: 'เงินไม่พอ' },
}

/** Lab sheet: each lab is a Catalyst Lab (researches graded catalysts) or a Formula Lab
 *  (mixes a base or formula with catalysts into a permanent formula). */
export function ResearchPanel({ labUid }: { labUid: string }) {
  const { state: s, dispatch } = useGame()
  const lab = s.yard.buildings.find(b => b.uid === labUid)
  if (!lab) return null
  const job = labJob(s, labUid)
  const role = labRole(lab)
  return (
    <>
      <Section>{text({ en: 'Lab', th: 'ห้องแล็บ' })}</Section>
      <PanelTabs<LabRole>
        options={[
          { id: 'catalyst', label: { en: 'Catalyst Lab', th: 'แล็บสารเร่ง' } },
          { id: 'formula', label: { en: 'Formula Lab', th: 'แล็บผสมสูตร' } },
        ]}
        value={role}
        color="#4FA3D9"
        onChange={r => dispatch(s => setLabRole(s, labUid, r))}
      />
      {job ? (
        <Card>
          <Text style={type.title}>
            {job.kind === 'catalyst'
              ? text({ en: 'Researching a catalyst…', th: 'กำลังวิจัยสารเร่ง…' })
              : text({
                  en: `Mixing ${formulaName(job.formula).en}…`,
                  th: `กำลังผสม ${formulaName(job.formula).th}…`,
                })}
          </Text>
          <Bar
            value={
              1 -
              (job.endTick - s.tick) /
                (job.kind === 'catalyst' ? catalystTicks(s, lab) : mixTicks(s, lab))
            }
            color="#4FA3D9"
            height={10}
          />
          <Muted>
            {text({
              en: `${Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))} weeks left · the lab can't switch until it's done`,
              th: `เหลือ ${Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))} สัปดาห์ · ระหว่างนี้สลับหน้าที่แล็บไม่ได้`,
            })}
          </Muted>
        </Card>
      ) : null}
      {role === 'catalyst' ? (
        <CatalystView s={s} labUid={labUid} busy={!!job} />
      ) : (
        <MixView s={s} labUid={labUid} busy={!!job} />
      )}
      <Stock s={s} />
      <Book s={s} />
    </>
  )
}

function CatalystView({ s, labUid, busy }: { s: GameState; labUid: string; busy: boolean }) {
  const { dispatch } = useGame()
  const lab = s.yard.buildings.find(b => b.uid === labUid)!
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
      <Muted>
        {text({
          en: 'Research gives one random catalyst you have unlocked, with a grade. Upgrade the lab and assign chemists for better odds.',
          th: 'วิจัยแล้วได้สารเร่ง 1 ชนิดแบบสุ่มจากที่ปลดแล้ว พร้อมเกรด อัปเกรดแล็บและให้นักเคมีประจำเพื่อเพิ่มโอกาสเกรดสูง',
        })}
      </Muted>
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
      {!busy && (
        <SmallButton
          label={
            block && block !== 'rd' && block !== 'money'
              ? text(catalystBlockText[block])
              : text({
                  en: `Research catalyst · ${catalystRd(s)} RD · $${F.catalyst.money / 1000}k`,
                  th: `วิจัยสารเร่ง · ${catalystRd(s)} RD · $${F.catalyst.money / 1000}k`,
                })
          }
          disabled={!!block}
          onPress={() => dispatch(s => startCatalyst(s, labUid))}
        />
      )}
      {!s.unlockedAdditives.length && (
        <Muted>
          {text({
            en: 'No catalysts yet: unlock them by training staff or from regular customers’ gifts.',
            th: 'ยังไม่มีสารเร่ง ปลดได้จากการฝึกพนักงาน หรือของขวัญจากลูกค้าประจำ',
          })}
        </Muted>
      )}
    </>
  )
}

function MixView({ s, labUid, busy }: { s: GameState; labUid: string; busy: boolean }) {
  const { dispatch } = useGame()
  const lab = s.yard.buildings.find(b => b.uid === labUid)!
  const year = gameYear(s)
  const slots = slotsFor(year)
  const [base, setBase] = useState<BaseId>('gasoline')
  const [from, setFrom] = useState<string | undefined>()
  const [picks, setPicks] = useState<{ additive: AdditiveId; grade: Grade }[]>([])
  const formulas = s.formulaLab.formulas.filter(f => f.base === base)
  const start = formulas.find(f => f.key === from)
  const req: MixRequest = { base, from: start?.key, picks }
  const block = labMixBlock(s, labUid, req)
  const odds = picks.length ? mixOdds({ ...s.formulaLab, rng: s.rng }, mixInput(s, lab, req)) : null
  const nextSlots = firstYear(F.mix.slotsByYear, n => n > slots)
  const toggle = (additive: AdditiveId, grade: Grade) =>
    setPicks(p =>
      p.some(x => x.additive === additive && x.grade === grade)
        ? p.filter(x => !(x.additive === additive && x.grade === grade))
        : [...p.filter(x => x.additive !== additive), { additive, grade }].slice(-slots),
    )
  const knownSyn = odds?.touched.filter(k => s.formulaLab.knownSynergies.includes(k)) ?? []
  const secretKnown =
    odds?.secret &&
    (s.formulaLab.hints.includes(`secret:${odds.secret.id}`) ||
      s.formulaLab.formulas.some(f => f.secret === odds.secret!.id))
  return (
    <>
      <Muted>
        {text({
          en: `Start from a plain base (grade D) or a formula you have, add up to ${slots} catalyst${slots > 1 ? 's' : ''}. A formula is never worse than before; the catalysts are used up.${nextSlots ? ` ${slots + 1} slots from year ${nextSlots}.` : ''}`,
          th: `เริ่มจากน้ำมันฐาน (เกรด D) หรือสูตรที่มีอยู่ แล้วใส่สารเร่งได้ ${slots} ช่อง สูตรเดิมไม่มีทางแย่ลง แต่สารเร่งจะถูกใช้ไป${nextSlots ? ` ปีที่ ${nextSlots} ได้ ${slots + 1} ช่อง` : ''}`,
        })}
      </Muted>
      <Text style={type.small}>{text({ en: 'Base', th: 'น้ำมันฐาน' })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {bases
          .filter(b => baseAvailable(s, b.id))
          .map(b => (
            <Choice
              key={b.id}
              label={text(b.name)}
              on={base === b.id}
              onPress={() => {
                setBase(b.id)
                setFrom(undefined)
              }}
            />
          ))}
      </View>
      <Text style={type.small}>{text({ en: 'Start from', th: 'เริ่มจาก' })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Choice
          label={text({ en: `Plain ${baseName(base)} · D`, th: `${baseName(base)} ล้วน · D` })}
          on={!start}
          onPress={() => setFrom(undefined)}
        />
        {formulas.map(f => (
          <Choice
            key={f.key}
            label={`${text(formulaName(f))} · ${f.grade}`}
            on={start?.key === f.key}
            onPress={() => setFrom(f.key)}
          />
        ))}
      </View>
      <Text style={type.small}>
        {text({
          en: `Catalysts (${picks.length}/${slots}) · tap a grade to use it`,
          th: `สารเร่ง (${picks.length}/${slots}) · แตะเกรดที่จะใช้`,
        })}
      </Text>
      {s.formulaLab.stock.length ? (
        <View style={{ gap: 6 }}>
          {[...new Set(s.formulaLab.stock.map(c => c.additive))].sort().map(a => (
            <Row key={a}>
              <View style={{ flex: 1 }}>
                <Text style={type.body} numberOfLines={1}>
                  {addName(a)}
                </Text>
                <Text style={[type.small, { color: ui.navy }]}>
                  {text({ en: `fit ${pairCompat(base, a)}`, th: `เข้ากัน ${pairCompat(base, a)}` })}
                </Text>
              </View>
              {s.formulaLab.stock
                .filter(c => c.additive === a)
                .sort((x, y) => gradeIndex(y.grade) - gradeIndex(x.grade))
                .map(c => (
                  <Choice
                    key={c.grade}
                    label={`${c.grade}×${c.units}`}
                    on={picks.some(p => p.additive === a && p.grade === c.grade)}
                    dim={c.units < F.mix.unitsPerSlot}
                    onPress={() => toggle(a, c.grade)}
                  />
                ))}
            </Row>
          ))}
        </View>
      ) : (
        <Muted>
          {text({
            en: 'No catalysts in stock: switch a lab to Catalyst Lab and research some.',
            th: 'ยังไม่มีสารเร่งในคลัง ให้แล็บอีกห้องเป็นแล็บสารเร่งแล้ววิจัยก่อน',
          })}
        </Muted>
      )}
      {odds && (
        <Card>
          <Row>
            <Text style={[type.title, { flex: 1 }]}>
              {text({ en: 'Expected', th: 'คาดว่าจะได้' })}
            </Text>
            <GradeChip grade={odds.low} />
            {odds.high !== odds.low && (
              <>
                <Text style={type.body}>–</Text>
                <GradeChip grade={odds.high} />
              </>
            )}
          </Row>
          <Muted>
            {text({
              en: `Cap: best catalyst used (${FORMULA_GRADES[odds.cap]}).${s.formulaLab.pity >= F.mix.pityAfter ? ' Lucky streak due: +1!' : ''}`,
              th: `เพดาน = สารเร่งที่ดีที่สุดที่ใส่ (${FORMULA_GRADES[odds.cap]})${s.formulaLab.pity >= F.mix.pityAfter ? ' · รอบนี้ดวงดี +1!' : ''}`,
            })}
          </Muted>
          {knownSyn.map(k => {
            const kind = synergies.find(x => synergyKey(x.a, x.b) === k)!.kind
            return (
              <Muted key={k}>
                {kind === 'good'
                  ? text({
                      en: `✓ ${k.split('+').map(addName).join(' + ')} work well together`,
                      th: `✓ ${k.split('+').map(addName).join(' + ')} เข้ากันดี`,
                    })
                  : text({
                      en: `✗ ${k.split('+').map(addName).join(' + ')} clash`,
                      th: `✗ ${k.split('+').map(addName).join(' + ')} ไม่เข้ากัน`,
                    })}
              </Muted>
            )
          })}
          {secretKnown && (
            <Muted>
              {text({
                en: `✨ Secret formula: ${odds.secret!.name.en}`,
                th: `✨ สูตรลับ: ${odds.secret!.name.th}`,
              })}
            </Muted>
          )}
        </Card>
      )}
      {!busy && (
        <SmallButton
          label={
            block
              ? text(mixBlockText[block])
              : text({
                  en: `Mix · $${F.mix.money / 1000}k · ${F.mix.weeks} week`,
                  th: `ผสม · $${F.mix.money / 1000}k · ${F.mix.weeks} สัปดาห์`,
                })
          }
          disabled={!!block}
          onPress={() => {
            dispatch(s => startMix(s, labUid, req))
            setPicks([])
          }}
        />
      )}
    </>
  )
}

function Stock({ s }: { s: GameState }) {
  const [open, setOpen] = useState(false)
  const kinds = [...new Set(s.formulaLab.stock.map(c => c.additive))]
  if (!kinds.length) return null
  return (
    <>
      <Fold
        label={text({
          en: `Catalyst stock (${kinds.length})`,
          th: `คลังสารเร่ง (${kinds.length} ชนิด)`,
        })}
        open={open}
        onPress={() => setOpen(v => !v)}
      />
      {open &&
        kinds.map(a => (
          <Row key={a}>
            <Text style={[type.body, { flex: 1 }]}>{addName(a)}</Text>
            {s.formulaLab.stock
              .filter(c => c.additive === a)
              .sort((x, y) => gradeIndex(y.grade) - gradeIndex(x.grade))
              .map(c => (
                <GradeChip key={c.grade} grade={c.grade} suffix={` ×${c.units}`} />
              ))}
          </Row>
        ))}
    </>
  )
}

function Book({ s }: { s: GameState }) {
  const [open, setOpen] = useState(false)
  const good = synergies.filter(x => x.kind === 'good')
  const knownGood = good.filter(x => s.formulaLab.knownSynergies.includes(synergyKey(x.a, x.b)))
  const secretsFound = secretFormulas.filter(x =>
    s.formulaLab.formulas.some(f => f.secret === x.id),
  )
  return (
    <>
      <Fold
        label={text({
          en: `Formula book · ${s.formulaLab.formulas.length} formulas · pairs ${knownGood.length}/${good.length} · secrets ${secretsFound.length}/${secretFormulas.length}`,
          th: `สมุดสูตร · ${s.formulaLab.formulas.length} สูตร · คู่เข้ากัน ${knownGood.length}/${good.length} · สูตรลับ ${secretsFound.length}/${secretFormulas.length}`,
        })}
        open={open}
        onPress={() => setOpen(v => !v)}
      />
      {open && (
        <>
          {[...s.formulaLab.formulas]
            .sort((a, b) => gradeIndex(b.grade) - gradeIndex(a.grade))
            .map(f => {
              const short = f.catalysts.filter(a => stockOf(s.formulaLab, a) < 1)
              return (
                <Row key={f.key}>
                  <View style={{ flex: 1 }}>
                    <Text style={type.body}>
                      {f.secret ? '✨ ' : ''}
                      {text(formulaName(f))}
                    </Text>
                    {short.length > 0 && (
                      <Muted>
                        {text({
                          en: `Out of ${short.map(addName).join(', ')}: stations make plain ${F.plainGrade} lots`,
                          th: `${short.map(addName).join(', ')} หมด: สถานีจะผลิตเกรด ${F.plainGrade} ธรรมดา`,
                        })}
                      </Muted>
                    )}
                  </View>
                  <GradeChip grade={f.grade} />
                </Row>
              )
            })}
          <Text style={type.small}>{text({ en: 'Catalyst pairs', th: 'คู่สารเร่ง' })}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {synergies.map(x => {
              const k = synergyKey(x.a, x.b)
              const known = s.formulaLab.knownSynergies.includes(k)
              return known ? (
                <Chip
                  key={k}
                  label={`${addName(x.a)} + ${addName(x.b)} ${x.kind === 'good' ? '✓' : '✗'}`}
                  color={x.kind === 'good' ? '#8ED9C1' : '#F2A49B'}
                />
              ) : null
            })}
            <Chip
              label={text({
                en: `??? ×${synergies.length - s.formulaLab.knownSynergies.length}`,
                th: `??? อีก ${synergies.length - s.formulaLab.knownSynergies.length} คู่`,
              })}
            />
          </View>
          {openHints(s).length > 0 && (
            <>
              <Text style={type.small}>{text({ en: 'Lab notes', th: 'บันทึกแล็บ' })}</Text>
              {openHints(s).map(h => (
                <Muted key={h}>• {text(hintText(h))}</Muted>
              ))}
            </>
          )}
        </>
      )}
    </>
  )
}

/** Hints the player has not solved yet (pair not tried, secret not made). */
const openHints = (s: GameState) =>
  s.formulaLab.hints.filter(h =>
    h.startsWith('syn:')
      ? !s.formulaLab.knownSynergies.includes(h.slice(4))
      : !s.formulaLab.formulas.some(f => `secret:${f.secret}` === h),
  )

function Choice({
  label,
  sub,
  on,
  dim = false,
  onPress,
}: {
  label: string
  sub?: string
  on: boolean
  dim?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 10,
        borderWidth: on ? 3 : 2,
        borderRadius: 8,
        backgroundColor: on ? '#FFE7A3' : '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        opacity: dim ? 0.5 : 1,
      }}
    >
      <Text style={[type.body, on && { fontFamily: 'Kanit_600SemiBold' }]}>
        {on ? '✓ ' : ''}
        {label}
      </Text>
      {sub && <Text style={[type.small, { color: ui.navy }]}>{sub}</Text>}
    </Pressable>
  )
}

function Fold({ label, open, onPress }: { label: string; open: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}
    >
      <Text style={[type.small, { flex: 1 }]}>{label}</Text>
      <Text style={type.body}>{open ? '▴' : '▾'}</Text>
    </Pressable>
  )
}
