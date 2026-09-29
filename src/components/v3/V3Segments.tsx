import { Pressable, StyleSheet, Text, View } from 'react-native'

import { fonts } from '../../theme'

/** Segmented control for sub-sections inside a bottom-sheet tab. */
export function V3Segments<K extends string>({ items, value, onChange }: {
  items: Array<{ key: K; label: string; icon?: string; dot?: boolean }>
  value: K
  onChange: (key: K) => void
}) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.key === value
        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.key)}
            style={[styles.item, active && styles.active]}
          >
            {item.icon && <Text style={styles.icon}>{item.icon}</Text>}
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>{item.label}</Text>
            {item.dot && <View style={styles.dot} />}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 4, padding: 4, backgroundColor: '#10222F', borderRadius: 10, borderWidth: 1, borderColor: '#274B63' },
  item: { flex: 1, minHeight: 56, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, gap: 2 },
  active: { backgroundColor: '#FFD447', borderColor: '#B4863A' },
  icon: { fontSize: 18 },
  label: { color: '#8FA9BA', fontFamily: fonts.heading, fontSize: 11 },
  labelActive: { color: '#0A2943' },
  dot: { position: 'absolute', top: 6, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF6B5B' },
})
