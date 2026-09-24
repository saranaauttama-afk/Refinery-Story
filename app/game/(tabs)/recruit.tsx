import { useState } from 'react'
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import StaffPortrait from '../../../src/components/StaffPortrait'
import StaffSkillList from '../../../src/components/StaffSkillList'
import { useGame } from '../../../src/hooks/GameContext'
import { useLang } from '../../../src/hooks/SettingsContext'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, fonts, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { text } from '../../../src/game/translations'
import { WORKERS } from '../../../src/game/data/workers'
import { getStaffTrait } from '../../../src/game/data/staffTraits'
import { BUILDINGS } from '../../../src/game/data/buildings'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import { TICK_MS, getMaxHireCount, getSpecialistPlantForWorker, formatCompactNumber } from '../../../src/game/utils/gameCalculations'
import type { RecruitmentCandidate, RecruitmentTier } from '../../../src/game/types'

const CREW_ROOM = require('../../../assets/bg/team_crew_room_v1.png')

const TIER_CONFIG: Record<RecruitmentTier, { label: string; color: string; dark: string }> = {
  rookie: { label: 'ROOKIE', color: '#AFC1D0', dark: '#435A6D' },
  skilled: { label: 'SKILLED', color: '#8ED6FF', dark: '#24658F' },
  expert: { label: 'EXPERT', color: '#FFB873', dark: '#A95824' },
  star: { label: 'STAR', color: '#FFD447', dark: '#9A7414' },
}

