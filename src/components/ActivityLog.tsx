import BilingualText from './BilingualText'
import { parseBilingualText, text } from '../translations'

type ActivityLogProps = {
  entries: string[]
}

function ActivityLog({ entries }: ActivityLogProps) {
  return (
    <section className="panel log-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">
            <BilingualText text={text.activity.kicker} />
          </p>
          <h2>
            <BilingualText text={text.activity.title} />
          </h2>
        </div>
      </div>
      <ul className="log-list">
        {entries.map((entry, index) => (
          <li key={`${entry}-${index}`}>
            <BilingualText text={parseBilingualText(entry)} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ActivityLog
