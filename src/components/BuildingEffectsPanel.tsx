import { STORAGE_BALANCE } from '../data/balance'
import BilingualText from './BilingualText'
import { text } from '../translations'

type BuildingEffectsPanelProps = {
  maxCrudeStorage: number
  maxGasolineStorage: number
  contractRewardMultiplier: number
  contractRpRewardMultiplier: number
  eventPenaltyMultiplier: number
  productionMultiplier: number
  researchProductionMultiplier: number
  workerProductionMultiplier: number
}

function BuildingEffectsPanel({
  maxCrudeStorage,
  maxGasolineStorage,
  contractRewardMultiplier,
  contractRpRewardMultiplier,
  eventPenaltyMultiplier,
  productionMultiplier,
  researchProductionMultiplier,
  workerProductionMultiplier,
}: BuildingEffectsPanelProps) {
  const crudeBonus = maxCrudeStorage - STORAGE_BALANCE.baseCrudeStorage
  const gasolineBonus = maxGasolineStorage - STORAGE_BALANCE.baseGasolineStorage
  const contractRewardBonusPct = Math.round((contractRewardMultiplier - 1) * 100)
  const rpRewardBonusPct = Math.round((contractRpRewardMultiplier - 1) * 100)
  const penaltyReductionPct = Math.round((1 - eventPenaltyMultiplier) * 100)
  const totalProductionBonusPct = Math.round(
    (productionMultiplier * researchProductionMultiplier * workerProductionMultiplier - 1) * 100,
  )

  const hasStorageBonus = crudeBonus > 0 || gasolineBonus > 0
  const hasProductionBonus = totalProductionBonusPct > 0
  const hasContractBonus = contractRewardBonusPct > 0
  const hasRpBonus = rpRewardBonusPct > 0
  const hasEventProtection = penaltyReductionPct > 0
  const hasAnyBonus =
    hasStorageBonus ||
    hasProductionBonus ||
    hasContractBonus ||
    hasRpBonus ||
    hasEventProtection

  return (
    <article className="panel building-effects-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.buildingEffects.kicker} />
          </p>
          <h2>
            <BilingualText text={text.buildingEffects.title} />
          </h2>
        </div>
      </div>

      {!hasAnyBonus ? (
        <p className="helper-text">
          <BilingualText text={text.buildingEffects.noBonuses} />
        </p>
      ) : (
        <dl className="effects-list">
          {hasStorageBonus && (
            <div className="effects-group">
              <dt className="effects-group-label">
                <BilingualText text={text.buildingEffects.storageGroup} />
              </dt>
              {crudeBonus > 0 && (
                <dd>
                  <BilingualText text={text.buildingEffects.crudeBonus(crudeBonus)} />
                </dd>
              )}
              {gasolineBonus > 0 && (
                <dd>
                  <BilingualText text={text.buildingEffects.gasolineBonus(gasolineBonus)} />
                </dd>
              )}
            </div>
          )}

          {hasProductionBonus && (
            <div className="effects-group">
              <dt className="effects-group-label">
                <BilingualText text={text.buildingEffects.productionGroup} />
              </dt>
              <dd>
                <BilingualText
                  text={text.buildingEffects.productionBonusPct(totalProductionBonusPct)}
                />
              </dd>
            </div>
          )}

          {hasContractBonus && (
            <div className="effects-group">
              <dt className="effects-group-label">
                <BilingualText text={text.buildingEffects.contractRewardsGroup} />
              </dt>
              <dd>
                <BilingualText
                  text={text.buildingEffects.contractRewardBonusPct(contractRewardBonusPct)}
                />
              </dd>
            </div>
          )}

          {hasRpBonus && (
            <div className="effects-group">
              <dt className="effects-group-label">
                <BilingualText text={text.buildingEffects.researchRewardsGroup} />
              </dt>
              <dd>
                <BilingualText
                  text={text.buildingEffects.rpRewardBonusPct(rpRewardBonusPct)}
                />
              </dd>
            </div>
          )}

          {hasEventProtection && (
            <div className="effects-group">
              <dt className="effects-group-label">
                <BilingualText text={text.buildingEffects.eventProtectionGroup} />
              </dt>
              <dd>
                <BilingualText
                  text={text.buildingEffects.penaltyReductionPct(penaltyReductionPct)}
                />
              </dd>
            </div>
          )}
        </dl>
      )}
    </article>
  )
}

export default BuildingEffectsPanel
