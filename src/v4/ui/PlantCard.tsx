import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { overhaul } from '../sim/actions'
import {
  wears,
  conditionOf,
  plantFactor,
  repairing,
  overhaulCost,
  repairRate,
} from '../sim/systems/plant'
import { WEAR, B } from '../data/balance'
import { styles } from './controls'
import { Card, Row, Bar, SmallButton, Muted } from './cards'
import { text } from '../i18n'

/** Condition of a plant, what wear does to it, and the overhaul button. */
export function PlantCard({ uid }: { uid: string }) {
  const { state: s, dispatch } = useGame()
  const b = s.yard.buildings.find(b => b.uid === uid)
  if (!b || !wears(b)) return null
  const c = Math.round(conditionOf(b))
  const factor = plantFactor(s, b)
  const color = c < WEAR.broken ? '#E2483D' : c < WEAR.worn ? '#F2C230' : '#2FB38E'
  const cost = overhaulCost(b)
  const fix = repairRate(s, b)
  return (
    <Card tone={c < WEAR.worn ? 'warn' : undefined}>
      <Row>
        <Text style={[styles.text, { width: 92 }]}>
          {text({ en: 'Condition', th: 'สภาพเครื่อง' })}
        </Text>
        <Bar value={c / 100} color={color} height={10} />
        <Text style={styles.text}>{c}%</Text>
      </Row>
      <Muted>
        {repairing(s, b)
          ? text({
              en: `Overhaul in progress: back in ${Math.ceil(((b.repairUntil ?? 0) - s.tick) / B.ticksPerWeek)} week(s)`,
              th: `กำลังซ่อมใหญ่ กลับมาทำงานในอีก ${Math.ceil(((b.repairUntil ?? 0) - s.tick) / B.ticksPerWeek)} สัปดาห์`,
            })
          : text({
              en: `Output ${Math.round(factor * 100)}% · wears ${WEAR.perMonth}%/month${fix ? `, engineers repair ${fix.toFixed(1)}%/month` : ''}. Below ${WEAR.worn}% output drops; below ${WEAR.broken}% incidents rise.`,
              th: `กำลังผลิต ${Math.round(factor * 100)}% · เสื่อม ${WEAR.perMonth}%/เดือน${fix ? ` วิศวกรซ่อมให้ ${fix.toFixed(1)}%/เดือน` : ''} ต่ำกว่า ${WEAR.worn}% ผลิตลดลง ต่ำกว่า ${WEAR.broken}% เสี่ยงอุบัติเหตุ`,
            })}
      </Muted>
      <View style={{ alignItems: 'flex-start' }}>
        <SmallButton
          label={text({
            en: `Overhaul $${cost.toLocaleString()} (stops 1 week)`,
            th: `ซ่อมใหญ่ $${cost.toLocaleString()} (หยุด 1 สัปดาห์)`,
          })}
          disabled={repairing(s, b) || c >= 100 || s.money < cost}
          onPress={() => dispatch(s => overhaul(s, uid))}
        />
      </View>
    </Card>
  )
}
