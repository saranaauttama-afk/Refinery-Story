import type { DimensionValue } from 'react-native'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { fonts, pixelRadii, pixelSpacing, pixelUi } from '../theme'
import { useLang } from '../hooks/SettingsContext'
import { text } from '../game/translations'

type SheetProps = {
  visible: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  maxHeight?: DimensionValue
}

function Sheet({ visible, title, onClose, children, maxHeight = '78%' }: SheetProps) {
  const { t } = useLang()
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { maxHeight }]}>
        <View style={styles.handleRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(text.common.close)}
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.close}>×</Text>
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
    backgroundColor: 'rgba(3,17,29,0.76)',
  },
  sheet: {
    backgroundColor: pixelUi.surface,
    borderTopLeftRadius: pixelRadii.panel,
    borderTopRightRadius: pixelRadii.panel,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: pixelUi.border,
    paddingBottom: pixelSpacing.xl,
  },
  handleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: pixelSpacing.lg,
    paddingRight: pixelSpacing.sm,
    paddingVertical: pixelSpacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: pixelUi.borderSoft,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.display,
    color: pixelUi.text,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: pixelUi.border,
    borderRadius: pixelRadii.control,
    backgroundColor: pixelUi.surfaceRaised,
  },
  close: {
    color: pixelUi.text,
    fontFamily: fonts.heading,
    fontSize: 28,
    lineHeight: 30,
  },
  body: {
    paddingHorizontal: pixelSpacing.lg,
  },
})

export default Sheet
