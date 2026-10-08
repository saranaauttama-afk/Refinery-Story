import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web'

/** Web: fetch CanvasKit (public/canvaskit.wasm) before any Skia canvas mounts. */
export function loadSkiaWeb(): Promise<void> {
  return LoadSkiaWeb({ locateFile: (file: string) => `/${file}` })
}
