# Refinery Story — แผนหลัก V3: โรงกลั่นและผลิตภัณฑ์ของเรา

วันที่: 25 กันยายน 2026 · สถานะ: **กำลัง IMPLEMENT — เสร็จถึง V3-09; V3 เป็นเกม/เซฟใหม่เท่านั้น**

ผู้ใช้เลือกแนวพัฒนาผลิตภัณฑ์และทีมงาน และขอแผนครบสำหรับส่งต่อโมเดลเขียนโค้ด
รอบนี้เปลี่ยนเฉพาะเอกสาร ไม่มี runtime change, push หรือ APK ใหม่
ฐานที่ตรวจ: gameplay ใน ancestry ของ `6961511`; V2 audit docs `c51149c`;
build #68 ใช้ remote `51bc987` ซึ่งมีประวัติ commit ต่างจาก local

## วิธีใช้เอกสารชุดนี้

| เอกสาร | หน้าที่ |
| --- | --- |
| ไฟล์นี้ | ประสบการณ์ผู้เล่น เนื้อหาแคมเปญ ขอบเขต และคำตัดสินด้านดีไซน์ |
| [GAMEPLAY_SYSTEMS_V3.md](GAMEPLAY_SYSTEMS_V3.md) | สูตร ตัวเลขเริ่มทดลอง state/action, inventory, persistence และ invariants |
| [GAMEPLAY_IMPLEMENTATION_V3.md](GAMEPLAY_IMPLEMENTATION_V3.md) | งานย่อย dependencies ไฟล์ เกณฑ์ตรวจรับ และ release gates |
| [GAMEPLAY_ROADMAP_V2.md](GAMEPLAY_ROADMAP_V2.md) | หลักฐาน audit บั๊กเดิม ใช้ส่วนผลตรวจ ไม่ใช้แผนอนาคตเมื่อขัดกับ V3 |

V3 แทนที่การออกแบบอนาคตใน V2/U3 ทั้งหมด ไม่ใช่งานอีกชุดที่ต้องทำซ้อนกัน
หลักฐาน source/audit ยังใช้ได้จน runtime เปลี่ยน; ตัวเลข V3 ทั้งหมดเป็นค่าทดลอง
เมื่อพบปัญหา ให้แก้ decision ที่เกี่ยวข้องและ acceptance พร้อมกัน ไม่ให้แต่ละ task เดาใหม่
การทำแผนนี้ไม่ใช่คำสั่งให้ implement ทั้งชุดทันที

## 1. เกมนี้จะสนุกจากอะไร

**ผู้เล่นสร้างโรงกลั่นที่มีความถนัดของตัวเอง พัฒนาสินค้าให้ตรงตลาด
เห็นคนที่จัดลงงานมีผลงาน และนำความสำเร็จไปเปิดทางเลือกครั้งต่อไป**

วงจรหลัก:

1. มองโอกาส: ลูกค้าอยากได้อะไร คุณภาพเท่าไร ปริมาณเท่าไร จ่ายอย่างไร
2. เลือกแผน: ใช้สินค้ารุ่นเดิม พัฒนารุ่นใหม่ หรือเลือกงานอื่นที่เหมาะกับโรงงาน
3. ทดลองล็อตเล็ก: เลือกแนวผลิต อุปกรณ์ และหัวหน้าทดลอง เห็นผลที่อธิบายได้
4. ลงผลิต: เลือกสายผลิตและคน เห็นคอขวดไฟ วัตถุดิบ ถัง หรือเวลา
5. ส่งของและรับเงิน: ส่งเป็นงวดได้ ของคนละคุณภาพไม่ถูกนับรวมมั่ว
6. เติบโต: รุ่นสินค้าขายได้ ทีมมีประสบการณ์ ลูกค้าเปิดงานต่อไป

ความสนุกไม่ใช่จำนวนเมนูหรือจำนวนครั้งที่กด: ทุกช่วงต้องมีการเลือกที่เปลี่ยนผล
งานประจำที่ตั้งไว้ดีแล้วควรเดินได้เอง ไม่ต้องคอยแก้ความเสียหายทุกนาที

### เหตุการณ์ที่ต้องทำให้เกิดจริง

- «สูตรเร่งผลิตขายตลาดทั่วไปได้เร็ว แต่สูตรพรีเมียมเหมาะกับลูกค้าอีกคน»
- «ย้ายหัวหน้าสายผลิตไปช่วยทดลอง 30 วินาที ผลิตลดลงชั่วคราว แต่ได้รุ่นที่รับงานใหม่ได้»
- «ถังใหญ่ขึ้นช่วยเก็บของรอส่ง แต่ตอนนี้เพิ่มไฟน่าจะคุ้มกว่า เพราะไลน์ติดไฟ»
- «โรงงานเล็กเน้นคุณภาพกับโรงงานเน้นปริมาณมีทางเล่นที่จบได้ทั้งคู่»
- «รุ่นที่เคยพัฒนายังมีประโยชน์ ไม่ต้องทิ้งทุกอย่างเมื่อได้ Lv ใหม่»

## 2. คำตัดสินที่ล็อกไว้เพื่อให้ทำจบ

