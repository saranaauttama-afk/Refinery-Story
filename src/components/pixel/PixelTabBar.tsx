import type { ComponentProps } from 'react'
import { Tabs } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { fonts, pixelUi } from '../../theme'

const VISIBLE_ROUTES = ['index', 'supply', 'contracts', 'staff'] as const
const LABELS: Record<string, string> = {
  index: 'Factory',
  supply: 'Operations',
  contracts: 'Business',
  staff: 'Team',
}

type PixelTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0]

function NavGlyph({ route, active }: { route: string; active: boolean }) {
  const color = active ? pixelUi.accent : pixelUi.textMuted
  if (route === 'index') {
    return (
      <Image
        source={require('../../../assets/plants/distillation_unit_lv1.png')}
        style={[styles.factoryGlyph, !active && styles.glyphDim]}
        resizeMode="contain"
      />
    )
  }
  if (route === 'contracts') {
    return (
      <View style={styles.businessGlyph}>
        <View style={[styles.coin, { borderColor: color }]} />
        <View style={[styles.coin, styles.coinMiddle, { borderColor: color }]} />
        <View style={[styles.coin, styles.coinTop, { borderColor: color }]} />
      </View>
    )
  }
  if (route === 'supply') {
    return (
      <View style={styles.operationsGlyph}>
        <View style={[styles.pipe, { backgroundColor: color }]} />
        <View style={[styles.pipe, styles.pipeMid, { backgroundColor: color }]} />
        <View style={[styles.pipe, styles.pipeShort, { backgroundColor: color }]} />
      </View>
    )
  }
  return (
    <View style={styles.teamGlyph}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.worker}>
          <View style={[styles.workerHead, { backgroundColor: color }]} />
          <View style={[styles.workerBody, { borderColor: color }]} />
        </View>
      ))}
    </View>
  )
}

export default function PixelTabBar({ state, descriptors, navigation }: PixelTabBarProps) {
  const insets = useSafeAreaInsets()
  const routes = state.routes.filter((route) => VISIBLE_ROUTES.includes(route.name as typeof VISIBLE_ROUTES[number]))

  return (
    <View style={[styles.shell, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      <View style={styles.topRail} />
      <View style={styles.row}>
        {routes.map((route) => {
          const index = state.routes.findIndex((candidate) => candidate.key === route.key)
          const active = state.index === index
          const badge = descriptors[route.key]?.options.tabBarBadge
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={active ? { selected: true } : {}}
              accessibilityLabel={LABELS[route.name]}
              style={[styles.item, active && styles.itemActive]}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
                if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params)
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            >
              <NavGlyph route={route.name} active={active} />
              <Text style={[styles.label, active && styles.labelActive]}>{LABELS[route.name]}</Text>
              {badge ? (
                <View style={styles.badge}><Text style={styles.badgeText}>{String(badge)}</Text></View>
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: pixelUi.surface,
    borderTopWidth: 2,
    borderTopColor: pixelUi.border,
  },
  topRail: { height: 2, backgroundColor: pixelUi.shadow },
  row: { height: 54, flexDirection: 'row' },
  item: {
    flex: 1,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: pixelUi.borderSoft,
  },
  itemActive: { backgroundColor: pixelUi.surfaceRaised },
  label: {
    color: pixelUi.textMuted,
    fontFamily: fonts.heading,
    fontSize: 10,
    marginTop: -1,
  },
  labelActive: { color: pixelUi.accent },
  factoryGlyph: { width: 31, height: 27 },
  glyphDim: { opacity: 0.58 },
  operationsGlyph: { width: 28, height: 28, justifyContent: 'center', gap: 3 },
  pipe: { width: 27, height: 4 },
  pipeMid: { width: 20 },
  pipeShort: { width: 13 },
  businessGlyph: { width: 30, height: 25, position: 'relative' },
  coin: {
    position: 'absolute',
    left: 5,
    bottom: 2,
    width: 20,
    height: 7,
    borderWidth: 2,
    backgroundColor: pixelUi.surface,
  },
  coinMiddle: { bottom: 8 },
  coinTop: { bottom: 14 },
  teamGlyph: { width: 34, height: 28, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' },
  worker: { width: 11, alignItems: 'center' },
  workerHead: { width: 7, height: 7 },
  workerBody: { width: 10, height: 12, borderWidth: 2, borderBottomWidth: 0, marginTop: 2 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 14,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: pixelUi.warning,
    borderWidth: 2,
    borderColor: pixelUi.canvas,
  },
  badgeText: { color: pixelUi.text, fontFamily: fonts.heading, fontSize: 9 },
})
