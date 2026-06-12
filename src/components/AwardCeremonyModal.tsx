import type { AwardRecord } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type AwardCeremonyModalProps = {
  record: AwardRecord
  onClose: () => void
}

function AwardCeremonyModal({ record, onClose }: AwardCeremonyModalProps) {
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

        <button type="button" className="action-button primary" onClick={onClose}>
          <BilingualText text={text.awards.ceremonyClose} />
        </button>
      </article>
    </div>
  )
}

export default AwardCeremonyModal
