import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { advertise } from '../sim/actions'
import { adCost, advertised, demandOf, trending } from '../sim/systems/market'
import { baseAvailable } from '../sim/systems/investments'
import { bases, type BaseId } from '../data/bases'
import { ADS, B } from '../data/balance'
import { styles } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted } from './cards'
import { text } from '../i18n'

/** Market demand per product, with an ad campaign button. */
export function AdsSection() {
  const { state: s, dispatch } = useGame()
  const cost = adCost(s)
  return (
    <>
      <Section>{text({ en: 'Market & ads', th: 'ตลาดและโฆษณา' })}</Section>
      <Muted>
        {text({
          en: `Selling one product a lot cools its demand. An ad ($${cost.toLocaleString()}) resets it and adds ×${ADS.boost} for a month.`,
          th: `ขายชนิดเดียวเยอะ ตลาดจะเบื่อ โฆษณา ($${cost.toLocaleString()}) ทำให้ตลาดกลับมาเต็ม และ ×${ADS.boost} นาน 1 เดือน`,
        })}
      </Muted>
      <Card>
        {bases
          .filter(b => baseAvailable(s, b.id))
          .map(b => {
            const id = b.id as BaseId
            const d = demandOf(s, id)
            const on = advertised(s, id)
            return (
              <Row key={id}>
                <Text style={[styles.text, { width: 96, fontSize: 13 }]} numberOfLines={1}>
                  {text(b.name)}
                </Text>
                <Bar value={d} color={d < 0.75 ? '#E2483D' : '#2FB38E'} height={8} />
                <View style={{ width: 44, alignItems: 'flex-end' }}>
                  <Text style={[styles.text, { fontSize: 13 }]}>{Math.round(d * 100)}%</Text>
                </View>
                {on ? (
                  <Muted>
                    {text({
                      en: `ad ${Math.ceil(((s.ads[id] ?? 0) - s.tick) / B.ticksPerWeek)}w`,
                      th: `โฆษณา ${Math.ceil(((s.ads[id] ?? 0) - s.tick) / B.ticksPerWeek)} ส.`,
                    })}
                  </Muted>
                ) : (
                  <SmallButton
                    label={text({ en: 'Ad', th: 'โฆษณา' })}
                    color="#FFF6E3"
                    disabled={s.money < cost || !s.opened}
                    onPress={() => dispatch(s => advertise(s, id))}
                  />
                )}
                {trending(s, id) && <Muted>{text({ en: 'trend', th: 'กระแส' })}</Muted>}
              </Row>
            )
          })}
      </Card>
    </>
  )
}