| ประเด็น | คำตัดสิน |
| --- | --- |
| ประเภทเกม | Single-player factory management มี product development; ไม่ใช่เกมต่อท่อเชิงวิศวกรรม |
| ความสมจริง | สูตร/คุณภาพเป็นค่าของเกม ไม่ใช่กระบวนการผลิตเชื้อเพลิงจริง |
| ฉากและเครื่องมือ | ใช้ Expo/React Native, renderer, art, pan/zoom และ navigation เดิม |
| พื้นที่ | จบแคมเปญได้ภายใน 25 ช่อง; เปิดใช้ 9 → 16 → 25; 36 เป็นส่วนเสริม |
| สกุลเงิน | เงินกับ RP เดิม; ไม่เพิ่ม gem, ticket, วัตถุดิบสุ่ม หรือเงินลูกค้า |
| ผลิตภัณฑ์หลัก | Gasoline, Lube, Jet, Petrochemicals, Pellets; Asphalt/Recycled เป็นสินค้าเสริม |
| ความลึกสินค้า | Quality 0–100, ต้นทุน, อัตราผลิต; ไม่เพิ่มค่าทางเคมีอีกสิบชนิด |
| ลูกค้า | 5 รายที่มีตัวตน ใช้ไอคอน/ข้อความเดิมได้; ไม่ต้องรอ portrait ใหม่ |
| งานที่กำลังทำ | 1 งานรับแล้วทั้งเกม; ดูตัวเลือกแนะนำไม่เกิน 3 งาน |
| การทดลอง | 1 โครงการพร้อมกันทั้งบริษัท; ไม่เพิ่มคิวจ่ายเงิน |
| การผลิต | แต่ละ plant เลือกสินค้ารุ่นเดียวในขณะหนึ่ง; หลาย plant ใช้รุ่นเดียวกันได้ |
| พนักงาน | หนึ่งคนมีหน้าที่เดียว; หนึ่ง processing plant มีหัวหน้าหนึ่งคน; ไม่ต้องมีคนถึงจะเดินเครื่อง |
| การล้มเหลว | การทดลองไม่มีสุ่มพัง; ไม่มีการยึดโรงงาน/ทำลายตึก/บังคับเริ่มใหม่ |
| จบเกม | มี campaign clear ที่เห็นเงื่อนไขแต่ต้น; เล่นต่อได้; ไม่บังคับครบทุกตึกหรือเงินมหาศาล |
| งานภาพ/เสียง | อยู่ backlog; ไม่เป็น dependency ของ gameplay V3 |

## 3. จังหวะการเล่นและการแนะนำระบบ

เวลาเป็นช่วงที่ใช้ทดสอบที่ 1× ไม่ใช่เงื่อนไขจับเวลาเพื่อปลดล็อก

| ช่วงเป้าหมาย | ผู้เล่นทำ/เรียนรู้ | สิ่งที่ยังไม่แสดงเป็นภาระ |
| --- | --- | --- |
| 0–3 นาที | โรงงานเริ่มผลิต ส่ง Gasoline งานเล็ก รับเงิน และเห็นคอขวดถัดไป | RP tree ใหญ่, crisis, สินค้ายังไม่มีทางผลิต |
| 3–10 นาที | พัฒนารุ่น Volume หรือ Precision ครั้งแรก ทดลองแล้วลงผลิต | อุปกรณ์หลายชิ้นและความสัมพันธ์ลูกค้าหลายกลุ่ม |
| 10–20 นาที | เปรียบเทียบสองตลาด จัด Operator เลือกลงทุนถัง/สายผลิต/ห้องทดลอง | Jet/Petro เป็น preview สั้น ไม่ใช่งานรับได้ |
| 20–45 นาที | เปิด Lube หรือเตรียมทาง Jet; ใช้ไฟส่วนกลาง/โรงไฟฟ้า; ส่งของเป็นงวด | ไม่บังคับรีบขยายทุก product family |
| 45–90 นาที | รุ่นเฉพาะตลาด ลูกค้าคู่ค้า ทีมมีความชำนาญและทางเลือกอุปกรณ์ | ไม่เพิ่มระบบใหม่ทุก 5 นาที |
| 90–180 นาที | เลือกสามคู่ค้า งานโชว์ผลงาน จบแคมเปญและเห็นประวัติโรงงาน | ไม่บังคับรอครบเวลาเป้าหมาย |

เป้าหมาย session สั้น: กลับมาเห็นว่าแผนก่อนหน้าสำเร็จอะไร เลือกสิ่งถัดไปหนึ่งอย่าง
pause/ปิดแอปแล้วเวลาไม่เดิน V3 รุ่นแรกไม่คำนวณรายได้หรือโทษแบบ offline
ก่อนออกเกมมีข้อความว่าโรงงานจะพัก ไม่อ้างว่าได้เงินระหว่างปิดแอป

### บทแคมเปญและ unlock ที่มีแหล่งเดียว

การปลดล็อก gameplay V3 ใช้ `campaignChapter` จากความสำเร็จต่อไปนี้
Campaign chapter เป็นแหล่งปลดล็อกเดียว; V3 ไม่ใช้ Refinery Lv เดิมเป็นกำแพงซ้ำ
กติกาเดียวต้องใช้กับ build/hire/research/offer ไม่ใช่ปลดแค่ UI

