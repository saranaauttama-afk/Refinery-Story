import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import GameIcon from '../../../src/components/GameIcon'
import { useGame } from '../../../src/hooks/GameContext'
import { formatCompactNumber, formatGameClockTime } from '../../../src/game/utils/gameCalculations'
import { fonts, pixelRadii, pixelSpacing, pixelUi } from '../../../src/theme'

type Destination = {
  route: '/game/company' | '/game/research' | '/game/recruit' | '/game/achievements' | '/game/settings'
  title: string
  description: string
  icon: string
  badge?: number
}

function Resource({ icon, value, warn }: { icon: string; value: string; warn?: boolean }) {
  return (
    <View style={styles.resource}>
      <GameIcon name={icon} size={24} />
      <Text style={[styles.resourceValue, warn && styles.resourceWarn]} numberOfLines={1}>{value}</Text>
    </View>
  )
}

function BlockGlyph({ kind }: { kind: 'award' | 'settings' }) {
  if (kind === 'settings') {
    return (
      <View style={styles.settingsGlyph}>
        <View style={styles.settingsCore} />
        <View style={[styles.settingsTooth, styles.toothTop]} />
        <View style={[styles.settingsTooth, styles.toothBottom]} />
        <View style={[styles.settingsTooth, styles.toothLeft]} />
        <View style={[styles.settingsTooth, styles.toothRight]} />
      </View>
    )
  }
  return (
    <View style={styles.awardGlyph}>
      <View style={styles.awardCup} />
      <View style={styles.awardStem} />
      <View style={styles.awardBase} />
    </View>
  )
}