function CandidateCard({ candidate, selected, canHire, atCap, onSelect, onHire }: {
  candidate: RecruitmentCandidate; selected: boolean; canHire: boolean; atCap: boolean; onSelect: () => void; onHire: () => void
}) {
  const { t } = useLang()
  const worker = WORKERS.find((item) => item.key === candidate.type)
  const trait = getStaffTrait(candidate.trait)
  const tier = TIER_CONFIG[candidate.tier]
  return (
    <Pressable onPress={onSelect} style={[styles.candidateCard, selected && styles.candidateCardSelected]}>
      <View style={[styles.portrait, selected && styles.portraitSelected]}><StaffPortrait type={candidate.type} size={70} /></View>
      <View style={styles.candidateBody}>
        <View style={styles.nameRow}><Text style={styles.candidateName} numberOfLines={1}>{candidate.name}{trait ? ` ${trait.badge}` : ''}</Text>{candidate.isAce ? <Text style={styles.aceStar}>★</Text> : null}</View>
        <Text style={styles.candidateRole} numberOfLines={1}>{worker ? t(worker.name) : candidate.type} · Lv{candidate.startingLevel}</Text>
        <View style={[styles.tierChip, { borderColor: tier.dark, backgroundColor: `${tier.dark}55` }]}><Text style={[styles.tierChipText, { color: tier.color }]}>{tier.label}</Text></View>
        {candidate.skills?.length ? <StaffSkillList skills={candidate.skills.slice(0, 2)} isAce={candidate.isAce} compact /> : null}
      </View>
      <View style={styles.priceColumn}>
        <Text style={styles.price}>${formatCompactNumber(candidate.cost)}</Text>
        <Pressable disabled={!canHire} onPress={(event) => { event.stopPropagation(); onHire() }} style={[styles.rowHireBtn, canHire ? styles.rowHireBtnActive : styles.rowHireBtnOff]}>
          <Text style={styles.rowHireText}>{atCap ? 'FULL' : canHire ? 'HIRE' : 'NEED $'}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

export default function RecruitScreen() {
  const router = useRouter()
  const { game, loaded, hireCandidate, refreshRecruitmentPool, claimHiddenEvent } = useGame()
  const { t } = useLang()
  const rs = text.recruitScreen
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const [selectedSlot, setSelectedSlot] = useState(0)

  if (!loaded || !game) return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>

  const cap = getMaxHireCount(game.refineryLevel)
  const totalHired = Object.values(game.workerCounts).reduce((sum, count) => sum + count, 0)
  const refreshCost = getManualRefreshCost(game.refineryLevel)
  const canRefresh = game.money >= refreshCost
  const refreshSecsLeft = Math.max(0, Math.round(((game.recruitmentRefreshAt - game.tickCount) * TICK_MS) / 1000))
  const selectedCandidate = game.recruitmentPool[selectedSlot] ?? game.recruitmentPool[0]
  const selectedWorker = selectedCandidate ? WORKERS.find((item) => item.key === selectedCandidate.type) : undefined
  const selectedTrait = selectedCandidate ? getStaffTrait(selectedCandidate.trait) : undefined
  const specPlant = selectedCandidate ? getSpecialistPlantForWorker(selectedCandidate.type) : undefined
  const mentorBonus = selectedCandidate ? (game.mentorXpBonus?.[selectedCandidate.type] ?? 0) : 0

  const hire = (slot: number) => {
    const candidate = game.recruitmentPool[slot]
    if (!candidate || game.workerCounts[candidate.type] >= cap || game.money < candidate.cost) return
    spawnFloat(`-$${formatCompactNumber(candidate.cost)}`, 'expense'); haptics.confirm(); hireCandidate(slot); setSelectedSlot(0)
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ImageBackground source={CREW_ROOM} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroShade} />
          <View style={styles.heroHeader}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable>
            <View style={styles.heroTitleWrap}><Text style={styles.eyebrow}>REFINERY HIRING OFFICE</Text><Text style={styles.heroTitle}>{t(rs.title)}</Text></View>
            <View style={styles.staffPill}><Text style={styles.staffPillText}>STAFF {totalHired}</Text></View>
          </View>
          <View style={styles.heroSummary}>
            <View><Text style={styles.summaryValue}>{game.recruitmentPool.length}</Text><Text style={styles.summaryLabel}>CANDIDATES</Text></View><View style={styles.summaryDivider} />
            <View><Text style={styles.summaryValue}>{totalHired}</Text><Text style={styles.summaryLabel}>ON TEAM</Text></View><View style={styles.summaryDivider} />
            <View><Text style={styles.summaryValue}>Lv{game.refineryLevel}</Text><Text style={styles.summaryLabel}>REFINERY</Text></View>
          </View>
        </ImageBackground>

        <View style={styles.contentPanel}>
          <View style={styles.sectionHeadingRow}><View><Text style={styles.sectionEyebrow}>CANDIDATE BOARD</Text><Text style={styles.sectionTitle}>{game.recruitmentPool.length} candidates available</Text></View><Text style={styles.refreshCountdown}>{refreshSecsLeft > 0 ? `${Math.ceil(refreshSecsLeft / 60)}m` : 'READY'}</Text></View>

          {HIDDEN_EVENTS.filter((event) => event.reward.kind === 'staff' && game.hiddenEventStatus[event.key] === 'unlocked').slice(0, 1).map((event) => (
            <Pressable key={event.key} style={styles.mysteryCard} onPress={() => claimHiddenEvent(event.key)}><Text style={styles.mysteryIcon}>?</Text><View style={{ flex: 1 }}><Text style={styles.mysteryTitle}>MYSTERY CANDIDATE</Text><Text style={styles.mysterySub}>Tap to reveal a special recruit.</Text></View><Text style={styles.mysteryArrow}>›</Text></Pressable>
          ))}

          <View style={styles.candidateList}>{game.recruitmentPool.map((candidate, slot) => {
            const atCap = game.workerCounts[candidate.type] >= cap
            return <CandidateCard key={candidate.id} candidate={candidate} selected={slot === selectedSlot} canHire={!atCap && game.money >= candidate.cost} atCap={atCap} onSelect={() => setSelectedSlot(slot)} onHire={() => hire(slot)} />
          })}</View>

          {selectedCandidate ? (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}><View><Text style={styles.detailLabel}>SELECTED CANDIDATE</Text><Text style={styles.detailName}>{selectedCandidate.name}</Text><Text style={styles.detailRole}>{selectedWorker ? t(selectedWorker.name) : selectedCandidate.type}{selectedTrait ? ` · ${t(selectedTrait.name)}` : ''}</Text></View><View style={styles.detailPortrait}><StaffPortrait type={selectedCandidate.type} size={82} /></View></View>
              {selectedTrait ? <Text style={styles.flavor}>{t(selectedTrait.flavor)}</Text> : null}
              <View style={[styles.assignmentTag, specPlant ? styles.assignmentPlant : styles.assignmentGlobal]}><Text style={styles.assignmentText}>{specPlant ? t(text.staffRole.assignTo(BUILDINGS[specPlant].name)) : t(text.staffRole.global)}</Text></View>
              {selectedCandidate.skills?.length ? <View style={styles.skillArea}>{selectedCandidate.isAce ? <Text style={styles.aceRibbon}>★ {t(rs.ace)}</Text> : null}<StaffSkillList skills={selectedCandidate.skills} isAce={selectedCandidate.isAce} /></View> : null}
              <View style={styles.detailStats}><View style={styles.detailStat}><Text style={styles.detailStatValue}>Lv{selectedCandidate.startingLevel}</Text><Text style={styles.detailStatLabel}>{t(rs.starts)}</Text></View><View style={styles.detailDivider} /><View style={styles.detailStat}><Text style={styles.detailStatValue}>{game.workerCounts[selectedCandidate.type]}/{cap}</Text><Text style={styles.detailStatLabel}>{t(rs.hired)}</Text></View>{mentorBonus > 0 ? <><View style={styles.detailDivider} /><View style={styles.detailStat}><Text style={[styles.detailStatValue, styles.mentorValue]}>+{mentorBonus}</Text><Text style={styles.detailStatLabel}>{t(rs.mentorXp)}</Text></View></> : null}</View>
              {(() => { const atCap = game.workerCounts[selectedCandidate.type] >= cap; const affordable = game.money >= selectedCandidate.cost; const canHire = !atCap && affordable; return <AnimatedPressable disabled={!canHire} onPress={() => hire(selectedSlot)} style={[styles.primaryHire, canHire ? styles.primaryHireActive : styles.primaryHireOff]}><Text style={styles.primaryHireText}>{atCap ? t(rs.full(cap)) : !affordable ? t(rs.need(formatCompactNumber(selectedCandidate.cost))) : t(rs.hireName(selectedCandidate.name, formatCompactNumber(selectedCandidate.cost)))}</Text></AnimatedPressable> })()}
            </View>
          ) : null}

          <View style={styles.refreshBar}><View><Text style={styles.refreshTitle}>{t(rs.hiringOffice)}</Text><Text style={styles.refreshSub}>{refreshSecsLeft > 0 ? t(rs.newCandidatesIn(Math.ceil(refreshSecsLeft / 60))) : t(rs.candidatesReady)}</Text></View><AnimatedPressable disabled={!canRefresh} onPress={() => { if (canRefresh) { spawnFloat(`-$${formatCompactNumber(refreshCost)}`, 'expense'); haptics.tap() }; refreshRecruitmentPool(); setSelectedSlot(0) }} style={[styles.refreshBtn, canRefresh ? styles.refreshBtnActive : styles.refreshBtnOff]}><Text style={styles.refreshBtnText}>{t(rs.refresh(formatCompactNumber(refreshCost)))}</Text></AnimatedPressable></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07121D' }, loadingScreen: { flex: 1, backgroundColor: '#07121D', alignItems: 'center', justifyContent: 'center' }, scroll: { paddingBottom: FLOATING_TAB_BAR_CLEARANCE + 10 },
  hero: { height: 235, padding: spacing.md, justifyContent: 'space-between' }, heroImage: { opacity: 0.98 }, heroShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,18,32,0.24)' }, heroHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 42, height: 42, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(151,207,245,0.55)', backgroundColor: 'rgba(5,34,57,0.88)', alignItems: 'center', justifyContent: 'center' }, backText: { marginTop: -4, fontSize: 34, fontWeight: '800', color: '#FFFFFF' }, heroTitleWrap: { flex: 1 }, eyebrow: { fontSize: 7.5, fontFamily: fonts.heading, letterSpacing: 1.2, color: '#A7D6FA' }, heroTitle: { marginTop: 2, fontSize: 27, fontFamily: fonts.heading, color: '#FFFFFF', textShadowColor: '#051725', textShadowRadius: 4 }, staffPill: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.38)', backgroundColor: 'rgba(5,34,57,0.86)', paddingHorizontal: 9, paddingVertical: 7 }, staffPillText: { fontSize: 8, fontFamily: fonts.heading, color: '#FFFFFF' },
  heroSummary: { alignSelf: 'center', minWidth: '88%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderRadius: 11, borderWidth: 1, borderColor: 'rgba(116,188,235,0.58)', backgroundColor: 'rgba(3,28,49,0.9)', paddingVertical: 10 }, summaryValue: { textAlign: 'center', fontSize: 15, fontFamily: fonts.heading, color: '#FFFFFF' }, summaryLabel: { marginTop: 3, fontSize: 7, fontFamily: fonts.heading, color: '#83A9C4', letterSpacing: 0.6 }, summaryDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  contentPanel: { marginTop: -8, marginHorizontal: spacing.sm, borderRadius: 14, borderWidth: 2, borderColor: '#176AA4', backgroundColor: '#081D2D', padding: 11 }, sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, sectionEyebrow: { fontSize: 7.5, fontFamily: fonts.heading, color: '#6F95B1', letterSpacing: 1 }, sectionTitle: { marginTop: 3, fontSize: 15, fontFamily: fonts.heading, color: '#FFFFFF' }, refreshCountdown: { fontSize: 11, fontFamily: fonts.heading, color: '#8ED6FF' },
  mysteryCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, borderRadius: 9, borderWidth: 1, borderColor: '#C47B2E', backgroundColor: '#392714', padding: 10 }, mysteryIcon: { width: 36, height: 36, borderRadius: 8, textAlign: 'center', textAlignVertical: 'center', fontSize: 21, fontFamily: fonts.heading, color: '#FFD447', backgroundColor: '#6B4219' }, mysteryTitle: { fontSize: 10, fontFamily: fonts.heading, color: '#FFD447' }, mysterySub: { marginTop: 3, fontSize: 9, color: '#C8A877' }, mysteryArrow: { fontSize: 26, color: '#FFD447' },
  candidateList: { gap: 8 }, candidateCard: { minHeight: 102, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 9, borderWidth: 1, borderColor: '#20577D', borderLeftWidth: 4, backgroundColor: '#0B2B45', padding: 9 }, candidateCardSelected: { borderColor: '#FFD447', backgroundColor: '#0E3554' }, portrait: { width: 62, height: 72, overflow: 'hidden', borderRadius: 8, borderWidth: 1, borderColor: '#2C6D98', backgroundColor: '#F4EAD7', alignItems: 'center', justifyContent: 'center' }, portraitSelected: { borderColor: '#FFD447' }, candidateBody: { flex: 1, alignItems: 'flex-start' }, nameRow: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4 }, candidateName: { flexShrink: 1, fontSize: 14, fontFamily: fonts.heading, color: '#FFFFFF' }, aceStar: { color: '#FFD447', fontSize: 14 }, candidateRole: { marginTop: 3, fontSize: 9.5, color: '#9CB5C8' }, tierChip: { marginTop: 6, borderRadius: 5, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 }, tierChipText: { fontSize: 7, fontFamily: fonts.heading, letterSpacing: 0.5 }, priceColumn: { alignItems: 'flex-end', gap: 7 }, price: { fontSize: 14, fontFamily: fonts.heading, color: '#FFD447' }, rowHireBtn: { minWidth: 76, borderRadius: 7, borderBottomWidth: 4, paddingVertical: 9, alignItems: 'center' }, rowHireBtnActive: { backgroundColor: '#FFD447', borderBottomColor: '#A87412' }, rowHireBtnOff: { backgroundColor: '#31495C', borderBottomColor: '#182B3A' }, rowHireText: { fontSize: 10, fontFamily: fonts.heading, color: '#0A2943' },
  detailCard: { marginTop: 11, borderRadius: 10, borderWidth: 1, borderColor: '#24658F', backgroundColor: '#0A263D', padding: 12 }, detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, detailPortrait: { width: 86, height: 86, overflow: 'hidden', borderRadius: 9, borderWidth: 1, borderColor: '#357AA8', backgroundColor: '#F4EAD7', alignItems: 'center', justifyContent: 'center' }, detailLabel: { fontSize: 7, fontFamily: fonts.heading, letterSpacing: 0.8, color: '#6E96B2' }, detailName: { marginTop: 4, fontSize: 18, fontFamily: fonts.heading, color: '#FFFFFF' }, detailRole: { marginTop: 3, fontSize: 10, color: '#9CB5C8' }, flavor: { marginTop: 8, fontSize: 10, color: '#9EB4C4', fontStyle: 'italic' }, assignmentTag: { alignSelf: 'flex-start', marginTop: 9, borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 }, assignmentGlobal: { borderColor: '#4D8B4F', backgroundColor: 'rgba(75,130,70,0.18)' }, assignmentPlant: { borderColor: '#3B79A4', backgroundColor: 'rgba(41,101,143,0.2)' }, assignmentText: { fontSize: 9.5, fontWeight: '700', color: '#D9E7F0' }, skillArea: { marginTop: 9, gap: 6 }, aceRibbon: { fontSize: 9, fontFamily: fonts.heading, color: '#FFD447' },
  detailStats: { marginTop: 10, marginBottom: 10, flexDirection: 'row', borderRadius: 8, backgroundColor: '#061A2A', paddingVertical: 8 }, detailStat: { flex: 1, alignItems: 'center' }, detailStatValue: { fontSize: 14, fontFamily: fonts.heading, color: '#FFFFFF' }, detailStatLabel: { marginTop: 2, fontSize: 7, color: '#7893A8', textTransform: 'uppercase' }, detailDivider: { width: 1, backgroundColor: '#1B3D54' }, mentorValue: { color: '#78ED87' }, primaryHire: { borderRadius: 8, borderBottomWidth: 5, paddingVertical: 13, alignItems: 'center' }, primaryHireActive: { backgroundColor: '#FFD447', borderBottomColor: '#A87412' }, primaryHireOff: { backgroundColor: '#31495C', borderBottomColor: '#192B39' }, primaryHireText: { fontSize: 14, fontFamily: fonts.display, color: '#0A2943' },
  refreshBar: { marginTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 9, borderWidth: 1, borderColor: '#1C425C', backgroundColor: '#091B2A', padding: 10 }, refreshTitle: { fontSize: 10, fontFamily: fonts.heading, color: '#FFFFFF' }, refreshSub: { marginTop: 3, fontSize: 8.5, color: '#7893A8' }, refreshBtn: { borderRadius: 7, borderBottomWidth: 4, paddingHorizontal: 12, paddingVertical: 9 }, refreshBtnActive: { backgroundColor: '#2C6590', borderBottomColor: '#153D5B' }, refreshBtnOff: { backgroundColor: '#263A4A', borderBottomColor: '#172733' }, refreshBtnText: { fontSize: 9, fontFamily: fonts.heading, color: '#FFFFFF' },
})
