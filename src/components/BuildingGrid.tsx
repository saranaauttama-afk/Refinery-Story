import { useState } from 'react'
import { BUILDINGS } from '../data/buildings'
import { BUILDING_UPGRADE_BALANCE, EXPANSION_BALANCE } from '../data/balance'
import type { BuildingConfig, BuildingType, GridCell } from '../types'
import BilingualText from './BilingualText'
import { text, toAriaLabel } from '../translations'

const UPGRADEABLE_TYPES: ReadonlySet<BuildingType> = new Set([
  'crudeTank',
  'productTank',
  'distillationUnit',
])

const UPGRADE_COST_BY_LEVEL = [
  0,
  BUILDING_UPGRADE_BALANCE.upgradeLv1ToLv2Cost,
  BUILDING_UPGRADE_BALANCE.upgradeLv2ToLv3Cost,
  0,
]

type BuildingGridProps = {
  grid: GridCell[]
  gridLevels: number[]
  gridExpansionLevel: number
  money: number
  refineryLevel: number
  selectedBuilding: BuildingType
  onPlaceBuilding: (cellIndex: number) => void
  onSelectBuilding: (building: BuildingType) => void
  onRemoveBuilding: (cellIndex: number) => void
  onUpgradeBuilding: (cellIndex: number) => void
}

function BuildingGrid({
  grid,
  gridLevels,
  gridExpansionLevel,
  money,
  refineryLevel,
  selectedBuilding,
  onPlaceBuilding,
  onSelectBuilding,
  onRemoveBuilding,
  onUpgradeBuilding,
}: BuildingGridProps) {
  const [isRemoveMode, setIsRemoveMode] = useState(false)
  const selectedConfig = BUILDINGS[selectedBuilding]
  const selectedIsLocked = !!(
    selectedConfig.unlockLevel && refineryLevel < selectedConfig.unlockLevel
  )
  const cols = EXPANSION_BALANCE[Math.min(gridExpansionLevel, EXPANSION_BALANCE.length - 1)].size

  return (
    <section className="layout-grid">
      <article className="panel build-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">
              <BilingualText text={text.buildings.kicker} />
            </p>
            <h2>
              <BilingualText text={text.buildings.title} />
            </h2>
          </div>
        </div>

        <div className="build-options">
          {(Object.entries(BUILDINGS) as [BuildingType, BuildingConfig][]).map(
            ([key, building]) => {
              const isLocked = !!(
                building.unlockLevel && refineryLevel < building.unlockLevel
              )
              return (
                <button
                  key={key}
                  type="button"
                  className={`build-option ${selectedBuilding === key ? 'selected' : ''} ${isLocked ? 'locked' : ''}`}
                  onClick={() => onSelectBuilding(key)}
                  disabled={isLocked}
                >
                  <span className="build-option-title">
                    <BilingualText text={building.name} />{' '}
                    {isLocked ? (
                      <span className="build-option-lock-badge">
                        <BilingualText text={text.buildings.locked} />
                      </span>
                    ) : (
                      <span>${building.cost}</span>
                    )}
                  </span>
                  <span className="build-option-copy">
                    <BilingualText text={building.description} />
                    {isLocked && (
                      <span className="build-option-unlock-note">
                        <BilingualText
                          text={text.buildings.unlockAtLevel(building.unlockLevel!)}
                        />
                      </span>
                    )}
                  </span>
                </button>
              )
            },
          )}
        </div>

        <p className="helper-text">
          <BilingualText text={text.buildings.adjacencyNote} />
        </p>
      </article>

      <article className={`panel grid-panel ${isRemoveMode ? 'remove-mode' : ''}`}>
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">
              <BilingualText text={text.buildings.gridKicker} />
            </p>
            <h2>
              <BilingualText text={text.buildings.gridTitle} />
            </h2>
          </div>
          <button
            type="button"
            className={`action-button remove-mode-toggle ${isRemoveMode ? 'active' : ''}`}
            onClick={() => setIsRemoveMode((prev) => !prev)}
          >
            <BilingualText
              text={isRemoveMode ? text.buildings.removeModeActive : text.buildings.removeModeButton}
            />
          </button>
        </div>

        {isRemoveMode && (
          <p className="helper-text no-refund-warning">
            <BilingualText text={text.buildings.noRefundWarning} />
          </p>
        )}

        <div
          className="refinery-grid"
          role="grid"
          aria-label={toAriaLabel(text.buildings.gridAriaLabel)}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {grid.map((cell, index) => {
            const building = cell ? BUILDINGS[cell] : null

            if (isRemoveMode) {
              return (
                <button
                  key={index}
                  type="button"
                  className={`grid-cell ${cell ? 'filled removable' : 'empty'}`}
                  onClick={() => cell && onRemoveBuilding(index)}
                  disabled={cell === null}
                >
                  {building ? (
                    <>
                      <span className="grid-cell-code">✕</span>
                      <span className="grid-cell-name">
                        <BilingualText text={text.buildings.removeCell(building.name)} />
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="grid-cell-code">+</span>
                      <span className="grid-cell-name">
                        <BilingualText
                          text={text.buildings.placeBuilding(selectedConfig.name)}
                        />
                      </span>
                    </>
                  )}
                </button>
              )
            }

            if (cell && building) {
              const level = gridLevels[index] ?? 1
              const isUpgradeable = UPGRADEABLE_TYPES.has(cell)
              const canUpgrade = isUpgradeable && level < BUILDING_UPGRADE_BALANCE.maxBuildingLevel
              const upgradeCost = UPGRADE_COST_BY_LEVEL[level] ?? 0
              const canAffordUpgrade = money >= upgradeCost

              return (
                <div key={index} className="grid-cell filled" role="gridcell">
                  <div className="grid-cell-header">
                    <span className="grid-cell-code">{building.shortName}</span>
                    {isUpgradeable && (
                      <span className={`grid-cell-level-badge${level >= BUILDING_UPGRADE_BALANCE.maxBuildingLevel ? ' max' : ''}`}>
                        {level < BUILDING_UPGRADE_BALANCE.maxBuildingLevel ? (
                          <BilingualText text={text.buildings.levelBadge(level)} />
                        ) : (
                          <BilingualText text={text.buildings.maxLevelBadge} />
                        )}
                      </span>
                    )}
                  </div>
                  <span className="grid-cell-name">
                    <BilingualText text={building.name} />
                  </span>
                  {canUpgrade && (
                    <button
                      type="button"
                      className="grid-cell-upgrade"
                      disabled={!canAffordUpgrade}
                      onClick={() => onUpgradeBuilding(index)}
                    >
                      <BilingualText text={text.buildings.upgradeButton(upgradeCost)} />
                    </button>
                  )}
                </div>
              )
            }

            return (
              <button
                key={index}
                type="button"
                className="grid-cell empty"
                onClick={() => onPlaceBuilding(index)}
                disabled={selectedIsLocked || money < selectedConfig.cost}
              >
                <span className="grid-cell-code">+</span>
                <span className="grid-cell-name">
                  <BilingualText
                    text={text.buildings.placeBuilding(selectedConfig.name)}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </article>
    </section>
  )
}

export default BuildingGrid
