import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, fonts } from '../theme'
import type { FabNavItem } from './FabNav'

// Persistent bottom navigation bar. Replaces the old hamburger FAB (one tap
// to even see the destinations, and no indication of where you are). All
// sections are always visible with their unread badges, and the active tab
// is highlighted -- standard, glanceable mobile nav.

const NAV_HEIGHT = 56

export default function BottomNav({ items }: { items: FabNavItem[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.bar, { height: NAV_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {items.map((item) => {
        const routeKey = item.route.split('/').pop() ?? ''
        const isActive =
          pathname.endsWith(routeKey) || (routeKey === 'game' && pathname.endsWith('/game'))
        return (
          <Pressable
            key={item.route}
            style={styles.item}
            onPress={() => {
              if (isActive) return
              router.push(item.route as any)
            }}
          >
            <View style={styles.iconWrap}>
              <Text style={[styles.icon, isActive && styles.iconActive]}>{item.icon}</Text>
              {item.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {item.label}
            </Text>
            {isActive ? <View style={styles.activeBar} /> : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(20,28,40,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    zIndex: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 7,
    gap: 2,
  },
  iconWrap: {
    position: 'relative',
  },
  icon: {
    fontSize: 19,
    opacity: 0.55,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 9,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.gold,
  },
  activeBar: {
    position: 'absolute',
    top: 0,
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.orange,
    borderWidth: 1.5,
    borderColor: 'rgba(20,28,40,1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fff',
  },
})
