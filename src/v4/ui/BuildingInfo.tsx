import { BuildingSprite } from '../render/BuildingSprite'
import { useState } from 'react'
import { Text, View, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { type, ui } from './theme'
import { overhaul } from '../sim/actions'
import { wears, conditionOf, overhaulCost, repairing } from '../sim/systems/plant'
import { featureOn } from '../data/features'
import { SPEC, WEAR } from '../data/balance'
import { useGame } from '../store/useGame'
import { buildingDef } from '../data/buildings'
import { infoFor } from '../data/buildingInfo'
import { combos } from '../data/combos'
import { jobs } from '../data/staff'
import { YARD, B } from '../data/balance'
import { upgrade, demolish } from '../sim/actions'
import { upgradeCost } from '../sim/systems/yardInfo'
import { comboLeads } from '../sim/systems/combos'
import { recipeOf, recipeGrade, formulaOf } from '../sim/systems/blending'
import { formulaName } from '../sim/systems/research'
import { bases } from '../data/bases'
import { effectText } from './RecipeBook'
import { ResearchPanel } from './ResearchPanel'
import { PlantCard } from './PlantCard'
import { Card, Section, Row, Bar, SmallButton, Muted, Chip } from './cards'
import { text } from '../i18n'

/** Tapped building: level and condition, the one thing it does, four big actions, details on demand. */
export function BuildingInfo({
  uid,
  onMove,
  onClose,
  onRecipe,
}: {
  uid: string
  onMove: () => void
  onClose: () => void
  onRecipe: () => void
}) {
  const { state: s, dispatch } = useGame()
  const [confirmDemolish, setConfirmDemolish] = useState(false)
  const [details, setDetails] = useState(false)
  const b = s.yard.buildings.find(b => b.uid === uid)
  if (!b) return null
  const d = buildingDef(b.defId)
  const active = s.activeCombos.filter(a => a.members.includes(b.uid))
  const staff = s.staff.filter(p => p.assignedTo === b.uid)
  const leads = comboLeads(s, b.defId).filter(l => !active.some(a => a.id === l.combo.id))
  const cost = upgradeCost(b)
  const worn = wears(b) && featureOn(s, 'wear')
  const c = Math.round(conditionOf(b))
  const fix = overhaulCost(b)
  const specOpen = wears(b) && !b.spec && b.level >= SPEC.minLevel && featureOn(s, 'spec')
  const partner = (id: string) =>
    id === 'process'
      ? text({ en: 'any process unit', th: 'หน่วยผลิตใดก็ได้' })
      : text(buildingDef(id).name)
  const action = (
    label: { en: string; th: string },
    price: string,
    onPress: () => void,
    opts: { disabled?: boolean; color?: string } = {},
  ) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text(label)} ${price}`}
      disabled={opts.disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        height: 62,
        borderWidth: 2,
        borderColor: ui.ink,
        borderRadius: 8,
        backgroundColor: opts.color ?? ui.paper,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: opts.disabled ? 0.4 : 1,
        boxShadow: '0px 2px 0px #14110F',
        transform: pressed ? [{ translateY: 2 }] : undefined,
      })}
    >
      <Text style={[type.body, { fontSize: 14 }]}>{text(label)}</Text>
      <Text style={[type.num, { fontSize: 13 }]}>{price}</Text>
    </Pressable>
  )
  const short = (n: number) =>
    n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : n >= 1e4
        ? `$${Math.round(n / 1000)}K`
        : `$${Math.round(n).toLocaleString()}`
  return (
    <>
      <Row gap={10}>
        <BuildingSprite id={b.defId} level={b.level} size={56} />
        <View style={{ flex: 1, gap: 4 }}>
          <Row gap={6}>
            <Chip label={`Lv ${b.level}/${YARD.maxLevel}`} color="#FFE7A3" />
            <Text style={type.small}>
              {text({ en: 'upkeep', th: 'ค่าบำรุง' })} $
              {Math.round(
                b.cost * B.upkeepRate * (1 + B.upkeepPerLevel * (b.level - 1)),
              ).toLocaleString()}
              {text({ en: '/mo', th: '/ด.' })}
            </Text>
          </Row>
          {worn && (
            <Row gap={6}>
              <Text style={type.small}>{text({ en: 'Condition', th: 'สภาพ' })}</Text>
              <Bar
                value={c / 100}
                color={c < WEAR.broken ? '#E2483D' : c < WEAR.worn ? '#F2C230' : '#2FB38E'}
                height={8}
              />
              <Text style={[type.small, { color: ui.ink }]}>
                {repairing(s, b) ? text({ en: 'repairing', th: 'กำลังซ่อม' }) : `${c}%`}
              </Text>
            </Row>
          )}
        </View>
      </Row>

      {b.defId === 'blend' &&
        (() => {
          const r = recipeOf(s, b)
          const grade = recipeGrade(s, r)
          const f = formulaOf(s, r.formula)
          return (
            <Pressable
              accessibilityRole="button"
              onPress={onRecipe}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 10,
                borderWidth: 2,
                borderColor: ui.ink,
                borderRadius: 8,
                backgroundColor: pressed ? '#FFE7A3' : '#FFFFFF',
              })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderWidth: 2,
                  borderRadius: 6,
                  backgroundColor: '#F7DC7A',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={type.numBig}>{grade}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={type.small}>{text({ en: 'Mixing now', th: 'กำลังผสม' })}</Text>
                <Text style={type.title} numberOfLines={1}>
                  {f ? text(formulaName(f)) : text(bases.find(x => x.id === r.base)!.name)}
                </Text>
              </View>
              <Text style={type.body}>{text({ en: 'Change', th: 'เปลี่ยน' })}</Text>
              <ChevronRight size={18} color={ui.ink} />
            </Pressable>
          )
        })()}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {action(
          b.level >= YARD.maxLevel
            ? { en: 'Max level', th: 'เต็มแล้ว' }
            : { en: 'Upgrade', th: 'อัปเกรด' },
          b.level >= YARD.maxLevel ? '—' : short(cost),
          () => dispatch(s => upgrade(s, b.uid)),
          { disabled: b.level >= YARD.maxLevel || s.money < cost, color: ui.gold },
        )}
        {worn &&
          action(
            { en: 'Overhaul', th: 'ซ่อม' },
            short(fix),
            () => dispatch(s => overhaul(s, b.uid)),
            {
              disabled: repairing(s, b) || c >= 100 || s.money < fix,
            },
          )}
        {action({ en: 'Move', th: 'ย้าย' }, short(YARD.moveCost), onMove, {
          disabled: s.money < YARD.moveCost,
        })}
        {action(
          { en: 'Demolish', th: 'รื้อ' },
          `+${short(b.cost * YARD.refund)}`,
          () => setConfirmDemolish(true),
          { color: '#FFF1EE' },
        )}
      </View>

      {confirmDemolish && (
        <Card tone="warn">
          <Text style={type.body}>
            {text({
              en: 'Demolish this building? Its combos will be recalculated.',
              th: 'รื้ออาคารนี้หรือไม่? คอมโบที่เกี่ยวข้องจะคำนวณใหม่',
            })}
          </Text>
          <Row>
            <SmallButton
              label={text({ en: 'Confirm demolish', th: 'ยืนยันรื้อ' })}
              color="#F2A49B"
              onPress={() => {
                dispatch(s => demolish(s, b.uid))
                onClose()
              }}
            />
            <SmallButton
              label={text({ en: 'Cancel', th: 'ยกเลิก' })}
              color="#FFF6E3"
              onPress={() => setConfirmDemolish(false)}
            />
          </Row>
        </Card>
      )}

      {b.defId === 'lab' && <ResearchPanel labUid={b.uid} />}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: details }}
        onPress={() => setDetails(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44 }}
      >
        <Text
          style={[type.small, { flex: 1, color: specOpen ? '#B42318' : ui.muted }]}
          numberOfLines={2}
        >
          {specOpen
            ? text({
                en: 'Pick a specialisation in details',
                th: 'เลือกสายพัฒนาได้แล้ว ดูในรายละเอียด',
              })
            : text({
                en: `Combos ${active.length} · staff ${staff.length}${leads[0] ? ` · near ${leads[0].partners.map(partner).join(' + ')} for a combo` : ''}`,
                th: `คอมโบ ${active.length} · คน ${staff.length}${leads[0] ? ` · วางใกล้${leads[0].partners.map(partner).join(' + ')}ได้คอมโบ` : ''}`,
              })}
        </Text>
        <Text style={[type.body, { color: ui.navy, textDecorationLine: 'underline' }]}>
          {details ? text({ en: 'Hide', th: 'ซ่อน' }) : text({ en: 'Details', th: 'รายละเอียด' })}
        </Text>
      </Pressable>

      {details && (
        <>
          <Text style={type.body}>{text(infoFor(b.defId))}</Text>
          <PlantCard uid={b.uid} />
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
                  {text({
                    en: 'Nobody yet · assign from Staff',
                    th: 'ยังไม่มี · มอบหมายได้ที่หน้าคน',
                  })}
                </Muted>
              )}
            </>
          )}
          <Section>{text({ en: 'Combos', th: 'คอมโบ' })}</Section>
          {active.map(a => {
            const c = combos.find(c => c.id === a.id)!
            return (
              <Muted key={a.id}>
                • {text(c.name)}: {effectText(c)}
              </Muted>
            )
          })}
          {leads.map(l => (
            <Muted key={l.combo.id}>
              {text({
                en: `Try near ${l.partners.map(partner).join(' + ')} → ${l.known ? l.combo.name.en : 'a combo'}`,
                th: `ลองวางใกล้ ${l.partners.map(partner).join(' + ')} → ${l.known ? l.combo.name.th : 'เกิดคอมโบ'}`,
              })}
            </Muted>
          ))}
          {!active.length && !leads.length && (
            <Muted>{text({ en: 'No combo here yet.', th: 'ยังไม่มีคอมโบที่ตึกนี้' })}</Muted>
          )}
          <Muted>
            {d.w}×{d.h} ·{' '}
            {text({
              en: 'Upgrading adds +25% output per level.',
              th: 'อัปเกรดเพิ่มกำลังผลิต +25% ต่อเลเวล',
            })}
          </Muted>
        </>
      )}
    </>
  )
}
