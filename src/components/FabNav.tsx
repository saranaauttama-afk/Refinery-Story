import { useEffect } from 'react'
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { useRouter, usePathname } from 'expo-router'
import { colors, radii, spacing } from '../theme'

export type FabNavItem = {
  route: string
  icon: string
  label: string
  badge?: number
}

// ── Single animated menu item ─────────────────────────────────────────────────
function MenuItem({
  item,
  index,
  total,
  open,
  isActive,
  onPress,
}: {
  item: FabNavItem
  index: number
  total: number
  open: boolean
  isActive: boolean
  onPress: () => void
}) {
  const prog = useSharedValue(0)

  useEffect(() => {
    prog.value = open
      ? withSpring(1, { damping: 18, stiffness: 220, delay: index * 40 } as any)
      : withTiming(0, { duration: 100 })
  }, [open])

  const animStyle = useAnimatedStyle(() => ({
    opacity: prog.value,
    transform: [
      { translateY: interpolate(prog.value, [0, 1], [16, 0]) },
      { scale: interpolate(prog.value, [0, 1], [0.85, 1]) },
    ],
    pointerEvents: (open ? 'auto' : 'none') as any,
  }))

  const bottomOffset = 86 + (total - 1 - index) * 60

  return (
    <Animated.View style={[styles.menuItem, { bottom: bottomOffset }, animStyle]}>
      <View style={styles.menuItemInner}>
        <View style={styles.labelWrap}>
          {item.badge ? (
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{item.badge}</Text>
            </View>
          ) : null}
          <Text style={styles.menuLabel}>{item.label}</Text>
        </View>
        <Pressable
          style={[styles.menuBtn, isActive && styles.menuBtnActive]}
          onPress={onPress}
        >
          <Text style={styles.menuIcon}>{item.icon}</Text>
          {item.badge ? (
            <View style={styles.badgeDot}>
              <Text style={styles.badgeDotText}>{item.badge}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </Animated.View>
  )
}

// ── FAB overlay ───────────────────────────────────────────────────────────────
type Props = {
  open: boolean
  onToggle: () => void
  onClose: () => void
  items: FabNavItem[]
}

export default function FabNav({ open, onToggle, onClose, items }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const overlayProg = useSharedValue(0)
  const fabRot = useSharedValue(0)

  useEffect(() => {
    overlayProg.value = withTiming(open ? 1 : 0, { duration: 180 })
    fabRot.value = withSpring(open ? 1 : 0, { damping: 18, stiffness: 220 })
  }, [open])

  // Android back closes menu
  useEffect(() => {
    if (!open) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [open])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(overlayProg.value, [0, 1], [0, 0.50]),
    pointerEvents: (open ? 'auto' : 'none') as any,
  }))

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(fabRot.value, [0, 1], [0, 135])}deg` }],
  }))

  return (
    <>
      {/* Dimming overlay tapping it closes menu */}
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Menu items */}
      {items.map((item, idx) => {
        const routeKey = item.route.split('/').pop() ?? ''
        const isActive = pathname.endsWith(routeKey) || (routeKey === 'index' && pathname.endsWith('/game'))
        return (
          <MenuItem
            key={item.route}
            item={item}
            index={idx}
            total={items.length}
            open={open}
            isActive={isActive}
            onPress={() => {
              onClose()
              router.push(item.route as any)
            }}
          />
        )
      })}

      {/* FAB */}
      <Pressable style={styles.fab} onPress={onToggle}>
        <Animated.Text style={[styles.fabIcon, fabIconStyle]}>☰</Animated.Text>
      </Pressable>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#000',
    zIndex: 40,
  },
  menuItem: {
    position: 'absolute',
    right: 12,
    zIndex: 50,
  },
  menuItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(28,38,52,0.94)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  badgePill: {
    backgroundColor: colors.orange,
    borderRadius: radii.pill,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: { fontSize: 9, fontWeight: '900', color: '#fff' },
  menuBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C2634',
    borderWidth: 1.5,
    borderColor: '#2E3D50',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuBtnActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  menuIcon: { fontSize: 20 },
  badgeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDotText: { fontSize: 8, fontWeight: '900', color: '#fff' },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1C2634',
    borderWidth: 2.5,
    borderColor: '#F2C12E',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 14,
  },
  fabIcon: {
    fontSize: 18,
    color: '#F2C12E',
    fontWeight: '900',
  },
})
