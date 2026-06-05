import type { BilingualTextValue } from '../types'

type BilingualTextProps = {
  text: BilingualTextValue
  className?: string
}

function BilingualText({ text, className = '' }: BilingualTextProps) {
  return (
    <span className={`bilingual-text ${className}`.trim()}>
      <span className="bilingual-en">{text.en}</span>
      {text.th ? <span className="bilingual-th">{text.th}</span> : null}
    </span>
  )
}

export default BilingualText
