/** Native: Skia is linked into the app, nothing to load. (The web build uses skiaWeb.web.ts.) */
export function loadSkiaWeb(): Promise<void> {
  return Promise.resolve()
}
