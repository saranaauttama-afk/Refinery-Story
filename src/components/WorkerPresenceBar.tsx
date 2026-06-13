import type { Employee, WorkerCounts, WorkerType } from '../types'
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
  employees: Employee[]
}

function WorkerPresenceBar({ workerCounts, employees }: WorkerPresenceBarProps) {
  // Order tokens by type (using workerCounts' key order) so the bar reads
  // consistently even though `employees` is in hire order across all types.
  const tokens: Array<{ type: WorkerType; icon: string; level: number }> = []

  for (const type of Object.keys(workerCounts) as WorkerType[]) {
    for (const employee of employees) {
      if (employee.type !== type) continue
      tokens.push({ type, icon: WORKER_ICONS[type], level: employee.level })
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
