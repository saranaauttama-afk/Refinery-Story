import BilingualText from './BilingualText'
import { text } from '../translations'

type StarterGuidePanelProps = {
  everBoughtCrude: boolean
  hasProducedGasoline: boolean
  hasCompletedContract: boolean
  onDismiss: () => void
}

type StepProps = {
  label: { en: string; th: string }
  done: boolean
}

function Step({ label, done }: StepProps) {
  return (
    <div className={`starter-step ${done ? 'done' : ''}`}>
      <span className="starter-step-check" aria-hidden="true">
        {done ? '✓' : '○'}
      </span>
      <span className="starter-step-label">
        <BilingualText text={label} />
      </span>
    </div>
  )
}

function StarterGuidePanel({
  everBoughtCrude,
  hasProducedGasoline,
  hasCompletedContract,
  onDismiss,
}: StarterGuidePanelProps) {
  const allDone = everBoughtCrude && hasProducedGasoline && hasCompletedContract

  return (
    <aside className="starter-guide-panel">
      <div className="starter-guide-header">
        <strong className="starter-guide-title">
          <BilingualText text={text.starterGuide.title} />
        </strong>
        <button
          type="button"
          className="starter-guide-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss guide"
        >
          <BilingualText text={text.starterGuide.dismissButton} />
        </button>
      </div>

      <div className="starter-steps">
        <Step label={text.starterGuide.step1} done={hasProducedGasoline} />
        <Step label={text.starterGuide.step2} done={everBoughtCrude} />
        <Step label={text.starterGuide.step3} done={hasCompletedContract} />
      </div>

      {!allDone && (
        <p className="starter-guide-hint">
          <BilingualText text={text.starterGuide.hint} />
        </p>
      )}

      {allDone && (
        <p className="starter-guide-all-done">
          <BilingualText text={text.starterGuide.allDone} />
        </p>
      )}
    </aside>
  )
}

export default StarterGuidePanel
