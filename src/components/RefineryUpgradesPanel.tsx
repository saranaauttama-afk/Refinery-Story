import type { PerkBranch, PerkConfig, PerkKey } from '../types'
import { PERKS } from '../data/perks'
import BilingualText from './BilingualText'
import { text } from '../translations'

type RefineryUpgradesPanelProps = {
  upgradePoints: number
  unlockedPerks: PerkKey[]
  onInstallPerk: (perk: PerkConfig) => void
}

const BRANCH_ORDER: PerkBranch[] = ['efficiency', 'capacity', 'quality']

const BRANCH_LABELS = {
  efficiency: text.perks.branchEfficiency,
  capacity: text.perks.branchCapacity,
  quality: text.perks.branchQuality,
}

function RefineryUpgradesPanel({
  upgradePoints,
  unlockedPerks,
  onInstallPerk,
}: RefineryUpgradesPanelProps) {
  return (
    <section className="panel perks-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.perks.kicker} />
          </p>
          <h2>
            <BilingualText text={text.perks.title} />
          </h2>
        </div>
        <span className="status-badge">
          {upgradePoints}
        </span>
      </div>

      <p className="helper-text">
        <BilingualText
          text={
            upgradePoints > 0
              ? text.perks.pointsAvailable(upgradePoints)
              : text.perks.noPoints
          }
        />
      </p>

      <div className="perks-branches">
        {BRANCH_ORDER.map((branch) => {
          const branchPerks = PERKS.filter((p) => p.branch === branch)
          return (
            <div key={branch} className={`perk-branch perk-branch--${branch}`}>
              <p className="perk-branch-heading">
                <BilingualText text={BRANCH_LABELS[branch]} />
              </p>
              <div className="perk-branch-list">
                {branchPerks.map((perk) => {
                  const isInstalled = unlockedPerks.includes(perk.key)
                  const prereqMet =
                    !perk.prerequisite || unlockedPerks.includes(perk.prerequisite)
                  const canInstall =
                    !isInstalled && prereqMet && upgradePoints >= perk.cost

                  let buttonText
                  if (isInstalled) {
                    buttonText = text.perks.installed
                  } else if (!prereqMet) {
                    buttonText = text.perks.lockedPrereq
                  } else {
                    buttonText = text.perks.install
                  }

                  return (
                    <article
                      key={perk.key}
                      className={`perk-card ${isInstalled ? 'installed' : ''} ${!prereqMet ? 'locked' : ''}`}
                    >
                      <div className="perk-copy">
                        <div className="perk-title-row">
                          <strong>
                            <BilingualText text={perk.name} />
                          </strong>
                          <span className="perk-cost-chip">
                            <BilingualText text={text.perks.costLabel(perk.cost)} />
                          </span>
                        </div>
                        <p className="perk-description">
                          <BilingualText text={perk.description} />
                        </p>
                      </div>
                      <button
                        type="button"
                        className="action-button"
                        onClick={() => onInstallPerk(perk)}
                        disabled={!canInstall}
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
      </div>
    </section>
  )
}

export default RefineryUpgradesPanel
