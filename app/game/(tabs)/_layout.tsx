import { Tabs } from 'expo-router'

import { useGame } from '../../../src/hooks/GameContext'
import PixelTabBar from '../../../src/components/pixel/PixelTabBar'

export default function TabsLayout() {
  const { game } = useGame()
  const teamBadge = game && game.recruitmentPool.length > 0
    ? game.recruitmentPool.length
    : undefined

  return (
    <Tabs
      tabBar={(props) => <PixelTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Factory',
        }}
      />
      <Tabs.Screen
        name="supply"
        options={{
          title: 'Operations',
        }}
      />
      <Tabs.Screen
        name="contracts"
        options={{
          title: 'Business',
        }}
      />
      <Tabs.Screen
        name="staff"
        options={{
          title: 'Team',
          tabBarBadge: teamBadge,
        }}
      />
      <Tabs.Screen name="management" options={{ href: null }} />
      <Tabs.Screen name="achievements" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="recruit" options={{ href: null }} />
      <Tabs.Screen name="research" options={{ href: null }} />
      <Tabs.Screen name="company" options={{ href: null }} />
    </Tabs>
  )
}
