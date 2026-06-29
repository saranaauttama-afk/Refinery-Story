import { Component, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

type Props = { children: ReactNode }
type State = { error: Error | null }

// App-level safety net: a render error in any screen/overlay used to brick the
// whole app to the platform red error screen. This catches it and shows a
// recoverable "tap to continue" card instead, so a one-off bug can't trap the
// player. (React error boundaries must be class components.)
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Surfaced in dev logs; harmless in production.
    console.error('[ErrorBoundary]', error)
  }

  handleReset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>😵 Something went wrong</Text>
          <Text style={styles.body}>
            A screen hit an unexpected error. Your save is safe — tap below to continue.
          </Text>
          <ScrollView style={styles.detailBox}>
            <Text style={styles.detail}>{error.message || String(error)}</Text>
          </ScrollView>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonLabel}>Continue</Text>
          </Pressable>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 360,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  body: { fontSize: 13, color: colors.inkMuted, textAlign: 'center', lineHeight: 19 },
  detailBox: { maxHeight: 120, backgroundColor: colors.cream, borderRadius: radii.sm, padding: spacing.sm },
  detail: { fontSize: 11, color: colors.red, fontFamily: 'monospace' },
  button: {
    marginTop: spacing.xs,
    backgroundColor: colors.green,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  buttonLabel: { fontWeight: '800', color: colors.ink, fontSize: 15 },
})
