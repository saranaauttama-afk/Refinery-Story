import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(root, 'assets', 'plants', 'starter')

const assets = {
  distillation_unit_lv1: 'distillationUnitLv1',
  distillation_unit_lv2: 'distillationUnitLv2',
  distillation_unit_lv3: 'distillationUnitLv3',
  crude_tank_lv1: 'crudeTankLv1',
  crude_tank_lv2: 'crudeTankLv2',
  crude_tank_lv3: 'crudeTankLv3',
  gasoline_tank_lv1: 'gasolineTankLv1',
  gasoline_tank_lv2: 'gasolineTankLv2',
  gasoline_tank_lv3: 'gasolineTankLv3',
}

mkdirSync(outputDir, { recursive: true })

for (const [outputName, moduleName] of Object.entries(assets)) {
  const source = readFileSync(join(root, 'src', 'assets', 'generated', `${moduleName}.ts`), 'utf8')
  const match = source.match(/export default 'data:image\/png;base64,([^']+)'/)
  if (!match) throw new Error(`PNG data URI missing from ${moduleName}.ts`)
  writeFileSync(join(outputDir, `${outputName}.png`), Buffer.from(match[1], 'base64'))
}
