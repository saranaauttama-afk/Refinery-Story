import { staffPortrait } from './art'
import { SpriteThumbnail } from '../render/SpriteThumbnail'
import { useMemo } from 'react'
import { workerSprite } from '../render/life'
import { useState } from 'react'
import { Text, View, Pressable, Image } from 'react-native'
import { STAFF } from '../data/balance'
import { useGame } from '../store/useGame'
import { hiring, trainings, jobs } from '../data/staff'
import {
  recruit,
  hire,
  assign,
  fire,
  rehire,
  train,
  levelUp,
  buyManual,
  changeJob,
} from '../sim/actions'
import { staffCap } from '../sim/systems/staff'
import { buildingDef } from '../data/buildings'
import { jobColors } from '../render/life'
import { styles, PanelTabs } from './controls'
import { Card, Section, Row, Bar, SmallButton, Muted, Chip } from './cards'
import { text } from '../i18n'
import type { GameState, Staff } from '../sim/types'

const jobName = (id: string) => text(jobs.find(j => j.id === id)!.name)
const statRows = [
  { key: 'op', en: 'Operation', th: 'ปฏิบัติการ', color: '#F08A24' },
  { key: 'chem', en: 'Chemistry', th: 'เคมี', color: '#3D8FE0' },
  { key: 'mech', en: 'Mechanics', th: 'ช่าง', color: '#9C5BD6' },
  { key: 'safe', en: 'Safety', th: 'ปลอดภัย', color: '#2FB38E' },
] as const
const STAT_SCALE = 80

