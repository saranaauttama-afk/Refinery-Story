import { useEffect, useState } from 'react'
import './App.css'

const STARTING_MONEY = 60
const STARTING_CRUDE = 12
const GASOLINE_PRICE = 18
const BASE_REFINING_MS = 2600
const SPEED_STEP_MS = 350
const MIN_REFINING_MS = 900

function App() {
  const [money, setMoney] = useState(STARTING_MONEY)
  const [crudeOil, setCrudeOil] = useState(STARTING_CRUDE)
  const [gasoline, setGasoline] = useState(0)
  const [speedLevel, setSpeedLevel] = useState(0)
  const [isRefining, setIsRefining] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeRefiningTime, setActiveRefiningTime] = useState(BASE_REFINING_MS)

  const refiningTime = Math.max(
    MIN_REFINING_MS,
    BASE_REFINING_MS - speedLevel * SPEED_STEP_MS,
  )
  const upgradeCost = 45 + speedLevel * 35
  const refineSeconds = (refiningTime / 1000).toFixed(1)
  const activeRefineSeconds = (activeRefiningTime / 1000).toFixed(1)

  useEffect(() => {
    if (!isRefining) {
      return
    }

    const startedAt = Date.now()
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt
      setProgress(Math.min((elapsed / activeRefiningTime) * 100, 100))
    }, 100)

    const finishTimer = window.setTimeout(() => {
      setGasoline((current) => current + 1)
      setProgress(100)
      setIsRefining(false)
    }, activeRefiningTime)

    return () => {
      window.clearInterval(progressTimer)
      window.clearTimeout(finishTimer)
    }
  }, [activeRefiningTime, isRefining])

  function handleRefine() {
    if (isRefining || crudeOil < 1) {
      return
    }

    setCrudeOil((current) => current - 1)
    setActiveRefiningTime(refiningTime)
    setProgress(0)
    setIsRefining(true)
  }

  function handleSell() {
    if (gasoline < 1) {
      return
    }

    setGasoline((current) => current - 1)
    setMoney((current) => current + GASOLINE_PRICE)
  }

  function handleUpgrade() {
    if (money < upgradeCost) {
      return
    }

    setMoney((current) => current - upgradeCost)
    setSpeedLevel((current) => current + 1)
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Refinery Story</p>
        <h1>Small refinery, tight margins, one more barrel.</h1>
        <p className="hero-copy">
          Turn crude into gasoline, sell it for cash, and keep upgrading the
          plant so each batch finishes faster.
        </p>
      </section>

      <section className="resource-grid" aria-label="Resources">
        <article className="resource-card">
          <span className="resource-label">Money</span>
          <strong>${money}</strong>
          <p>Used to fund refinery upgrades.</p>
        </article>

        <article className="resource-card">
          <span className="resource-label">Crude Oil</span>
          <strong>{crudeOil} bbl</strong>
          <p>Each refining run consumes one barrel.</p>
        </article>

        <article className="resource-card">
          <span className="resource-label">Gasoline</span>
          <strong>{gasoline} units</strong>
          <p>Sell each unit for ${GASOLINE_PRICE}.</p>
        </article>
      </section>

      <section className="control-grid">
        <article className="panel operation-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Operations</p>
              <h2>Refinery Floor</h2>
            </div>
            <span className={`status-badge ${isRefining ? 'active' : ''}`}>
              {isRefining ? 'Refining' : 'Idle'}
            </span>
          </div>

          <div className="progress-block" aria-live="polite">
            <div className="progress-meta">
              <span>Current batch</span>
              <span>{isRefining ? `${progress.toFixed(0)}%` : 'Ready'}</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <div
                className="progress-fill"
                style={{ width: `${isRefining ? progress : 0}%` }}
              />
            </div>
            <p className="helper-text">
              {isRefining
                ? `One barrel is being processed into gasoline in ${activeRefineSeconds}s.`
                : crudeOil > 0
                  ? `The next batch will finish in ${refineSeconds}s.`
                  : 'No crude remaining for the next batch.'}
            </p>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="action-button primary"
              onClick={handleRefine}
              disabled={isRefining || crudeOil < 1}
            >
              Refine 1 Crude
            </button>
            <button
              type="button"
              className="action-button"
              onClick={handleSell}
              disabled={gasoline < 1}
            >
              Sell 1 Gasoline
            </button>
          </div>
        </article>

        <article className="panel upgrade-panel">
          <p className="panel-kicker">Upgrades</p>
          <h2>Refinery Speed</h2>
          <p className="upgrade-value">Level {speedLevel}</p>
          <p className="helper-text">
            Faster equipment lowers the time needed for each barrel.
          </p>

          <dl className="stats-list">
            <div>
              <dt>Current speed</dt>
              <dd>{refineSeconds}s per barrel</dd>
            </div>
            <div>
              <dt>Next upgrade cost</dt>
              <dd>${upgradeCost}</dd>
            </div>
          </dl>

          <button
            type="button"
            className="action-button accent"
            onClick={handleUpgrade}
            disabled={money < upgradeCost}
          >
            Upgrade Speed
          </button>
        </article>
      </section>
    </main>
  )
}

export default App
