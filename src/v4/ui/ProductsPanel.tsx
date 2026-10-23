import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { ChevronLeft, Pencil } from 'lucide-react-native'
import { useGame } from '../store/useGame'
import { bases, type BaseId } from '../data/bases'
import { additives } from '../data/additives'
import { FORMULA_LAB, SALES } from '../data/balance'
import { selectBlend, discardLot, renameFormula } from '../sim/actions'
import {
  blendStations,
  recipeOf,
  formulaOf,
  tankCapacity,
  tankUnits,
} from '../sim/systems/blending'
import { formulaName, NAME_MAX } from '../sim/systems/research'
import { stockOf, gradeIndex } from '../sim/systems/formulaLab'
import { baseAvailable } from '../sim/systems/investments'
import { demandOf, trending } from '../sim/systems/market'
import { featureOn } from '../data/features'
import { productAccent } from '../render/palette'
import { type, ui } from './theme'
import { Row, SmallButton, Muted, GradeChip, Bar } from './cards'
import { ProductTile, cardPrice, cardTitle, gradeFill, lotsLeft, linesMaking } from './ProductCard'
import { text } from '../i18n'
import type { Formula, GameState } from '../sim/types'

const baseName = (id: string) => text(bases.find(b => b.id === id)!.name)
const addName = (id: string) => text(additives.find(a => a.id === id)!.name)
type Pick = { key: string | null; base: BaseId }

/** Products: pick a production line, then tap a product card; a tap opens the card's detail. */
export function ProductsPanel({
  station: initial,
  onUpgrade,
}: {
  station?: string
  /** Open the Lab menu to upgrade this card. */
  onUpgrade: (key: string) => void
}) {
  const { state: s, dispatch } = useGame()
  const lines = blendStations(s)
  const [picked, setPicked] = useState(initial)
  const [filter, setFilter] = useState<BaseId | 'all'>('all')
  const [detail, setDetail] = useState<Pick | null>(null)
  const line = lines.find(b => b.uid === picked) ?? lines[0]
  const lineNo = line ? lines.indexOf(line) + 1 : 0
  const r = line ? recipeOf(s, line) : s.blend
  const make = (p: Pick) => dispatch(s => selectBlend(s, p.base, p.key, line?.uid))
  const available = bases.filter(b => baseAvailable(s, b.id))
  const cards = s.formulaLab.formulas
    .filter(f => (filter === 'all' || f.base === filter) && baseAvailable(s, f.base))
    .sort(
      (a, b) =>
        gradeIndex(b.grade) - gradeIndex(a.grade) ||
        cardPrice(s, b, b.base) - cardPrice(s, a, a.base),
    )
  const market = featureOn(s, 'market')

  if (detail) {
    const f = detail.key ? formulaOf(s, detail.key) : null
    return (
      <Detail
        s={s}
        formula={f}
        base={detail.base}
        line={lineNo}
        making={line ? r.formula === detail.key && r.base === detail.base : false}
        onBack={() => setDetail(null)}
        onMake={() => {
          make(detail)
          setDetail(null)
        }}
        onUpgrade={f ? () => onUpgrade(f.key) : undefined}
      />
    )
  }
  return (
    <>
      {lines.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {lines.map((b, i) => {
            const on = b.uid === line?.uid
            const lr = recipeOf(s, b)
            const lf = formulaOf(s, lr.formula)
            const out = lf ? lotsLeft(s, lf) <= 0 : false
            const g = lf && !out ? lf.grade : FORMULA_LAB.plainGrade
            return (
              <Pressable
                key={b.uid}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setPicked(b.uid)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  borderWidth: 1.5,
                  borderRadius: 18,
                  paddingLeft: 10,
                  paddingRight: 4,
                  height: 36,
                  maxWidth: 220,
                  backgroundColor: on ? ui.ink : '#FFFFFF',
                }}
              >
                <View
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 5,
                    backgroundColor: productAccent[lr.base] ?? '#D8D2C4',
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={[type.body, { fontSize: 13, flexShrink: 1 }, on && { color: ui.paper }]}
                >
                  {text({ en: `Line ${i + 1}`, th: `สาย ${i + 1}` })} ·{' '}
                  {lf ? cardTitle(lf, lr.base) : baseName(lr.base)}
                </Text>
                <View
                  style={{
                    minWidth: 26,
                    height: 26,
                    borderRadius: 13,
                    borderWidth: 1.5,
                    borderColor: ui.ink,
                    backgroundColor: gradeFill[g],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={[type.num, { fontSize: 12 }]}>{g}</Text>
                </View>
              </Pressable>
            )
          })}
        </ScrollView>
      ) : (
        <Muted>
          {text({
            en: 'Build a Production Line to make products.',
            th: 'สร้างสายการผลิตก่อน เพื่อผลิตสินค้า',
          })}
        </Muted>
      )}
      <Text style={type.small}>
        {lines.length > 1
          ? text({
              en: `Tap a card to see it · making on line ${lineNo}`,
              th: `แตะการ์ดเพื่อดูรายละเอียด · กำลังเลือกให้สาย ${lineNo}`,
            })
          : text({ en: 'Tap a card to see it', th: 'แตะการ์ดเพื่อดูรายละเอียด' })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6 }}
      >
        {(['all', ...available.map(b => b.id)] as const).map(id => {
          const on = filter === id
          const d = id === 'all' ? 1 : demandOf(s, id)
          const note =
            id === 'all'
              ? null
              : trending(s, id)
                ? { t: text({ en: '×1.5', th: 'กระแส' }), c: '#8A5A00' }
                : market && d < 0.95
                  ? { t: `${Math.round(d * 100)}%`, c: d < 0.75 ? '#B42318' : ui.muted }
                  : null
          return (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
              onPress={() => setFilter(id)}
              style={{
                height: 30,
                paddingHorizontal: 10,
                borderWidth: 1.5,
                borderRadius: 15,
                backgroundColor: on ? ui.navy : '#FFFFFF',
                alignItems: 'center',
                flexDirection: 'row',
                gap: 5,
              }}
            >
              {id !== 'all' && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: productAccent[id] ?? '#D8D2C4',
                  }}
                />
              )}
              <Text style={[type.body, { fontSize: 13 }, on && { color: ui.paper }]}>
                {id === 'all' ? text({ en: 'All', th: 'ทั้งหมด' }) : baseName(id)}
              </Text>
              {note && (
                <Text style={[type.small, { fontSize: 11, color: on ? ui.paper : note.c }]}>
                  {note.t}
                </Text>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 8,
        }}
      >
        {cards.map(f => (
          <ProductTile
            key={f.key}
            s={s}
            formula={f}
            base={f.base}
            selected={r.formula === f.key}
            onPress={() => setDetail({ key: f.key, base: f.base })}
          />
        ))}
        {available
          .filter(b => filter === 'all' || filter === b.id)
          .map(b => (
            <ProductTile
              key={`plain:${b.id}`}
              s={s}
              formula={null}
              base={b.id}
              selected={r.formula === null && r.base === b.id}
              onPress={() => setDetail({ key: null, base: b.id })}
            />
          ))}
      </View>
      <Muted>
        {text({
          en: 'New products and upgrades are made in the Lab menu.',
          th: 'สินค้าใหม่และการอัปเกรด ทำได้ที่เมนูแล็บ',
        })}
      </Muted>
      <Tanks s={s} />
    </>
  )
}

