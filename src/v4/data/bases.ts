export const bases = [
 {id:'lpg',name:{en:'LPG',th:'แอลพีจี'},price:50,cut:'naphtha',rank:4,unit:'cracker'},
 {id:'gasoline',name:{en:'Gasoline',th:'เบนซิน'},price:40,cut:'naphtha',rank:1,unit:'cdu'},
 {id:'jet',name:{en:'Jet',th:'เชื้อเพลิงอากาศยาน'},price:80,cut:'kerosene',rank:4,unit:'hydro'},
 {id:'diesel',name:{en:'Diesel',th:'ดีเซล'},price:45,cut:'gasoil',rank:1,unit:'cdu'},
 {id:'lube',name:{en:'Lube',th:'น้ำมันหล่อลื่น'},price:300,cut:'gasoil',rank:6,unit:'hydro'},
 {id:'asphalt',name:{en:'Asphalt',th:'ยางมะตอย'},price:90,cut:'residue',rank:6,unit:'cdu'},
 {id:'wax',name:{en:'Wax',th:'แวกซ์'},price:180,cut:'residue',rank:7,unit:'hydro'},
 {id:'pellet',name:{en:'Pellet',th:'เม็ดพลาสติก'},price:250,cut:'naphtha',rank:7,unit:'cracker'},
] as const
export type BaseId = typeof bases[number]['id']
export type CutId = typeof bases[number]['cut']
export const baseDef=(id:BaseId)=>bases.find(b=>b.id===id)!
