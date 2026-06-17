import { Tabs } from 'expo-router'
import { type ComponentProps } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { BarChart3, Briefcase, Factory, Users } from 'lucide-react-native'
import { colors, radii, spacing } from '../../../src/theme'

// Wraps a tab icon so the active tab gets a small rounded "pressed button"
// highlight instead of a text label / color-only change -- reads more like
// a game HUD toolbar than a standard app tab bar.
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{children}</View>
}

// expo-router doesn't export BottomTabBarProps from a documented subpath
// (it's bundled inside the package, not re-exported at the top level), so
// the prop type is inferred from Tabs itself rather than guessing an
// import path.
type TabsProps = ComponentProps<typeof Tabs>
type TabBarRenderProp = TabsProps['tabBar']
type TabBarProps = NonNullable<TabBarRenderProp> extends (props: infer P) => unknown ? P : never

// Custom tab bar: each tab is its OWN small floating pill (position:
// absolute, separated by visible gaps) instead of one continuous bar --
// per the user's explicit request to see the background (grid/screen
// color) peek through between buttons, not one solid strip. Built with
// the `tabBar` render prop (replacing `tabBarStyle`, which can only style
// ONE container for the whole bar, not separate per-button floating
// pills) -- this is the only way expo-router/React Navigation supports
// fully custom tab bar layouts.
function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View style={styles.tabBarRow} pointerEvents="box-none">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]
        const isFocused = state.index === index
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name)
          }
        }
        return (
          <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
            <TabIcon focused={isFocused}>
              {options.tabBarIcon?.({
                focused: isFocused,
                color: isFocused ? colors.ink : colors.inkMuted,
                size: 24,
              })}
            </TabIcon>
          </Pressable>
        )
      })}
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Refinery',
          tabBarIcon: ({ focused, color, size }) => <Factory color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ focused, color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: 'Business',
          tabBarIcon: ({ focused, color, size }) => <Briefcase color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused, color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  // The row that positions the 4 separate floating buttons -- itself
  // absolute + pointerEvents='box-none' so the gaps between buttons let
  // touches (and visually, the background) pass through, only the
  // buttons themselves are tappable.
  tabBarRow: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Each tab is its own floating pill: rounded on every side, its own
  // shadow, separated from its neighbors by the row's justifyContent
  // (space-between) rather than touching edge-to-edge like the old
  // single-strip tabBarStyle did.
  tabButton: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
  },
  iconWrapActive: {
    backgroundColor: colors.gold,
  },
})
