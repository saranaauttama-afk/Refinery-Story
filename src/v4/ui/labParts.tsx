// Pieces shared by the Formula Lab and Product Lab sheets.
import { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { additives } from '../data/additives'
import { synergies, synergyKey, secretFormulas } from '../data/formulaLab'
import { hintText } from '../sim/systems/research'
import { gradeIndex } from '../sim/systems/formulaLab'
import { type, ui } from './theme'
import { Row, Muted, GradeChip, Chip } from './cards'
import { text } from '../i18n'
import type { GameState } from '../sim/types'

export const addName = (id: string) => text(additives.find(a => a.id === id)!.name)
/** First year a table reaches a value (year tables repeat their last entry). */
export const firstYear = <T,>(table: readonly T[], ok: (v: T) => boolean) => {
  const i = table.findIndex(ok)
  return i < 0 ? null : i + 1
}

export function Stock({ s, defaultOpen = false }: { s: GameState; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
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

export function Book({ s, defaultOpen = false }: { s: GameState; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const good = synergies.filter(x => x.kind === 'good')
  const knownGood = good.filter(x => s.formulaLab.knownSynergies.includes(synergyKey(x.a, x.b)))
  const secretsFound = secretFormulas.filter(x =>
    s.formulaLab.formulas.some(f => f.secret === x.id),
  )
  return (
    <>
      <Fold
        label={text({
          en: `Lab book · good pairs ${knownGood.length}/${good.length} · secrets ${secretsFound.length}/${secretFormulas.length}`,
          th: `สมุดแล็บ · คู่เข้ากัน ${knownGood.length}/${good.length} · สูตรลับ ${secretsFound.length}/${secretFormulas.length}`,
        })}
        open={open}
        onPress={() => setOpen(v => !v)}
      />
      {open && (
        <>
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
export const openHints = (s: GameState) =>
  s.formulaLab.hints.filter(h =>
    h.startsWith('syn:')
      ? !s.formulaLab.knownSynergies.includes(h.slice(4))
      : !s.formulaLab.formulas.some(f => `secret:${f.secret}` === h),
  )

export function Choice({
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

export function Fold({
  label,
  open,
  onPress,
}: {
  label: string
  open: boolean
  onPress: () => void
}) {
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

/** Progress of a running lab job. */
export function JobCard({
  title,
  progress,
  weeks,
}: {
  title: string
  progress: number
  weeks: number
}) {
  return (
    <View
      style={{
        gap: 6,
        padding: 10,
        borderWidth: 2,
        borderRadius: 8,
        borderColor: ui.ink,
        backgroundColor: '#FFFFFF',
      }}
    >
      <Text style={type.title}>{title}</Text>
      <View style={{ height: 10, borderWidth: 2, borderRadius: 4, overflow: 'hidden' }}>
        <View
          style={{
            width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            height: '100%',
            backgroundColor: '#4FA3D9',
          }}
        />
      </View>
      <Muted>{text({ en: `${weeks} weeks left`, th: `เหลือ ${weeks} สัปดาห์` })}</Muted>
    </View>
  )
}
