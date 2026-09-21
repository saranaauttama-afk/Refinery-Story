// Shared palette -- matches the isometric icon set (assets/icons) so the UI
// and icons feel like one consistent visual language.
export const colors = {
  // Backgrounds
  cream: '#F4EAD7',
  creamBorder: '#D8C7A8',
  ground: '#E3D6BC',
  white: '#FFFFFF',

  // Ink / text
  ink: '#2B3A4A',
  inkMuted: '#6B7A8A',

  // Steel (industrial / crude)
  steelLight: '#C9D3DB',
  steelMid: '#9AAAB8',
  steelDark: '#6E7E8C',

  // Accents
  orange: '#E8833A',
  orangeDark: '#C96A1F',
  gold: '#F2C12E',
  goldDark: '#E0A823',
  green: '#7FAE74',
  greenDark: '#5C8A52',
  blue: '#5B8DBF',
  blueDark: '#3F6E9E',
  teal: '#7FD1C8',
  purple: '#9B86C2',
  red: '#C0392B',
} as const

// Modern Pixel UI shell. The game world keeps its pixel-art palette while
// navigation and HUD use a quieter, high-contrast layer that does not compete
// with the refinery scene.
export const modernUi = {
  canvas: '#0C151E',
  surface: '#12212D',
  surfaceRaised: '#192B38',
  surfaceSoft: 'rgba(18,33,45,0.92)',
  border: 'rgba(221,235,243,0.10)',
  borderStrong: 'rgba(221,235,243,0.18)',
  text: '#F2F6F8',
  textMuted: '#8FA4B1',
  accent: '#F0B849',
  accentSoft: 'rgba(240,184,73,0.14)',
  success: '#66C78B',
  warning: '#EF8B4A',
  danger: '#E36B63',
} as const

// UI V2 pixel foundation. Keep this separate from the legacy palettes while
// screens are migrated so gameplay surfaces can move one verified slice at a
// time without silently changing every existing component.
export const pixelUi = {
  canvas: '#061827',
  surface: '#082A48',
  surfaceRaised: '#0B365B',
  surfacePressed: '#0D426C',
  border: '#0E5E96',
  borderSoft: '#123F62',
  shadow: '#03111D',
  text: '#F5F7F2',
  textMuted: '#9CB4C8',
  accent: '#FFD33D',
  accentDark: '#C98A0A',
  success: '#63DF79',
  warning: '#FF9B32',
  danger: '#F05B57',
  crude: '#A96F4F',
  gasoline: '#83DC70',
  rp: '#74D9F0',
} as const

export const pixelSpacing = {
  micro: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export const pixelRadii = {
  control: 3,
  panel: 4,
} as const

// Custom display font (Baloo 2 -- friendly, rounded, readable) loaded at app
// start in app/_layout.tsx. Until the font finishes loading these family
// names fall back to the system font. Applied to the game's "hero" text
// (company name, resource dock, headlines, celebration modals) to give the
// UI a cozy game identity instead of the default system typeface. Roll out
// to more screens by swapping a style's fontWeight for one of these.
export const fonts = {
  display: 'Baloo2_800ExtraBold', // big celebratory titles
  heading: 'Baloo2_700Bold', // section headers, badges, values
  body: 'Baloo2_500Medium', // labels, body copy
  regular: 'Baloo2_400Regular',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

export const radii = {
  sm: 8,
  md: 14,
  lg: 18,
  pill: 999,
} as const

// Vertical clearance (px from screen top) for transient overlay banners
// (hidden-event / era / combo / milestone). Kept below the persistent top HUD
// + resource dock on the factory screen so a banner never covers the player's
// money/crude/gas read-out. Global overlays render outside the SafeAreaView,
// so this also accounts for the status bar / notch area.
export const OVERLAY_BANNER_TOP = 132

// The floating bottom tab bar (app/game/(tabs)/_layout.tsx) is
// position: 'absolute' with its own height + bottom margin, so React
// Navigation's automatic content-inset doesn't apply -- every tab
// screen's scrollable content needs at least this much bottom padding so
// the last item isn't hidden underneath the bar. Tab bar height (72) +
// its bottom margin (spacing.md = 12) + a little breathing room.
export const FLOATING_TAB_BAR_CLEARANCE = 72 + 12 + 16  // legacy — kept for non-factory screens
export const FAB_CLEARANCE = 96  // clearance for FAB button (56px + 20px bottom + padding)