| บท | เงื่อนไขเข้า | เปิดอะไร |
| --- | --- | --- |
| C0 เริ่มโรงงาน | New game | Starter 3 ตึก, ซื้อ crude/ขาย gas, งานแนะนำแรก, Operator คนเริ่มต้น |
| C1 สินค้ารุ่นแรก | ส่ง tutorial Gasoline 20 หน่วยครบ | Laboratory Lv1, ทดลอง Gasoline, auto trade, ลูกค้า Local/Performance |
| C2 เลือกทางธุรกิจ | รับรองรุ่น Gasoline ที่พัฒนาเอง + ส่งรุ่นนั้น 40 หน่วยผ่านงานใดก็ได้ | Lube/tank, generator, workshop, Lab Lv2, modules, research rank1, ลูกค้า Fleet, ซื้อ 4×4 |
| C3 โรงงานเฉพาะทาง | ลูกค้า 2 รายถึง Regular + อัปเกรด processing/tank/power อย่างน้อย 1 ครั้ง | Jet/tank/specialist, ลูกค้า Airline, sales office, processing Lv3 |
| C4 พอร์ตผลิตภัณฑ์ | ลูกค้า 1 ราย Partner + มี certified blueprint Q≥65 | Petro/Polymer/tanks, Materials, Lab Lv3/rank2, ซื้อ 5×5 |
| C5 ผู้ผลิตที่มีชื่อ | ผ่าน clear conditions ในข้อ 11 | Freeplay + challenges; ไม่มี reset อัตโนมัติ |

C2 เข้าได้ด้วย Gasoline เท่านั้น; C3 เข้าได้ด้วย Local+Performance หรือ Local+Fleet
C4 ไปได้ทั้งสาย Gasoline พรีเมียม, Lube หรือ Jet ไม่บังคับโรงงานเดียวกันทุกคน
build/hire/research/offer ทุกจุดต้องอ่าน chapter rule ชุดเดียวกัน
ตึก/คน/research ที่ผู้เล่นเก่ามีอยู่แล้วใช้ต่อได้ ไม่ถูกล็อกคืน

## 4. Product development: การสร้างสินค้ารุ่นของเรา

### สิ่งที่ผู้เล่นเลือก

1. Product family ที่มีทางผลิตแล้ว
2. Process profile: **Volume / Standard / Precision**
3. Module: ไม่มี / Throughput / Economy / Precision; สามแบบหลังเปิด C2
4. หัวหน้าทดลอง 0 หรือ 1 คนจาก role ที่เหมาะสม
5. ดูผลคาดหมาย Q, rate, input/energy และสิ่งที่สายผลิตต้องติดตั้ง ก่อนยืนยัน

ไม่มี slider สูตรเคมี ไม่มี chance-success และไม่มี reroll
ผลทดลองตรงกับ preview เมื่อ prerequisites เดิมครบ; ใช้เวลาเพื่อเล่าให้เห็นขั้นตอน
รับรองแล้วตั้งชื่อและบันทึกเป็น blueprint revision ที่แก้ย้อนหลังไม่ได้
เมื่อความรู้ดีขึ้นต้องเลือก «พัฒนารุ่นถัดไป» สินค้าเก่าในถังไม่เปลี่ยน Q ตาม

### อะไรทำให้ไม่จบที่สูตรที่แรงที่สุด

- Volume ผลิตเร็วแต่คุณภาพลดและใช้ input มากขึ้นต่อรอบ
- Precision ช้าลงและต้นทุนสูงขึ้น แลกกับ Q ที่เข้าเกณฑ์ลูกค้าบางราย
- Economy module ลดต้นทุน/ไฟแต่ลดอัตราผลิต
- ตลาด spot จ่ายตาม product family ไม่จ่ายเพิ่มเพียงเพราะ Q สูง
- ลูกค้าจ่ายตาม requirement ที่ตกลง ไม่จ่ายเพิ่มให้คุณภาพเกินสเปก
- งาน premium มีจำนวน/รอบที่จำกัดและใช้ช่องงานเดียว จึงไม่แทน spot market ทั้งหมด
- สิ่งที่แข่งคือกำไรตามเงื่อนไขจริง, ระยะส่ง, เงินจม, ความยืดหยุ่น ไม่ใช่ Q สูงสุด

### การทดลองและการรับรอง

ใช้ตัวอย่างสินค้าครอบครัวนั้นจาก stock ที่ไม่ reserve 10 หน่วย + เงินค่าทดลอง
ตัวอย่างถูกใช้จริง ไม่คืนเป็นสินค้าขายได้ และไม่มีรางวัลทดลองซ้ำ
Gas/Lube/Jet/Petro/Pellet ใช้เวลา 20/25/30/35/40 วินาที simulation ตามลำดับ
หัวหน้าถูกดึงจากงานเดิมระหว่างโครงการ ดู before/after ก่อนเริ่ม
การย้าย/ขาย lab ที่ใช้อยู่หรือปลดหัวหน้าระหว่างทำต้องเลือกยกเลิกโครงการก่อน
ยกเลิกไม่คืน sample/fee; แสดงผลนี้ก่อนยืนยัน; ไม่หักเงินเพิ่ม
ทำซ้ำ configuration เดิมใน family/knowledge/lead quality contribution เดิมไม่ได้ reward/XP
ถ้าจะทำรุ่น identical ให้เปิดรุ่นเก่าแทน ไม่ต้องเสียตัวอย่างใหม่

Blueprint จำ Q, profile, module, knowledge rank, min plant level และผู้ร่วมพัฒนา
ไม่ได้จำคนที่ต้องอยู่ในสายผลิตตลอดไป: ความรู้ที่รับรองเป็นความรู้บริษัท
หัวหน้าสายผลิตมีผลด้านความเร็ว/ประสิทธิภาพ ไม่แก้ Q ของสูตรหรือ stock ย้อนหลัง
stock sample ใช้พัฒนารุ่นอื่นใน family เดียวกันได้ Q เดิมไม่บวกทับ Q รุ่นใหม่

