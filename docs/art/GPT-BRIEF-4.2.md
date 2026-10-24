# งานรูป 4.2 / 4.3 สำหรับ GPT — อ่านไฟล์นี้ก่อนแล้วทำตามได้เลย

ไฟล์นี้เขียนให้ **GPT ที่เข้าถึง repo นี้** (Refinery Story, branch `topdown/v5` หรือ `feature/rewarded-ads`)
อ่านแล้วสร้างรูป ใส่ไฟล์ และต่อเข้าเกมเอง ข้อความ prompt เต็มของแต่ละรูปอยู่ใน
[`GPT-PROMPTS-4.2.md`](GPT-PROMPTS-4.2.md) (หัวข้อเลขเดียวกัน) — **ใช้ prompt ตามนั้นโดยไม่ต้องแก้**
ไฟล์นี้บอกเพิ่มว่า: เซฟที่ไหน, ตัดยังไง, ต่อเข้าโค้ดตรงไหน, เช็กอะไรก่อนจบ

## กฎก่อนเริ่ม (อ่านก่อนแตะโค้ด)

- อ่าน `AGENTS.md` และ `docs/v4/ADS.md` ถ้าเกี่ยวกับโฆษณา เจ้าของพูดไทย อยากได้สรุปไทยสั้น ๆ ตอนจบ
- สไตล์: พิกเซลอาร์ตแบบ Kairosoft ขอบดำ 1px เงา 3 โทน แสงจากซ้ายบน **ห้ามมีตัวหนังสือ/ตัวเลข/โลโก้ในรูป**
- รูปจาก GPT ต้อง **ย่อแบบพิกเซล (nearest-neighbour) และลดสี** ก่อนใส่เกม ห้ามใช้ภาพสีเต็มขนาดดิบ
  (ดูตัวอย่างฟังก์ชัน `pix()` ใน `scripts/art/bgs.py`) ไอคอนต้องอ่านออกที่ขนาดเล็ก
- สีประจำน้ำมัน (การ์ดใช้สีนี้): เบนซิน `#E2483D` · ดีเซล `#F08A24` · เจ็ท `#3D8FE0` · LPG `#9C5BD6` ·
  หล่อลื่น `#2FB38E` · แวกซ์ `#2FB38E` · ยางมะตอย `#6D5A4A` · เม็ดพลาสติก `#E36BB0`
- ก่อนจบทุกงาน: `npx tsc --noEmit` และ `npm run v4:check` ต้องผ่าน (ถ้ารันคำสั่งไม่ได้ ให้บอกว่าไม่ได้รัน)
- ถ้าทำขั้นไหนไม่ได้ (เช่น รันสคริปต์ไม่ได้) ให้เซฟ PNG ไว้ที่ path ที่กำหนดแล้วบอกว่าเหลือขั้นไหน
  อย่าแก้โค้ดครึ่งทางจนเกม build ไม่ผ่าน
- เสร็จแล้วถ่ายภาพหน้าจอเว็บ (`npm run export:web` แล้วเปิด `/game`) ให้เจ้าของดูก่อน/หลัง

## ลำดับและที่เก็บไฟล์

