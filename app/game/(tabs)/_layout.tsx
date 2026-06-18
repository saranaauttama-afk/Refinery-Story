import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { BarChart3, Briefcase, Factory, Package, Shield, Users } from 'lucide-react-native'
import { colors, radii, spacing } from '../../../src/theme'

// Wraps a tab icon so the active tab gets a small rounded "pressed button"
// highlight behind the icon while still keeping compact labels visible for
// the 5-tab skeleton.
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{children}</View>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Factory',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <Factory color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="production"
        options={{
          title: 'Production',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <Package color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Staff',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <Users color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          title: 'Business',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <Briefcase color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="hq"
        options={{
          title: 'HQ',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <Shield color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          href: null,
          title: 'Stats',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <BarChart3 color={color} size={size} />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    // Floating pill instead of a full-width strip docked to the screen
    // edge -- margins on every side, rounded corners all around (not just
    // the top), and a soft shadow so it reads as a card sitting ABOVE the
    // background rather than part of it.
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.md,
    height: 72,
    borderRadius: radii.lg,
    borderTopWidth: 0,
    backgroundColor: colors.cream,
    elevation: 8,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  tabBarItem: {
    paddingTop: spacing.xs,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: spacing.xs,
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
