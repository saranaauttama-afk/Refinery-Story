// Hand-authored isometric SVG icons for the 9 original building types
// (crude tank through sales office -- the buildings that existed when
// these icons were generated). Embedded as string constants rather than
// imported as files because Metro's default config treats .svg as a
// binary asset (require() returns a module reference, not text) -- this
// repo doesn't have react-native-svg-transformer configured, and adding
// that is a bigger, riskier change than just inlining ~1KB of SVG markup
// per icon. Rendered via react-native-svg's SvgXml component.
//
// The 8 buildings added later (Power Plant, Waste Treatment Plant,
// Polymer Plant, and the 5 Tank Farm storage buildings) don't have icons
// yet -- BuildingTile falls back to the existing colored-box-with-
// shortName rendering for any BuildingType not in this map. See
// BUILDING_ICONS below.

import type { BuildingType } from './game/types'

export const BUILDING_ICONS: Partial<Record<BuildingType, string>> = {
  crudeTank: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <path d="M30 40 A34 13 0 0 0 64 53 V103 A34 13 0 0 1 30 90 Z" fill="#6E7E8C" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M98 40 A34 13 0 0 1 64 53 V103 A34 13 0 0 0 98 90 Z" fill="#AEBBC6" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="64" cy="40" rx="34" ry="13" fill="#C9D3DB" stroke="#2B3A4A" stroke-width="3"/>
  <path d="M30 72 A34 13 0 0 0 64 85 V92 A34 13 0 0 1 30 79 Z" fill="#C96A1F" opacity="0.95"/>
  <path d="M98 72 A34 13 0 0 1 64 85 V92 A34 13 0 0 0 98 79 Z" fill="#F2A05E" opacity="0.95"/>
  <rect x="98" y="48" width="14" height="10" rx="2" fill="#9AAAB8" stroke="#2B3A4A" stroke-width="2"/>

</svg>`,
  distillationUnit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="38,50 64,61 64,107 38,96" fill="#7E8FA0" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,61 90,50 90,96 64,107" fill="#AEBBC6" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,39 90,50 64,61 38,50" fill="#D8E0E6" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <rect x="46" y="24" width="8" height="24" rx="2" fill="#8A99A8" stroke="#2B3A4A" stroke-width="2"/>
  <ellipse cx="50" cy="21" rx="7" ry="4" fill="#FFFFFF" opacity="0.55"/>
  <rect x="76" y="30" width="8" height="18" rx="2" fill="#8A99A8" stroke="#2B3A4A" stroke-width="2"/>
  <ellipse cx="80" cy="27" rx="7" ry="4" fill="#FFFFFF" opacity="0.55"/>
  <circle cx="64" cy="68" r="7" fill="#F2A05E" opacity="0.85"/>
  <circle cx="64" cy="68" r="3.5" fill="#E8833A"/>

</svg>`,
  jetFuelPlant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="34,50 64,62 64,104 34,92" fill="#7E97AC" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,62 94,50 94,92 64,104" fill="#B6C8D6" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,38 94,50 64,62 34,50" fill="#E2EAF1" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="48,68 80,68 80,74 48,74" fill="#5B8DBF" opacity="0.85"/>
  <circle cx="64" cy="38" r="11" fill="#5B8DBF" stroke="#2B3A4A" stroke-width="2.5"/>
  <path d="M56 39 L73 36 L73 39 L62 41 L73 43 L73 46 Z" fill="#FFFFFF" stroke="#2B3A4A" stroke-width="1.2" stroke-linejoin="round"/>

</svg>`,
  laboratory: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="34,48 64,60 64,102 34,90" fill="#9BB8C9" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,60 94,48 94,90 64,102" fill="#C7DCE8" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,36 94,48 64,60 34,48" fill="#EAF3F8" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <rect x="50" y="60" width="12" height="14" rx="1.5" fill="#BFE3F0" stroke="#2B3A4A" stroke-width="2"/>
  <circle cx="64" cy="36" r="11" fill="#7FD1C8" stroke="#2B3A4A" stroke-width="2.5"/>
  <path d="M61 33 v-5 h6 v5 l3 6 a4 4 0 0 1 -4 4 h-4 a4 4 0 0 1 -4 -4 z" fill="#FFFFFF" stroke="#2B3A4A" stroke-width="1.5"/>
  <rect x="60" y="27" width="8" height="2" fill="#2B3A4A"/>

</svg>`,
  lubricantPlant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="34,50 64,62 64,104 34,92" fill="#74848F" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,62 94,50 94,92 64,104" fill="#A6B4BD" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,38 94,50 64,62 34,50" fill="#D9DEE2" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <rect x="48" y="64" width="12" height="18" rx="6" fill="#E0A823" stroke="#2B3A4A" stroke-width="2"/>
  <rect x="64" y="64" width="12" height="18" rx="6" fill="#F2C12E" stroke="#2B3A4A" stroke-width="2"/>
  <rect x="80" y="28" width="8" height="20" rx="2" fill="#8A99A8" stroke="#2B3A4A" stroke-width="2"/>
  <ellipse cx="84" cy="25" rx="7" ry="4" fill="#FFFFFF" opacity="0.55"/>

</svg>`,
  maintenanceWorkshop: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="34,50 64,62 64,102 34,90" fill="#A38F73" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,62 94,50 94,90 64,102" fill="#C7B59B" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,38 94,50 64,62 34,50" fill="#E4D9C8" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <rect x="48" y="62" width="20" height="22" rx="2" fill="#8A99A8" stroke="#2B3A4A" stroke-width="2"/>
  <line x1="48" y1="67" x2="68" y2="67" stroke="#2B3A4A" stroke-width="1.5" opacity="0.5"/>
  <line x1="48" y1="72" x2="68" y2="72" stroke="#2B3A4A" stroke-width="1.5" opacity="0.5"/>
  <line x1="48" y1="77" x2="68" y2="77" stroke="#2B3A4A" stroke-width="1.5" opacity="0.5"/>
  <circle cx="64" cy="38" r="11" fill="#F2A12E" stroke="#2B3A4A" stroke-width="2.5"/>
  <g transform="rotate(-35 64 38)"><rect x="56" y="36" width="16" height="4.5" rx="2" fill="#FFFFFF" stroke="#2B3A4A" stroke-width="1.5"/><circle cx="70" cy="38.25" r="3.5" fill="none" stroke="#2B3A4A" stroke-width="1.5"/></g>

</svg>`,
  petrochemicalPlant: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="34,50 64,62 64,104 34,92" fill="#8A78A8" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,62 94,50 94,92 64,104" fill="#BBA9D4" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,38 94,50 64,62 34,50" fill="#E6DEF0" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <rect x="48" y="26" width="8" height="22" rx="2" fill="#9B86C2" stroke="#2B3A4A" stroke-width="2"/>
  <ellipse cx="52" cy="23" rx="7" ry="4" fill="#FFFFFF" opacity="0.55"/>
  <rect x="64" y="22" width="8" height="26" rx="2" fill="#A993CC" stroke="#2B3A4A" stroke-width="2"/>
  <ellipse cx="68" cy="19" rx="7" ry="4" fill="#FFFFFF" opacity="0.55"/>
  <rect x="80" y="30" width="8" height="18" rx="2" fill="#9B86C2" stroke="#2B3A4A" stroke-width="2"/>
  <ellipse cx="84" cy="27" rx="7" ry="4" fill="#FFFFFF" opacity="0.55"/>
  <circle cx="64" cy="70" r="9" fill="#7FD1C8" stroke="#2B3A4A" stroke-width="2.5"/>
  <circle cx="61" cy="68" r="2" fill="#FFFFFF"/><circle cx="67" cy="68" r="2" fill="#FFFFFF"/><circle cx="64" cy="72.5" r="2" fill="#FFFFFF"/>
  <line x1="61" y1="68" x2="67" y2="68" stroke="#FFFFFF" stroke-width="1.5"/><line x1="61" y1="68" x2="64" y2="72.5" stroke="#FFFFFF" stroke-width="1.5"/><line x1="67" y1="68" x2="64" y2="72.5" stroke="#FFFFFF" stroke-width="1.5"/>

</svg>`,
  productTank: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <path d="M30 40 A34 13 0 0 0 64 53 V103 A34 13 0 0 1 30 90 Z" fill="#7FA582" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M98 40 A34 13 0 0 1 64 53 V103 A34 13 0 0 0 98 90 Z" fill="#A9C9A9" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="64" cy="40" rx="34" ry="13" fill="#D6E8D6" stroke="#2B3A4A" stroke-width="3"/>
  <path d="M30 72 A34 13 0 0 0 64 85 V92 A34 13 0 0 1 30 79 Z" fill="#4F8C52" opacity="0.95"/>
  <path d="M98 72 A34 13 0 0 1 64 85 V92 A34 13 0 0 0 98 79 Z" fill="#6FB373" opacity="0.95"/>
  <rect x="98" y="48" width="14" height="10" rx="2" fill="#9AAAB8" stroke="#2B3A4A" stroke-width="2"/>

</svg>`,
  salesOffice: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect x="4" y="4" width="120" height="120" rx="18" fill="#F4EAD7" stroke="#D8C7A8" stroke-width="2"/>
  <polygon points="64,118 18,98 64,78 110,98" fill="#E3D6BC"/>
  <ellipse cx="64" cy="100" rx="38" ry="11" fill="#000000" opacity="0.07"/>
  <polygon points="34,50 64,62 64,102 34,90" fill="#CBB994" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,62 94,50 94,90 64,102" fill="#E6D5B8" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <polygon points="64,38 94,50 64,62 34,50" fill="#FBF3E4" stroke="#2B3A4A" stroke-width="3" stroke-linejoin="round"/>
  <path d="M48 62 L80 62 L84 70 L44 70 Z" fill="#5B8DBF" stroke="#2B3A4A" stroke-width="2"/>
  <rect x="52" y="70" width="24" height="14" rx="1.5" fill="#CDE6F2" stroke="#2B3A4A" stroke-width="2"/>
  <circle cx="64" cy="38" r="11" fill="#F2C12E" stroke="#2B3A4A" stroke-width="2.5"/>
  <text x="64" y="43" font-size="13" font-weight="700" fill="#2B3A4A" text-anchor="middle" font-family="Arial">$</text>

</svg>`,
}
