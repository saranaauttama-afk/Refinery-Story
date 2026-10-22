// Presentation constants only. The simulation owns parcels and building footprints.
export const GRAPHICS = {
  tile: 32,
  artDensity: 2,
  playZooms: [1, 1.5, 2] as readonly number[],
  defaultZoom: 1.5,
  overviewMargin: 8,
  world: { x: -8 * 32, y: -16 * 32, width: 48 * 32, height: 48 * 32 },
  chunk: 8 * 32,
  margin: 4,
  sea: '#3D92B2',
}
export const headroom: Record<string, number> = {
  tank: 16,
  pipe: 8,
  lab: 12,
  flare: 48,
  gate: 8,
  control: 16,
  canteen: 16,
  cdu: 32,
  crudeTank: 24,
  blend: 16,
  loading: 16,
  hydro: 24,
  reformer: 40,
  cracker: 40,
  tower: 64,
  road: 0,
}
export const scenicSizes: Record<string, { w: number; h: number; headroom: number }> = {
  warehouse: { w: 3, h: 2, headroom: 16 },
  house: { w: 2, h: 2, headroom: 16 },
  office: { w: 2, h: 2, headroom: 32 },
  crane: { w: 2, h: 2, headroom: 64 },
  containers: { w: 2, h: 1, headroom: 16 },
  utility: { w: 2, h: 1, headroom: 16 },
  rocks: { w: 1, h: 1, headroom: 16 },
  flowerbed: { w: 1, h: 1, headroom: 40 },
}
export function spriteTemplate(id: string, w: number, d: number) {
  const r = headroom[id] ?? scenicSizes[id]?.headroom ?? 40,
    width = w * 32 + 8,
    height = d * 32 + r + 8
  return {
    width,
    height,
    ax: width / 2,
    ay: height - 4,
    footprint: { x: 4, y: r + 4, width: w * 32, height: d * 32 },
    headroom: r,
  }
}
// Local offsets from a building's bottom-centre ground anchor, not image bounds.
export function buildingSocket(id: string) {
  return id === 'flare'
    ? { x: 0, y: -75 }
    : id === 'cdu'
      ? { x: -1, y: -89 }
      : id === 'cracker'
        ? { x: -20, y: -122 }
        : { x: 0, y: -32 }
}
