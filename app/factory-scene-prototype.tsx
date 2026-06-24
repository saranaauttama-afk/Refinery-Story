import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import FactoryScenePrototype from '../src/components/FactoryScenePrototype'
import { colors, radii, spacing } from '../src/theme'

export default function FactoryScenePrototypeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.screen}>
      <FactoryScenePrototype />
      <View pointerEvents="box-none" style={styles.overlay}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    padding: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(244, 234, 215, 0.9)',
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backLabel: {
    color: colors.ink,
    fontWeight: '800',
  },
})
