import BilingualText from './BilingualText'
import { text } from '../translations'

type DevToolsPanelProps = {
  onAddMoney: () => void
  onAddRP: () => void
  onAddReputation: () => void
  onAddCrude: () => void
  onAddGasoline: () => void
  onSetLevel5: () => void
  onSetLevel10: () => void
  onTriggerEvent: () => void
  onTriggerChoiceEvent: () => void
}

function DevToolsPanel({
  onAddMoney,
  onAddRP,
  onAddReputation,
  onAddCrude,
  onAddGasoline,
  onSetLevel5,
  onSetLevel10,
  onTriggerEvent,
  onTriggerChoiceEvent,
}: DevToolsPanelProps) {
  return (
    <aside className="dev-tools-panel">
      <div className="dev-tools-header">
        <span className="dev-tools-badge" aria-hidden="true">DEV</span>
        <strong className="dev-tools-title">
          <BilingualText text={text.devTools.label} />
        </strong>
      </div>
      <div className="dev-tools-grid">
        <button type="button" className="action-button dev-tools-button" onClick={onAddMoney}>
          <BilingualText text={text.devTools.addMoney} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onAddRP}>
          <BilingualText text={text.devTools.addRP} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onAddReputation}>
          <BilingualText text={text.devTools.addReputation} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onAddCrude}>
          <BilingualText text={text.devTools.addCrude} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onAddGasoline}>
          <BilingualText text={text.devTools.addGasoline} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onSetLevel5}>
          <BilingualText text={text.devTools.setLevel5} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onSetLevel10}>
          <BilingualText text={text.devTools.setLevel10} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onTriggerEvent}>
          <BilingualText text={text.devTools.triggerEvent} />
        </button>
        <button type="button" className="action-button dev-tools-button" onClick={onTriggerChoiceEvent}>
          <BilingualText text={text.devTools.triggerChoiceEvent} />
        </button>
      </div>
    </aside>
  )
}

export default DevToolsPanel
