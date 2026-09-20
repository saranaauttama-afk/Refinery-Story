import { useState } from 'react'
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native'
import { colors, radii, spacing } from '../theme'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type CollapsibleCardProps = {
  title: string
  // Shown next to the title even while collapsed (e.g. a one-line summary
  // like "78%" or "Ready" or a count) so collapsing doesn't hide the most
  // important glance-able info -- only the full detail underneath does.
  summary?: string
  children: React.ReactNode
  // Uncontrolled by default (manages its own open/closed state) --
  // initialOpen lets a caller start a specific card expanded (e.g. the
  // Boost card while active/cooldown, since that's actively relevant).
  initialOpen?: boolean
}

// Wraps a dashboard card with a tap-to-expand/collapse header, for cards
// whose body can get long (Production Overview grows with how many
// products are active; the Boost card grows when active/cooldown shows a
// progress bar). Uses LayoutAnimation rather than an explicit height
// Animated.Value since card content is variable-height and re-measuring
// on every render would be more code for the same visual result.
function CollapsibleCard({ title, summary, children, initialOpen = true }: CollapsibleCardProps) {
  const [open, setOpen] = useState(initialOpen)

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setOpen((o) => !o)
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={toggle}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          {summary && <Text style={styles.summary}>{summary}</Text>}
          <Text style={styles.chevron}>{open ? '▾' : '▸'}</Text>
        </View>
      </Pressable>
      {open && <View style={styles.body}>{children}</View>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  summary: {
    fontWeight: '700',
    color: colors.inkMuted,
    fontSize: 13,
  },
  chevron: {
    fontSize: 13,
    color: colors.inkMuted,
    width: 14,
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
})

export default CollapsibleCard