function Detail({
  s,
  formula: f,
  base,
  line,
  making,
  onBack,
  onMake,
  onUpgrade,
}: {
  s: GameState
  formula: Formula | null
  base: BaseId
  line: number
  making: boolean
  onBack: () => void
  onMake: () => void
  onUpgrade?: () => void
}) {
  const { dispatch } = useGame()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(f?.name ?? '')
  const g = f?.grade ?? FORMULA_LAB.plainGrade
  const left = f ? lotsLeft(s, f) : Infinity
  const out = left <= 0
  const lines = linesMaking(s, f, base)
  const save = () => {
    if (f) dispatch(s => renameFormula(s, f.key, draft))
    setEditing(false)
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        hitSlop={6}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' }}
      >
        <ChevronLeft size={18} color={ui.navy} />
        <Text style={[type.body, { color: ui.navy }]}>
          {text({ en: 'All products', th: 'สินค้าทั้งหมด' })}
        </Text>
      </Pressable>
      <View
        style={{
          borderWidth: 2,
          borderColor: ui.ink,
          borderRadius: 10,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        }}
      >
        <View style={{ height: 8, backgroundColor: productAccent[base] ?? '#D8D2C4' }} />
        <View style={{ flexDirection: 'row', gap: 12, padding: 10, alignItems: 'center' }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              borderWidth: 2,
              borderColor: ui.ink,
              backgroundColor: out ? ui.inset : gradeFill[g],
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[type.numBig, { fontSize: 26 }, out && { color: ui.muted }]}>{g}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={type.small}>
              {f?.secret ? '✨ ' : ''}
              {baseName(base)}
            </Text>
            {editing ? (
              <View style={{ gap: 4 }}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={save}
                  maxLength={NAME_MAX}
                  autoFocus
                  placeholder={f ? text(formulaName({ ...f, name: null })) : ''}
                  style={[
                    type.body,
                    { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
                  ]}
                />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <SmallButton label={text({ en: 'Save', th: 'บันทึก' })} onPress={save} />
                  <SmallButton
                    label={text({ en: 'Cancel', th: 'ยกเลิก' })}
                    color="#FFF6E3"
                    onPress={() => setEditing(false)}
                  />
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text({ en: 'Rename', th: 'ตั้งชื่อ' })}
                disabled={!f}
                hitSlop={6}
                onPress={() => {
                  setDraft(f?.name ?? '')
                  setEditing(true)
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Text style={[type.title, { flexShrink: 1 }]}>
                  {f ? text(formulaName(f)) : text({ en: 'Plain', th: 'ธรรมดา' })}
                </Text>
                {f && <Pencil size={14} color={ui.muted} />}
              </Pressable>
            )}
            <Text style={type.num}>
              ${cardPrice(s, f, base).toLocaleString()}
              <Text style={type.small}> {text({ en: '/ truck', th: '/ คัน' })}</Text>
            </Text>
          </View>
        </View>
        <View style={{ paddingHorizontal: 10, paddingBottom: 10, gap: 6 }}>
          {f && f.catalysts.length > 0 ? (
            f.catalysts.map(a => {
              const n = stockOf(s.formulaLab, a)
              return (
                <View key={a} style={{ gap: 2 }}>
                  <Row>
                    <Text style={[type.body, { flex: 1, fontSize: 14 }]}>{addName(a)}</Text>
                    <Text style={[type.small, n < 1 && { color: '#B42318' }]}>
                      ×{n} ·{' '}
                      {text({
                        en: `~${n * FORMULA_LAB.production.lotsPerUnit} lots`,
                        th: `ผลิตได้ ~${n * FORMULA_LAB.production.lotsPerUnit} ล็อต`,
                      })}
                    </Text>
                  </Row>
                  <Bar
                    value={Math.min(1, n / 20)}
                    color={n < 1 ? '#E2483D' : n < 3 ? '#F2C230' : '#2FB38E'}
                    height={6}
                  />
                </View>
              )
            })
          ) : (
            <Muted>
              {text({
                en: 'A plain product needs no catalysts. Develop a card in the Lab for better grades.',
                th: 'สินค้าธรรมดาไม่ต้องใช้สารเร่ง อยากได้เกรดดีขึ้นให้พัฒนาการ์ดที่แล็บ',
              })}
            </Muted>
          )}
          {out && (
            <Muted>
              {text({
                en: `Out of catalyst: lines make plain ${FORMULA_LAB.plainGrade} lots until you research more.`,
                th: `สารเร่งหมด: สายการผลิตจะได้เกรด ${FORMULA_LAB.plainGrade} จนกว่าจะวิจัยสารเร่งเพิ่ม`,
              })}
            </Muted>
          )}
          <Text style={type.small}>
            {lines.length
              ? text({
                  en: `Made on line ${lines.join(', ')}`,
                  th: `กำลังผลิตที่สาย ${lines.join(', ')}`,
                })
              : text({ en: 'Not being made', th: 'ยังไม่มีสายไหนผลิต' })}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {line > 0 && (
          <View style={{ flex: 1 }}>
            <SmallButton
              label={
                making
                  ? text({ en: `Line ${line} is making this`, th: `สาย ${line} ผลิตอยู่แล้ว` })
                  : text({ en: `Make on line ${line}`, th: `ผลิตที่สาย ${line}` })
              }
              disabled={making}
              onPress={onMake}
            />
          </View>
        )}
        {onUpgrade && (
          <View style={{ flex: 1 }}>
            <SmallButton
              label={text({ en: 'Upgrade in Lab', th: 'อัปเกรดที่แล็บ' })}
              color="#FFF6E3"
              onPress={onUpgrade}
            />
          </View>
        )}
      </View>
    </>
  )
}

function Tanks({ s }: { s: GameState }) {
  const { dispatch } = useGame()
  const [open, setOpen] = useState(false)
  const capacity = tankCapacity(s)
  const used = tankUnits(s)
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36 }}
      >
        <Text style={type.small}>{text({ en: 'Tanks', th: 'ถัง' })}</Text>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            height: 12,
            borderWidth: 1.5,
            borderRadius: 4,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            borderColor: used >= capacity * SALES.clearanceFill ? '#B42318' : ui.ink,
          }}
        >
          {s.tanks.map(l => (
            <View
              key={l.uid}
              style={{
                width: `${(l.units / Math.max(capacity, 1)) * 100}%`,
                backgroundColor: productAccent[l.base] ?? '#D8D2C4',
                borderRightWidth: 1,
              }}
            />
          ))}
        </View>
        <Text style={[type.num, { fontSize: 13 }]}>
          {Math.round(used).toLocaleString()}/{Math.round(capacity).toLocaleString()}
        </Text>
        <Text style={type.body}>{open ? '▴' : '▾'}</Text>
      </Pressable>
      {open && (
        <>
          {used >= capacity * SALES.clearanceFill && (
            <Muted>
              {text({
                en: 'Nearly full: buyers take low-grade lots at half price. Build tanks or discard.',
                th: 'เกือบเต็ม: ล็อตเกรดต่ำจะถูกขายลดครึ่งราคา สร้างถังเพิ่มหรือระบายทิ้งได้',
              })}
            </Muted>
          )}
          {s.tanks.map(l => {
            const lf = formulaOf(s, l.formula)
            return (
              <Row key={l.uid}>
                <Text style={[type.body, { flex: 1, fontSize: 14 }]} numberOfLines={1}>
                  {lf ? text(formulaName(lf)) : baseName(l.base)} · {l.units}
                </Text>
                <GradeChip grade={l.grade} />
                <SmallButton
                  label={text({ en: 'Discard', th: 'ระบาย' })}
                  color="#FFF6E3"
                  onPress={() => dispatch(s => discardLot(s, l.uid))}
                />
              </Row>
            )
          })}
        </>
      )}
    </>
  )
}
