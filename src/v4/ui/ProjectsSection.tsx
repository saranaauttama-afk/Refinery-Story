import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { buyProject } from '../sim/actions'
import { projectCost, projectLevel, type ProjectId } from '../sim/systems/projects'
import { PROJECTS } from '../data/balance'
import { styles } from './controls'
import { Card, Section, Row, SmallButton, Muted } from './cards'
import { text } from '../i18n'

const info: Record<
  ProjectId,
  { name: { en: string; th: string }; effect: { en: string; th: string } }
> = {
  export: {
    name: { en: 'Overseas export', th: 'ส่งออกต่างประเทศ' },
    effect: {
      en: `Every product sells +${PROJECTS.export.pricePerLevel * 100}% per level`,
      th: `ราคาขายทุกชนิด +${PROJECTS.export.pricePerLevel * 100}% ต่อเลเวล`,
    },
  },
  researchCenter: {
    name: { en: 'Research Center', th: 'ศูนย์วิจัย' },
    effect: {
      en: 'Every lab researches as if one level higher',
      th: 'ห้องทดลองทุกห้องวิจัยเหมือนเลเวลสูงขึ้น 1',
    },
  },
}
const short = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1000).toLocaleString()}K`

/** Big late-game projects that soak up spare cash. */
export function ProjectsSection() {
  const { state: s, dispatch } = useGame()
  return (
    <>
      <Section>{text({ en: 'Big projects', th: 'โปรเจกต์ใหญ่' })}</Section>
      {(Object.keys(PROJECTS) as ProjectId[]).map(id => {
        const p = PROJECTS[id]
        const level = projectLevel(s, id),
          cost = projectCost(s, id)
        const locked = s.rank < p.rank,
          done = level >= p.max
        return (
          <Card key={id} dashed={locked}>
            <Row>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.heading}>
                  {text(info[id].name)}
                  {p.max > 1 ? ` Lv${level}/${p.max}` : ''}
                </Text>
                <Muted>
                  {locked
                    ? text({ en: `Unlocks at rank ${p.rank}`, th: `ปลดที่แรงก์ ${p.rank}` })
                    : text(info[id].effect)}
                </Muted>
              </View>
              {!locked && !done && (
                <SmallButton
                  label={short(cost)}
                  disabled={s.money < cost}
                  onPress={() => dispatch(s => buyProject(s, id))}
                />
              )}
              {done && <Muted>{text({ en: 'Done', th: 'ครบแล้ว' })}</Muted>}
            </Row>
          </Card>
        )
      })}
    </>
  )
}
