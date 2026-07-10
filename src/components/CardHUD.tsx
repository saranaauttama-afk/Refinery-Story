import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { colors, fonts, radii, spacing } from '../theme'
import GameIcon from './GameIcon'
import AnimatedPressable from './AnimatedPressable'

type CardHUDProps = {
  // Company info
  companyName: string
  companyTitle: string
  // Level
  level: number
  canUpgrade: boolean
  isMaxLevel: boolean
  onUpgradePress: () => void
  // Time
  timeLabel: string
  isDaytime: boolean
  // Speed control
  speed: number
  onSpeedPress: () => void
  // Boost control
  boostActive: boolean
  boostReady: boolean
  boostSeconds: number
  onBoostPress: () => void
  // Events
  eventsCount: number
  onEventsPress: () => void
}

/**
 * CardHUD — Consolidated top header card for the Refinery screen.
 *
 * Replaces the scattered top-left company block + top-right pill cluster
 * with a single balanced card. Layout:
 *
 * ╭──────────────────────────────────────────────────╮
 * │ 🏭 Acme Refinery              Lv5 ↑  ⏸ 1×  🔥  │
 * │ Small Town Blended              Day 15 · 14:30   │
 * ╰──────────────────────────────────────────────────╯
 *
 * - Left side: Company name (display font) + subtitle
 * - Right side: Level badge (tappable) + Speed pill + Boost pill
 * - Bottom row: Time info
 */
export default function CardHUD({
  companyName,
  companyTitle,
  level,
  canUpgrade,
  isMaxLevel,
  onUpgradePress,
  timeLabel,
  isDaytime,
  speed,
  onSpeedPress,
  boostActive,
  boostReady,
  boostSeconds,
  onBoostPress,
  eventsCount,
  onEventsPress,
}: CardHUDProps) {
  return (
    <View style={styles.card}>
      {/* Main row: Company + Controls */}
      <View style={styles.mainRow}>
        {/* Left: Company info */}
        <View style={styles.companyBlock}>
          <Text style={styles.companyName} numberOfLines={1}>
            {companyName}
          </Text>
          <Text style={styles.companyTitle} numberOfLines={1}>
            {companyTitle}
          </Text>
        </View>

        {/* Right: Control pills */}
        <View style={styles.controlsBlock}>
          {/* Level badge */}
          <AnimatedPressable
            style={[
              styles.lvBadge,
              canUpgrade && styles.lvBadgeReady,
              isMaxLevel && styles.lvBadgeMaxed,
            ]}
            onPress={onUpgradePress}
          >
            <Text style={styles.lvBadgeText}>
              {isMaxLevel ? '🏆' : `Lv${level}`}
              {canUpgrade ? ' ↑' : ''}
            </Text>
          </AnimatedPressable>

          {/* Speed control */}
          <Pressable
            style={[styles.controlPill, speed === 0 && styles.controlPillPaused]}
            onPress={onSpeedPress}
          >
            <Text style={[styles.controlPillText, speed === 0 && styles.controlPillTextPaused]}>
              {speed === 0 ? '⏸' : `${speed}×`}
            </Text>
          </Pressable>

          {/* Boost */}
          <Pressable
            style={[
              styles.controlPill,
              styles.boostPill,
              boostActive && styles.boostPillActive,
              boostReady && styles.boostPillReady,
              !boostReady && !boostActive && styles.boostPillCooldown,
            ]}
            disabled={!boostReady}
            onPress={onBoostPress}
          >
            <Text style={[styles.controlPillText, !boostReady && !boostActive && styles.controlPillTextDim]}>
              🔥{boostActive ? `${boostSeconds}s` : boostReady ? '' : `${boostSeconds}s`}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bottom row: Time + Events */}
      <View style={styles.bottomRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeIcon}>{isDaytime ? '☀️' : '🌙'}</Text>
          <Text style={styles.timeLabel}>{timeLabel}</Text>
        </View>

        {/* Events bell */}
        <Pressable style={styles.eventsBtn} onPress={onEventsPress}>
          <Text style={styles.eventsIcon}>🔔</Text>
          {eventsCount > 0 && (
            <View style={styles.eventsBadge}>
              <Text style={styles.eventsBadgeText}>{eventsCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(20, 28, 40, 0.92)',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  companyBlock: {
    flex: 1,
    minWidth: 0, // Allow text truncation
  },
  companyName: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  companyTitle: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.55)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 1,
  },
  controlsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lvBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs + 1,
  },
  lvBadgeReady: {
    backgroundColor: colors.green,
  },
  lvBadgeMaxed: {
    backgroundColor: colors.gold,
  },
  lvBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: fonts.heading,
    letterSpacing: 0.3,
  },
  controlPill: {
    minWidth: 36,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlPillPaused: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  controlPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  controlPillTextPaused: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  boostPill: {
    borderWidth: 1,
  },
  boostPillReady: {
    backgroundColor: 'rgba(232, 131, 58, 0.9)',
    borderColor: '#FFB27A',
  },
  boostPillActive: {
    backgroundColor: '#E8833A',
    borderColor: '#FFD9B0',
  },
  boostPillCooldown: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  controlPillTextDim: {
    color: 'rgba(255, 255, 255, 0.45)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  timeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeIcon: {
    fontSize: 12,
  },
  timeLabel: {
    fontSize: 11,
    fontFamily: fonts.body,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },
  eventsBtn: {
    position: 'relative',
    padding: spacing.xs,
  },
  eventsIcon: {
    fontSize: 16,
  },
  eventsBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(20, 28, 40, 1)',
  },
  eventsBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
})
