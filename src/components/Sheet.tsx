import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, radii, spacing } from '../theme'
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
    backgroundColor: 'rgba(6,9,14,0.6)',
  },
  sheet: {
    backgroundColor: '#161D28',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.09)',
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
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: '#F2F6FB',
  },
  close: {
    color: colors.teal,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: spacing.lg,
  },
})

export default Sheet