function Avatar({ job, uid, name }: { job: string; uid: string; name: string }) {
  const portrait = staffPortrait(uid, job, name)
  const commands = useMemo(() => workerSprite(job, 0), [job])
  return (
    <View
      style={{
        width: 52,
        height: 52,
        backgroundColor: '#E7F1F2',
        borderWidth: 2,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      {portrait ? (
        <Image source={portrait} style={{ width: 48, height: 48 }} />
      ) : (
        <SpriteThumbnail commands={commands} cacheKey={`worker:${job}`} size={44} />
      )}
    </View>
  )
}

function Stats({ p }: { p: Staff }) {
  return (
    <View style={{ gap: 2 }}>
      {statRows.map(r => (
        <Row key={r.key} gap={6}>
          <Text style={[styles.text, { width: 72, fontSize: 13 }]}>{text(r)}</Text>
          <Bar value={p.stats[r.key] / STAT_SCALE} color={r.color} height={8} />
          <Text style={[styles.text, { width: 30, fontSize: 13, textAlign: 'right' }]}>
            {Math.round(p.stats[r.key])}
          </Text>
        </Row>
      ))}
    </View>
  )
}

const workplace = (s: GameState, p: Staff) => {
  const b = s.yard.buildings.find(b => b.uid === p.assignedTo)
  return b ? text(buildingDef(b.defId).name) : text({ en: 'No job', th: 'ยังไม่มีงาน' })
}

function StaffCard({
  p,
  expanded,
  onExpand,
}: {
  p: Staff
  expanded: boolean
  onExpand: () => void
}) {
  const { state: s, dispatch } = useGame()
  const [open, setOpen] = useState<'' | 'train' | 'work' | 'more'>('')
  const level = p.jobLevels[p.job]
  if (!expanded)
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: false }}
        onPress={onExpand}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          minHeight: 56,
          paddingHorizontal: 10,
          borderWidth: 2,
          borderRadius: 8,
          backgroundColor: pressed ? '#FFE7A3' : '#FFFFFF',
        })}
      >
        {staffPortrait(p.uid, p.job, p.name) ? (
          <Image
            source={staffPortrait(p.uid, p.job, p.name)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: jobColors[p.job] ?? '#14110F',
            }}
          />
        ) : (
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 2,
              backgroundColor: jobColors[p.job] ?? '#D8D2C4',
            }}
          />
        )}
        <Text style={[styles.text, { flex: 1, fontSize: 14 }]} numberOfLines={1}>
          {p.name} · {jobName(p.job)} Lv{level}
          <Text style={{ color: '#52616B' }}> · {workplace(s, p)}</Text>
        </Text>
        <Text
          style={{
            fontFamily: 'PixelifySans_700Bold',
            fontSize: 13,
            color: p.resting ? '#B42318' : '#14110F',
          }}
        >
          {p.resting ? text({ en: 'rest', th: 'พัก' }) : `${Math.round(p.power)}/${p.maxPower}`}
        </Text>
      </Pressable>
    )
  const levelCost = STAFF.levelRDCost[level] ?? STAFF.levelRD * (level + 1)
  const workBuildings = s.yard.buildings.filter(b =>
    ['process', 'blend', 'support'].includes(buildingDef(b.defId).category),
  )
  const toggle = (k: typeof open) => setOpen(open === k ? '' : k)
  return (
    <Card>
      <Row gap={10}>
        <Avatar job={p.job} uid={p.uid} name={p.name} />
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>{p.name}</Text>
          <Muted>
            {jobName(p.job)} Lv{level} · {workplace(s, p)} · $
            {Math.round(p.salary).toLocaleString()}
            {text({ en: '/mo', th: '/ด.' })}
          </Muted>
        </View>
        <Chip
          label={
            p.resting
              ? text({ en: 'Resting', th: 'พัก' })
              : p.assignedTo
                ? text({ en: 'Working', th: 'ทำงาน' })
                : text({ en: 'Idle', th: 'ว่าง' })
          }
          color={p.resting ? '#E9E2D2' : p.assignedTo ? '#8ED9C1' : '#FFE7A3'}
        />
      </Row>
      <Row gap={6}>
        <Text style={[styles.text, { width: 72, fontSize: 13 }]}>
          {text({ en: 'Power', th: 'พลัง' })}
        </Text>
        <Bar value={p.power / p.maxPower} color="#F2C230" height={8} />
        <Text style={[styles.text, { width: 46, fontSize: 13, textAlign: 'right' }]}>
          {Math.round(p.power)}/{p.maxPower}
        </Text>
      </Row>
      <Stats p={p} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <SmallButton label={text({ en: 'Train', th: 'ฝึก' })} onPress={() => toggle('train')} />
        <SmallButton
          label={text({ en: `Level up ${levelCost} RD`, th: `เลื่อนขั้น ${levelCost} RD` })}
          color="#FFF6E3"
          disabled={level >= STAFF.levelMax || s.rd < levelCost}
          onPress={() => dispatch(s => levelUp(s, p.uid))}
        />
        <SmallButton
          label={text({ en: 'Job', th: 'งาน' })}
          color="#FFF6E3"
          onPress={() => toggle('work')}
        />
        <SmallButton
          label={text({ en: 'More', th: 'อื่น ๆ' })}
          color="#FFF6E3"
          onPress={() => toggle('more')}
        />
      </View>
      {open === 'train' &&
        trainings
          .filter(t => t.rank <= s.rank)
          .map(t => (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              disabled={s.money < t.cost || p.power < t.power}
              onPress={() => dispatch(s => train(s, p.uid, t.id))}
              style={{
                borderWidth: 2,
                borderRadius: 8,
                padding: 8,
                minHeight: 44,
                backgroundColor: '#E7F1F2',
                opacity: s.money < t.cost || p.power < t.power ? 0.4 : 1,
              }}
            >
              <Row>
                <Text style={[styles.text, { flex: 1 }]}>{text(t.name)}</Text>
                <Text style={styles.text}>
                  ${t.cost.toLocaleString()} · {text({ en: 'Power', th: 'พลัง' })} {t.power}
                </Text>
              </Row>
              <Muted>
                {statRows
                  .filter(r => (t as unknown as Record<string, number>)[r.key])
                  .map(
                    r =>
                      `${text(r)} ${(t as unknown as Record<string, number>)[r.key] > 0 ? '+' : ''}${(t as unknown as Record<string, number>)[r.key]}`,
                  )
                  .join(' · ')}
                {(p.trainingCounts[t.id] ?? 0) > 0 &&
                  text({
                    en: ` · done ${p.trainingCounts[t.id]}×`,
                    th: ` · ฝึกแล้ว ${p.trainingCounts[t.id]} ครั้ง`,
                  })}
              </Muted>
            </Pressable>
          ))}
      {open === 'work' && (
        <View style={{ gap: 4 }}>
          {workBuildings.map(b => (
            <SmallButton
              key={b.uid}
              label={`${text(buildingDef(b.defId).name)}${p.assignedTo === b.uid ? ' ✓' : ''}`}
              color={p.assignedTo === b.uid ? '#8ED9C1' : '#FFF6E3'}
              onPress={() => dispatch(s => assign(s, p.uid, b.uid))}
            />
          ))}
          <SmallButton
            label={text({ en: 'Rest (no job)', th: 'พัก (ไม่มอบหมาย)' })}
            color="#FFF6E3"
            onPress={() => dispatch(s => assign(s, p.uid, null))}
          />
        </View>
      )}
      {open === 'more' && (
        <View style={{ gap: 4 }}>
          <Muted>
            {text({
              en: `Career manuals: ${s.careerManuals}. Changing job uses one.`,
              th: `คู่มืออาชีพที่มี: ${s.careerManuals} เล่ม · เปลี่ยนอาชีพใช้ 1 เล่ม`,
            })}
          </Muted>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {jobs
              .filter(j => j.id !== p.job)
              .map(j => (
                <SmallButton
                  key={j.id}
                  label={text(j.name)}
                  color="#FFF6E3"
                  disabled={s.careerManuals < 1}
                  onPress={() => dispatch(s => changeJob(s, p.uid, j.id))}
                />
              ))}
          </View>
          <SmallButton
            label={text({ en: 'Fire', th: 'เลิกจ้าง' })}
            color="#FFF1EE"
            onPress={() => dispatch(s => fire(s, p.uid))}
          />
        </View>
      )}
    </Card>
  )
}