## 5. โรงงาน ไฟ ถัง และการวาง

### สายผลิต

- สาย Distillation ผลิต Gasoline และ feedstock; เลือก blueprint ของ Gasoline
- Lube/Jet/Petro ใช้ feedstock; Polymer ใช้ Petro ที่ไม่ reserve
- ใส่ blueprint ที่ผ่าน requirements แล้ว พร้อม module ตามสูตร จึงผลิต Q ของรุ่นนั้นได้
- เปลี่ยนสูตรมี setup 5 วินาที; ไม่ทิ้ง stock เดิม; ไม่ consume inputs ระหว่าง setup
- UI แสดง actual output เทียบกับ fully supplied output และเหตุผลที่ต่าง
- อัปเกรด Lv1/2/3 เพิ่มกำลังผลิตของตึกนั้นจริง และเปิด capability ตามตาราง
- ไม่เพิ่มขนาด footprint; เรื่องรูป Lv ยังแยก backlog

### พลังงาน

ใช้ข้อแก้หลักจาก audit V2: Gasoline มี built-in supply ตลอด; advanced มี site supply
สร้าง generator คือเพิ่ม supply ไม่เปิดภาษีไฟใหม่ให้สายที่เคยทำงานอยู่
ทุก consumer รวม Polymer ผ่าน allocator เดียว; ไม่เสีย input หากไม่มี output/work
generator ไม่เผา crude เมื่อ battery เต็ม; ทำ partial cycle ตามพื้นที่แบตได้
หยุด line/ตั้ง priority0 หมายถึงไม่ขอไฟ/inputs
อ่านเป็น supply/min, requested/min, delivered/min, stored/capacity หน่วยตรงกัน

### ถังและสต็อก

ความจุแชร์ตาม product family ไม่ใช่เพิ่มถังใหม่ทุก blueprint
สินค้า Q35 กับ Q55 อยู่ในถัง family เดียวกัน แต่ ledger แยก ไม่เฉลี่ย Q หลอกลูกค้า
งานใหญ่ทยอยส่งได้ จึงไม่ต้องสร้างถังห้าหลังเพียงเพื่อกด Complete
ถังยังมีประโยชน์กับ buffer, sample, bulk purchase และ production ระหว่างจัดการเมนู
ลดความจุแล้วมีของเกิน: เก็บของเดิมไว้ ขึ้น Over capacity หยุดรับเพิ่ม ขาย/ส่งได้
ไม่ลบ stock อัตโนมัติ ไม่ให้คำนวณพื้นที่ติดลบ

### Layout แบบเบา

ทางเดิน/ถนนเป็นภาพเดิมก่อน; ไม่บังคับต่อถนน/ต่อท่อเพื่อให้ตึกทำงาน
Adjacency สุดท้ายเหลือ local bonus ที่อ่านง่าย: ถังตรงชนิดติดสายผลิต +5% rate,
workshop ติดสายผลิตลด upkeep ของเป้าหมาย 10%; ต่อ target ได้ชนิดละหนึ่งครั้ง
นับ 4 ทิศของ logical grid ไม่ใช้ระยะ pixel; ไม่ stack จากถังหลายหลัง
generator adjacency เดิมที่เพิ่ม output ถูกแทนด้วย supply จริง ไม่บวกซ้ำ
ย้ายตึกไม่จ่าย discovery reward ซ้ำ; แสดง preview cell ที่ได้รับผลก่อนวาง

## 6. ทีมงานที่ผู้เล่นเห็นคุณค่า

หน้าที่มีสามกลุ่ม: **หัวหน้าสายผลิต / หัวหน้าทดลอง / ทีมสนับสนุน**
คนที่ไม่ได้ทำหน้าที่อยู่ Reserve ชัดเจน; ไม่มีคนเดียวรับโบนัสสองตำแหน่ง

| Role เดิม | สายผลิตที่รับได้ | ทดลอง | Support เมื่อเลือกหน้าที่นี้ |
| --- | --- | --- | --- |
| Operator | Distillation/Lube และ fallback Jet/Petro/Polymer | ทุก family โบนัส Q เมื่อ Lv≥3 | — |
| Fuel Specialist | Distillation/Lube | Gas/Lube | — |
| Aviation Specialist | Jet | Jet | — |
| Chemical Engineer | Petro | Petro | — |
| Polymer Engineer | Polymer | Pellets | — |
| Chemist | — | ทุก family | RP bonus เดิมแบบมี cap |
| Mechanic | — | — | Storage/maintenance ตาม cap |
| Sales Agent | — | — | Trade bonus ตาม cap |
| Safety Officer | — | — | Safety/upkeep ตาม cap |
| Logistics Coordinator | — | — | Logistics/storage ตาม cap |

หัวหน้าทดลองที่ตรง family หรือ Operator Lv≥3 ให้ Q+5; ไม่มี/Operator ต่ำกว่า Lv3 =0
ไม่มีโบนัส Q สุ่มจาก traits; ใช้ personality เดิมเป็นคำบรรยาย/เหตุการณ์สั้นเท่านั้น
คนธรรมดาหาจ้างผ่านปุ่ม role vacancy ได้เสมอ ไม่ต้องเสียเงิน refresh จนสุ่มได้
cap พนักงานเดิมยังใช้ แต่ไม่ออกแบบแคมเปญให้ต้องจ้างหลักร้อย
เป้าหมายขนาดทีมช่วงจบ 6–12 คนเป็นสมมติฐานที่ต้องวัด

