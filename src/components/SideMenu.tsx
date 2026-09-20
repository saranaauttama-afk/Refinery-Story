import { useEffect, useState } from 'react'
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, fonts } from '../theme'
import type { FabNavItem } from './FabNav'

// Grouped, collapsible slide-out drawer (mockup-style navigation map). Opens
// from the left over a dimming overlay. Sections can be collapsed/expanded so
// the menu stays "small but expandable" as the destination list grows. The
// flat BottomNav still carries the core tabs; this drawer is the full map.

export type SideMenuSection = {
  key: string
  title: string
  items: (FabNavItem & { desc?: string })[]
}

const PANEL_WIDTH = 274

function activeFor(pathname: string, route: string): boolean {
  const routeKey = route.split('/').pop() ?? ''
  if (routeKey === 'game') return pathname.endsWith('/game')
  return pathname.endsWith(routeKey)
}

export default function SideMenu({
  open,
  onClose,
  sections,
}: {
  open: boolean
  onClose: () => void
  sections: SideMenuSection[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()
  const prog = useSharedValue(0)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => {
    prog.value = withTiming(open ? 1 : 0, { duration: 200 })
  }, [open])

  // Android back closes the drawer instead of leaving the screen.
  useEffect(() => {
    if (!open) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose()
      return true
    })
    return () => sub.remove()
  }, [open])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(prog.value, [0, 1], [0, 0.55]),
    pointerEvents: (open ? 'auto' : 'none') as any,
  }))

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(prog.value, [0, 1], [-PANEL_WIDTH - 24, 0]) }],
    pointerEvents: (open ? 'auto' : 'none') as any,
  }))

  const go = (route: string) => {
    onClose()
    if (!activeFor(pathname, route)) router.push(route as any)
  }

  return (
    <>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          { width: PANEL_WIDTH, paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14 },
          panelStyle,
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Refinery</Text>
          <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={10}>
            <Text style={styles.closeIcon}>✕</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollInner}>
          {sections.map((section) => {
            const isCollapsed = collapsed[section.key]
            return (
              <View key={section.key} style={styles.section}>
                <Pressable
                  style={styles.sectionHead}
                  onPress={() =>
                    setCollapsed((c) => ({ ...c, [section.key]: !c[section.key] }))
                  }
                >
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.chevron}>{isCollapsed ? '▸' : '▾'}</Text>
                </Pressable>
                {!isCollapsed &&
                  section.items.map((item) => {
                    const isActive = activeFor(pathname, item.route)
                    return (
                      <Pressable
                        key={item.route}
                        style={[styles.row, isActive && styles.rowActive]}
                        onPress={() => go(item.route)}
                      >
                        <Text style={styles.rowIcon}>{item.icon}</Text>
                        <View style={styles.rowText}>
                          <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]}>
                            {item.label}
                          </Text>
                          {item.desc ? <Text style={styles.rowDesc}>{item.desc}</Text> : null}
                        </View>
                        {item.badge ? (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        ) : null}
                      </Pressable>
                    )
                  })}
              </View>
            )
          })}
        </ScrollView>
      </Animated.View>
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    zIndex: 70,
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,25,36,0.99)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    zIndex: 80,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 4, height: 0 },
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 12,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.gold,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  closeIcon: { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: '900' },
  scrollInner: { paddingBottom: 8 },
  section: { marginTop: 10 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: fonts.body,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chevron: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 2,
  },
  rowActive: {
    backgroundColor: 'rgba(242,193,46,0.14)',
  },
  rowIcon: { fontSize: 20, width: 26, textAlign: 'center' },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  rowLabelActive: { color: colors.gold },
  rowDesc: {
    fontSize: 10,
    fontFamily: fonts.body,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: '#fff' },
})
