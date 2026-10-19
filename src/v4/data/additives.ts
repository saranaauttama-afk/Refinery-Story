// Content defaults beyond the examples in GDD §3; rules are exercised by staff checks.
const rows = [
 ['octane','Octane Booster','เพิ่มออกเทน','chemist',2,'lab'],['antifreeze','Anti-freeze','สารกันเยือกแข็ง','chemist',2,'manual'],
 ['detergent','Detergent','สารชะล้าง','operator',2,'manual'],['bio','Bio-blend','ไบโอเบลนด์','safety',2,'walk'],
 ['dye','Dye','สีย้อม','chemist',1,'manual'],['fragrance','Fragrance','สารแต่งกลิ่น','chemist',3,'lab'],
 ['cetane','Cetane','เพิ่มซีเทน','operator',3,'walk'],['antioxidant','Antioxidant','สารต้านออกซิเดชัน','chemist',3,'manual'],
 ['lubricity','Lubricity','สารหล่อลื่น','engineer',2,'repair'],['stabilizer','Stabilizer','สารคงสภาพ','engineer',3,'repair'],
 ['corrosion','Corrosion Guard','สารกันสนิม','engineer',2,'manual'],['antifoam','Anti-foam','สารลดฟอง','operator',2,'repair'],
 ['coldflow','Cold Flow','สารช่วยไหล','engineer',4,'tour'],['cleanburn','Clean Burn','สารเผาไหม้สะอาด','safety',3,'drill'],
 ['polymer','Polymer','พอลิเมอร์','chemist',4,'tour'],['adhesive','Adhesive','สารยึดเกาะ','operator',4,'tour'],
 ['recycled','Recycled Blend','ส่วนผสมรีไซเคิล','safety',4,'tour'],['premium','Premium Package','แพ็กเกจพรีเมียม','manager',4,'overseas'],
 ['catalyst','Catalyst','ตัวเร่ง','chemist',5,'overseas'],['nano','Nano Blend','นาโนเบลนด์','director',2,'overseas'],
] as const
export const additives=rows.map(([id,en,th,job,level,training])=>({id,name:{en,th},job,level,training}))
export type AdditiveId = typeof rows[number][0]
