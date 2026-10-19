import { baseAvailable } from '../sim/systems/investments'
import { Text } from 'react-native'
import { bases, type BaseId } from '../data/bases'
import { additives, type AdditiveId } from '../data/additives'
import { pairCompat, type Compat } from '../data/compatibility'
import { useGame } from '../store/useGame'
import { selectBlend, discardLot } from '../sim/actions'
import { predictedScore, gradeFor } from '../sim/systems/blending'
import { Button, styles } from './controls'
import { text } from '../i18n'
import type { GameState } from '../sim/types'

const compatColors: Record<Compat, string> = {
  S: '#F2C230',
  A: '#2FB38E',
  B: '#4FA3D9',
  C: '#D8D2C4',
  D: '#F08A24',
  F: '#E2483D',
}
const firstTry = { label: 'NEW', color: '#E36BB0' }

// Badge for a recipe: its compatibility letter once tried, otherwise a "first try" marker.
function recipeBadge(s: GameState, base: BaseId, additive: AdditiveId | null) {
  if (!s.triedPairs.includes(`${base}:${additive ?? 'none'}`)) return firstTry
  const compat = pairCompat(base, additive)
  return { label: compat, color: compatColors[compat] }
}

export function BlendPanel() {
  const { state: s, dispatch } = useGame()
  const score = predictedScore(s)
  const baseName = text(bases.find(b => b.id === s.blend.base)!.name)
  return (
    <>
      <Text style={styles.heading}>
        {baseName} +{' '}
        {s.blend.additive
          ? text(additives.find(a => a.id === s.blend.additive)!.name)
          : text({ en: 'no additive', th: 'ไม่ใส่สาร' })}{' '}
        → {gradeFor(score)} ({score.toFixed(0)})
      </Text>
      <Text style={styles.text}>
        {text({
          en: 'NEW = first try (+10 Fame). Letters show how well a pair goes together.',
          th: 'NEW = ลองครั้งแรก (+10 ชื่อเสียง) ตัวอักษรบอกว่าคู่นี้เข้ากันแค่ไหน',
        })}
      </Text>
      <Text style={styles.text}>{text({ en: 'Base', th: 'ฐาน' })}</Text>
      {bases
        .filter(b => baseAvailable(s, b.id))
        .map(b => (
          <Button
            key={b.id}
            label={b.name}
            selected={s.blend.base === b.id}
            badge={recipeBadge(s, b.id, s.blend.additive)}
            onPress={() => dispatch(s => selectBlend(s, b.id, s.blend.additive))}
          />
        ))}
      <Text style={styles.text}>{text({ en: 'Additive', th: 'สารเติมแต่ง' })}</Text>
      <Button
        label={{ en: 'No additive', th: 'ไม่ใส่สารเติมแต่ง' }}
        selected={s.blend.additive === null}
        badge={recipeBadge(s, s.blend.base, null)}
        onPress={() => dispatch(s => selectBlend(s, s.blend.base, null))}
      />
      {additives
        .filter(a => s.unlockedAdditives.includes(a.id))
        .map(a => (
          <Button
            key={a.id}
            label={a.name}
            selected={s.blend.additive === a.id}
            badge={recipeBadge(s, s.blend.base, a.id)}
            onPress={() => dispatch(s => selectBlend(s, s.blend.base, a.id))}
          />
        ))}
      {!s.unlockedAdditives.length && (
        <Text style={styles.text}>
          {text({
            en: 'Unlock additives by training staff or from regular customers’ gifts.',
            th: 'ปลดสารเติมแต่งได้จากการฝึกพนักงาน หรือของขวัญจากลูกค้าประจำ',
          })}
        </Text>
      )}
      <Text style={styles.text}>
        {text({ en: 'Ready to blend', th: 'พร้อมผสม' })}: {baseName}{' '}
        {Math.floor(s.baseStock[s.blend.base])} · {text({ en: 'Stored lots', th: 'ล็อตในถัง' })}{' '}
        {s.tanks.length}
      </Text>
      {s.tanks.map(l => (
        <Button
          key={l.uid}
          label={{
            en: `Discard ${l.base} ${l.grade} · ${l.units}`,
            th: `ระบาย ${text(bases.find(b => b.id === l.base)!.name)} ${l.grade} · ${l.units} หน่วย`,
          }}
          onPress={() => dispatch(s => discardLot(s, l.uid))}
        />
      ))}
    </>
  )
}
