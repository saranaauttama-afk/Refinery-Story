import type { ActiveContract, Contract, ReputationTier, StandingOrderKey } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'
import { CORE_BALANCE, STANDING_ORDER_BALANCE } from '../data/balance'

type ContractsPanelProps = {
  activeContracts: ActiveContract[]
  gasoline: number
  asphalt: number
  jetFuel: number
  refineryLevel: number
  currentReputation: number
  currentReputationTier: ReputationTier
  nextReputationTier?: ReputationTier
  standingOrderCooldowns: Partial<Record<StandingOrderKey, number>>
  tickCount: number
  onCompleteContract: (contract: Contract) => void
  onFulfillStandingOrder: (key: StandingOrderKey) => void
}

// Returns the product type, required amount, and shortfall for a contract.
// Add a new branch here when adding a new product.
function getContractRequirement(
  contract: ActiveContract,
  gasoline: number,
  asphalt: number,
  jetFuel: number,
) {
  if ((contract.jetFuelRequired ?? 0) > 0) {
    const required = contract.jetFuelRequired ?? 0
    return {
      product: text.contracts.productLabels.jetFuel,
      productKey: 'jetFuel' as const,
      required,
      shortfall: Math.max(0, required - jetFuel),
    }
  }
  if ((contract.asphaltRequired ?? 0) > 0) {
    const required = contract.asphaltRequired ?? 0
    return {
      product: text.contracts.productLabels.asphalt,
      productKey: 'asphalt' as const,
      required,
      shortfall: Math.max(0, required - asphalt),
    }
  }
  return {
    product: text.contracts.productLabels.gasoline,
    productKey: 'gasoline' as const,
    required: contract.gasolineRequired,
    shortfall: Math.max(0, contract.gasolineRequired - gasoline),
  }
}

function formatCooldown(remainingTicks: number): { minutes: number; seconds: number } {
  const remainingMs = remainingTicks * CORE_BALANCE.tickMs
  const minutes = Math.floor(remainingMs / 60_000)
  const seconds = Math.ceil((remainingMs % 60_000) / 1_000)
  return { minutes, seconds }
}

function ContractsPanel({
  activeContracts,
  gasoline,
  asphalt,
  jetFuel,
  refineryLevel,
  currentReputation,
  currentReputationTier,
  nextReputationTier,
  standingOrderCooldowns,
  tickCount,
  onCompleteContract,
  onFulfillStandingOrder,
}: ContractsPanelProps) {
  const unlockedStandingOrders = STANDING_ORDER_BALANCE.filter(
    (order) => refineryLevel >= order.unlockLevel,
  )

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
        <div className="contract-rep-row">
          <strong className="contract-rep-value">{currentReputation}</strong>
          <span className="contract-rep-label">
            <BilingualText text={text.contracts.reputationStatusTitle} />
          </span>
          <span className="contract-tier-chip">
            <BilingualText text={currentReputationTier.name} />
          </span>
        </div>
        <p className="contract-rep-next">
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

      {([1, 2, 3] as const).map((tier) => {
        const tierContracts = activeContracts.filter((c) => c.tier === tier)
        if (tierContracts.length === 0) return null
        return (
          <div key={tier} className="contracts-tier-group">
            <p className="contracts-tier-heading">
              <BilingualText text={text.contracts.tierHeading(tier)} />
            </p>
            <div className="contracts-list">
              {tierContracts.map((contract) => {
                const { product, productKey, required, shortfall } =
                  getContractRequirement(contract, gasoline, asphalt, jetFuel)
                const canComplete =
                  contract.isUnlocked && !contract.isCompleted && shortfall === 0

                let buttonText
                if (!contract.isUnlocked) {
                  buttonText = text.contracts.lockedButton
                } else if (contract.isCompleted) {
                  buttonText = text.contracts.completedButton
                } else if (shortfall > 0) {
                  buttonText =
                    productKey === 'jetFuel'
                      ? text.contracts.needJetFuel(shortfall)
                      : productKey === 'asphalt'
                        ? text.contracts.needAsphalt(shortfall)
                        : text.contracts.needGasoline(shortfall)
                } else {
                  buttonText = text.contracts.fulfillButton
                }

                return (
                  <article
                    key={contract.id}
                    className={`contract-card ${contract.isCompleted ? 'completed' : ''} ${!contract.isUnlocked ? 'locked' : ''}`}
                  >
                    <div className="contract-copy">
                      {productKey !== 'gasoline' && (
                        <span className={`contract-product-badge contract-product-badge--${productKey}`}>
                          <BilingualText text={product} />
                        </span>
                      )}
                      <strong>
                        <BilingualText text={contract.name} />
                      </strong>
                      <p className="contract-requires">
                        <BilingualText
                          text={text.contracts.requires(required, product)}
                        />
                      </p>
                      <p className="contract-rewards">
                        <BilingualText
                          text={text.contracts.rewards(
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
                      <BilingualText text={buttonText} />
                    </button>
                  </article>
                )
              })}
            </div>
          </div>
        )
      })}

      {unlockedStandingOrders.length > 0 && (
        <div className="standing-orders-group">
          <p className="contracts-tier-heading standing-orders-heading">
            <BilingualText text={text.standingOrders.sectionTitle} />
          </p>
          <div className="contracts-list">
            {unlockedStandingOrders.map((order) => {
              const orderText = text.standingOrders.orders[order.key]
              const productLabel = text.contracts.productLabels[order.productKey]
              const inventory = order.productKey === 'asphalt' ? asphalt : jetFuel
              const shortfall = Math.max(0, order.required - inventory)

              const cooldownAt = standingOrderCooldowns[order.key]
              const isRestocking =
                cooldownAt !== undefined && cooldownAt > tickCount

              let buttonText
              if (isRestocking) {
                const { minutes, seconds } = formatCooldown(cooldownAt! - tickCount)
                buttonText = text.standingOrders.restocking(minutes, seconds)
              } else if (shortfall > 0) {
                buttonText =
                  order.productKey === 'asphalt'
                    ? text.contracts.needAsphalt(shortfall)
                    : text.contracts.needJetFuel(shortfall)
              } else {
                buttonText = text.contracts.fulfillButton
              }

              const canFulfill = !isRestocking && shortfall === 0

              return (
                <article
                  key={order.key}
                  className={`contract-card standing-order-card ${isRestocking ? 'standing-order-restocking' : ''}`}
                >
                  <div className="contract-copy">
                    <span className={`contract-product-badge contract-product-badge--${order.productKey}`}>
                      <BilingualText text={productLabel} />
                    </span>
                    <strong>
                      <BilingualText text={orderText.name} />
                    </strong>
                    <p className="contract-flavor">
                      <BilingualText text={orderText.flavor} />
                    </p>
                    <p className="contract-requires">
                      <BilingualText
                        text={text.contracts.requires(order.required, productLabel)}
                      />
                    </p>
                    <p className="contract-rewards">
                      <BilingualText
                        text={text.contracts.rewards(
                          order.reward,
                          order.rpReward,
                          order.reputationReward,
                        )}
                      />
                    </p>
                  </div>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onFulfillStandingOrder(order.key)}
                    disabled={!canFulfill}
                  >
                    <BilingualText text={buttonText} />
                  </button>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export default ContractsPanel
