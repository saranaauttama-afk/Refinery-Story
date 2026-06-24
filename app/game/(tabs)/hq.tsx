import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../../src/components/ListRow'
import { useGame } from '../../../src/hooks/GameContext'
import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'
import { EXPANSION_BALANCE, type PaidExpansionEntry } from '../../../src/game/data/balance'
import {
  getEsgTier,
  getSeasonLabel,
  getRefineryTitle,
} from '../../../src/game/utils/gameCalculations'

type HQTab = 'overview' | 'expand' | 'settings'

// ── Stat row component ────────────────────────────────────────────────────────
function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, accent && statStyles.valueAccent]}>{value}</Text>
    </View>
  )
}
const statStyles = StyleSheet.create({
  row:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: colors.creamBorder },
  label:       { fontSize: 12, color: colors.inkMuted, flex: 1 },
  value:       { fontSize: 12, fontWeight: '700', color: colors.ink, textAlign: 'right', flexShrink: 1, marginLeft: spacing.sm },
  valueAccent: { color: colors.green },
})

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      {children}
    </View>
  )
}
const cardStyles = StyleSheet.create({
  card:  { backgroundColor: colors.white, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.creamBorder, padding: spacing.md },
  title: { fontSize: 11, fontWeight: '900', color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.sm },
})

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HQScreen() {
  const router = useRouter()
  const { game, loaded, derived, expandGrid, renameRefinery, manualSave, resetGame } = useGame()
  const [activeTab, setActiveTab] = useState<HQTab>('overview')
  const [name, setName] = useState('')

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  const refineryTitle = getRefineryTitle(game.refineryLevel).en
  const esgTier = getEsgTier(game.esgScore)
  const seasonLabel = getSeasonLabel(game.tickCount, game.yearStartTick)
  const lastAward = game.awardHistory[0]
  const completedMilestones = game.completedMilestoneKeys.length
  const totalMilestones = derived.activeMilestones.length
  const unlockedResearch = derived.activeResearchItems.filter((i) => i.isUnlocked).length
  const totalResearch = derived.activeResearchItems.length
  const nextExpansion = EXPANSION_BALANCE[game.gridExpansionLevel + 1] as PaidExpansionEntry | undefined
  const currentSize = EXPANSION_BALANCE[game.gridExpansionLevel].size

  const TABS: { key: HQTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'expand',   label: 'Expand' },
    { key: 'settings', label: 'Settings' },
  ]

  return (
    <SafeAreaView style={styles.screen}>

      {/* ── Header ── */}
      <View style={styles.header}>
        {/* Company hero block */}
        <View style={styles.companyBlock}>
          <View style={styles.companyLeft}>
            <Text style={styles.companyName} numberOfLines={1}>{game.refineryName}</Text>
            <Text style={styles.companyTitle}>{refineryTitle}</Text>
          </View>
          <View style={styles.companyRight}>
            {lastAward && (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>{lastAward.grade}</Text>
                <Text style={styles.gradeLabel}>Last year</Text>
              </View>
            )}
            <View style={styles.yearBadge}>
              <Text style={styles.yearText}>Yr. {game.businessYear}</Text>
            </View>
          </View>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.qStat}>
            <Text style={styles.qStatVal}>Lv{game.refineryLevel}</Text>
            <Text style={styles.qStatLabel}>Level</Text>
          </View>
          <View style={styles.qStatDiv} />
          <View style={styles.qStat}>
            <Text style={styles.qStatVal}>{completedMilestones}/{totalMilestones}</Text>
            <Text style={styles.qStatLabel}>Milestones</Text>
          </View>
          <View style={styles.qStatDiv} />
          <View style={styles.qStat}>
            <Text style={styles.qStatVal}>{unlockedResearch}/{totalResearch}</Text>
            <Text style={styles.qStatLabel}>Research</Text>
          </View>
          <View style={styles.qStatDiv} />
          <View style={styles.qStat}>
            <Text style={styles.qStatVal}>{currentSize}×{currentSize}</Text>
            <Text style={styles.qStatLabel}>Grid</Text>
          </View>
        </View>

        {/* Tab toggle */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ══════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <ScrollView contentContainerStyle={styles.list}>

          {/* Era & world */}
          <Card title="World">
            <StatRow label="Current era" value={derived.currentEra.name.en} />
            <StatRow label="Season" value={`${seasonLabel.en} · ${Math.round(derived.seasonalGasolineMultiplier * 100)}% demand`} />
            <StatRow label="ESG score" value={`${Math.round(game.esgScore)}/100 · ${esgTier.en}`} />
            <StatRow
              label="Next era"
              value={derived.nextEra
                ? `${derived.nextEra.name.en} · Lv${derived.nextEra.requiredLevel} + ${derived.nextEra.requiredResearch} research`
                : 'Final era reached'}
            />
          </Card>

          {/* Awards */}
          <Card title="Awards">
            {lastAward ? (
              <>
                <StatRow label="Last grade" value={`${lastAward.grade} · Score ${lastAward.score}`} accent />
                <StatRow
                  label="Ranking"
                  value={lastAward.rivals.length > 0
                    ? `#${lastAward.playerRank} of ${lastAward.rivals.length + 1}`
                    : 'No rivals yet'}
                />
                <StatRow label="Payroll" value={`$${lastAward.payroll.toLocaleString()}`} />
                <StatRow label="Net profit" value={`$${lastAward.netProfit?.toLocaleString() ?? '—'}`} />
              </>
            ) : (
              <Text style={styles.emptyNote}>Year-end award ceremony hasn't happened yet.</Text>
            )}
            <Pressable style={styles.linkBtn} onPress={() => router.push('/achievements')}>
              <Text style={styles.linkBtnLabel}>View Milestones →</Text>
            </Pressable>
          </Card>

          {/* Activity log */}
          <Card title="Activity Log">
            {game.activityLog.length === 0
              ? <Text style={styles.emptyNote}>Nothing logged yet.</Text>
              : game.activityLog.slice(0, 10).map((entry, i) => (
                  <Text key={i} style={styles.logEntry}>{entry}</Text>
                ))
            }
          </Card>

        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════
          EXPAND TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'expand' && (
        <ScrollView contentContainerStyle={styles.list}>

          {/* Grid expansion */}
          <Card title="Refinery Expansion">
            <StatRow label="Current grid" value={`${currentSize}×${currentSize}`} />
            {nextExpansion ? (
              <>
                <StatRow
                  label="Next size"
                  value={`${nextExpansion.size}×${nextExpansion.size} · requires Lv${nextExpansion.requiresRefineryLevel}`}
                />
                <StatRow
                  label="Cost"
                  value={`$${nextExpansion.cost.toLocaleString()}`}
                  accent={game.money >= nextExpansion.cost}
                />
                <Pressable
                  style={[
                    styles.expandBtn,
                    (game.refineryLevel < nextExpansion.requiresRefineryLevel || game.money < nextExpansion.cost)
                      && styles.expandBtnDisabled,
                  ]}
                  onPress={() => expandGrid()}
                  disabled={game.refineryLevel < nextExpansion.requiresRefineryLevel || game.money < nextExpansion.cost}
                >
                  <Text style={styles.expandBtnLabel}>
                    Expand to {nextExpansion.size}×{nextExpansion.size} · ${nextExpansion.cost.toLocaleString()}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.emptyNote}>Maximum refinery size reached.</Text>
            )}
          </Card>

          {/* Rename */}
          <Card title="Company Name">
            <Text style={styles.currentName}>{game.refineryName}</Text>
            <View style={styles.renameRow}>
              <TextInput
                style={styles.input}
                placeholder="New name..."
                placeholderTextColor={colors.inkMuted}
                value={name}
                onChangeText={setName}
              />
              <Pressable
                style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
                onPress={() => {
                  const n = name.trim()
                  if (!n) return
                  renameRefinery(n)
                  setName('')
                }}
              >
                <Text style={styles.saveBtnLabel}>Rename</Text>
              </Pressable>
            </View>
          </Card>

        </ScrollView>
      )}

      {/* ══════════════════════════════════════════════════════
          SETTINGS TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'settings' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Card title="Save">
            <ListRow
              title="Manual save"
              subtitle="Autosave runs in the background. Tap to save now."
              actionLabel="Save"
              onPress={() => manualSave()}
            />
          </Card>

          <Card title="Navigation">
            <ListRow
              title="Store"
              subtitle="Remove ads, boosts (demo)"
              actionLabel="Open"
              onPress={() => router.push('/store')}
            />
            <ListRow
              title="Settings"
              subtitle="Language, audio, and app-level controls"
              actionLabel="Open"
              onPress={() => router.push('/settings')}
            />
            <ListRow
              title="Main Menu"
              subtitle="Return to front menu without changing your save"
              actionLabel="Go"
              onPress={() => router.replace('/')}
            />
          </Card>

          <Card title="Danger Zone">
            <ListRow
              title="Reset save"
              subtitle="Deletes all progress after confirmation. Cannot be undone."
              actionLabel="Reset"
              onPress={() =>
                Alert.alert(
                  'Reset save?',
                  'This deletes all progress and starts a new refinery.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: () => { resetGame(); router.replace('/') },
                    },
                  ],
                )
              }
            />
          </Card>
        </ScrollView>
      )}

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  loadingScreen: { flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    backgroundColor: '#1C2634',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },

  // Company hero
  companyBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  companyLeft: { flex: 1, marginRight: spacing.md },
  companyName: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  companyTitle: { fontSize: 10, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },
  companyRight: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  gradeBadge: {
    backgroundColor: colors.gold,
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  gradeText: { fontSize: 16, fontWeight: '900', color: colors.ink },
  gradeLabel: { fontSize: 8, color: colors.ink, fontWeight: '700' },
  yearBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  yearText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Quick stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  qStat: { flex: 1, alignItems: 'center' },
  qStatVal: { fontSize: 14, fontWeight: '900', color: '#fff' },
  qStatLabel: { fontSize: 8, color: '#6B8099', textTransform: 'uppercase', letterSpacing: 0.3 },
  qStatDiv: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Tab toggle
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
    marginBottom: spacing.xs,
  },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: radii.pill, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#fff' },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#6B8099' },
  tabLabelActive: { color: '#1C2634' },

  // Content
  list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: FLOATING_TAB_BAR_CLEARANCE, gap: spacing.sm },

  emptyNote: { fontSize: 12, color: colors.inkMuted, fontStyle: 'italic', paddingVertical: 4 },

  logEntry: {
    fontSize: 11, color: colors.inkMuted,
    paddingVertical: 3,
    borderBottomWidth: 1, borderBottomColor: colors.creamBorder,
  },

  linkBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'flex-end',
  },
  linkBtnLabel: { fontSize: 12, fontWeight: '700', color: colors.blue },

  // Expansion
  expandBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.green,
    borderRadius: radii.md,
    paddingVertical: 11,
    alignItems: 'center',
  },
  expandBtnDisabled: { backgroundColor: colors.creamBorder },
  expandBtnLabel: { fontSize: 14, fontWeight: '900', color: colors.ink },

  currentName: { fontSize: 15, fontWeight: '800', color: colors.ink, marginBottom: spacing.sm },
  renameRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1.5, borderColor: colors.creamBorder,
    borderRadius: radii.sm, backgroundColor: colors.cream,
    paddingHorizontal: spacing.sm, paddingVertical: 8,
    color: colors.ink, fontSize: 13,
  },
  saveBtn: {
    backgroundColor: colors.green,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center', alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: colors.creamBorder },
  saveBtnLabel: { fontWeight: '800', color: colors.ink, fontSize: 13 },
})