### ความเติบโตและความผูกพัน

XP มาจากทำงานจริง/ทดลอง configuration ใหม่/งานส่งสำเร็จ ไม่ใช่ hire spam
บันทึกผลงานสั้นต่อคน: รุ่นที่ร่วมพัฒนา, เวลาทำงาน, งาน milestone ที่ช่วย
มีข้อความหลังส่ง เช่น «ทีมสาย Jet ส่งรุ่น Regional 2 สำเร็จ» โดยอิง ledger จริง
เลเวลใช้ thresholds เดิมก่อน แล้วจูนให้เห็นการเติบโตใน prototype
ปิด forced retirement ทั้งแคมเปญและหลัง clear; mentoring เป็น backlog ไม่ทำครึ่งระบบ
morale ในรุ่นแรกเป็น feedback เดิมที่ไม่ลด production จากการปิดแอป/ไม่กดดู
ไม่เพิ่ม hunger, stamina, shift scheduling หรือ relationship meter ระหว่างคน

## 7. ลูกค้าและเนื้อหางานทั้งแคมเปญ

ชื่อเป็น working titles ใช้ localized text แก้ได้โดยไม่เปลี่ยน ID
ทุก milestone ด้านล่างรับเงินตามงวด + completion bonus; ไม่มี deadline
quantity เป็นค่าตั้งต้น ต้องผ่าน validator และ playtest; ไม่เพิ่มตาม player stock เพื่อหลอกยืด

| Client ID / ชื่อ | Product | Trial: Q / qty | Regular: Q / qty | Partner: Q / qty |
| --- | --- | --- | --- | --- |
| `local` / เครือปั๊มชุมชน | Gasoline | 35 / 40 | 40 / 80 | 55 / 150 |
| `performance` / ศูนย์บริการพรีเมียม | Gasoline | 55 / 35 | 65 / 70 | 75 / 120 |
| `fleet` / บริษัทขนส่ง | Lube | 40 / 30 | 55 / 70 | 65 / 140 |
| `airline` / สายการบินภูมิภาค | Jet | 55 / 30 | 65 / 60 | 75 / 120 |
| `materials` / ผู้ผลิตวัสดุ | Petro **หรือ** Pellets | Petro40/40 หรือ Pellet50/25 | Petro55/80 หรือ Pellet65/50 | Petro65/160 หรือ Pellet75/100 |

Materials เลือก branch ตอนรับแต่ละงานได้ แต่หนึ่ง job ต้องใช้ product ที่เลือกจนจบ
คุณสมบัติใหม่ไม่ใช้สินค้า Asphalt/Recycled ใน quality ladder; ยังขาย spot/งานเสริมได้
Milestone sequence: Trial → Regular → Partner ต้องทำงานสามอันที่ต่างกันตามลำดับ
ไม่บังคับส่ง standing ซ้ำสองรอบเหมือน V2; การเล่นซ้ำมีไว้สร้างรายได้ ไม่เป็นกำแพง rank
หลัง Regular เปิด repeat offer เกณฑ์เดียวกับ Regular; หลัง Partner มี Partner repeat เพิ่ม
repeat cooldown 120 วินาที simulation เริ่มตอนรับ; หลังจบต้องพ้น cooldown จึงรับซ้ำ
เลือก auto-repeat ได้หลัง C3; ใช้ accepted job slot เดิมและหยุดได้หลัง shipment ปัจจุบัน
milestone และ repeat เป็นคนละ ID; repeat ไม่แจก milestone RP/reputation ซ้ำ

### การรับงาน/ส่งของ/รับเงิน

- 1 accepted job; แนะนำไม่เกิน 3 ใบ: งาน milestone, งานทำเงินที่ feasible, optional rush
- Offer ระบุ Q, quantity, quote ต่อหน่วย, completion bonus, คอขวดและ estimated time
- รับแล้ว quote และ requirements ไม่เปลี่ยนตามตลาดหรืออัปเกรด Sales Agent
- ส่งด้วยมือหรือ auto-dispatch opt-in; auto ส่งก่อน auto-sell และก่อนใช้เป็น feed ของ Polymer
- แต่ละ shipment รับเงินค่าสินค้าทันที; completion bonus/RP/rank ได้เมื่อครบครั้งเดียว
- ยกเลิก: ของส่งแล้วไม่คืน เงินที่ได้แล้วไม่เรียกคืน ไม่ได้ completion bonus; มี receipt
- ทยอยส่ง Q≥requirement ได้หลายรุ่น; ห้ามเฉลี่ยของต่ำกว่าสเปกให้ผ่าน
- Reserve เฉพาะของเข้าเกณฑ์ที่ต้องใช้กับ accepted job; spot ขาย surplus ได้
- ถ้าเก็บสินค้า Qสูงไว้ให้ Polymer/งานอื่น มี keep-stock setting ราย variant พร้อมลำดับชัดเจน
- ไม่มี multi-client scheduling, penalties ต่อวัน หรือเครดิตหนี้ในรุ่นนี้

### Rush เป็น optional หลัง C3

