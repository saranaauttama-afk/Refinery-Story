import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import ListRow from '../../src/components/ListRow'
import { useGameLoop } from '../../src/hooks/useGameLoop'
import { colors, spacing } from '../../src/theme'
import { WORKERS } from '../../src/game/data/workers'

export default function StaffScreen() {
  const { game, loaded, hireWorker } = useGameLoop()

  if (!loaded || !game) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.orange} size="large" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff</Text>
        <Text style={styles.subtitle}>{game.employees.length} employees hired</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {WORKERS.map((worker) => {
          const count = game.workerCounts[worker.key] ?? 0
          const locked = worker.unlockLevel ? game.refineryLevel < worker.unlockLevel : false
          const affordable = game.money >= worker.cost
          return (
            <View key={worker.key} style={styles.card}>
              <ListRow
                title={`${worker.name.en} · x${count}`}
                subtitle={
                  locked
                    ? `Requires refinery Lv${worker.unlockLevel}`
                    : `${worker.description.en} · $${worker.cost.toLocaleString()}`
                }
                actionLabel="Hire"
                disabled={locked || !affordable}
                onPress={() => hireWorker(worker)}
              />
            </View>
          )
        })}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xs,
  },
})
