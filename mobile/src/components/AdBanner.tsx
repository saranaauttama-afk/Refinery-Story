import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSettingsContext } from '../hooks/SettingsContext'
import { colors, radii, spacing } from '../theme'

// Placeholder for a real ad SDK banner (AdMob etc.). Tapping it goes to the
// "Remove Ads" store screen -- standard mobile-game pattern. Hidden entirely
// once settings.adsRemoved is true.
function AdBanner() {
  const { settings, loaded } = useSettingsContext()
  const router = useRouter()

  if (!loaded || settings.adsRemoved) return null

  return (
    <Pressable style={styles.banner} onPress={() => router.push('/store')}>
      <View style={styles.inner}>
        <Text style={styles.label}>AD</Text>
        <Text style={styles.text}>Your ad could be here · Tap to remove ads</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.creamBorder,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.white,
    backgroundColor: colors.inkMuted,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  text: {
    fontSize: 11,
    color: colors.inkMuted,
    flex: 1,
  },
})

export default AdBanner