ใช้ requirement ของ repeat ที่ผู้เล่นเคยทำได้แล้ว; quantity ไม่เกิน output ประเมิน 90 วินาที
deadline ≥2× conservative completion estimate และอย่างน้อย 180 วินาที simulation
หาก ETA ประเมินไม่ได้ไม่เสนอ; pause/ปิดแอปไม่เดินนาฬิกา
expire เก็บเงินงวดที่ส่งแล้วไว้ เสียแค่ completion bonus และแสดงผลใน report
ไม่มีค่าปรับ/หัก rank/ทำให้ลูกค้าหายถาวร; ไม่บังคับทำ Rush เพื่อจบ

## 8. เศรษฐกิจและ progression

สูตรและตัวเลขครบอยู่ใน Systems; หลักของการจูนคือ **เห็นต้นทุนจริงและมีทางเลือกที่คุ้มต่างกัน**
prototype เปรียบเทียบ Volume/Precision ภายใต้ลูกค้าคนละแบบและ spot market
ยอมให้สินค้าคุณภาพสูงทำเงินดีเมื่อมีงานตรงตลาด แต่ห้ามดีกว่าทุกด้านในทุกกรณี
RP ใช้ปลดความรู้/ความสามารถ ไม่ต้องกดซื้องานวิจัยทุกช่องเพื่อจบ
knowledge rank เป็นสิทธิ์จาก research เดิม/ใหม่ ไม่ใช่สกุลเงินเก็บเพิ่ม
ระดับบริษัทแสดงภาพรวม ส่วนบทแคมเปญเป็นทางเปิดระบบ; ไม่บังคับอัป Lv ด้วยเงินซ้ำ

### สิ่งที่ HUD ต้องบอกตรง

- เงินสดกับกำไรดำเนินงานแยกจากกัน; ซื้อเครื่องจักรไม่ใช่โรงงานผลิตขาดทุนทั้งระบบ
- แสดงเงินจริงเข้า/ออกช่วง 60 วินาที และแยก capex/research/one-time grants
- กำไรตามบัญชีสินค้ามี cost basis แยกจาก cashflow; ไม่เอาสองตัวมาปนเรียก net/min
- Margin ของสูตรเป็น estimate พร้อมสมมติฐานวัตถุดิบ/ลูกค้า ไม่ใช่ราคาขายลบ crude อย่างเดียว
- Upgrade preview บอกว่าคอขวดปัจจุบันทำให้ benefit จริงเป็นศูนย์ได้

### ป้องกันทางตัน

โรงงานเริ่มต้นมี 3 ตึกที่ใช้ได้ + Operator1 + crude18 + เงิน600; ไม่ต้องซื้อให้ครบก่อนเล่น
เริ่มมี Gasoline Standard Q40 ที่รับรองแล้ว ผลิตและขายได้โดยไม่ทดลอง
auto-buy กันเงิน wage/upkeep หนึ่งรอบ + crude สองรอบก่อนงบลงทุนอัตโนมัติใด ๆ
ถ้าเงินไม่พอเดินเครื่องมีทางลดทีมเป็น Reserve/พักไลน์/ขาย stock/ยกเลิก reservation
ถ้าหมดเงินจริงและไม่มี stock ใช้ recovery tolling: วัตถุดิบลูกค้าไม่เข้าสต็อก
ทำงานบริการ 20 วินาทีได้ fee พอซื้อ crude 6 หน่วย; ไม่มี reward อื่น ไม่มี debt
เปิดเฉพาะเมื่อเงิน < cost crude6 และไม่มี unreserved stock ขายให้ถึง threshold ได้
วัตถุดิบลูกค้า/ผลผลิตงานช่วยเหลือขายหรือใช้ทำสูตรไม่ได้; ไม่เป็นวิธีฟาร์มที่เหนือ spot
ถ้าถอดตึกเริ่มต้นหมด ให้เลือก restore starter setup ผ่าน recovery โดยไม่แจกเงิน/ตึกที่ขายทำกำไรได้
รายละเอียดป้องกัน buy/demolish/recovery loop อยู่ใน Systems

## 9. ระบบเดิม: ใช้ต่อ เปลี่ยน หรือพัก

**คำตัดสินล่าสุด 2026-09-25:** V3 เริ่มเกมและเซฟใหม่เท่านั้น ไม่ย้ายเซฟ
contract, inventory, prestige หรือ progression จากเกมเดิม ระบบเดิมในตารางนี้
เป็นเพียงรายการอ้างอิงสิ่งที่ต้องสร้างใหม่หรือเลิกใช้ ไม่ใช่แผน migration

