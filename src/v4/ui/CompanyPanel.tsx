import { useState } from 'react'
import { Text, View, Pressable } from 'react-native'
import { ChevronLeft, TrendingUp, Map, Waves, BookOpen, Trophy, Rocket } from 'lucide-react-native'
import { FEATURE_RANK } from '../data/features'
import { type, ui } from './theme'
import { awardList, marketNames, unlockName } from '../i18nLabels'
import { useGame } from '../store/useGame'
import { investments } from '../data/investments'
import { ranks } from '../data/ranks'
import { invest, newGamePlus } from '../sim/actions'
import { Card, Row, Bar, SmallButton, Muted } from './cards'
import { text } from '../i18n'
import { FlowCard } from './FlowCard'
import { ProjectsSection } from './ProjectsSection'

const short = (n: number) =>
  Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : `$${Math.round(n / 1000).toLocaleString()}K`

type View_ = 'invest' | 'flow' | 'awards' | 'projects' | 'events' | 'settings'

/** Company: rank and money at a glance, then a menu of big buttons that open one topic each. */
export function CompanyPanel({
  onLand,
  onCombos,
  initialView,
}: {
  onLand: () => void
  onCombos: () => void
  initialView?: string
}) {
  const { state: s, dispatch, saveError, retrySave } = useGame()
  const [view, setView] = useState<View_ | undefined>(initialView as View_ | undefined)
  const current = ranks[s.rank - 1]
  const next = ranks[s.rank]
  const marketColor =
    s.market.phase === 'boom' ? '#CDEFE3' : s.market.phase === 'bust' ? '#F6D6D2' : '#FFFFFF'
  const tiles: {
    id: View_ | 'land' | 'combos'
    label: { en: string; th: string }
    icon: React.ReactNode
    lockedAt?: number
  }[] = [
    {
      id: 'invest',
      label: { en: 'Invest', th: 'ลงทุน' },
      icon: <TrendingUp size={24} color="#2FB38E" />,
    },
    {
      id: 'land',
      label: { en: 'Land', th: 'ที่ดิน' },
      icon: <Map size={24} color="#1E6E57" />,
      lockedAt: FEATURE_RANK.land,
    },
    {
      id: 'flow',
      label: { en: 'Oil flow', th: 'การไหลน้ำมัน' },
      icon: <Waves size={24} color="#4FA3D9" />,
    },
    {
      id: 'combos',
      label: { en: 'Combos', th: 'ตำราคอมโบ' },
      icon: <BookOpen size={24} color="#B78A00" />,
    },
    {
      id: 'awards',
      label: { en: 'Awards', th: 'รางวัล' },
      icon: <Trophy size={24} color="#B184E3" />,
    },
    {
      id: 'projects',
      label: { en: 'Big projects', th: 'โปรเจกต์ใหญ่' },
      icon: <Rocket size={24} color="#E2483D" />,
      lockedAt: FEATURE_RANK.projects,
    },
  ]
  const back = (
    <Pressable
      accessibilityRole="button"
      onPress={() => setView(undefined)}
      style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, alignSelf: 'flex-start' }}
    >
      <ChevronLeft size={20} color={ui.ink} />
      <Text style={type.body}>{text({ en: 'Company', th: 'กลับหน้าบริษัท' })}</Text>
    </Pressable>
  )
  if (view)
    return (
      <>
        {back}
        {view === 'flow' && <FlowCard />}
        {view === 'projects' && <ProjectsSection />}
        {view === 'invest' &&
          investments.map(d => {
            const level = s.investments[d.id] ?? 0
            const step = d.steps[level]
            const locked = s.rank < d.rank
            return (
              <Card key={d.id} dashed={locked}>
                <Row>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={type.title}>{text(d.name)}</Text>
                    <Row gap={4}>
                      {d.steps.map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 22,
                            height: 10,
                            borderWidth: 2,
                            borderRadius: 3,
                            backgroundColor: i < level ? '#2FB38E' : '#E9E2D2',
                          }}
                        />
                      ))}
                    </Row>
                    <Muted>
                      {locked
                        ? text({ en: `Unlocks at rank ${d.rank}`, th: `ปลดที่แรงก์ ${d.rank}` })
                        : step
                          ? text({ en: `Next: ${step.name.en}`, th: `ถัดไป: ${step.name.th}` })
                          : text({ en: 'Complete', th: 'ครบแล้ว' })}
                    </Muted>
                  </View>
                  {!locked && step && (
                    <SmallButton
                      label={short(step.cost)}
                      disabled={s.money < step.cost}
                      onPress={() => dispatch(s => invest(s, d.id))}
                    />
                  )}
                </Row>
              </Card>
            )
          })}
        {view === 'awards' &&
          (s.history.awards.length ? (
            s.history.awards.map(a => (
              <Card key={a.year}>
                <Text style={type.body}>
                  {text({ en: `Year ${a.year}`, th: `ปี ${a.year}` })}:{' '}
                  {awardList(a.wins) || text({ en: 'no award', th: 'ไม่ได้รางวัล' })}
                </Text>
                <Muted>+{a.fame}★</Muted>
              </Card>
            ))
          ) : (
            <Muted>
              {text({
                en: 'Awards are given at the end of each year.',
                th: 'ประกาศรางวัลตอนปลายทุกปี',
              })}
            </Muted>
          ))}
        {view === 'events' &&
          s.log
            .slice()
            .reverse()
            .map((l, i) => (
              <Text key={i} style={type.body}>
                • {text(l)}
              </Text>
            ))}
        {view === 'settings' && (
          <Row gap={8}>
            <SmallButton
              label={text(
                s.settings.sound
                  ? { en: 'Sound on', th: 'เสียง: เปิด' }
                  : { en: 'Sound off', th: 'เสียง: ปิด' },
              )}
              color="#FFF6E3"
              onPress={() =>
                dispatch(s => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }))
              }
            />
            <SmallButton
              label={text(
                s.settings.haptics
                  ? { en: 'Haptics on', th: 'สั่น: เปิด' }
                  : { en: 'Haptics off', th: 'สั่น: ปิด' },
              )}
              color="#FFF6E3"
              onPress={() =>
                dispatch(s => ({ ...s, settings: { ...s.settings, haptics: !s.settings.haptics } }))
              }
            />
            <SmallButton
              label={text(
                s.settings.ambient !== false
                  ? { en: 'Scenery motion on', th: 'ฉากเคลื่อนไหว: เปิด' }
                  : { en: 'Scenery motion off', th: 'ฉากเคลื่อนไหว: ปิด' },
              )}
              color="#FFF6E3"
              onPress={() =>
                dispatch(s => ({
                  ...s,
                  settings: { ...s.settings, ambient: s.settings.ambient === false },
                }))
              }
            />
          </Row>
        )}
      </>
    )
  return (
    <>
      {saveError && (
        <Card tone="warn">
          <Text style={type.body}>{text(saveError)}</Text>
          <SmallButton
            label={text({ en: 'Retry save', th: 'ลองบันทึกอีกครั้ง' })}
            onPress={retrySave}
          />
        </Card>
      )}
      <Row gap={10}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            borderWidth: 3,
            backgroundColor: ui.gold,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={type.numBig}>{s.rank}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={type.title}>
            {next
              ? text({
                  en: `Rank ${s.rank} → ${s.rank + 1}`,
                  th: `แรงก์ ${s.rank} → ${s.rank + 1}`,
                })
              : text({ en: `Rank ${s.rank} (max)`, th: `แรงก์ ${s.rank} (สูงสุด)` })}
            {next && (
              <Text style={type.small}>
                {' '}
                · {Math.round(s.fame).toLocaleString()}/{next.fame.toLocaleString()} ★
              </Text>
            )}
          </Text>
          {next && (
            <Row>
              <Bar value={(s.fame - current.fame) / (next.fame - current.fame)} color={ui.gold} />
            </Row>
          )}
          {next && (
            <Text style={type.small} numberOfLines={1}>
              {text({ en: 'Next: ', th: 'ปลดถัดไป: ' })}
              {next.unlocks.map(u => text(unlockName(u))).join(', ')}
            </Text>
          )}
        </View>
      </Row>
      <Row gap={8}>
        {(
          [
            [{ en: 'Income this year', th: 'รายได้ปีนี้' }, short(s.year.income), '#FFFFFF'],
            [{ en: 'Expenses', th: 'รายจ่าย' }, short(s.year.expenses), '#FFFFFF'],
            [{ en: 'Market', th: 'ตลาด' }, text(marketNames[s.market.phase]), marketColor],
          ] as const
        ).map(([label, value, bg]) => (
          <View
            key={label.en}
            style={{
              flex: 1,
              borderWidth: 2,
              borderColor: ui.ink,
              borderRadius: 8,
              padding: 8,
              backgroundColor: bg,
            }}
          >
            <Text style={type.small}>{text(label)}</Text>
            <Text
              style={[
                type.num,
                label.en === 'Market' && { fontFamily: 'Kanit_600SemiBold', fontSize: 15 },
              ]}
            >
              {value}
            </Text>
          </View>
        ))}
      </Row>
      {s.loan > 0 && (
        <Muted>
          {text({
            en: `Bank loan left $${Math.ceil(s.loan).toLocaleString()} (repaid from sales)`,
            th: `หนี้ธนาคารคงเหลือ $${Math.ceil(s.loan).toLocaleString()} (หักจากยอดขายอัตโนมัติ)`,
          })}
        </Muted>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tiles.map(t => {
          const locked = !!t.lockedAt && s.rank < t.lockedAt
          return (
            <Pressable
              key={t.id}
              accessibilityRole="button"
              accessibilityState={{ disabled: locked }}
              disabled={locked}
              onPress={() =>
                t.id === 'land' ? onLand() : t.id === 'combos' ? onCombos() : setView(t.id as View_)
              }
              style={({ pressed }) => ({
                width: '31.5%',
                height: 84,
                borderWidth: 2,
                borderStyle: locked ? 'dashed' : 'solid',
                borderColor: locked ? '#9E978A' : ui.ink,
                borderRadius: 10,
                backgroundColor: locked
                  ? '#EFE8D8'
                  : pressed
                    ? '#FFE7A3'
                    : t.id === 'invest' || t.id === 'land'
                      ? '#EAF4E8'
                      : t.id === 'flow'
                        ? '#E8F1F6'
                        : t.id === 'awards'
                          ? '#F0EAF7'
                          : '#FFFAEC',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                boxShadow: locked ? undefined : '0px 2px 0px #14110F',
              })}
            >
              {!locked && t.icon}
              <Text
                style={[
                  type.body,
                  { fontSize: 14, textAlign: 'center' },
                  locked && { color: ui.muted },
                ]}
              >
                {text(t.label)}
              </Text>
              {locked && (
                <Text style={type.small}>
                  {text({ en: `Rank ${t.lockedAt}`, th: `แรงก์ ${t.lockedAt}` })}
                </Text>
              )}
            </Pressable>
          )
        })}
      </View>
      <Row gap={8}>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={text({ en: 'All events', th: 'เหตุการณ์ทั้งหมด' })}
            color="#FFF6E3"
            onPress={() => setView('events')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SmallButton
            label={text({ en: 'Settings', th: 'ตั้งค่า' })}
            color="#FFF6E3"
            onPress={() => setView('settings')}
          />
        </View>
      </Row>
      {s.evaluation !== null && (
        <Card>
          <Text style={type.title}>
            {text({ en: 'Final evaluation', th: 'ผลประเมิน 15 ปี' })}: {s.evaluation}
          </Text>
          <SmallButton
            label={text({ en: 'New Game+', th: 'เริ่มเกมใหม่+' })}
            onPress={() => dispatch(newGamePlus)}
          />
        </Card>
      )}
    </>
  )
}
