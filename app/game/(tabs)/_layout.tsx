import { Tabs } from 'expo-router'

// Keep Expo Router Tabs for deep-link compatibility (router.push/replace still
// works for /achievements, /settings, /store, /game/staff, /game/business etc.)
// We just hide the tab bar entirely — navigation is handled by the FAB overlay
// that lives inside the Factory screen (index.tsx).

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },  // hidden — FAB replaces it
      }}
    />
  )
}
