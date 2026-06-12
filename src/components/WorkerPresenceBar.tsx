import type { WorkerCounts, WorkerLevels, WorkerType } from '../types'
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
  fuelSpecialist: '⛽',
  aviationSpecialist: '✈️',
  chemicalEngineer: '🏭',
}

type WorkerPresenceBarProps = {
  workerCounts: WorkerCounts
  workerLevels: WorkerLevels
}

function WorkerPresenceBar({ workerCounts, workerLevels }: WorkerPresenceBarProps) {
  const tokens: Array<{ type: WorkerType; icon: string; level: number }> = []

  for (const [type, count] of Object.entries(workerCounts) as [WorkerType, number][]) {
    const level = workerLevels[type] ?? 1
    for (let i = 0; i < count; i++) {
      tokens.push({ type, icon: WORKER_ICONS[type], level })
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
            title={`Lv ${token.level}`}
          >
            {token.icon}
            {token.level > 1 && (
              <span className="worker-token-level">{token.level}</span>
            )}
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
