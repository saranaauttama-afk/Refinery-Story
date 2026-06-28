import { SvgXml } from 'react-native-svg'

// Renders the project's isometric icon set (assets/icons/*.svg) inline via
// react-native-svg's SvgXml — the repo has no svg-transformer, so the .svg
// files can't be imported as components; inlining the (small, self-contained)
// XML keeps the real art with no new deps or metro config and works on web.
//
// To add an icon: paste the file's XML below keyed by a short name. The cream
// rounded-tile background is part of the art style (matches the building icons),
// so these read as little "resource tiles" on the dark HUD dock.

const ICON_XML: Record<string, string> = {
  // assets/icons/ui-money.svg
  money: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <ellipse cx="64" cy="78" rx="26" ry="9" fill="#C98A1F" stroke="#2B3A4A" stroke-width="3"/>
  <ellipse cx="64" cy="70" rx="26" ry="9" fill="#E0A823" stroke="#2B3A4A" stroke-width="3"/>
  <ellipse cx="64" cy="62" rx="26" ry="9" fill="#F2C12E" stroke="#2B3A4A" stroke-width="3"/>
  <text x="64" y="67" font-size="16" font-weight="700" fill="#2B3A4A" text-anchor="middle" font-family="Arial">$</text>
</svg>`,
  // assets/icons/product-crudeOil.svg
  crude: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <path d="M36 46 A28 10 0 0 0 64 56 V98 A28 10 0 0 1 36 88 Z" fill="#4A3728" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M92 46 A28 10 0 0 1 64 56 V98 A28 10 0 0 0 92 88 Z" fill="#6B5440" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="64" cy="46" rx="28" ry="10" fill="#8A6F52" stroke="#2B3A4A" stroke-width="3"/>
</svg>`,
  // assets/icons/product-gasoline.svg (stray "#5B6B78" token removed)
  gas: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <path d="M36 46 A28 10 0 0 0 64 56 V98 A28 10 0 0 1 36 88 Z" fill="#9BB84F" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M92 46 A28 10 0 0 1 64 56 V98 A28 10 0 0 0 92 88 Z" fill="#C3DC7E" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="64" cy="46" rx="28" ry="10" fill="#DCEFA8" stroke="#2B3A4A" stroke-width="3"/>
  <path d="M36 79 A28 10 0 0 0 64 89 V96 A28 10 0 0 1 36 86 Z" fill="#7FA33A" opacity="0.95"/>
  <path d="M92 79 A28 10 0 0 1 64 89 V96 A28 10 0 0 0 92 86 Z" fill="#9BB84F" opacity="0.95"/>
  <circle cx="100" cy="94" r="11" fill="#FFFFFF" stroke="#2B3A4A" stroke-width="2.5"/>
</svg>`,
  // assets/icons/ui-reputation.svg
  reputation: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="64.0,30.0 70.5,47.1 88.7,48.0 74.5,59.4 79.3,77.0 64.0,67.0 48.7,77.0 53.5,59.4 39.3,48.0 57.5,47.1" fill="#F2C12E" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M50 76 L40 96 L52 92 L58 100 L62 80 Z" fill="#C0392B" stroke="#2B3A4A" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M78 76 L88 96 L76 92 L70 100 L66 80 Z" fill="#E8833A" stroke="#2B3A4A" stroke-width="2.5" stroke-linejoin="round"/>
</svg>`,
  // assets/icons/ui-esgScore.svg
  esg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <path d="M64 30 L96 42 V70 Q96 96 64 106 Q32 96 32 70 V42 Z" fill="#A9C9A9" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M64 50 C84 54 84 78 64 90 C44 78 44 54 64 50 Z" fill="#5C8A52" stroke="#2B3A4A" stroke-width="2.5"/>
  <path d="M64 52 V88" stroke="#3F6E40" stroke-width="2"/>
</svg>`,
}

export type GameIconName = keyof typeof ICON_XML

export default function GameIcon({ name, size = 22 }: { name: GameIconName; size?: number }) {
  return <SvgXml xml={ICON_XML[name]} width={size} height={size} />
}