| #   | ไฟล์ดิบจาก GPT (เก็บไว้)                                 | ผลลัพธ์ในเกม                                  | จุดต่อโค้ด                                                    |
| --- | -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| 1   | `art-src/gpt/oil_icons.png` (1024×512, 4×2)              | `assets/v4/ui/oil_<baseId>.png` 64×64 ×8      | `ProductCard.tsx` (การ์ด/ไทล์), ตัวกรองใน `ProductsPanel.tsx` |
| 2   | `assets/v5/pixel/source/productLab.png` (1536×1024, 3×2) | สร้างอัตโนมัติด้วย `npm run art:v5`           | ไม่ต้องแก้โค้ด (ดูข้อ 2)                                      |
| 3   | `art-src/gpt/tab_products.png` (1024²)                   | `assets/v4/ui/tab_products.png` ~144²         | `GameIcon.tsx` ชื่อ `blend`                                   |
| 4   | `art-src/gpt/bg_products.png`, `bg_lab.png` (1024×1536)  | ใช้ไฟล์ใน `art-src/gpt` ตรง ๆ                 | `headerArt` ใน `src/v4/ui/art.ts`                             |
| 5   | `art-src/gpt/card_frames.png` (1536×1024, 3×2)           | `assets/v4/ui/frame_<grade>.png` ×6           | `ProductReveal` ใน `Notices.tsx`                              |
| 6   | `art-src/gpt/catalyst_icons.png` (1280×1024, 5×4)        | `assets/v4/ui/cat_<additiveId>.png` 48×48 ×20 | `labParts.tsx`, `ProductLabPanel.tsx`, `ProductCard.tsx`      |
| 7   | `art-src/gpt/feature_graphic.png` (1536×768)             | `docs/store/feature_graphic_1024x500.png`     | ไม่เข้าเกม (ส่ง Google Play)                                  |

ข้อ 1–3 เห็นผลในเกมมากสุด ทำก่อน

## รายละเอียดรายข้อ

### 1. `oil_icons.png` → ไอคอนน้ำมัน

- ช่อง 256×256 เรียงซ้าย→ขวา บน→ล่าง = `gasoline, diesel, jet, lpg, lube, wax, asphalt, pellet`
  (ตรงกับ id ใน `src/v4/data/bases.ts`)
- ตัดแต่ละช่อง ครอปขอบโปร่งใสให้เต็มกรอบ ย่อเป็น 64×64 nearest ลดสี ≤ 32 สี เซฟ `assets/v4/ui/oil_<id>.png`
- ใช้: ที่แถบสีหัวไทล์ใน `ProductTile` และหัวการ์ดใน `ProductCard` วางไอคอน ~20px ข้างชื่อชนิดน้ำมัน
  ตัวกรองชนิดน้ำมันใน `ProductsPanel` ใช้ไอคอนเดียวกันแทนข้อความล้วน
  (`require` ต้องเป็น path ตรง ๆ ทำเป็น map `Record<BaseId, number>` ในไฟล์ใหม่ เช่น `src/v4/ui/oilIcons.ts`)
- ห้ามเปลี่ยนความสูงไทล์ (`TILE_HEIGHT = 148`) การ์ดทุกใบต้องขนาดเท่ากัน

### 2. `productLab.png` → ตึกแล็บสร้างสินค้า 5 เลเวล

- วางที่ `assets/v5/pixel/source/productLab.png` (ผ่านแพตเทิร์นเดียวกับ `lab.png`, `cdu.png`)
- เพิ่ม entry `productLab` ลง `assets/v5/pixel/source/generation.json` (id, prompt จากข้อ 2, file) ให้เหมือนตึกอื่น
- รัน `npm run art:v5` — `build-generated-pixel.ts` จะตัดช่อง 3×2 ให้เอง และ `build-product-lab.ts`
  จะข้ามรูปเปลี่ยนสีชั่วคราวเมื่อเจอไฟล์นี้ (แก้ไว้แล้ว; ลูปตกแต่งเก่าที่ทำให้ `art:v5` พังก็แก้แล้ว รันซ้ำได้ผลไม่เปลี่ยน)
- ต้องผ่าน `check-v5-graphics` และ `check-generated-pixel` (5 ภาพต่างกัน, ขนาด/จุดยึดเท่ากันทุกเลเวล, footprint 64×64)
  ถ้า error "Cell touches cut edge" แปลว่ารูปล้นช่อง ให้ gen ใหม่ ห้ามแก้สคริปต์ให้หลวม
- ตึกนี้ต้องดูต่างจากแล็บสร้างสูตร (สีฟ้า) ชัด: หลังคาส้ม ผนังงาช้าง หน้าต่างโชว์ขวดสินค้า

