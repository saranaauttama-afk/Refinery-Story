import type { WorkerCounts, WorkerType } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

const MAX_VISIBLE = 12

const WORKER_ICONS: Record<WorkerType, string> = {
  operator: '⚙️',
  mechanic: '🔧',
  salesAgent: '💼',
  safetyOfficer: '🦺',
  chemist: '🧪',
  logisticsCoordinator: '📦',
}

type WorkerPresenceBarProps = {
  workerCounts: WorkerCounts
}

function WorkerPresenceBar({ workerCounts }: WorkerPresenceBarProps) {
  const tokens: Array<{ type: WorkerType; icon: string }> = []

  for (const [type, count] of Object.entries(workerCounts) as [WorkerType, number][]) {
    for (let i = 0; i < count; i++) {
      tokens.push({ type, icon: WORKER_ICONS[type] })
    }
  }

  if (tokens.length === 0) return null

  const visible = tokens.slice(0, MAX_VISIBLE)
  const overflow = tokens.length - visible.length

  return (
    <div className="worker-presence-bar">
      <div className="worker-presence-tokens">
        {visible.map((token, i) => (
          <span
            key={`${token.type}-${i}`}
            className={`worker-token worker-token--${token.type}`}
            aria-hidden="true"
          >
            {token.icon}
          </span>
        ))}
        {overflow > 0 && (
          <span className="worker-token worker-token--overflow">
            <BilingualText text={text.workerPresence.overflow(overflow)} />
          </span>
        )}
      </div>
      <p className="worker-presence-note">
        <BilingualText text={text.workerPresence.decorativeNote} />
      </p>
    </div>
  )
}

export default WorkerPresenceBar
