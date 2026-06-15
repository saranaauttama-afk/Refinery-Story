import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { BarChart3, Briefcase, Factory, Users } from 'lucide-react-native'
import { colors, radii } from '../../../src/theme'

// Wraps a tab icon so the active tab gets a small rounded "pressed button"
// highlight instead of a text label / color-only change -- reads more like
// a game HUD toolbar than a standard app tab bar.
function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  return <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>{children}</View>
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Refinery',
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon focused={focused}>
              <Factory color={color} size={size} />
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
        name="stats"
        options={{
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
    // Same color as every screen's background -- no separate "app bar"
    // strip, just icons sitting on the same canvas as the game.
    backgroundColor: colors.cream,
    borderTopWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
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
