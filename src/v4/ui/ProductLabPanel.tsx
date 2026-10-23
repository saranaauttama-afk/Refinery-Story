import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { bases, type BaseId } from '../data/bases'
import type { AdditiveId } from '../data/additives'
import { B, FORMULA_GRADES, FORMULA_LAB as F } from '../data/balance'
import { pairCompat } from '../data/compatibility'
import { synergies } from '../data/formulaLab'
import { startMix } from '../sim/actions'
import {
  labJob,
  gameYear,
  mixTicks,
  labMixBlock,
  mixInput,
  formulaName,
  type MixRequest,
} from '../sim/systems/research'
import { slotsFor, mixOdds, gradeIndex } from '../sim/systems/formulaLab'
import { baseAvailable } from '../sim/systems/investments'
import { type, ui } from './theme'
import { PanelTabs } from './controls'
import { Row, SmallButton, Muted } from './cards'
import { ProductCard, ProductTile } from './ProductCard'
import { Choice, JobCard, addName, firstYear } from './labParts'
import { text } from '../i18n'
import type { Formula, GameState, Grade } from '../sim/types'

const blockText: Record<string, { en: string; th: string }> = {
  busy: { en: 'Busy', th: 'กำลังทำงาน' },
  base: { en: 'Base locked', th: 'ยังไม่ปลดน้ำมันฐาน' },
  empty: { en: 'Put a catalyst in a slot', th: 'ใส่สารเร่งลงช่องก่อน' },
  slots: { en: 'Too many slots', th: 'ช่องเกิน' },
  duplicate: { en: 'Same catalyst twice', th: 'ใส่สารซ้ำ' },
  formula: { en: 'Pick a card to upgrade', th: 'เลือกการ์ดที่จะอัปเกรด' },
  stock: {
    en: `Need ${F.mix.unitsPerSlot} units each`,
    th: `ต้องมีสารละ ${F.mix.unitsPerSlot} หน่วย`,
  },
  full: {
    en: `A product holds ${F.mix.maxCatalysts} catalysts`,
    th: `สินค้าหนึ่งใส่สารได้ ${F.mix.maxCatalysts} ชนิด`,
  },
  money: { en: 'Not enough money', th: 'เงินไม่พอ' },
}
type Mode = 'new' | 'upgrade'
type Pick = { additive: AdditiveId; grade: Grade }

