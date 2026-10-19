import type { LocalizedText } from '../i18n'
export interface BuildingDef { id:string; name:LocalizedText; category:'process'|'storage'|'logistics'|'blend'|'support'|'deco'; w:number; h:number; height:number; cost:number; rank:number; accent:string }
const def = (id:string,en:string,th:string,category:BuildingDef['category'],w:number,h:number,height:number,cost:number,rank:number,accent:string):BuildingDef => ({id,name:{en,th},category,w,h,height,cost,rank,accent})
export const buildings:BuildingDef[] = [
 def('gate','Truck Gate','ประตูรถบรรทุก','logistics',1,2,16,5000,1,'#F2C230'),
 def('loading','Loading Bay','ลานจ่ายสินค้า','logistics',2,2,24,4900,1,'#F08A24'),
 def('crudeTank','Crude Tank','ถังน้ำมันดิบ','storage',2,2,24,5000,1,'#3C3C46'),
 def('tank','Product Tank','ถังผลิตภัณฑ์','storage',1,1,24,5000,1,'#E2483D'),
 def('cdu','CDU','หอกลั่น','process',2,2,48,20000,1,'#3C3C46'),
 def('blend','Blending Station','สถานีผสม','blend',2,2,24,10000,1,'#E2483D'),
 def('pipe','Pipe Rack','แนวท่อ','logistics',1,1,16,1000,1,'#9EABB8'),
 def('road','Road','ถนน','logistics',1,1,0,100,1,'#4A4E57'),
 def('hydro','Hydrotreater','หน่วยไฮโดรทรีต','process',2,2,40,25000,2,'#F08A24'),
 def('lab','Lab','ห้องทดลอง','support',1,1,24,15000,2,'#4FA3D9'),
 def('reformer','Reformer','หน่วยรีฟอร์มเมอร์','process',2,3,40,120000,3,'#E2483D'),
 def('cracker','Cracker','หน่วยแครกเกอร์','process',3,3,64,300000,4,'#9C5BD6'),
 def('control','Control Room','ห้องควบคุม','support',2,1,24,80000,5,'#4FA3D9'),
 def('canteen','Canteen','โรงอาหาร','support',2,1,24,8000,1,'#B5653A'),
 def('flare','Flare','หอเผา','support',1,1,56,6000,2,'#F08A24'),
 def('tree','Tree','ต้นไม้','deco',1,1,24,500,1,'#5E8C3A'),
 def('lamp','Lamp','โคมไฟ','deco',1,1,24,500,1,'#F2C230'),
 def('sign','Company Sign','ป้ายบริษัท','deco',1,1,24,1000,1,'#4FA3D9'),
 def('tower','Mega Refinery Tower','เมกะรีไฟเนอรี','process',3,3,80,3000000,9,'#E36BB0'),
]
export const buildingDef = (id:string):BuildingDef => { const d=buildings.find(b=>b.id===id); if(!d) throw new Error(`Unknown building ${id}`); return d }