| ระบบ | การจัดการ V3 |
| --- | --- |
| Map/camera/art/UI shell/save | ใช้ต่อ; regression checks ต้องผ่าน |
| ไฟ/ถัง/production | แก้ audit bugs ก่อนต่อระบบใหม่ |
| Contracts/standing/rush | ย้ายสู่ job action/ledger เดียว ไม่ให้จ่ายสอง engine |
| 41 contracts เดิม | ไม่ import; ใช้ client/job ชุดใหม่เท่านั้น |
| Employees/portraits/skills | เก็บ identity/XP; ย้าย effects ตามหน้าที่; ปิด global operator stack |
| Research | ใช้ RP เดิม; map เดิมสู่ capability/bonus โดยไม่ลบของที่ซื้อ; ดู Systems mapping |
| Perks/prestige bonuses | คงประวัติ; แปลง effects เข้าช่อง capped เดียว ไม่บวกซ้ำกับสูตร |
| Green/Industrial | เก็บ choice เดิมเป็น optional specialization modifier; ไม่เพิ่ม tree อีกชุด |
| Hidden combos | เก็บ discovery; bonus ใช้ local rules ข้อ5 ไม่มี reward จากย้ายซ้ำ |
| Random/choice events/crisis | พัก destructive/modifier events ใน prototype; full release ใช้ optional inbox events จำกัดตามข้อ10 |
| Boost | เก็บได้ แต่เป็น rate modifier ที่ใช้ input/ไฟจริง; ไม่ช่วยเพิ่ม Q; ไม่นับเป็นเงื่อนไข clear |
| Market saturation/era shift | ปิดการเปลี่ยนราคาแบบลงถาวรใน campaign; ใช้ราคาฐานกับ quote คงที่ก่อน |
| Awards/rivals | ช่วง prototype แสดงสถิติ ไม่จ่าย/ลงโทษ; full release ใช้ period targets ที่ freeze ตามข้อ11 |
| Retirement/forced morale churn | ปิด; ไม่เอาระบบเสียคนทุกชั่วโมงกลับมาเงียบ ๆ |
| Legend/prestige เดิม | ไม่ import และไม่เป็น campaign gate |

## 10. หน้าจอและเหตุการณ์

ใช้ 4 tabs เดิม; ไม่เพิ่ม tab ระดับบน

| จุดเข้า | สิ่งที่ต้องทำได้ | Empty/error state |
| --- | --- | --- |
| Factory → Plant Info | สูตรปัจจุบัน Q, actual/max rate, worker, module, upgrade, pause | บอกเหตุผลที่ผลิตไม่ได้พร้อม action; ห้าม Info ว่าง |
| Operations → Products | รายการรุ่นสินค้า, stock แยก Q, รุ่นไหนขาย/ส่งให้ใครได้ | ยังไม่มีรุ่นใหม่ → เริ่มทดลองจาก Standard |
| Operations → Develop | เลือก family/profile/module/lead, preview, เริ่มทดลอง, report, รับรอง | ขาด lab/sample/เงิน → บอกจำนวนและลิงก์ action |
| Business → Opportunities | 3 ทางเลือก, client next milestone, accepted job/progress/shipments | งานยังไม่ feasible → preview พร้อมสิ่งที่ขาด; ไม่ใช้ปุ่มรับที่กดแล้วเงียบ |
| Business → Trade | spot/manual/auto, reserved/keep/free stock, input floor | ของถูก reserve → ลิงก์ไปงาน/keep rule |
| Team | หน้าที่ active/support/reserve, ผลงาน, transfer, training เดิม | ไม่มี vacancy/worker → เหตุผลและ direct hire ที่ถูก role |
| Company | Chapter roadmap, clear conditions, optional challenges | แสดงสิ่งถัดไปเพียง 1–2 อย่าง |

Product card ย่อ: `ชื่อรุ่น · Q55 · 48/min เมื่อวัตถุดิบพอ · สำหรับลูกค้า X`
sheet รายละเอียดค่อยแสดง input/min, cost estimate, lead/equipment prerequisites
ไม่แสดง internal IDs, schema versions หรือ calculation debug ใน flow ผู้เล่น
รองรับ TH/EN, ตัวอักษรธรรมดาอ่านง่าย, safe area, touch target ≥44 logical px
pause simulation ระหว่าง modal ที่ตัดสินใจเรื่องสูตร/รับงาน/ยืนยันย้ายคน; restore speed เดิมเมื่อปิด
ดู stock หรือสลับ tab ไม่ต้อง pause; nested sheet ต้องมี pause ownership ไม่ resume ก่อนเวลา

เหตุการณ์เต็มเกมใช้ inbox ไม่บัง critical action; มีพร้อมกันไม่เกินหนึ่ง pending decision
minimum gap 180 วินาที simulation; suppress ระหว่าง tutorial/recovery/development confirmation
มีเพียงโอกาสทดลอง, คำชมลูกค้า, เรื่องเล่าผลงานทีม; ไม่มี automatic resource debit
event ให้ bonus เงิน/RP ครั้งเดียวตาม ID ได้ แต่ห้ามเป็น prerequisite ของ campaign
เหตุการณ์เก่าที่เปลี่ยน inventory/quality/contract quote ข้าม ledger ต้องไม่รันใน V3

## 11. จุดจบและการเล่นต่อ

### Clear conditions ที่เลือกตรวจได้

1. ลูกค้า **3 ใน 5 ราย** ถึง Partner โดยครอบคลุมอย่างน้อย **2 product families**
2. หนึ่งในสามเป็น Airline หรือ Materials เพื่อได้ลอง advanced business อย่างน้อยหนึ่งทาง
3. ส่ง Showcase หนึ่งงานด้วย blueprint ที่พัฒนาเอง Q≥65: เลือก Gas150 / Lube120 / Jet100 / Petro100 / Pellets80
4. กำไรดำเนินงานสะสมของ rolling 180 วินาทีล่าสุดเป็นบวก โดยไม่รวมเงินแจก/ขายตึก

Showcase ไม่มี deadline, จ่ายตามงวด, quote tier Q65 และ completion bonus ปกติ
หาก stock เก่าพอส่งก็ใช้ได้ถ้าเป็น certified variant; ไม่ซ่อนเงื่อนไขผลิตใหม่
clear เป็น sticky milestone ครั้งเดียว; หลัง clear ไม่ยึดคืนเมื่อเงินลด/รื้อโรงงาน
ฉากจบใช้ report/ไอคอนเดิม: สินค้าดาวเด่น ทีมที่มีผลงาน ลูกค้า แผนโรงงาน และกำไร
ไม่ต้อง 5×5 เต็ม, ทุก research, Lv30, ทุก client, 6×6 หรือเงิน120ล้าน

