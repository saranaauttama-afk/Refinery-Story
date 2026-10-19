import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { buildingDef } from '../data/buildings'
import { infoFor } from '../data/buildingInfo'
import { combos } from '../data/combos'
import { jobs } from '../data/staff'
import { YARD, B } from '../data/balance'
import { upgrade, demolish } from '../sim/actions'
import { upgradeCost, comboLeadsFor } from '../sim/systems/yardInfo'
import { effectText } from './RecipeBook'
import { styles } from './controls'
import { Card, Section, Row, SmallButton, Muted, Chip } from './cards'
import { text } from '../i18n'

export function BuildingInfo({
  uid,
  onMove,
  onClose,
}: {
  uid: string
  onMove: () => void
  onClose: () => void
}) {
  const { state: s, dispatch } = useGame()
  const b = s.yard.buildings.find(b => b.uid === uid)
  if (!b) return null
  const d = buildingDef(b.defId)
  const active = s.activeCombos.filter(a => a.members.includes(b.uid))
  const staff = s.staff.filter(p => p.assignedTo === b.uid)
  const leads = comboLeadsFor(s, b.defId).filter(l => !active.some(a => a.id === l.combo.id))
  const cost = upgradeCost(b)
  return (
    <>
      <Row>
        <Chip label={`Lv ${b.level}/${YARD.maxLevel}`} color="#FFE7A3" />
        <Chip label={`${d.w}×${d.h}`} />
        <Muted>
          {text({ en: 'Upkeep', th: 'ค่าบำรุง' })} $
          {Math.round(b.cost * B.upkeepRate).toLocaleString()}
          {text({ en: '/mo', th: '/ด.' })}
        </Muted>
      </Row>
      <Text style={styles.text}>{text(infoFor(b.defId))}</Text>
      {(['process', 'blend', 'support'] as string[]).includes(d.category) && (
        <>
          <Section>{text({ en: 'Staff here', th: 'พนักงานประจำ' })}</Section>
          {staff.length ? (
            staff.map(p => (
              <Muted key={p.uid}>
                • {p.name} · {text(jobs.find(j => j.id === p.job)!.name)} Lv{p.jobLevels[p.job]}
              </Muted>
            ))
          ) : (
            <Muted>
              {text({ en: 'Nobody yet · assign from Staff', th: 'ยังไม่มี · มอบหมายได้ที่หน้าคน' })}
            </Muted>
          )}
        </>
      )}
      <Section>{text({ en: 'Combos', th: 'คอมโบ' })}</Section>
      {active.map(a => {
        const c = combos.find(c => c.id === a.id)!
        return (
          <Card key={a.id}>
            <Row>
              <Text style={[styles.text, { flex: 1 }]}>{text(c.name)}</Text>
              <Chip label={text({ en: 'Active', th: 'ใช้อยู่' })} color="#8ED9C1" />
            </Row>
            <Muted>{effectText(c)}</Muted>
          </Card>
        )
      })}
      {leads.map(l => (
        <Muted key={l.combo.id}>
          {text({
            en: `Try placing near ${l.partnerNames} → ${l.known ? l.combo.name.en : 'a combo'}`,
            th: `ลองวางใกล้ ${l.partnerNames} → ${l.known ? l.combo.name.th : 'เกิดคอมโบ'}`,
          })}
        </Muted>
      ))}
      {!active.length && !leads.length && (
        <Muted>{text({ en: 'No combo here yet.', th: 'ยังไม่มีคอมโบที่ตึกนี้' })}</Muted>
      )}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={text({ en: 'Move $2k', th: 'ย้าย $2,000' })}
            color="#FFF6E3"
            onPress={onMove}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={
              b.level >= YARD.maxLevel
                ? text({ en: 'Max level', th: 'เลเวลสูงสุด' })
                : text({
                    en: `Upgrade $${Math.round(cost).toLocaleString()}`,
                    th: `อัปเกรด $${Math.round(cost).toLocaleString()}`,
                  })
            }
            disabled={b.level >= YARD.maxLevel || s.money < cost}
            onPress={() => dispatch(s => upgrade(s, b.uid))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={text({
              en: `Demolish +$${Math.round(b.cost * YARD.refund).toLocaleString()}`,
              th: `รื้อ คืน $${Math.round(b.cost * YARD.refund).toLocaleString()}`,
            })}
            color="#FFF1EE"
            onPress={() => {
              dispatch(s => demolish(s, b.uid))
              onClose()
            }}
          />
        </View>
      </View>
      <Muted>
        {text({
          en: 'Upgrading adds +25% output per level and makes the building taller.',
          th: 'อัปเกรดเพิ่มกำลังผลิต +25% ต่อเลเวล และตัวตึกจะใหญ่ขึ้น',
        })}
      </Muted>
    </>
  )
}
