import { writeFileSync } from 'fs'
import { sprites } from '../../src/v4/render/buildings'
import { buildingDef } from '../../src/v4/data/buildings'
const ids = process.argv.slice(2)
const out: Record<string, unknown> = {}
for (const id of ids) {
  const d = buildingDef(id)
  out[id] = {
    w: d.w,
    h: d.h,
    height: d.height,
    accent: d.accent,
    cmds: sprites[id](1, d.accent, 0),
  }
}
writeFileSync('init/cmds.json', JSON.stringify(out))
console.log(
  Object.entries(out)
    .map(([k, v]: any) => `${k} ${v.w}x${v.h} h${v.height} ${v.accent}`)
    .join('\n'),
)
