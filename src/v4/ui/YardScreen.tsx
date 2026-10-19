import { RecipeBook } from './RecipeBook'
import { detectCombos } from '../sim/systems/combos'
import { combos } from '../data/combos'
import { CustomersPanel } from './CustomersPanel'
import { BlendPanel } from './BlendPanel'
import { buildStarter } from '../sim/actions'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { useGame } from '../store/useGame'
import { YardCanvas } from '../render/YardCanvas'
import { buildings, buildingDef } from '../data/buildings'
import { YARD } from '../data/balance'
import { place,move,demolish,upgrade,buyLand } from '../sim/actions'
import { buildingAt, canPlace } from '../sim/systems/yard'
import { HUD } from './HUD'
import { Button,Sheet,styles } from './controls'
import { text } from '../i18n'
export function YardScreen(){
 const {state:s,dispatch}=useGame();const [panel,setPanel]=useState('');const [selected,setSelected]=useState('');const [ghost,setGhost]=useState<{id:string;x:number;y:number;uid?:string}>()
 const b=s.yard.buildings.find(b=>b.uid===selected)
 return <View style={{flex:1}}><HUD/><YardCanvas state={s} ghost={ghost} onTile={(x,y)=>{if(ghost)setGhost({...ghost,x,y});else{const b=buildingAt(s,x,y);if(b){setSelected(b.uid);setPanel('info')}}}}/>
 {!s.yard.buildings.length&&<Button label={{en:'Build starter refinery $50k',th:'สร้างโรงกลั่นเริ่มต้น $50,000'}} onPress={()=>dispatch(buildStarter)}/>}
 <View style={{flexDirection:'row',backgroundColor:'#FFF6E3',justifyContent:'space-around'}}><Button label={{en:'Build',th:'สร้าง'}} onPress={()=>setPanel('build')}/><Button label={{en:'Blend',th:'ผสม'}} onPress={()=>setPanel('blend')}/><Button label={{en:'Customers',th:'ลูกค้า'}} onPress={()=>setPanel('customers')}/><Button label={{en:'Combos',th:'คอมโบ'}} onPress={()=>setPanel('combos')}/><Button label={{en:'Land',th:'ที่ดิน'}} onPress={()=>setPanel('land')}/></View>
 {ghost&&<View style={{position:'absolute',bottom:70,left:12,right:12,backgroundColor:'#FFF6E3',padding:8}}><Text style={styles.text}>{detectCombos([...s.yard.buildings.filter(b=>b.uid!==ghost.uid),{uid:'preview',defId:ghost.id,x:ghost.x,y:ghost.y,level:1,staff:[],cost:0}]).filter(c=>c.members.includes('preview')).map(c=>text(combos.find(d=>d.id===c.id)!.name)).join(' · ')}</Text><Text style={styles.text}>{text({en:'Tap a tile, then confirm',th:'แตะพื้นที่ แล้วกดยืนยัน'})}</Text><Button disabled={!canPlace(s,ghost.id,ghost.x,ghost.y,ghost.uid)||s.money<(ghost.uid?YARD.moveCost:buildingDef(ghost.id).cost)} label={{en:'Confirm',th:'ยืนยัน'}} onPress={()=>{dispatch(s=>ghost.uid?move(s,ghost.uid,ghost.x,ghost.y):place(s,ghost.id,ghost.x,ghost.y));setGhost(undefined)}}/><Button label={{en:'Cancel',th:'ยกเลิก'}} onPress={()=>setGhost(undefined)}/></View>}
 {panel==='combos'&&<Sheet title={{en:'Recipe Book',th:'ตำราคอมโบ'}} onClose={()=>setPanel('')}><RecipeBook/></Sheet>}
 {panel==='customers'&&<Sheet title={{en:'Customers',th:'ลูกค้าและสัญญา'}} onClose={()=>setPanel('')}><CustomersPanel/></Sheet>}
 {panel==='blend'&&<Sheet title={{en:'Blend',th:'ผสมผลิตภัณฑ์'}} onClose={()=>setPanel('')}><BlendPanel/></Sheet>}
 {panel==='build'&&<Sheet title={{en:'Build',th:'สร้างอาคาร'}} onClose={()=>setPanel('')}>{buildings.filter(b=>b.rank<=s.rank||s.blueprints.includes(b.id)||s.decos.includes(b.id)).map(d=><Button key={d.id} disabled={s.money<d.cost} label={{en:`${d.name.en} $${d.cost}`,th:`${d.name.th} $${d.cost.toLocaleString()}`}} onPress={()=>{setGhost({id:d.id,x:0,y:0});setPanel('')}}/>)}</Sheet>}
 {panel==='info'&&b&&<Sheet title={buildingDef(b.defId).name} onClose={()=>setPanel('')}><Text style={styles.text}>Lv {b.level}</Text><Button label={{en:'Move $2k',th:'ย้าย $2,000'}} onPress={()=>{setGhost({id:b.defId,x:b.x,y:b.y,uid:b.uid});setPanel('')}}/><Button label={{en:'Upgrade',th:'อัปเกรด'}} onPress={()=>dispatch(s=>upgrade(s,b.uid))}/><Button label={{en:'Demolish (50% refund)',th:'รื้อถอน (คืน 50%)'}} onPress={()=>{dispatch(s=>demolish(s,b.uid));setPanel('')}}/></Sheet>}
 {panel==='land'&&<Sheet title={{en:'Buy an 8×8 parcel',th:'ซื้อที่ดิน 8×8'}} onClose={()=>setPanel('')}><Text style={styles.text}>{text({en:'Rank 2 required. $20,000 per parcel.',th:'ต้องแรงก์ 2 ราคาแปลงละ $20,000'})}</Text>{Array.from({length:25},(_,i)=>({x:i%5,y:Math.floor(i/5)})).filter(p=>!s.yard.ownedParcels.includes(`${p.x},${p.y}`)).map(p=><Button key={`${p.x},${p.y}`} label={{en:`Parcel ${p.x},${p.y}`,th:`แปลง ${p.x},${p.y}`}} disabled={buyLand(s,p.x,p.y)===s} onPress={()=>dispatch(s=>buyLand(s,p.x,p.y))}/>)}</Sheet>}
 </View>
}
