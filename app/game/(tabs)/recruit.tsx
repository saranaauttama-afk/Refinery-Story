import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated'
import { useRouter } from 'expo-router'

import AnimatedPressable from '../../../src/components/AnimatedPressable'
import FloatingNumbers from '../../../src/components/FloatingNumbers'
import { useGame } from '../../../src/hooks/GameContext'
import { useFloatingNumbers } from '../../../src/hooks/useFloatingNumbers'
import { useHaptics } from '../../../src/hooks/useHaptics'
import { colors, radii, spacing } from '../../../src/theme'
import { WORKERS } from '../../../src/game/data/workers'
import { HIDDEN_EVENTS } from '../../../src/game/data/hiddenEvents'
import { getManualRefreshCost } from '../../../src/game/data/recruitment'
import { TICK_MS, getMaxHireCount } from '../../../src/game/utils/gameCalculations'
import type { RecruitmentCandidate, RecruitmentTier } from '../../../src/game/types'

const TIER_CONFIG: Record<RecruitmentTier, { label: string; bodyColor: string; legColor: string; headColor: string; borderColor: string }> = {
  rookie:  { label: 'Rookie',  headColor: '#C8A882', bodyColor: '#8090A0', legColor: '#506070', borderColor: colors.creamBorder },
  skilled: { label: 'Skilled', headColor: '#D4A070', bodyColor: '#4A7AAA', legColor: '#2A5A8A', borderColor: colors.blue },
  expert:  { label: 'Expert',  headColor: '#C09060', bodyColor: '#C06A20', legColor: '#903A10', borderColor: colors.orange },
  star:    { label: 'Star',    headColor: '#D4A860', bodyColor: '#8060B0', legColor: '#604090', borderColor: colors.gold },
}

function CandidateFigure({ candidate, selected, onPress }: { candidate: RecruitmentCandidate; selected: boolean; onPress: () => void }) {
  const tc = TIER_CONFIG[candidate.tier]
  const worker = WORKERS.find((w) => w.key === candidate.type)
  const prog = useSharedValue(0)
  useEffect(() => { prog.value = withSpring(selected ? 1 : 0, { damping: 18, stiffness: 220 }) }, [selected])
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(prog.value, [0, 1], [1, 1.12]) }, { translateY: interpolate(prog.value, [0, 1], [0, -4]) }],
  }))
  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[figStyles.wrap, animStyle]}>
        <View style={figStyles.bubble}><Text style={figStyles.bubbleName} numberOfLines={1}>{candidate.name}</Text>{candidate.isVeteran && <Text>*</Text>}</View>
        <View style={[figStyles.head, { backgroundColor: tc.headColor }]} />
        <View style={[figStyles.body, { backgroundColor: tc.bodyColor }]} />
        <View style={figStyles.legs}><View style={[figStyles.leg, { backgroundColor: tc.legColor }]} /><View style={[figStyles.leg, { backgroundColor: tc.legColor }]} /></View>
        {selected && <View style={figStyles.ring} />}
        <Text style={figStyles.roleLabel} numberOfLines={1}>{worker?.name.en ?? candidate.type}</Text>
      </Animated.View>
    </Pressable>
  )
}
const figStyles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingBottom: 8, paddingTop: 28, paddingHorizontal: 4, position: 'relative' },
  bubble: { position: 'absolute', top: 4, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: 'rgba(28,38,52,0.88)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  bubbleName: { fontSize: 9, fontWeight: '800', color: '#fff' },
  head: { width: 22, height: 22, borderRadius: 11, marginBottom: -2, zIndex: 2 },
  body: { width: 20, height: 30, borderRadius: 4, zIndex: 2 },
  legs: { flexDirection: 'row', gap: 3, marginTop: 1 },
  leg: { width: 8, height: 14, borderRadius: 3 },
  ring: { position: 'absolute', bottom: 6, width: 52, height: 14, borderRadius: 26, backgroundColor: 'rgba(242,193,46,0.35)' },
  roleLabel: { fontSize: 8, color: 'rgba(255,255,255,0.55)', fontWeight: '700', marginTop: 4, textAlign: 'center', textTransform: 'uppercase' },
})