### Freeplay ที่อยู่ในขอบเขต

- ทำอีกสอง client ให้ Partner, พัฒนาทุกรายการ, ทดสอบโรงงาน compact หรือ bulk
- Optional challenges จาก rules ที่มี: clear ภายใน16lots, ส่ง Showcaseสองfamily, positive marginสามperiod
- ขยาย6×6 เมื่ออยากทำโรงงานใหญ่; ไม่มี premium currency
- period report ทุก12นาที simulation: scoreจาก margin/qualified deliveries/product diversity
  targets เปิดและ freeze ตอนเริ่ม period ไม่ขยับตามคะแนนผู้เล่นกลางรอบ
- Award เป็น badge/one-time RP ต่อ grade สูงสุดที่เพิ่งได้ (B5/A10/S15RP ส่วนเพิ่มครั้งเดียวต่อrun)
  ไม่หักเงิน/คน/กำลังผลิตจาก grade ต่ำ; no win condition on calendar waiting
- ไม่มี NewGame+ ใน V3; reset เริ่ม state ใหม่ทั้งหมด

## 12. ขอบเขตครบและสิ่งที่ตั้งใจไม่ทำ

V3 release ต้องมี: correctness fixes, 5 families ที่พัฒนารุ่นได้, 5 clients/15 milestones,
repeat/rush ที่เลือกได้, local staffing, product inventory, research mapping, utilities,
campaign/ending/freeplay, onboarding, fresh-save persistence, legal simulation และ device checks

ไม่ทำใน V3: ภาพใหม่/PixelLab, music/day-night redesign, multiplayer, backend,
ซื้อขายกับผู้เล่น, dynamic world economy, real chemistry, pipe/road pathfinding,
shipping vehicles, employee hunger/shift/retirement, random gear, monetization,
new product families, new engine, branching storyline หรือ NewGame+ ใหม่

## 13. แผนส่งมอบและการหยุดขยายที่มีเหตุผล

| Release | ผลที่ผู้ใช้เล่นได้ | Gate |
| --- | --- | --- |
| R0 หลักฐานและความถูกต้อง | บั๊กทรัพยากร/ไฟ/ถัง/assign แก้จริงพร้อม diagnostic | state invariants + upgrade/UI regression |
| R1 Prototype Gasoline | สองแนวสินค้า สองตลาด คนหนึ่งทีม ทดลอง→ผลิต→ส่ง→เงิน ครบ | 15–20นาที มีเหตุผลเลือกสูตรและอยากทดลองต่อ |
| R2 Midgame | Lube/Jet, local crew, power/storage/modules, ลูกค้า3–4ราย, chapterถึงC3 | สองแผนลงทุนไปต่อได้ ไม่มี deadlock |
| R3 Complete campaign | Petro/Polymer, Materials, C4/Showcase/ending, existing systems mapping | จบได้ภายใน25lotsและไม่ต้องทุกตึก |
| R4 Release validation | Fresh-save/reset, calibrated economy, freeplay, full mobile QA | ตัวเลขตรง UI ไม่มี known blocker และผ่าน playtest ทั้งต้น/กลาง/ท้าย |

R1 ถ้าไม่สนุก ให้ปรับ R1 ไม่เพิ่ม client/art เพื่อกลบปัญหา
ผู้ใช้ขอแผนใหญ่ แต่การเขียนต้องทีละ task/commit และรวม build เป็น release slice
ไม่สร้าง APK ทุก task; ไม่รวมเปลี่ยนรูปกับเปลี่ยนสูตรผลิตใน commit เดียว

## 14. Definition of done และคำถามที่ playtest ต้องตอบ

Technical: no negative/nonfinite resources, no duplicated payout, no mixed quality exploit,
one source of truth, exact fresh save/reload/reset, portable tests and mobile UI paths
Content: 15 milestones ทุกอันมีทางทำถึง Q/stock/power/cash ในบทที่เสนอ
Economic: positive baseline, premiumsไม่ชนะทุกกรณี, recoveryไม่ฟาร์ม, workersไม่stackทั่วโรง
Player: อธิบายได้ว่าติดอะไร เลือกสูตรเพราะอะไร จำผลงานทีมได้ และรู้ว่ารอบต่อไปอยากทำอะไร

วัด fresh save + mid/late constructed fixtures แยกกัน; fixture ไม่ใช่หลักฐานว่าเล่นไปถึงได้
ใช้อย่างน้อยสาม strategy: volume/spot, quality/client, efficiency/compact; เพิ่ม idle control
เป้าหมาย90–180นาทีต้องพิสูจน์ด้วย legal actions; ไม่แก้ duration assertion เพื่อให้ผ่านอย่างเดียว
ถ้า feedback ชี้ว่าตัวเลขไม่ดี ให้ปรับ data ไม่เพิ่มระบบโดยอัตโนมัติ

แผนนี้ตัดสินระบบหลักครบแล้ว ความไม่แน่นอนที่เหลือคือค่าบาลานซ์และความสนุกจากการเล่นจริง
งานแรกเมื่อได้รับคำสั่ง implement คือ **V3-00** ใน Implementation ไม่ใช่ทำทุกระบบพร้อมกัน
