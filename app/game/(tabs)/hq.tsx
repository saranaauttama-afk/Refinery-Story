import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors, radii, spacing, FLOATING_TAB_BAR_CLEARANCE } from '../../../src/theme'

function PlaceholderCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  )
}

export default function HQScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>HQ</Text>
        <Text style={styles.subtitle}>Long-term progression placeholder for Phase 1.</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <PlaceholderCard title="Research" body="Placeholder space for future research progression and unlocks." />
        <PlaceholderCard title="Achievements" body="Placeholder summary for milestones and achievement tracking." />
        <PlaceholderCard title="Awards & Era" body="Placeholder area for annual results, rivals, and era progression." />
        <PlaceholderCard title="Save Tools" body="Placeholder tools for manual save, rename, and other utility actions." />
        <PlaceholderCard title="Settings" body="Placeholder link area for settings and app-level management." />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: FLOATING_TAB_BAR_CLEARANCE,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: 13,
    color: colors.inkMuted,
  },
})
