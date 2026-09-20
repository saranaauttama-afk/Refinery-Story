import { Tabs } from 'expo-router'
import { BriefcaseBusiness, Factory, Gauge, Users } from 'lucide-react-native'

import { useGame } from '../../../src/hooks/GameContext'
import { fonts, modernUi } from '../../../src/theme'

export default function TabsLayout() {
  const { game } = useGame()
  const teamBadge = game && game.recruitmentPool.length > 0
    ? game.recruitmentPool.length
    : undefined

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: modernUi.accent,
        tabBarInactiveTintColor: modernUi.textMuted,
        tabBarLabelStyle: {
          fontFamily: fonts.body,
          fontSize: 10,
          marginTop: 1,
        },
        tabBarItemStyle: { paddingTop: 5 },
        tabBarStyle: {
          height: 64,
          backgroundColor: modernUi.surface,
          borderTopColor: modernUi.border,
          borderTopWidth: 1,
          elevation: 16,
        },
        tabBarBadgeStyle: {
          backgroundColor: modernUi.warning,
          color: modernUi.text,
          fontSize: 9,
          fontWeight: '900',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Factory',
          tabBarIcon: ({ color, size }) => <Factory color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="supply"
        options={{
          title: 'Operations',
          tabBarIcon: ({ color, size }) => <Gauge color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Business',
          tabBarIcon: ({ color, size }) => <BriefcaseBusiness color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Team',
          tabBarBadge: teamBadge,
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} strokeWidth={2.2} />,
        }}
      />
      <Tabs.Screen name="recruit" options={{ href: null }} />
      <Tabs.Screen name="research" options={{ href: null }} />
      <Tabs.Screen name="company" options={{ href: null }} />
    </Tabs>
  )
}
