import { writeFileSync } from 'node:fs'
import { buildings } from '../../src/v4/data/buildings'
import { sprites } from '../../src/v4/render/buildings'
import type { Command } from '../../src/v4/render/buildings/shapes'
const shape=(c:Command)=>{const attrs=`fill="${c.color}" stroke="#14110F" stroke-width="1"`;if(c.kind==='polygon')return `<polygon points="${c.points.map(p=>p.join(',')).join(' ')}" ${attrs}/>`;if(c.kind==='circle')return `<circle cx="${c.x}" cy="${c.y}" r="${c.r}" ${attrs}/>`;if(c.kind==='ellipse')return `<ellipse cx="${c.x+c.w/2}" cy="${c.y+c.h/2}" rx="${c.w/2}" ry="${c.h/2}" ${attrs}/>`;return `<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" ${attrs}/>`}
const width=720,row=150,height=buildings.length*row+60
const rows=buildings.map((b,i)=>`<text x="12" y="${i*row+65}" font-size="13">${b.name.en}</text>`+[1,3,5].map((level,j)=>`<g transform="translate(${230+j*175},${i*row+105}) scale(2)" shape-rendering="crispEdges">${sprites[b.id](level,b.accent,0).map(shape).join('')}</g>`).join('')).join('')
writeFileSync('docs/v4/ART-GALLERY.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#FFF6E3"/><text x="12" y="24" font-size="18">Refinery v4 · code-drawn sprites · Levels 1 / 3 / 5</text>${rows}</svg>`)
