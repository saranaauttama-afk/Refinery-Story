import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web'
export const loadSkia = ():Promise<void> => LoadSkiaWeb({locateFile:(file:string)=>`/${file}`})
