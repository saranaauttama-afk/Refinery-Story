import { Tabs } from 'expo-router'

// Tab bar hidden — FAB navigation in Factory screen replaces it.
// Screens registered here: index (Factory), business, company.
// Old screens (production, staff, hq) kept as files for rollback but
// no longer registered as primary navigation targets.

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="business" />
      <Tabs.Screen name="company" />
    </Tabs>
  )
}
