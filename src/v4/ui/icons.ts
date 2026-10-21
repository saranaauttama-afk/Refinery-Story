// Pixel icons made with PixelLab in the mockup's style (scripts/art: rounds 1–2).
// Stored pre-scaled with nearest-neighbour so phones downscale them without blur.
export const icons = {
  cash: require('../../../assets/v4/ui/cash.png'),
  star: require('../../../assets/v4/ui/star.png'),
  rd: require('../../../assets/v4/ui/rd.png'),
  calendar: require('../../../assets/v4/ui/calendar.png'),
  crown: require('../../../assets/v4/ui/crown.png'),
  build: require('../../../assets/v4/ui/tab_build.png'),
  blend: require('../../../assets/v4/ui/tab_blend.png'),
  staff: require('../../../assets/v4/ui/tab_staff.png'),
  customers: require('../../../assets/v4/ui/tab_customers.png'),
  company: require('../../../assets/v4/ui/tab_company.png'),
} as const
export type IconName = keyof typeof icons
