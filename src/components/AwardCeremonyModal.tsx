import type { AwardRecord } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type AwardCeremonyModalProps = {
  record: AwardRecord
  playerName: string
  onClose: () => void
}

function AwardCeremonyModal({ record, playerName, onClose }: AwardCeremonyModalProps) {
  const board = record.rivals.length > 0
    ? [
        ...record.rivals.map((rival) => ({ ...rival, isPlayer: false })),
        { key: 'player', name: null, score: record.score, grade: record.grade, isPlayer: true },
      ].sort((a, b) => b.score - a.score)
    : []

  return (
    <div className="choice-event-overlay" role="dialog" aria-modal="true">
      <article className={`award-ceremony-card award-ceremony--${record.grade}`}>
        <p className="panel-kicker">
          <BilingualText text={text.awards.kicker} />
        </p>
        <h2 className="award-ceremony-title">
          <BilingualText text={text.awards.ceremonyTitle(record.year)} />
        </h2>

        <div className={`award-ceremony-grade award-grade--${record.grade}`}>
          {record.grade}
        </div>

        <p className="award-ceremony-reward">
          <BilingualText text={text.awards.ceremonyReward(record.cashReward)} />
        </p>

        <div className="award-ceremony-stats">
          <div className="award-stat-row">
            <span><BilingualText text={text.awards.statGasoline} /></span>
            <strong>{record.gasolineProduced.toLocaleString()}</strong>
          </div>
          <div className="award-stat-row">
            <span><BilingualText text={text.awards.statMoney} /></span>
            <strong>${record.moneyEarned.toLocaleString()}</strong>
          </div>
          <div className="award-stat-row">
            <span><BilingualText text={text.awards.statContracts} /></span>
            <strong>{record.contractsCompleted}</strong>
          </div>
          <div className="award-stat-row award-stat-row--payroll">
            <span><BilingualText text={text.awards.statPayroll} /></span>
            <strong>−${record.payroll.toLocaleString()}</strong>
          </div>
          <div className="award-stat-row award-stat-row--net">
            <span><BilingualText text={text.awards.statNet} /></span>
            <strong className={record.netProfit < 0 ? 'award-net-negative' : ''}>
              ${record.netProfit.toLocaleString()}
            </strong>
          </div>
        </div>

        {record.couldNotAfford && (
          <p className="award-unpaid-warning">
            <BilingualText text={text.awards.unpaidWarning} />
          </p>
        )}

        {board.length > 0 && (
          <div className="award-ranking">
            <p className="panel-kicker">
              <BilingualText text={text.awards.rankingTitle} />
            </p>
            <ol className="award-ranking-list">
              {board.map((entry, index) => (
                <li
                  key={entry.key}
                  className={`award-ranking-row${entry.isPlayer ? ' award-ranking-row--player' : ''}`}
                >
                  <span className="award-ranking-position">#{index + 1}</span>
                  <span className="award-ranking-name">
                    {entry.isPlayer ? playerName : <BilingualText text={entry.name!} />}
                  </span>
                  <span className={`award-ranking-grade award-grade--${entry.grade}`}>
                    {entry.grade}
                  </span>
                  <span className="award-ranking-score">{entry.score.toLocaleString()}</span>
                </li>
              ))}
            </ol>
            <p className="award-ranking-summary">
              <BilingualText text={text.awards.rankingPosition(record.playerRank, board.length)} />
            </p>
          </div>
        )}

        <button type="button" className="action-button primary" onClick={onClose}>
          <BilingualText text={text.awards.ceremonyClose} />
        </button>
      </article>
    </div>
  )
}

export default AwardCeremonyModal
