import type { V3DecorKind } from '../game/v3/decorData'

// Small world props are native vector art on the same 2:1 projection as the
// placement grid. Road/fence connections are computed from real neighbours.
export function getV3DecorSvg(kind: V3DecorKind, rotated = false, mask = 0): string {
  const wide = kind === 'busStop' || kind === 'companySign'
  const large = kind === 'parkingLot' || kind === 'fountain'
  const width = wide ? 96 : large ? 128 : 64
  const height = 128
  const base = wide ? '48,80 96,104 64,120 16,96' : large ? '64,64 128,96 64,128 0,96' : '32,96 64,112 32,128 0,112'
  const polygon = (points: string, fill: string, stroke = '#263744') => `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
  const line = (x1: number, y1: number, x2: number, y2: number, color: string, weight = 2) => `<path d="M${x1} ${y1}L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${weight}"/>`
  const rect = (x: number, y: number, w: number, h: number, fill: string) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="#263744" stroke-width="1.5"/>`
  const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="#263744" stroke-width="1.5"/>`
  let art = ''
  switch (kind) {
    case 'road': {
      art = polygon(base, '#545E65', '#77838B')
      const ends = [[48,104], [48,120], [16,120], [16,104]]
      if (mask === 0) art += line(19,105,45,118,'#EED7A0',2)
      ends.forEach(([x,y], index) => { if (mask & (1 << index)) art += line(32,112,x,y,'#EED7A0',2) })
      break
    }
    case 'sidewalk':
      art = polygon(base, '#BEC4BB', '#8C9995') + line(16,104,48,120,'#8C9995',1) + line(16,120,48,104,'#8C9995',1)
      break
    case 'tree':
      art = ellipse(35,114,17,7,'#647757') + rect(29,77,6,35,'#8E623B')
        + polygon('9,69 15,48 26,40 43,43 55,59 53,79 40,90 20,87 9,78','#2D6846')
        + polygon('15,56 26,45 41,47 46,58 38,65 19,68','#62A458','#386F43')
        + polygon('16,74 28,67 41,69 48,79 38,85 22,82','#43834C','#386F43')
      break
    case 'shrub':
      art = ellipse(32,115,22,9,'#3C6546') + polygon('11,109 14,98 24,94 35,95 48,101 53,111 43,119 23,121','#518C53')
        + polygon('18,102 25,98 34,100 39,106 29,109 20,108','#81B468','#518C53')
      break
    case 'streetLamp':
      art = ellipse(32,113,7,3,'#718078') + rect(30,50,4,62,'#718692') + line(32,51,45,44,'#263744',4)
        + polygon('38,40 50,40 54,46 48,52 38,48','#F9D583')
      break
    case 'fence': {
      art = rect(29,85,5,29,'#86969C')
      const ends = [[48,104], [48,120], [16,120], [16,104]]
      if (!mask) mask = 5
      ends.forEach(([x,y], index) => {
        if (!(mask & (1 << index))) return
        art += polygon(`32,88 ${x},${y-24} ${x},${y-8} 32,104`,'#A6B9BE')
          + line(32,88,x,y-8,'#63808A',1) + line(32,104,x,y-24,'#63808A',1) + rect(x-2,y-27,4,27,'#86969C')
      })
      break
    }
    case 'bench':
      art = line(18,106,18,116,'#3B4850',3) + line(47,111,47,121,'#3B4850',3)
        + polygon('12,102 42,97 53,106 24,114','#BF8950')
        + polygon('12,86 43,91 43,102 12,97','#BC864C') + line(16,90,39,94,'#E1B77D',2)
      break
    case 'trashBin':
      art = polygon('22,88 43,92 43,114 22,109','#2E735D') + polygon('15,92 22,88 22,109 15,113','#235746')
        + polygon('15,88 34,83 46,90 25,96','#54967D') + rect(28,98,8,7,'#B7CAB3')
      break
    case 'flowerBed':
      art = polygon('8,108 32,97 56,108 32,120','#846743') + polygon('11,106 32,97 53,107 32,116','#598755')
      for (const [x,y,color] of [[20,103,'#F392AD'],[32,100,'#F4D267'],[43,105,'#EE719D'],[30,110,'#F4D267']] as const) art += rect(x-2,y-4,5,5,color)
      break
    case 'flagPole':
      art = ellipse(32,114,8,4,'#8D989A') + rect(30,34,3,80,'#A8B8BD')
        + polygon('33,36 53,43 50,59 33,51','#EEA345')
      break
    case 'awardStatue':
      art = polygon('18,107 32,100 46,107 32,115','#596B74') + rect(25,92,14,17,'#899BA1')
        + polygon('32,57 45,80 40,91 32,96 24,90 20,80','#EFB94B')
        + polygon('32,62 36,79 31,86 26,78','#FFE295','#EFB94B')
      break
    case 'busStop':
      art = line(27,70,27,105,'#54717A',4) + line(68,84,68,120,'#54717A',4)
        + polygon('12,62 48,46 86,65 50,82','#50949E')
        + polygon('27,73 57,87 57,108 27,94','#9DC3C6')
        + polygon('27,95 53,106 64,101 39,90','#D0A465') + rect(77,71,3,35,'#81969A') + rect(71,67,15,12,'#F1CE77')
      break
    case 'companySign':
      art = line(26,88,26,108,'#73868B',4) + line(65,101,65,122,'#73868B',4)
        + polygon('17,60 75,80 75,104 17,84','#E9D1A2')
        + polygon('42,71 49,84 45,90 39,87 36,82','#E59B43')
      break
    case 'parkingLot':
      art = polygon(base,'#59656D','#ABB5B4')
      for (let index = 0; index < 4; index++) art += line(25+index*16,83+index*8,7+index*16,92+index*8,'#E2E5D4',2)
      art += polygon('67,82 93,95 80,102 54,89','#6DA0B0') + polygon('62,74 79,82 85,91 68,83','#B7D3D6')
      break
    case 'fountain':
      art = ellipse(64,104,40,19,'#8C9B9E') + ellipse(64,99,36,16,'#74C6D5')
        + ellipse(64,97,21,9,'#AEDCE0') + rect(61,72,6,23,'#D1DDDA')
        + line(64,76,64,54,'#B3E7EA',3) + line(64,57,53,77,'#B3E7EA',2) + line(64,57,75,77,'#B3E7EA',2)
      break
  }
  if (wide && rotated) art = `<g transform="translate(${width} 0) scale(-1 1)">${art}</g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${art}</svg>`
}
