import { Image, StyleSheet, Text, View, type DimensionValue, type ImageStyle, type StyleProp } from 'react-native'

import { ART } from '../art/registry'
import { colors, radii } from '../theme'

// A drop-in art slot. While the matching id is missing from src/art/registry.ts
// it renders a tidy placeholder (id + target pixel size) so the layout is real
// and the artist knows exactly what to make; once the image is registered it
// renders the real bundled image instead. See ASSETS_NEEDED.md.
export default function ArtSlot({
  id,
  width,
  height,
  spec,
  caption,
  radius = radii.md,
  resize = 'cover',
  imageStyle,
}: {
  id: string
  /** Layout width (px or '100%'). */
  width: DimensionValue
  /** Layout height in px. */
  height: number
  /** Human-readable target size shown on the placeholder + in the manifest, e.g. "1080×600". */
  spec: string
  /** Optional short hint of what the art depicts. */
  caption?: string
  radius?: number
  resize?: 'cover' | 'contain'
  imageStyle?: StyleProp<ImageStyle>
}) {
  const source = ART[id]

  if (source) {
    return (
      <Image
        source={source}
        resizeMode={resize}
        style={[{ width, height, borderRadius: radius }, imageStyle]}
      />
    )
  }

  return (
    <View style={[styles.placeholder, { width, height, borderRadius: radius }]}>
      <Text style={styles.icon}>🎨</Text>
      <Text style={styles.id} numberOfLines={1}>{id}</Text>
      <Text style={styles.spec}>{spec}</Text>
      {caption ? <Text style={styles.caption} numberOfLines={2}>{caption}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: 'rgba(46,61,80,0.06)',
    borderWidth: 1.5,
    borderColor: colors.creamBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 2,
    overflow: 'hidden',
  },
  icon: { fontSize: 22, opacity: 0.55 },
  id: { fontSize: 11, fontWeight: '800', color: colors.inkMuted, letterSpacing: 0.3 },
  spec: { fontSize: 10, fontWeight: '700', color: colors.inkMuted, opacity: 0.7 },
  caption: { fontSize: 9, color: colors.inkMuted, opacity: 0.6, textAlign: 'center' },
})
