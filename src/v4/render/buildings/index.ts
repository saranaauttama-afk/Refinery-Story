import type { Sprite } from './designs'
import { draw as gate } from './gate'
import { draw as loading } from './loading'
import { draw as crudeTank } from './crudeTank'
import { draw as productTank } from './productTank'
import { draw as cdu } from './cdu'
import { draw as hydro } from './hydro'
import { draw as reformer } from './reformer'
import { draw as cracker } from './cracker'
import { draw as blend } from './blend'
import { draw as pipe } from './pipe'
import { draw as lab } from './lab'
import { draw as control } from './control'
import { draw as canteen } from './canteen'
import { draw as flare } from './flare'
import { draw as tree } from './tree'
import { draw as lamp } from './lamp'
import { draw as sign } from './sign'
import { draw as tower } from './tower'
import { draw as road } from './road'
import { draw as trophy } from './trophy'
export const sprites: Record<string, Sprite> = {
  gate,
  loading,
  crudeTank,
  tank: productTank,
  cdu,
  hydro,
  reformer,
  cracker,
  blend,
  pipe,
  lab,
  control,
  canteen,
  flare,
  tree,
  lamp,
  sign,
  tower,
  road,
  goldTree: tree,
  goldSign: sign,
  flag: sign,
  legend: trophy,
  awardproduct: trophy,
  awardsafety: trophy,
  awardeco: trophy,
  awardrefinery: trophy,
}