/** Product Lab: develop a new product card from a base, or upgrade a card, with catalysts. */
export function ProductLabPanel({ labUid, upgrade }: { labUid: string; upgrade?: string }) {
  const { state: s, dispatch } = useGame()
  const lab = s.yard.buildings.find(b => b.uid === labUid)
  const [mode, setMode] = useState<Mode>(upgrade ? 'upgrade' : 'new')
  const [base, setBase] = useState<BaseId>('gasoline')
  const [from, setFrom] = useState<string | undefined>(upgrade)
  const [picks, setPicks] = useState<Pick[]>([])
  if (!lab) return null
  const job = labJob(s, labUid)
  const year = gameYear(s)
  const slots = slotsFor(year)
  const cards = [...s.formulaLab.formulas].sort(
    (a, b) => gradeIndex(b.grade) - gradeIndex(a.grade) || a.base.localeCompare(b.base),
  )
  const card = mode === 'upgrade' ? cards.find(f => f.key === from) : undefined
  const req: MixRequest = { base: card?.base ?? base, from: card?.key, picks }
  const block = mode === 'upgrade' && !card ? 'formula' : labMixBlock(s, labUid, req)
  const odds = picks.length ? mixOdds({ ...s.formulaLab, rng: s.rng }, mixInput(s, lab, req)) : null
  const nextSlots = firstYear(F.mix.slotsByYear, n => n > slots)
  const choose = (m: Mode, key?: string) => {
    setMode(m)
    setFrom(key)
    setPicks([])
  }
  const put = (p: Pick) =>
    setPicks(cur => {
      const at = cur.findIndex(x => x.additive === p.additive)
      if (at >= 0)
        return cur[at].grade === p.grade
          ? cur.filter((_, i) => i !== at)
          : cur.map((x, i) => (i === at ? p : x))
      return cur.length < slots ? [...cur, p] : [...cur.slice(0, slots - 1), p]
    })
  return (
    <>
      {job?.kind === 'mix' ? (
        <JobCard
          title={text({
            en: `Developing ${formulaName(job.formula).en}…`,
            th: `กำลังพัฒนา ${formulaName(job.formula).th}…`,
          })}
          progress={1 - (job.endTick - s.tick) / mixTicks(s, lab)}
          weeks={Math.max(0, Math.ceil((job.endTick - s.tick) / B.ticksPerWeek))}
        />
      ) : (
        <>
          <PanelTabs<Mode>
            options={[
              { id: 'new', label: { en: 'New product', th: 'สินค้าใหม่' } },
              { id: 'upgrade', label: { en: 'Upgrade a card', th: 'อัปเกรดการ์ด' } },
            ]}
            value={mode}
            color="#E36BB0"
            onChange={m => choose(m, m === 'upgrade' ? cards[0]?.key : undefined)}
          />
          <Step
            n={1}
            label={
              mode === 'new'
                ? text({ en: 'Base', th: 'เลือกน้ำมันฐาน' })
                : text({ en: 'Card to upgrade', th: 'เลือกการ์ดที่จะอัปเกรด' })
            }
          />
          {mode === 'new' ? (
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
                      setPicks([])
                    }}
                  />
                ))}
            </View>
          ) : cards.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {cards.map(f => (
                <ProductTile
                  key={f.key}
                  s={s}
                  formula={f}
                  base={f.base}
                  selected={f.key === from}
                  onPress={() => choose('upgrade', f.key)}
                />
              ))}
            </View>
          ) : (
            <Muted>
              {text({
                en: 'No product cards yet: develop a new product first.',
                th: 'ยังไม่มีการ์ดสินค้า พัฒนาสินค้าใหม่ก่อน',
              })}
            </Muted>
          )}

          <Step
            n={2}
            label={text({
              en: `Catalyst slots (${picks.length}/${slots})`,
              th: `ช่องสารเร่ง (${picks.length}/${slots})`,
            })}
          />
          {card && card.catalysts.length > 0 && (
            <Muted>
              {text({
                en: `Already in the card: ${card.catalysts.map(addName).join(', ')}. Adding the same one again refines it.`,
                th: `ในการ์ดมีแล้ว: ${card.catalysts.map(addName).join(', ')} ใส่ตัวเดิมซ้ำ = ขัดเกลาเกรด`,
              })}
            </Muted>
          )}
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: slots }, (_, i) => (
              <Slot
                key={i}
                pick={picks[i]}
                onClear={() => setPicks(p => p.filter((_, j) => j !== i))}
              />
            ))}
          </View>
          {nextSlots && (
            <Muted>
              {text({
                en: `${slots + 1} slots from year ${nextSlots}`,
                th: `ปีที่ ${nextSlots} ได้ ${slots + 1} ช่อง`,
              })}
            </Muted>
          )}
          <StockPicker s={s} base={req.base} picks={picks} onPick={put} />

          <Step n={3} label={text({ en: 'Expected result', th: 'ผลที่คาดว่าจะได้' })} />
          {odds ? (
            <ProductCard
              s={s}
              wide
              base={req.base}
              formula={{
                key: card?.key ?? 'preview',
                base: req.base,
                catalysts: odds.catalysts as AdditiveId[],
                grade: odds.high,
                secret: secretShown(s, odds.secret?.id) ? (odds.secret?.id ?? null) : null,
                name: card?.name ?? null,
              }}
              grade={odds.low === odds.high ? odds.low : `${odds.low}–${odds.high}`}
              footer={<OddsNotes s={s} odds={odds} card={card} />}
            />
          ) : (
            <Muted>
              {text({
                en: 'Put catalysts in the slots to see the grade range.',
                th: 'ใส่สารเร่งลงช่องเพื่อดูช่วงเกรดที่น่าจะได้',
              })}
            </Muted>
          )}
          <SmallButton
            label={
              block
                ? text(blockText[block])
                : text({
                    en: `Develop · $${F.mix.money / 1000}k · ${F.mix.weeks} week`,
                    th: `พัฒนา · $${F.mix.money / 1000}k · ${F.mix.weeks} สัปดาห์`,
                  })
            }
            disabled={!!block}
            onPress={() => {
              dispatch(s => startMix(s, labUid, req))
              setPicks([])
            }}
          />
        </>
      )}
    </>
  )
}

