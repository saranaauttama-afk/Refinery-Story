import type { ChoiceEvent } from '../game/types'
import Dialog, { DialogButton } from './Dialog'

type ChoiceEventModalProps = {
  event: ChoiceEvent | null
  onChoose: (option: 'A' | 'B') => void
}

function ChoiceEventModal({ event, onChoose }: ChoiceEventModalProps) {
  return (
    <Dialog
      visible={!!event}
      dismissOnBackdrop={false}
      icon="📣"
      title={event?.title.en}
      subtitle={event?.description.en}
      footer={
        event ? (
          <>
            <DialogButton label={event.optionA.en} variant="primary" onPress={() => onChoose('A')} />
            <DialogButton label={event.optionB.en} variant="secondary" onPress={() => onChoose('B')} />
          </>
        ) : null
      }
    />
  )
}

export default ChoiceEventModal
