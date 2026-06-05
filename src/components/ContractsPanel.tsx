import type { ActiveContract, Contract, ReputationTier } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ContractsPanelProps = {
  activeContracts: ActiveContract[]
  gasoline: number
  currentReputation: number
  currentReputationTier: ReputationTier
  nextReputationTier?: ReputationTier
  onCompleteContract: (contract: Contract) => void
}

function ContractsPanel({
  activeContracts,
  gasoline,
  currentReputation,
  currentReputationTier,
  nextReputationTier,
  onCompleteContract,
}: ContractsPanelProps) {
  return (
    <section className="panel contracts-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.contracts.kicker} />
          </p>
          <h2>
            <BilingualText text={text.contracts.title} />
          </h2>
        </div>
      </div>

      <div className="contract-status-card">
        <strong>{currentReputation}</strong>
        <p>
          <BilingualText text={text.contracts.reputationStatusTitle} />
        </p>
        <p>
          <BilingualText text={text.contracts.currentTier(currentReputationTier.name)} />
        </p>
        <p>
          <BilingualText
            text={
              nextReputationTier
                ? text.contracts.nextGoal(
                    nextReputationTier.minimumReputation,
                    nextReputationTier.name,
                  )
                : text.contracts.topTierReached
            }
          />
        </p>
      </div>

      <div className="contracts-list">
        {activeContracts.map((contract) => {
          const canComplete =
            contract.isUnlocked &&
            !contract.isCompleted &&
            gasoline >= contract.gasolineRequired

          return (
            <article
              key={contract.id}
              className={`contract-card ${contract.isCompleted ? 'completed' : ''} ${!contract.isUnlocked ? 'locked' : ''}`}
            >
              <div className="contract-copy">
                <span className="contract-tier-badge">
                  <BilingualText text={text.contracts.tierLabel(contract.tier)} />
                </span>
                <strong>
                  <BilingualText text={contract.name} />
                </strong>
                <p>
                  <BilingualText
                    text={text.contracts.summary(
                      contract.gasolineRequired,
                      contract.currentReward,
                      contract.currentRpReward,
                      contract.currentReputationReward,
                    )}
                  />
                </p>
                {!contract.isUnlocked && contract.unlockRequirement ? (
                  <p>
                    <BilingualText text={contract.unlockRequirement} />
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="action-button"
                onClick={() => onCompleteContract(contract)}
                disabled={!canComplete}
              >
                <BilingualText
                  text={
                    !contract.isUnlocked
                      ? text.contracts.lockedButton
                      : contract.isCompleted
                      ? text.contracts.completedButton
                      : text.contracts.fulfillButton
                  }
                />
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default ContractsPanel
