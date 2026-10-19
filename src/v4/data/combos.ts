import { COMBO_EFFECTS } from './balance'
export interface Modifiers { dwell:number;purity:number;yield:number;stability:number;eco:number;score:number;gasolineScore:number;yieldPct:number;quality:number;capacity:number;production:number;price:number;regen:number;incident:number;monthlyFame:number;yearlyFame:number }
export const emptyModifiers=():Modifiers=>({dwell:0,purity:0,yield:0,stability:0,eco:0,score:0,gasolineScore:0,yieldPct:0,quality:0,capacity:0,production:0,price:0,regen:0,incident:0,monthlyFame:0,yearlyFame:0})
export interface ComboDef {id:string;name:{en:string;th:string};kind:'pair'|'set';members:string[];effect:Partial<Modifiers>;hidden:boolean}
const c=(id:string,en:string,th:string,kind:ComboDef['kind'],members:string[],effect:Partial<Modifiers>,hidden=false):ComboDef=>({id,name:{en,th},kind,members,effect,hidden})
export const combos:ComboDef[]=[
 c('tankFarm','Tank Farm','ฟาร์มถัง','set',['tank','tank','pipe'],COMBO_EFFECTS.tankFarm),
 c('freshCut','Fresh Cut','กลั่นสะอาด','pair',['cdu','hydro'],COMBO_EFFECTS.freshCut),
 c('octaneLine','Octane Line','สายออกเทน','set',['reformer','blend','lab'],COMBO_EFFECTS.octaneLine),
 c('quickLoad','Quick Load','จ่ายไว','pair',['loading','gate'],COMBO_EFFECTS.quickLoad),
 c('watchful','Watchful Eye','จับตาปลอดภัย','pair',['control','process'],COMBO_EFFECTS.watchful),
 c('greenBelt','Green Belt','แนวสีเขียว','set',['tree','tree','tree'],COMBO_EFFECTS.greenBelt),
 c('lunch','Lunch Break','พักกลางวัน','pair',['canteen','control'],COMBO_EFFECTS.lunch),
 c('smoke','Smoke Break','ควันรบกวน','pair',['flare','canteen'],COMBO_EFFECTS.smoke),
 c('heavy','Heavy Duty','สายงานหนัก','set',['cracker','hydro','tank'],COMBO_EFFECTS.heavy),
 c('showcase','Showcase','โรงงานตัวอย่าง','set',['lab','lamp','sign'],COMBO_EFFECTS.showcase,true),
 c('research','Research Row','แถววิจัย','pair',['lab','control'],COMBO_EFFECTS.research),
 c('cleanLab','Clean Lab','แล็บสีเขียว','pair',['lab','tree'],COMBO_EFFECTS.cleanLab),
 c('brightGate','Bright Gate','ประตูสว่าง','pair',['gate','lamp'],COMBO_EFFECTS.brightGate),
 c('pipeFlow','Pipe Flow','ท่อคล่อง','pair',['pipe','cdu'],COMBO_EFFECTS.pipeFlow),
 c('safeLoad','Safe Load','จ่ายปลอดภัย','pair',['loading','control'],COMBO_EFFECTS.safeLoad),
 c('tankCare','Tank Care','ดูแลถัง','pair',['tank','lab'],COMBO_EFFECTS.tankCare),
 c('blendStudy','Blend Study','วิจัยสูตร','pair',['blend','lab'],COMBO_EFFECTS.blendStudy),
 c('octaneCare','Octane Care','รักษาออกเทน','pair',['reformer','hydro'],COMBO_EFFECTS.octaneCare),
 c('welcome','Welcome','ต้อนรับ','set',['gate','sign','lamp'],COMBO_EFFECTS.welcome),
 c('restGarden','Rest Garden','สวนพัก','set',['canteen','tree','lamp'],COMBO_EFFECTS.restGarden),
 c('flowLine','Flow Line','สายไหลคล่อง','set',['cdu','pipe','blend'],COMBO_EFFECTS.flowLine),
 c('quietLab','Quiet Lab','แล็บเงียบ','pair',['lab','flare'],COMBO_EFFECTS.quietLab),
 c('nightShift','Night Shift','กะกลางคืน','pair',['control','lamp'],COMBO_EFFECTS.nightShift),
 c('greenBlend','Green Blend','ผสมรักษ์โลก','pair',['blend','tree'],COMBO_EFFECTS.greenBlend,true),
 c('towerLight','Tower Light','แสงหอสูง','pair',['tower','lamp'],COMBO_EFFECTS.towerLight,true),
 c('greatView','Great View','วิวโรงงาน','pair',['tower','sign'],COMBO_EFFECTS.greatView,true),
 c('hotScience','Hot Science','วิจัยร้อนแรง','set',['cracker','lab','flare'],COMBO_EFFECTS.hotScience,true),
 c('oilGarden','Oil Garden','สวนถังน้ำมัน','set',['crudeTank','tree','tank'],COMBO_EFFECTS.oilGarden,true),
 c('teamSpirit','Team Spirit','พลังทีม','set',['canteen','control','sign'],COMBO_EFFECTS.teamSpirit,true),
 c('perfectMix','Perfect Mix','สูตรสมบูรณ์','set',['hydro','blend','reformer'],COMBO_EFFECTS.perfectMix,true),
]
