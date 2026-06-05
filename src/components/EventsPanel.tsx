import BilingualText from './BilingualText'
import { parseBilingualText, text } from '../translations'

type EventsPanelProps = {
  lastEventMessage: string
  onTriggerEvent: () => void
  onTriggerChoiceEvent: () => void
}

function EventsPanel({
  lastEventMessage,
  onTriggerEvent,
  onTriggerChoiceEvent,
}: EventsPanelProps) {
  return (
    <section className="panel events-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.events.kicker} />
          </p>
          <h2>
            <BilingualText text={text.events.title} />
          </h2>
        </div>
      </div>

      <div className="event-card">
        <strong>
          <BilingualText text={text.events.lastEvent} />
        </strong>
        <p>
          <BilingualText text={parseBilingualText(lastEventMessage)} />
        </p>
      </div>

      <div className="event-trigger-row">
        <button
          type="button"
          className="action-button"
          onClick={onTriggerEvent}
        >
          <BilingualText text={text.events.triggerButton} />
        </button>
        <button
          type="button"
          className="action-button primary"
          onClick={onTriggerChoiceEvent}
        >
          <BilingualText text={text.events.triggerChoiceButton} />
        </button>
      </div>
    </section>
  )
}

export default EventsPanel
