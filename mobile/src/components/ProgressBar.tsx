import { StyleSheet, View } from 'react-native'
import { colors, radii } from '../theme'

export default function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.ground,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: radii.pill,
  },
})
