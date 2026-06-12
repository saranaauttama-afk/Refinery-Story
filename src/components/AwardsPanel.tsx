import type { AwardRecord, YearStats } from '../types'
import { AWARDS_BALANCE } from '../data/balance'
import { getAwardGrade, getAwardScore } from '../utils/gameCalculations'
import BilingualText from './BilingualText'
import { text } from '../translations'

type AwardsPanelProps = {
  businessYear: number
  yearStats: YearStats
  yearProgressPercent: number
  awardHistory: AwardRecord[]
}

function AwardsPanel({
  businessYear,
  yearStats,
  yearProgressPercent,
  awardHistory,
}: AwardsPanelProps) {
  const projectedScore = getAwardScore(yearStats)
  const projectedGrade = getAwardGrade(projectedScore)

  return (
    <section className="panel awards-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.awards.kicker} />
          </p>
          <h2>
            <BilingualText text={text.awards.title} />
          </h2>
        </div>
        <span className={`award-grade-chip award-grade--${projectedGrade}`}>
          {projectedGrade}
        </span>
      </div>

      <div className="award-year-progress">
        <p className="award-year-label">
          <BilingualText
            text={text.awards.yearProgress(businessYear, yearProgressPercent)}
          />
        </p>
        <div className="award-year-track">
          <div
            className="award-year-fill"
            style={{ width: `${yearProgressPercent}%` }}
          />
        </div>
      </div>

      <div className="award-stats">
        <p className="award-stats-heading">
          <BilingualText text={text.awards.thisYear} />
        </p>
        <div className="award-stat-row">
          <span><BilingualText text={text.awards.statGasoline} /></span>
          <strong>{yearStats.gasolineProduced.toLocaleString()}</strong>
        </div>
        <div className="award-stat-row">
          <span><BilingualText text={text.awards.statMoney} /></span>
          <strong>${yearStats.moneyEarned.toLocaleString()}</strong>
        </div>
        <div className="award-stat-row">
          <span><BilingualText text={text.awards.statContracts} /></span>
          <strong>{yearStats.contractsCompleted}</strong>
        </div>
        <p className="award-projected">
          <BilingualText text={text.awards.projectedGrade(projectedGrade)} />
          {' '}({projectedScore} / {AWARDS_BALANCE.gradeThresholds.S})
        </p>
      </div>

      <div className="award-history">
        <p className="award-history-heading">
          <BilingualText text={text.awards.history} />
        </p>
        {awardHistory.length === 0 ? (
          <p className="helper-text">
            <BilingualText text={text.awards.noHistory} />
          </p>
        ) : (
          <div className="award-history-list">
            {awardHistory.map((record) => (
              <div key={record.year} className="award-history-row">
                <span className={`award-grade-chip small award-grade--${record.grade}`}>
                  {record.grade}
                </span>
                <span className="award-history-year">Year {record.year}</span>
                <span className="award-history-cash">
                  +${record.cashReward.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default AwardsPanel
