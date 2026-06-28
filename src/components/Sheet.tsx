import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, radii, spacing } from '../theme'
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'

type SheetProps = {
  visible: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

function Sheet({ visible, title, onClose, children }: SheetProps) {
  const { t } = useLang()
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handleRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.close}>{t(text.common.close)}</Text>
          </Pressable>
        </View>
        <ScrollView style={styles.body}>{children}</ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '75%',
    paddingBottom: spacing.xl,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  close: {
    color: colors.blue,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
})

export default Sheet
