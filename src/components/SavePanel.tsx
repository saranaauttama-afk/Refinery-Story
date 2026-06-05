import type { BilingualTextValue } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type SavePanelProps = {
  statusMessage: BilingualTextValue
  onSave: () => void
  onReset: () => void
}

function SavePanel({ statusMessage, onSave, onReset }: SavePanelProps) {
  return (
    <section className="panel save-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.save.kicker} />
          </p>
          <h2>
            <BilingualText text={text.save.title} />
          </h2>
        </div>
      </div>

      <div className="save-status-card">
        <strong>
          <BilingualText text={text.save.status} />
        </strong>
        <p>
          <BilingualText text={statusMessage} />
        </p>
      </div>

      <div className="save-actions">
        <button type="button" className="action-button" onClick={onSave}>
          <BilingualText text={text.save.saveButton} />
        </button>
        <button type="button" className="action-button" onClick={onReset}>
          <BilingualText text={text.save.resetButton} />
        </button>
      </div>
    </section>
  )
}

export default SavePanel