export default function RecruitScreen() {
  const router = useRouter()
  const { game, loaded, hireCandidate, refreshRecruitmentPool, claimHiddenEvent } = useGame()
  const { items: floatItems, spawn: spawnFloat, lifetimeMs: floatLifetimeMs } = useFloatingNumbers()
  const haptics = useHaptics()
  const [selectedSlot, setSelectedSlot] = useState(0)

  if (!loaded || !game) {
    return <SafeAreaView style={styles.loadingScreen}><ActivityIndicator color={colors.orange} size="large" /></SafeAreaView>
  }

  const cap = getMaxHireCount(game.refineryLevel)
  const refreshCost = getManualRefreshCost(game.refineryLevel)
  const canRefresh = game.money >= refreshCost
  const refreshSecsLeft = Math.max(0, Math.round(((game.recruitmentRefreshAt - game.tickCount) * TICK_MS) / 1000))
  const selectedCandidate = game.recruitmentPool[selectedSlot]
  const selectedWorker = selectedCandidate ? WORKERS.find((w) => w.key === selectedCandidate.type) : null
  const selectedTc = selectedCandidate ? TIER_CONFIG[selectedCandidate.tier] : null
  const atCap = selectedCandidate ? game.workerCounts[selectedCandidate.type] >= cap : false
  const affordable = selectedCandidate ? game.money >= selectedCandidate.cost : false
  const canHire = affordable && !atCap
  const mentorBonus = selectedCandidate ? (game.mentorXpBonus?.[selectedCandidate.type] ?? 0) : 0

  return (
    <SafeAreaView style={styles.screen}>
      <FloatingNumbers items={floatItems} lifetimeMs={floatLifetimeMs} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Text style={styles.closeBtnText}>X</Text>
        </Pressable>
        <Text style={styles.title}>Recruit</Text>
      </View>

      {/* Scene */}
      <View style={styles.scene}>
        <View style={styles.sceneBuildingLarge} />
        <View style={styles.sceneBuildingSmall} />
        <View style={styles.sceneSign}><Text style={styles.sceneSignText}>Hiring Office</Text></View>
        <View style={styles.candidatesStage}>
          {HIDDEN_EVENTS.filter((e) => e.reward.kind === 'staff' && game.hiddenEventStatus[e.key] === 'unlocked').slice(0, 1).map((event) => (
            <Pressable key={event.key} style={figStyles.wrap} onPress={() => claimHiddenEvent(event.key)}>
              <View style={[figStyles.bubble, { backgroundColor: 'rgba(232,131,58,0.9)' }]}><Text style={figStyles.bubbleName}>???</Text></View>
              <View style={{ width: 20, height: 50, backgroundColor: '#333', borderRadius: 4, opacity: 0.6 }} />
              <View style={figStyles.legs}><View style={[figStyles.leg, { backgroundColor: '#444' }]} /><View style={[figStyles.leg, { backgroundColor: '#444' }]} /></View>
              <Text style={[figStyles.roleLabel, { color: colors.orange }]}>Mystery!</Text>
            </Pressable>
          ))}
          {game.recruitmentPool.map((candidate, slotIndex) => (
            <CandidateFigure key={candidate.id} candidate={candidate} selected={selectedSlot === slotIndex} onPress={() => setSelectedSlot(slotIndex)} />
          ))}
        </View>
      </View>

      {/* Info panel */}
      {selectedCandidate && selectedTc && (
        <View style={[styles.infoPanel, { borderTopColor: selectedTc.borderColor }]}>
          <View style={styles.infoTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoName}>{selectedCandidate.name}</Text>
              <Text style={styles.infoRole}>{selectedWorker?.name.en ?? selectedCandidate.type}{selectedCandidate.isVeteran ? ' · Veteran +20%' : ''}</Text>
            </View>
            <View style={[styles.tierBadge, { backgroundColor: selectedTc.borderColor }]}>
              <Text style={styles.tierBadgeText}>{selectedTc.label}</Text>
            </View>
          </View>
          <View style={styles.infoStats}>
            <View style={styles.iStat}><Text style={styles.iStatVal}>Lv{selectedCandidate.startingLevel}</Text><Text style={styles.iStatLabel}>Starts</Text></View>
            <View style={styles.iStatDiv} />
            <View style={styles.iStat}><Text style={styles.iStatVal}>{game.workerCounts[selectedCandidate.type]}/{cap}</Text><Text style={styles.iStatLabel}>Hired</Text></View>
            {mentorBonus > 0 && <><View style={styles.iStatDiv} /><View style={styles.iStat}><Text style={[styles.iStatVal, { color: colors.green }]}>+{mentorBonus}</Text><Text style={styles.iStatLabel}>Mentor XP</Text></View></>}
          </View>
          <AnimatedPressable
            disabled={!canHire}
            onPress={() => { if (canHire) { spawnFloat("-$" + selectedCandidate.cost.toLocaleString(), 'expense'); haptics.confirm() }; hireCandidate(selectedSlot); setSelectedSlot(0) }}
            style={[styles.hireBtn, canHire ? styles.hireBtnActive : styles.hireBtnOff]}
          >
            <Text style={styles.hireBtnLabel}>
              {atCap ? "Full (" + cap + " max)" : !affordable ? "Need $" + selectedCandidate.cost.toLocaleString() : "Hire " + selectedCandidate.name + " $" + selectedCandidate.cost.toLocaleString()}
            </Text>
          </AnimatedPressable>
        </View>
      )}

      {/* Refresh bar */}
      <View style={styles.refreshBar}>
        <Text style={styles.refreshTimer}>{refreshSecsLeft > 0 ? "New candidates in " + Math.ceil(refreshSecsLeft / 60) + "m" : 'Candidates ready'}</Text>
        <AnimatedPressable disabled={!canRefresh}
          onPress={() => { if (canRefresh) { spawnFloat("-$" + refreshCost.toLocaleString(), 'expense'); haptics.tap() }; refreshRecruitmentPool(); setSelectedSlot(0) }}
          style={[styles.refreshBtn, canRefresh ? styles.refreshBtnActive : styles.refreshBtnOff]}>
          <Text style={styles.refreshBtnLabel}>Refresh ${refreshCost.toLocaleString()}</Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1520' },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#1C2634', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: '#fff' },
  scene: { height: 200, backgroundColor: '#4A7A9A', position: 'relative', overflow: 'hidden', flexShrink: 0 },
  sceneBuildingLarge: { position: 'absolute', right: 16, bottom: 0, width: 80, height: 110, backgroundColor: '#7A8A70', borderRadius: 4, opacity: 0.5 },
  sceneBuildingSmall: { position: 'absolute', right: 90, bottom: 0, width: 50, height: 70, backgroundColor: '#6A7A60', borderRadius: 4, opacity: 0.4 },
  sceneSign: { position: 'absolute', top: '45%', left: 14, backgroundColor: colors.cream, borderRadius: 6, borderWidth: 2, borderColor: '#8A7A5A', paddingHorizontal: 8, paddingVertical: 3 },
  sceneSignText: { fontSize: 9, fontWeight: '800', color: colors.ink },
  candidatesStage: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 20, paddingHorizontal: 20 },
  infoPanel: { backgroundColor: '#1C2634', borderTopWidth: 2, padding: spacing.md, paddingBottom: spacing.sm, flexShrink: 0 },
  infoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  infoName: { fontSize: 17, fontWeight: '900', color: '#fff' },
  infoRole: { fontSize: 11, color: '#6B8099', marginTop: 2 },
  tierBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  tierBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' },
  infoStats: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: radii.sm, padding: spacing.sm, marginBottom: spacing.sm },
  iStat: { flex: 1, alignItems: 'center' },
  iStatVal: { fontSize: 16, fontWeight: '900', color: '#fff' },
  iStatLabel: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase' },
  iStatDiv: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
  hireBtn: { borderRadius: radii.md, paddingVertical: 11, alignItems: 'center' },
  hireBtnActive: { backgroundColor: colors.green },
  hireBtnOff: { backgroundColor: '#2E3D50' },
  hireBtnLabel: { fontSize: 14, fontWeight: '900', color: '#fff' },
  refreshBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#141E2A', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: '#2E3D50', flexShrink: 0 },
  refreshTimer: { fontSize: 11, color: '#4A5A6A' },
  refreshBtn: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  refreshBtnActive: { backgroundColor: '#2E3D50' },
  refreshBtnOff: { backgroundColor: '#1A2530' },
  refreshBtnLabel: { fontSize: 11, fontWeight: '700', color: '#8A9BB0' },
})
