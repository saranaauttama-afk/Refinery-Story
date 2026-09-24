import type { ChoiceEvent } from '../game/types'
import Dialog, { DialogButton } from './Dialog'
import { useLang } from '../hooks/SettingsContext'

type ChoiceEventModalProps = {
  event: ChoiceEvent | null
  onChoose: (option: 'A' | 'B') => void
}

function ChoiceEventModal({ event, onChoose }: ChoiceEventModalProps) {
  const { t } = useLang()
  return (
    <Dialog
      visible={!!event}
      dismissOnBackdrop={false}
      icon="📣"
      title={event ? t(event.title) : undefined}
      subtitle={event ? t(event.description) : undefined}
      footer={
        event ? (
          <>
            <DialogButton label={t(event.optionA)} variant="primary" onPress={() => onChoose('A')} />
            <DialogButton label={t(event.optionB)} variant="secondary" onPress={() => onChoose('B')} />
          </>
        ) : null
      }
    />
  )
}

export default ChoiceEventModal
