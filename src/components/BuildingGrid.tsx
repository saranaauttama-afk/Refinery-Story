import { useState } from 'react'
import { BUILDINGS } from '../data/buildings'
import { EXPANSION_BALANCE } from '../data/balance'
import type { BuildingConfig, BuildingType, GridCell } from '../types'
import BilingualText from './BilingualText'
import { text, toAriaLabel } from '../translations'

type BuildingGridProps = {
  grid: GridCell[]
  gridExpansionLevel: number
  money: number
  refineryLevel: number
  selectedBuilding: BuildingType
  onPlaceBuilding: (cellIndex: number) => void
  onSelectBuilding: (building: BuildingType) => void
  onRemoveBuilding: (cellIndex: number) => void
}

function BuildingGrid({
  grid,
  gridExpansionLevel,
  money,
  refineryLevel,
  selectedBuilding,
  onPlaceBuilding,
  onSelectBuilding,
  onRemoveBuilding,
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

            return (
              <button
                key={index}
                type="button"
                className={`grid-cell ${cell ? 'filled' : 'empty'}`}
                onClick={() => onPlaceBuilding(index)}
                disabled={
                  cell !== null ||
                  selectedIsLocked ||
                  money < selectedConfig.cost
                }
              >
                {building ? (
                  <>
                    <span className="grid-cell-code">{building.shortName}</span>
                    <span className="grid-cell-name">
                      <BilingualText text={building.name} />
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
          })}
        </div>
      </article>
    </section>
  )
}

export default BuildingGrid