export default function ManagementScreen() {
  const router = useRouter()
  const { game, loaded, derived } = useGame()

  if (!loaded || !game || !derived) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator color={pixelUi.accent} size="large" />
      </SafeAreaView>
    )
  }

  const readyResearch = derived.activeResearchItems.filter(
    (item) => item.isVisible && !item.isUnlocked && game.researchPoints >= item.cost,
  ).length
  const destinations: Destination[] = [
    { route: '/game/company', title: 'Company', description: 'Growth, finance and refinery profile', icon: 'building-salesOffice' },
    { route: '/game/research', title: 'R&D', description: 'Unlock technology and install perks', icon: 'building-laboratory', badge: readyResearch || undefined },
    { route: '/game/recruit', title: 'Recruit', description: 'Find and hire refinery specialists', icon: 'worker-operator', badge: game.recruitmentPool.length || undefined },
    { route: '/game/achievements', title: 'Achievements', description: 'Milestones and company records', icon: 'award' },
    { route: '/game/settings', title: 'Settings', description: 'Language, audio and game data', icon: 'settings' },
  ]

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.hudShadow}>
        <View style={styles.hud}>
          <View style={styles.identityRow}>
            <View style={styles.identity}>
              <Text style={styles.refineryName} numberOfLines={1}>{game.refineryName}</Text>
              <View style={styles.levelChip}><Text style={styles.levelText}>LV {game.refineryLevel}</Text></View>
            </View>
            <View style={styles.clockChip}>
              <Text style={styles.clockText}>{formatGameClockTime(derived.gameClock)} · D{derived.gameClock.dayOfMonth + 1}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close management" style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.resourceRow}>
            <Resource icon="money" value={`$${formatCompactNumber(game.money)}`} />
            <View style={styles.resourceDivider} />
            <Resource icon="crude" value={`${formatCompactNumber(game.crudeOil)}/${formatCompactNumber(derived.maxCrudeStorage)}`} warn={game.crudeOil === 0} />
            <View style={styles.resourceDivider} />
            <Resource icon="gas" value={`${formatCompactNumber(game.gasoline)}/${formatCompactNumber(derived.maxGasolineStorage)}`} />
            <View style={styles.resourceDivider} />
            <Resource icon="esg" value={`${Math.round(game.esgScore)}`} />
            <View style={styles.resourceDivider} />
            <Resource icon="worker-operator" value={`${Math.round(game.staffMorale)}`} />
          </View>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.kicker}>REFINERY CONTROL</Text>
          <Text style={styles.title}>Management</Text>
        </View>
        <Text style={styles.reputation}>REP {formatCompactNumber(game.reputation)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {destinations.map((item, index) => (
          <Pressable
            key={item.route}
            accessibilityRole="button"
            style={({ pressed }) => [styles.destination, pressed && styles.destinationPressed]}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.destinationIndex}><Text style={styles.destinationIndexText}>{String(index + 1).padStart(2, '0')}</Text></View>
            <View style={styles.destinationIcon}>
              {item.icon === 'award' || item.icon === 'settings'
                ? <BlockGlyph kind={item.icon} />
                : <GameIcon name={item.icon} size={42} />}
            </View>
            <View style={styles.destinationCopy}>
              <Text style={styles.destinationTitle}>{item.title}</Text>
              <Text style={styles.destinationDescription} numberOfLines={1}>{item.description}</Text>
            </View>
            {item.badge ? <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View> : null}
            <Text style={styles.arrow}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pixelUi.canvas },
  loading: { flex: 1, backgroundColor: pixelUi.canvas, alignItems: 'center', justifyContent: 'center' },
  hudShadow: { margin: pixelSpacing.sm, backgroundColor: pixelUi.shadow, paddingRight: 3, paddingBottom: 3 },
  hud: { backgroundColor: pixelUi.surface, borderWidth: 2, borderColor: pixelUi.border },
  identityRow: { minHeight: 52, paddingLeft: pixelSpacing.md, paddingRight: pixelSpacing.xs, flexDirection: 'row', alignItems: 'center', gap: pixelSpacing.sm },
  identity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: pixelSpacing.sm },
  refineryName: { flexShrink: 1, color: pixelUi.text, fontFamily: fonts.display, fontSize: 18 },
  levelChip: { paddingHorizontal: 6, paddingVertical: 3, borderWidth: 2, borderColor: pixelUi.borderSoft, backgroundColor: pixelUi.surfaceRaised },
  levelText: { color: pixelUi.textMuted, fontFamily: fonts.heading, fontSize: 9 },
  clockChip: { paddingHorizontal: pixelSpacing.sm, paddingVertical: 5, borderWidth: 2, borderColor: pixelUi.borderSoft, backgroundColor: pixelUi.canvas },
  clockText: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 10 },
  closeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: pixelUi.border, backgroundColor: pixelUi.surfaceRaised },
  closeText: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 27, lineHeight: 29 },
  resourceRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', borderTopWidth: 2, borderTopColor: pixelUi.borderSoft, paddingHorizontal: pixelSpacing.xs },
  resource: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  resourceValue: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 11 },
  resourceWarn: { color: pixelUi.warning },
  resourceDivider: { width: 1, height: 26, backgroundColor: pixelUi.borderSoft },
  titleRow: { paddingHorizontal: pixelSpacing.lg, paddingTop: pixelSpacing.md, paddingBottom: pixelSpacing.sm, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  kicker: { color: pixelUi.accent, fontFamily: fonts.heading, fontSize: 9, letterSpacing: 1.4 },
  title: { color: pixelUi.text, fontFamily: fonts.display, fontSize: 29, lineHeight: 34 },
  reputation: { color: pixelUi.rp, fontFamily: fonts.heading, fontSize: 11, paddingBottom: 4 },
  list: { paddingHorizontal: pixelSpacing.sm, paddingBottom: 24 },
  destination: { minHeight: 76, flexDirection: 'row', alignItems: 'center', marginBottom: pixelSpacing.sm, backgroundColor: pixelUi.surface, borderWidth: 2, borderColor: pixelUi.border, paddingRight: pixelSpacing.sm },
  destinationPressed: { backgroundColor: pixelUi.surfacePressed, transform: [{ translateX: 1 }, { translateY: 1 }] },
  destinationIndex: { width: 31, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', backgroundColor: pixelUi.surfaceRaised, borderRightWidth: 2, borderRightColor: pixelUi.borderSoft },
  destinationIndexText: { color: pixelUi.textMuted, fontFamily: fonts.heading, fontSize: 9, transform: [{ rotate: '-90deg' }] },
  destinationIcon: { width: 59, height: 58, alignItems: 'center', justifyContent: 'center' },
  destinationCopy: { flex: 1, minWidth: 0 },
  destinationTitle: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 17 },
  destinationDescription: { color: pixelUi.textMuted, fontFamily: fonts.body, fontSize: 10 },
  badge: { minWidth: 25, height: 25, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: pixelUi.warning, borderWidth: 2, borderColor: pixelUi.canvas },
  badgeText: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 10 },
  arrow: { width: 25, color: pixelUi.accent, fontFamily: fonts.heading, fontSize: 28, textAlign: 'right' },
  awardGlyph: { width: 30, height: 34, alignItems: 'center' },
  awardCup: { width: 24, height: 17, backgroundColor: pixelUi.accent, borderWidth: 2, borderColor: pixelUi.accentDark },
  awardStem: { width: 6, height: 8, backgroundColor: pixelUi.accent },
  awardBase: { width: 20, height: 5, backgroundColor: pixelUi.accent },
  settingsGlyph: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  settingsCore: { width: 20, height: 20, backgroundColor: pixelUi.textMuted, borderWidth: 6, borderColor: pixelUi.text },
  settingsTooth: { position: 'absolute', width: 8, height: 8, backgroundColor: pixelUi.text },
  toothTop: { top: 0 },
  toothBottom: { bottom: 0 },
  toothLeft: { left: 0 },
  toothRight: { right: 0 },
})
