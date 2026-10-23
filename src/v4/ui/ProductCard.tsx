import { Pressable, Text, View } from 'react-native'
import { bases, type BaseId } from '../data/bases'
import { additives } from '../data/additives'
import { FORMULA_LAB, SALES } from '../data/balance'
import { formulaName } from '../sim/systems/research'
import { stockOf } from '../sim/systems/formulaLab'
import { salePrice } from '../sim/systems/customers'
import { productAccent } from '../render/palette'
import { type, ui } from './theme'
import { text } from '../i18n'
import type { Formula, GameState, Grade } from '../sim/types'

export const gradeFill: Record<string, string> = {
  SS: '#F5B37A',
  S: '#F7DC7A',
  A: '#8ED9C1',
  B: '#9CC9EA',
  C: '#D8D2C4',
  D: '#F2A49B',
}
const addName = (id: string) => text(additives.find(a => a.id === id)!.name)
const baseName = (id: string) => text(bases.find(b => b.id === id)!.name)
/** Lots before a card's scarcest catalyst runs out (lots use one unit each per lotsPerUnit). */
export const lotsLeft = (s: GameState, f: Formula) =>
  f.catalysts.length
    ? Math.min(...f.catalysts.map(a => stockOf(s.formulaLab, a))) *
      FORMULA_LAB.production.lotsPerUnit
    : Infinity
/** Card title. The oil type is printed above it, so automatic names list only the catalysts. */
export const cardTitle = (f: Formula | null, _base: BaseId) =>
  !f
    ? text({ en: 'Plain', th: 'ธรรมดา' })
    : f.name || f.secret || !f.catalysts.length
      ? text(formulaName(f))
      : f.catalysts.map(addName).join(' + ')
/** Price per truck for a card (plain grade when its catalysts are out). */
export function cardPrice(s: GameState, f: Formula | null, base: BaseId) {
  const out = f ? lotsLeft(s, f) <= 0 : false
  const grade = !f || out ? FORMULA_LAB.plainGrade : f.grade
  return Math.round(salePrice(s, { base, grade, secret: f?.secret ?? null }) * SALES.units)
}

/** A product card: colour strip by product, big grade, name, catalysts and price. Plain cards
 *  (no formula) are what a station makes with no product picked. */
export function ProductCard({
  s,
  formula: f,
  base,
  grade,
  selected = false,
  wide = false,
  onPress,
  footer,
}: {
  s: GameState
  formula: Formula | null
  base: BaseId
  /** Override the grade shown (a preview). */
  grade?: string
  selected?: boolean
  wide?: boolean
  onPress?: () => void
  footer?: React.ReactNode
}) {
  const g = grade ?? f?.grade ?? FORMULA_LAB.plainGrade
  const left = f ? lotsLeft(s, f) : Infinity
  const out = left <= 0
  const low = !out && left < FORMULA_LAB.production.lotsPerUnit * 2
  const body = (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: selected ? 3 : 2,
        borderColor: ui.ink,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: selected ? '#FFE7A3' : '#FFFFFF',
        minHeight: 84,
        opacity: out ? 0.75 : 1,
      }}
    >
      <View style={{ width: 8, backgroundColor: productAccent[base] ?? '#D8D2C4' }} />
      <View style={{ flex: 1, padding: 8, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
          <View style={{ flex: 1 }}>
            <Text style={type.small} numberOfLines={1}>
              {f?.secret ? '✨ ' : ''}
              {baseName(base)}
            </Text>
            <Text style={[type.title, { fontSize: wide ? 17 : 15 }]} numberOfLines={2}>
              {selected ? '✓ ' : ''}
              {cardTitle(f, base)}
            </Text>
          </View>
          <View
            style={{
              minWidth: 40,
              height: 40,
              paddingHorizontal: 4,
              borderWidth: 2,
              borderRadius: 6,
              backgroundColor: gradeFill[g.split('–').pop()!] ?? '#D8D2C4',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[type.numBig, { fontSize: g.length > 2 ? 16 : 22 }]}>{g}</Text>
          </View>
        </View>
        {f && f.catalysts.length > 0 && (
          <Text
            style={[type.small, { color: out ? '#B42318' : low ? '#8A5A00' : ui.muted }]}
            numberOfLines={2}
          >
            {out
              ? text({
                  en: `Out of catalyst · makes ${FORMULA_LAB.plainGrade}`,
                  th: `สารเร่งหมด · ผลิตได้ ${FORMULA_LAB.plainGrade}`,
                })
              : f.catalysts.map(a => `${addName(a)} ×${stockOf(s.formulaLab, a)}`).join(' · ')}
          </Text>
        )}
        <Text style={type.num}>
          ${cardPrice(s, f, base).toLocaleString()}
          <Text style={type.small}> {text({ en: '/ truck', th: '/ คัน' })}</Text>
        </Text>
        {footer}
      </View>
    </View>
  )
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        { width: wide ? '100%' : '48.5%' },
        pressed && { transform: [{ translateY: 1 }] },
      ]}
    >
      {body}
    </Pressable>
  ) : (
    <View style={{ width: wide ? '100%' : '48.5%' }}>{body}</View>
  )
}
