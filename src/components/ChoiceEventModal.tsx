import type { ChoiceEvent } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ChoiceEventModalProps = {
  event: ChoiceEvent
  onChoose: (option: 'A' | 'B') => void
}

function ChoiceEventModal({ event, onChoose }: ChoiceEventModalProps) {
  return (
    <div className="choice-event-overlay" role="dialog" aria-modal="true">
      <article className="choice-event-card">
        <p className="panel-kicker">
          <BilingualText text={text.choiceEvents.kicker} />
        </p>
        <h2 className="choice-event-title">
          <BilingualText text={event.title} />
        </h2>
        <p className="choice-event-description">
          <BilingualText text={event.description} />
        </p>
        <p className="choice-event-choose-label">
          <BilingualText text={text.choiceEvents.chooseLabel} />
        </p>
        <div className="choice-event-options">
          <button
            type="button"
            className="action-button primary"
            onClick={() => onChoose('A')}
          >
            <BilingualText text={event.optionA} />
          </button>
          <button
            type="button"
            className="action-button accent"
            onClick={() => onChoose('B')}
          >
            <BilingualText text={event.optionB} />
          </button>
        </div>
      </article>
    </div>
  )
}

export default ChoiceEventModal
