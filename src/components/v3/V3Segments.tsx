import { Pressable, StyleSheet, Text, View } from 'react-native'

import { fonts, pixelUi } from '../../theme'

/** Segmented control for sub-sections inside a bottom-sheet tab. */
export function V3Segments<K extends string>({ items, value, onChange }: {
  items: Array<{ key: K; label: string; dot?: boolean }>
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
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>{item.label}</Text>
            {item.dot && <View style={styles.dot} />}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 3, padding: 4, backgroundColor: pixelUi.shadow, borderWidth: 2, borderColor: pixelUi.border },
  item: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: pixelUi.borderSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  active: { backgroundColor: pixelUi.surfaceRaised, borderBottomWidth: 3, borderBottomColor: pixelUi.accent },
  label: { color: pixelUi.textMuted, fontFamily: fonts.brandHeading, fontSize: 12 },
  labelActive: { color: pixelUi.accent },
  dot: { position: 'absolute', top: 5, right: 5, width: 6, height: 6, backgroundColor: pixelUi.warning },
})
