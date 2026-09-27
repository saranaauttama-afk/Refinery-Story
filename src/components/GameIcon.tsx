import { SvgXml } from 'react-native-svg'

import { ICON_XML } from './iconRegistry'

// Renders the project's isometric icon set (assets/icons/*.svg) inline via
// react-native-svg's SvgXml. The repo has no svg-transformer, so the .svg files
// can't be imported as components; iconRegistry.ts inlines their XML (generated
// by scripts/gen-icons.js) which keeps the real art with no new deps or metro
// config and works on web. The cream rounded-tile background is part of the art
// style (matches the building icons), so these read as little "resource tiles".
//
// `name` is a registry key (e.g. "worker-operator", "product-gasoline") or one
// of the short aliases below. Unknown names render nothing, so callers can pass
// e.g. product-recycledMaterial (no icon yet) without breaking the layout.

const ALIAS: Record<string, string> = {
  money: 'ui-money',
  crude: 'product-crudeOil',
  gas: 'product-gasoline',
  reputation: 'ui-reputation',
  esg: 'ui-esgScore',
  research: 'ui-researchPoints',
  season: 'ui-season',
  feedstock: 'product-feedstock',
}

export default function GameIcon({ name, size = 22 }: { name: string; size?: number }) {
  const key = ALIAS[name] ?? name
  const xml = ICON_XML[key]
  if (!xml) return null
  return <SvgXml xml={xml} width={size} height={size} />
}