export function StaffPanel() {
  const { state: s, dispatch } = useGame()
  const [tab, setTab] = useState<'team' | 'hire'>('team')
  const [expanded, setExpanded] = useState(s.staff[0]?.uid ?? '')
  const full = s.staff.length >= staffCap(s)
  return (
    <>
      <PanelTabs
        value={tab}
        onChange={setTab}
        color="#3D8FE0"
        options={[
          {
            id: 'team',
            label: {
              en: `Team ${s.staff.length}/${staffCap(s)}`,
              th: `ทีม ${s.staff.length}/${staffCap(s)}`,
            },
          },
          { id: 'hire', label: { en: 'Hire', th: 'จ้างคนใหม่' } },
        ]}
      />
      {tab === 'team' &&
        s.staff.map(p => (
          <StaffCard
            key={p.uid}
            p={p}
            expanded={expanded === p.uid}
            onExpand={() => setExpanded(p.uid)}
          />
        ))}
      {tab === 'hire' && (
        <>
          {full && (
            <Card tone="warn">
              <Text style={styles.text}>
                {text({
                  en: 'Team is full. Rank up to hire more.',
                  th: 'ทีมเต็มแล้ว ขึ้นแรงก์เพื่อจ้างเพิ่ม',
                })}
              </Text>
            </Card>
          )}
          <Section>{text({ en: 'Find candidates', th: 'หาผู้สมัคร (ได้ 3 คนให้เลือก)' })}</Section>
          {hiring
            .filter(d => d.rank <= s.rank)
            .map(d => (
              <Card key={d.id}>
                <Row>
                  <Text style={[styles.text, { flex: 1 }]}>{text(d.name)}</Text>
                  <Muted>{text({ en: `Quality ×${d.quality}`, th: `ฝีมือ ×${d.quality}` })}</Muted>
                  <SmallButton
                    label={`$${d.cost.toLocaleString()}`}
                    disabled={full || s.money < d.cost}
                    onPress={() => dispatch(s => recruit(s, d.id))}
                  />
                </Row>
              </Card>
            ))}
          {s.candidates.length > 0 && (
            <Section>{text({ en: 'Pick one', th: 'เลือก 1 คน' })}</Section>
          )}
          {s.candidates.map(c => (
            <Card key={c.uid}>
              <Row gap={10}>
                <Avatar job={c.job} uid={c.uid} name={c.name} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.heading}>{c.name}</Text>
                  <Muted>
                    {jobName(c.job)} · ${c.salary.toLocaleString()}
                    {text({ en: '/mo', th: '/ด.' })}
                  </Muted>
                </View>
                <SmallButton
                  label={text({ en: 'Hire', th: 'จ้าง' })}
                  color="#2FB38E"
                  disabled={full}
                  onPress={() => dispatch(s => hire(s, c.uid))}
                />
              </Row>
              <Stats p={c} />
            </Card>
          ))}
          {s.merchantUntil > s.tick && (
            <Card>
              <Row>
                <Text style={[styles.text, { flex: 1 }]}>
                  {text({ en: 'Merchant: Career Manual', th: 'พ่อค้าเร่: คู่มืออาชีพ' })}
                </Text>
                <SmallButton
                  label={`$${STAFF.manualCost.toLocaleString()}`}
                  disabled={s.money < STAFF.manualCost}
                  onPress={() => dispatch(buyManual)}
                />
              </Row>
            </Card>
          )}
          {s.firedStaff.length > 0 && (
            <Section>{text({ en: 'Former staff', th: 'พนักงานเก่า' })}</Section>
          )}
          {s.firedStaff.map(p => (
            <Card key={p.uid}>
              <Row>
                <Text style={[styles.text, { flex: 1 }]}>
                  {p.name} · {jobName(p.job)}
                </Text>
                <SmallButton
                  label={text({ en: 'Rehire $5k', th: 'จ้างกลับ $5,000' })}
                  disabled={full}
                  onPress={() => dispatch(s => rehire(s, p.uid))}
                />
              </Row>
            </Card>
          ))}
        </>
      )}
    </>
  )
}