const secretShown = (s: GameState, id: string | undefined) =>
  !!id &&
  (s.formulaLab.hints.includes(`secret:${id}`) || s.formulaLab.formulas.some(f => f.secret === id))

function OddsNotes({
  s,
  odds,
  card,
}: {
  s: GameState
  odds: ReturnType<typeof mixOdds>
  card: Formula | undefined
}) {
  const known = odds.touched.filter(k => s.formulaLab.knownSynergies.includes(k))
  return (
    <View style={{ gap: 2 }}>
      <Muted>
        {text({
          en: `Best catalyst ${FORMULA_GRADES[odds.cap]} caps the grade.${card ? ` Now ${card.grade}: a worse result keeps the card as it is.` : ''}`,
          th: `เกรดสูงสุดไม่เกินสารเร่งที่ดีที่สุด (${FORMULA_GRADES[odds.cap]})${card ? ` · ตอนนี้ ${card.grade} ถ้าได้แย่กว่าการ์ดจะเหมือนเดิม` : ''}`,
        })}
      </Muted>
      {known.map(k => {
        const kind = synergies.find(x => [x.a, x.b].sort().join('+') === k)!.kind
        const names = k.split('+').map(addName).join(' + ')
        return (
          <Muted key={k}>
            {kind === 'good'
              ? text({ en: `✓ ${names} work well together`, th: `✓ ${names} เข้ากันดี` })
              : text({ en: `✗ ${names} clash`, th: `✗ ${names} ไม่เข้ากัน` })}
          </Muted>
        )
      })}
      {secretShown(s, odds.secret?.id) && (
        <Muted>
          {text({
            en: `✨ Secret product: ${odds.secret!.name.en}`,
            th: `✨ สูตรลับ: ${odds.secret!.name.th}`,
          })}
        </Muted>
      )}
      {s.formulaLab.pity >= F.mix.pityAfter && (
        <Muted>{text({ en: 'Lucky streak due: +1!', th: 'รอบนี้ดวงดี +1!' })}</Muted>
      )}
    </View>
  )
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: ui.navy,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[type.num, { color: ui.paper, fontSize: 14 }]}>{n}</Text>
      </View>
      <Text style={type.title}>{label}</Text>
    </View>
  )
}

function Slot({ pick, onClear }: { pick?: Pick; onClear: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={pick ? text({ en: 'Clear slot', th: 'เอาออก' }) : undefined}
      disabled={!pick}
      onPress={onClear}
      style={{
        flex: 1,
        minHeight: 64,
        borderWidth: 2,
        borderStyle: pick ? 'solid' : 'dashed',
        borderColor: pick ? ui.ink : ui.steel,
        borderRadius: 8,
        backgroundColor: pick ? '#FFE7A3' : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
      }}
    >
      {pick ? (
        <>
          <Text style={[type.body, { fontSize: 13, textAlign: 'center' }]} numberOfLines={2}>
            {addName(pick.additive)}
          </Text>
          <Text style={type.num}>{pick.grade} ✕</Text>
        </>
      ) : (
        <Text style={[type.numBig, { color: ui.steel }]}>+</Text>
      )}
    </Pressable>
  )
}

/** Stock grouped by catalyst; tap a grade to put it in a slot (tap again to take it out). */
function StockPicker({
  s,
  base,
  picks,
  onPick,
}: {
  s: GameState
  base: BaseId
  picks: Pick[]
  onPick: (p: Pick) => void
}) {
  const kinds = [...new Set(s.formulaLab.stock.map(c => c.additive))].sort()
  if (!kinds.length)
    return (
      <Muted>
        {text({
          en: 'No catalysts in stock: research some at a Formula Lab.',
          th: 'ยังไม่มีสารเร่งในคลัง ไปวิจัยที่แล็บสร้างสูตรก่อน',
        })}
      </Muted>
    )
  return (
    <View style={{ gap: 6 }}>
      {kinds.map(a => (
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
                onPress={() => onPick({ additive: a, grade: c.grade })}
              />
            ))}
        </Row>
      ))}
    </View>
  )
}
