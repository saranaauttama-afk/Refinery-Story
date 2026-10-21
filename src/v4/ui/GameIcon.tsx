import { Image } from 'react-native'
import Svg, { G, Path, Rect } from 'react-native-svg'

export type GameIconName =
  | 'build'
  | 'blend'
  | 'staff'
  | 'customers'
  | 'company'
  | 'cash'
  | 'star'
  | 'rd'
  | 'calendar'
  | 'crown'

// PixelLab icons in the mockup's style (scripts/art, rounds 1–2), stored pre-scaled with
// nearest-neighbour. Names without a bitmap fall back to the code-drawn icon below.
const bitmaps: Partial<Record<GameIconName, number>> = {
  build: require('../../../assets/v4/ui/tab_build.png'),
  blend: require('../../../assets/v4/ui/tab_blend.png'),
  staff: require('../../../assets/v4/ui/tab_staff.png'),
  customers: require('../../../assets/v4/ui/tab_customers.png'),
  company: require('../../../assets/v4/ui/tab_company.png'),
  cash: require('../../../assets/v4/ui/cash.png'),
  star: require('../../../assets/v4/ui/star.png'),
  rd: require('../../../assets/v4/ui/rd.png'),
  calendar: require('../../../assets/v4/ui/calendar.png'),
  crown: require('../../../assets/v4/ui/crown.png'),
}
const ink = '#172B38'

/** Game icons: PixelLab bitmaps where we have them, else original code-native pixel icons. */
export function GameIcon({ name, size = 36 }: { name: GameIconName; size?: number }) {
  const bitmap = bitmaps[name]
  if (bitmap)
    return <Image accessible={false} source={bitmap} style={{ width: size, height: size }} />
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <G stroke={ink} strokeWidth={2} strokeLinejoin="miter" strokeLinecap="square">
        {name === 'build' && (
          <>
            <Path d="M5 35H18V43H5Z M20 35H33V43H20Z M27 27H40V34H27Z" fill="#EEA731" />
            <Path d="M14 33L30 15L36 20L20 39Z" fill="#C57B36" />
            <Path d="M13 11L23 5L33 10L40 19L34 25L27 17L23 19L18 16L15 20L9 16Z" fill="#AFC2CC" />
            <Path d="M15 11L23 8L30 12" stroke="#F0F5EB" strokeWidth={3} />
          </>
        )}
        {name === 'blend' && (
          <>
            <Path d="M18 4H31V10H28V22L39 36V42H10V36L21 22V10H18Z" fill="#DDEAF0" />
            <Path d="M18 30H31L36 37V39H13V37Z" fill="#E45A75" stroke="none" />
            <Path d="M23 12V23L16 34" stroke="#FFFFFF" strokeWidth={3} />
            <Rect x={25} y={29} width={3} height={3} fill="#FFB1B6" stroke="none" />
          </>
        )}
        {name === 'staff' && (
          <>
            <Path d="M10 43V34L18 30H30L38 34V43Z" fill="#397EB4" />
            <Path d="M17 21H31V29L27 33H21L17 29Z" fill="#E9B77A" />
            <Path d="M13 21V16L17 10H31L35 16V21Z" fill="#E6A31B" />
            <Path d="M21 8H27V21H21Z" fill="#FFD55C" />
            <Path d="M9 21H39V25H9Z" fill="#FFC638" />
            <Path d="M18 35V43 M30 35V43" stroke="#F2AE29" strokeWidth={3} />
            <Path d="M21 27H22 M27 27H28" strokeWidth={2} />
          </>
        )}
        {name === 'customers' && (
          <>
            <Path d="M4 31V15L8 11H29V31Z" fill="#D7E4E8" />
            <Path d="M4 23H29V29H4Z" fill="#EF8B25" stroke="none" />
            <Path d="M29 19H39L44 26V35H29Z" fill="#EF8B25" />
            <Path d="M33 21H38L41 27H33Z" fill="#68BADD" />
            <Path d="M3 33H44V37H3Z" fill="#557080" />
            <Rect x={8} y={33} width={8} height={9} fill="#233947" />
            <Rect x={32} y={33} width={8} height={9} fill="#233947" />
            <Path d="M10 37H14 M34 37H38" stroke="#B3C2C8" strokeWidth={3} />
            <Path d="M9 15H25" stroke="#FFFFFF" strokeWidth={3} />
          </>
        )}
        {name === 'company' && (
          <>
            <Path d="M6 43V25H17V15H31V43Z" fill="#EEE9D7" />
            <Path d="M31 24H42V43H31Z" fill="#D0DCE0" />
            <Path d="M16 14H32V18H16Z" fill="#506B7C" />
            <Path d="M24 4V15 M25 4H38V11H25" fill="#E65B58" />
            <Path
              d="M11 29V33 M11 36V40 M21 21V25 M27 21V25 M21 29V33 M27 29V33 M36 29V33 M36 36V40"
              stroke="#489AC5"
              strokeWidth={3}
            />
            <Path d="M21 43V36H27V43" fill="#466779" />
          </>
        )}
        {name === 'cash' && (
          <>
            <Path d="M6 18L31 7L43 14V29L19 41L6 34Z" fill="#5F9E3A" />
            <Path d="M6 18L19 26L43 14 M19 26V41" stroke="#223D26" />
            <Path d="M10 17L31 10L38 14L19 23Z" fill="#A9D469" strokeWidth={1.5} />
            <Path d="M25 10L15 20L22 24L32 13Z" fill="#F2E4B8" />
            <Path d="M22 24V37L17 40V26" fill="#D6C699" />
            <Path d="M8 25L14 29 M26 29L39 23" stroke="#B9E582" />
          </>
        )}
        {name === 'star' && (
          <>
            <Path d="M24 4L30 16L43 18L34 28L36 42L24 36L12 42L14 28L5 18L18 16Z" fill="#F7BF2E" />
            <Path d="M24 9L28 19L37 20L31 26" stroke="#FFE78C" strokeWidth={3} />
            <Path d="M16 35L24 31L32 35" stroke="#D18B16" strokeWidth={3} />
          </>
        )}
      </G>
    </Svg>
  )
}
