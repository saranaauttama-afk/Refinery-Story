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

// The floating bottom tab bar (app/game/(tabs)/_layout.tsx) is
// position: 'absolute' with its own height + bottom margin, so React
// Navigation's automatic content-inset doesn't apply -- every tab
// screen's scrollable content needs at least this much bottom padding so
// the last item isn't hidden underneath the bar. Tab bar height (72) +
// its bottom margin (spacing.md = 12) + a little breathing room.
export const FLOATING_TAB_BAR_CLEARANCE = 72 + 12 + 16  // legacy — kept for non-factory screens
export const FAB_CLEARANCE = 96  // clearance for FAB button (56px + 20px bottom + padding)
