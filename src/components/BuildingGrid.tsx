import { BUILDINGS } from '../data/buildings'
import type { BuildingConfig, BuildingType, GridCell } from '../types'
import BilingualText from './BilingualText'
import { text, toAriaLabel } from '../translations'

type BuildingGridProps = {
  grid: GridCell[]
  money: number
  selectedBuilding: BuildingType
  onPlaceBuilding: (cellIndex: number) => void
  onSelectBuilding: (building: BuildingType) => void
}

function BuildingGrid({
  grid,
  money,
  selectedBuilding,
  onPlaceBuilding,
  onSelectBuilding,
}: BuildingGridProps) {
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
            ([key, building]) => (
              <button
                key={key}
                type="button"
                className={`build-option ${selectedBuilding === key ? 'selected' : ''}`}
                onClick={() => onSelectBuilding(key)}
              >
                <span className="build-option-title">
                  <BilingualText text={building.name} /> <span>${building.cost}</span>
                </span>
                <span className="build-option-copy">
                  <BilingualText text={building.description} />
                </span>
              </button>
            ),
          )}
        </div>

        <p className="helper-text">
          <BilingualText text={text.buildings.adjacencyNote} />
        </p>
      </article>

      <article className="panel grid-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-kicker">
              <BilingualText text={text.buildings.gridKicker} />
            </p>
            <h2>
              <BilingualText text={text.buildings.gridTitle} />
            </h2>
          </div>
        </div>

        <div
          className="refinery-grid"
          role="grid"
          aria-label={toAriaLabel(text.buildings.gridAriaLabel)}
        >
          {grid.map((cell, index) => {
            const building = cell ? BUILDINGS[cell] : null

            return (
              <button
                key={index}
                type="button"
                className={`grid-cell ${cell ? 'filled' : 'empty'}`}
                onClick={() => onPlaceBuilding(index)}
                disabled={cell !== null || money < BUILDINGS[selectedBuilding].cost}
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
                        text={text.buildings.placeBuilding(
                          BUILDINGS[selectedBuilding].name,
                        )}
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
