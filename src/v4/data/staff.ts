export const jobs=[{id:'operator',name:{en:'Operator',th:'พนักงานปฏิบัติการ'}},{id:'chemist',name:{en:'Chemist',th:'นักเคมี'}},{id:'engineer',name:{en:'Engineer',th:'วิศวกร'}},{id:'safety',name:{en:'Safety Officer',th:'เจ้าหน้าที่ความปลอดภัย'}},{id:'manager',name:{en:'Manager',th:'ผู้จัดการ'}},{id:'director',name:{en:'Plant Director',th:'ผู้อำนวยการโรงงาน'}}] as const
export type JobId=typeof jobs[number]['id']
export const hiring=[{id:'word',name:{en:'Word of mouth',th:'บอกต่อ'},cost:5000,rank:1,quality:1},{id:'board',name:{en:'Job board',th:'ประกาศงาน'},cost:20000,rank:1,quality:1.2},{id:'university',name:{en:'University',th:'มหาวิทยาลัย'},cost:80000,rank:3,quality:1.6},{id:'fair',name:{en:'Job Fair',th:'มหกรรมงาน'},cost:250000,rank:5,quality:2},{id:'headhunter',name:{en:'Headhunter',th:'เฮดฮันเตอร์'},cost:600000,rank:7,quality:3}] as const
export const trainings=[
 {id:'manual',name:{en:'Read manual',th:'อ่านคู่มือ'},cost:3000,power:2,rank:1,op:2,chem:3,mech:0,safe:0},
 {id:'walk',name:{en:'Yard walk',th:'เดินสำรวจลาน'},cost:3000,power:2,rank:1,op:3,chem:0,mech:0,safe:3},
 {id:'repair',name:{en:'Hands-on repair',th:'ฝึกซ่อม'},cost:6000,power:3,rank:1,op:0,chem:0,mech:5,safe:1},
 {id:'lab',name:{en:'Lab Study',th:'ศึกษาในแล็บ'},cost:12000,power:4,rank:2,op:0,chem:6,mech:0,safe:-2},
 {id:'drill',name:{en:'Fire drill',th:'ซ้อมดับเพลิง'},cost:15000,power:4,rank:3,op:1,chem:0,mech:0,safe:6},
 {id:'tour',name:{en:'Plant tour',th:'ดูงานโรงงาน'},cost:60000,power:6,rank:5,op:5,chem:4,mech:4,safe:3},
 {id:'overseas',name:{en:'Overseas course',th:'อบรมต่างประเทศ'},cost:200000,power:9,rank:7,op:7,chem:7,mech:5,safe:5},
] as const
export type TrainingId=typeof trainings[number]['id']
export const names=['สมชาย','มาลี','กิตติ','อรุณ','พิมพ์','วิชัย','ปรียา','ธนา','เมธา','น้ำฝน','สุรีย์','นที']