### 3. `tab_products.png` → ไอคอนปุ่ม "สินค้า"

- ตัดขอบโปร่งใส ย่อเป็นประมาณ 144×144 nearest ลดสี เซฟ `assets/v4/ui/tab_products.png`
- `GameIcon.tsx`: ตอนนี้ `blend` วาดด้วยโค้ด (SVG ถังแดงกับกล่อง) ให้เปลี่ยนเป็น `Image` จากไฟล์ใหม่
  เหมือน `build/staff/customers/company` (ดู map `require` บรรทัด ~20) แล้วลบส่วน SVG ของ `blend` ออก
- ตรวจที่ขนาด 24px ใน `GameDock` ว่ายังอ่านออก

### 4. `bg_products.png`, `bg_lab.png` → ภาพหัวเมนู

- เซฟไฟล์ดิบที่ `art-src/gpt/` แล้วแก้ `headerArt` ใน `src/v4/ui/art.ts`:
  `Products` → `bg_products.png`, `Lab` → `bg_lab.png` (ตอนนี้ทั้งคู่ชี้ `bg_blend.png`)
- ดูหัวเมนูสินค้า/แล็บในเว็บ: ต้องเห็นของตรงแถบกลางภาพ

### 5. `card_frames.png` → กรอบการ์ดตามเกรด

- ช่อง 512×512 เรียง `D, C, B, A, S, SS` ตัดเฉพาะกรอบ (ครอปขอบ) ย่อให้กว้าง ~150px สัดส่วน 2:3
  เซฟ `assets/v4/ui/frame_D.png … frame_SS.png`
- `ProductReveal` ใน `Notices.tsx`: วางกรอบเป็น overlay (`position:'absolute'`, `pointerEvents:'none'`,
  `resizeMode:'stretch'`) ทับ `ProductCard wide` ตามเกรดของสินค้า ใช้ได้เฉพาะป๊อปอัปเปิดการ์ด
  ไม่ใส่กรอบในรายการสินค้า (ต้องคงขนาดเท่ากัน อ่านง่าย)

### 6. `catalyst_icons.png` → ไอคอนสารเร่ง 20 ชนิด

- ช่อง 256×256 เรียงซ้าย→ขวา บน→ล่าง (5 คอลัมน์ × 4 แถว) = ลำดับ `src/v4/data/additives.ts`:
  `octane, antifreeze, detergent, bio, dye, fragrance, cetane, antioxidant, lubricity, stabilizer,
corrosion, antifoam, coldflow, cleanburn, polymer, adhesive, recycled, premium, catalyst, nano`
- ย่อเป็น 48×48 nearest ลดสี เซฟ `assets/v4/ui/cat_<id>.png` + map `require` ไฟล์เดียว (`catalystIcons.ts`)
- ใช้ใน: แถวสต็อกสารเร่ง (`Stock` ใน `labParts.tsx`), ตัวเลือกสารเร่งตอนพัฒนาสินค้า (`ProductLabPanel.tsx`),
  บรรทัดสารเร่งบนการ์ด (ไอคอนเล็ก 16px หน้าชื่อ)

### 7. `feature_graphic.png` → ภาพหน้าร้าน Google Play

- ย่อ/ครอปเป็น **1024×500** เซฟ `docs/store/feature_graphic_1024x500.png`
- วางชื่อ "Refinery Story" ฝั่งซ้าย (ส่วนโล่ง 40%) ด้วยฟอนต์ที่เกมใช้ (Pixelify Sans) — GPT ห้ามวาดตัวหนังสือเอง
  ทำด้วย `sharp` + SVG text หรือ PIL ก็ได้

## เมื่อเสร็จ

- สรุปไทยสั้น ๆ: ใส่รูปอะไรแล้ว, อะไรยังค้าง, ภาพก่อน/หลังที่ถ่ายไว้
- commit แยกเป็นข้อ ๆ ตามตาราง ไม่ push ไป `main` (ตามกฎใน `AGENTS.md`)
