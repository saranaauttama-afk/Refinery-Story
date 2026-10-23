// One industrial panel language for the HUD, sheets and title.
export const ui = {
  ink: '#14110F',
  navy: '#263D49',
  steel: '#526974',
  paper: '#FFF6E3',
  surface: '#FFFDF5',
  inset: '#EAE3D1',
  muted: '#52616B',
  build: '#F08A24',
  blend: '#E2483D',
  staff: '#3D8FE0',
  customers: '#2FB38E',
  company: '#B184E3',
  gold: '#F2C230',
  dockHeight: 60,
}
// One type scale for the whole game: numbers, titles, body, small.
export const type = {
  num: { fontFamily: 'PixelifySans_700Bold', fontSize: 16, color: '#14110F' },
  numBig: { fontFamily: 'PixelifySans_700Bold', fontSize: 22, color: '#14110F' },
  title: { fontFamily: 'Kanit_600SemiBold', fontSize: 17, color: '#14110F' },
  body: { fontFamily: 'Kanit_400Regular', fontSize: 15, color: '#14110F' },
  small: { fontFamily: 'Kanit_400Regular', fontSize: 13, color: '#52616B' },
} as const
