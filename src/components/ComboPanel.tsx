import type { ComboStats } from '../types'
import BilingualText from './BilingualText'
import { text } from '../translations'

type ComboPanelProps = {
  comboStats: ComboStats
}

function ComboPanel({ comboStats }: ComboPanelProps) {
  return (
    <section className="panel combo-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.combos.kicker} />
          </p>
          <h2>
            <BilingualText text={text.combos.title} />
          </h2>
        </div>
      </div>

      <div className="combo-list">
        <article className="combo-card">
          <strong>
            <BilingualText
              text={text.combos.crudeDistillationTitle(
                comboStats.crudeToDistillation,
              )}
            />
          </strong>
          <p>
            <BilingualText text={text.combos.crudeDistillationDescription} />
          </p>
        </article>
        <article className="combo-card">
          <strong>
            <BilingualText
              text={text.combos.distillationProductTitle(
                comboStats.distillationToProduct,
              )}
            />
          </strong>
          <p>
            <BilingualText text={text.combos.distillationProductDescription} />
          </p>
        </article>
        <article className="combo-card">
          <strong>
            <BilingualText
              text={text.combos.crudeProductTitle(comboStats.crudeToProduct)}
            />
          </strong>
          <p>
            <BilingualText text={text.combos.crudeProductDescription} />
          </p>
        </article>
      </div>
    </section>
  )
}

export default ComboPanel
