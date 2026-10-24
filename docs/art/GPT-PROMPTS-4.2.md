# GPT image prompts — v4.2 (product cards)

วิธีใช้: เปิด ChatGPT (สร้างภาพ) ทีละงาน แนบภาพอ้างอิงตามที่บอก แล้ววาง prompt ภาษาอังกฤษทั้งก้อน
ได้ภาพแล้วส่งไฟล์ PNG กลับมาในแชทพร้อมบอกชื่อไฟล์ เดี๋ยว Claude ตัด/ย่อ/ลดสี/ใส่เข้าเกมให้เอง
(ไม่ต้องย่อหรือตัดเอง) ถ้า GPT ใส่ตัวหนังสือ ใส่ขอบ หรือมุมกล้องเพี้ยน ให้กด regenerate หรือพิมพ์บอก
ข้อที่ผิดซ้ำได้เลย

ลำดับแนะนำ: 1 → 2 → 3 → 4 → 5 → 6 → 7 (ข้อ 1–3 เห็นผลในเกมมากที่สุด)

| # | ไฟล์ | ใช้ที่ | ขนาดที่ขอ | ใส่ในเกมที่ |
|---|------|------|----------|-----------|
| 1 | `oil_icons.png` | กลางการ์ดสินค้า, ตัวกรองชนิดน้ำมัน | 1024×512 (4×2) | 64×64 ต่อไอคอน |
| 2 | `productLab.png` | ตึกแล็บสร้างสินค้า 5 เลเวล | 1536×1024 (3×2) | sprite 1×1 ช่อง |
| 3 | `tab_products.png` | ปุ่ม "สินค้า" แถบล่าง | 1024×1024 | 144×144 |
| 4 | `bg_products.png`, `bg_lab.png` | ภาพหัวเมนูสินค้า / แล็บ | 1024×1536 | แถบหัวเมนู |
| 5 | `card_frames.png` | กรอบการ์ดตามเกรด + ประกาย | 1536×1024 (3×2) | ป๊อปอัปเปิดการ์ด |
| 6 | `catalyst_icons.png` | ไอคอนสารเร่ง 20 ชนิด | 1280×1024 (5×4) | 48×48 ต่อไอคอน |
| 7 | `feature_graphic.png` | หน้าร้าน Google Play | 1536×768 | 1024×500 |

ภาพหน้าจอสำหรับหน้าร้าน (screenshots) ไม่ต้องใช้ GPT ใช้ภาพจากเกมจริง Claude ถ่ายจากเวอร์ชันเว็บให้ได้

---

## Style line (ใช้ซ้ำ — ทุก prompt ด้านล่างใส่ไว้ให้แล้ว)

> Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines,
> bright cheerful flat colours with simple 3-tone shading, palette: steel grey #C9D3DC/#9EABB8/#73818F,
> cream #FFF6E3, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E,
> dark ink #14110F. No text, no letters, no numbers, no logos, no watermark.

สีประจำชนิดน้ำมันในเกม (ต้องตรง เพราะการ์ดใช้สีนี้): เบนซิน แดง `#E2483D` · ดีเซล ส้ม `#F08A24` ·
เจ็ท ฟ้า `#3D8FE0` · LPG ม่วง `#9C5BD6` · หล่อลื่น เขียวน้ำทะเล `#2FB38E` · แวกซ์ เขียว `#2FB38E` ·
ยางมะตอย น้ำตาล `#6D5A4A` · เม็ดพลาสติก ชมพู `#E36BB0`

---

## 1. `oil_icons.png` — ไอคอนชนิดน้ำมัน 8 แบบ

แนบอ้างอิง: `assets/v4/ui/cash.png` และ `assets/v4/ui/star.png` (ให้สไตล์ไอคอนตรงกับ HUD)

```
Cute pixel art game icons in the style of Kairosoft mobile games, chunky pixels, clean 1px dark
outlines, bright cheerful flat colours with simple 3-tone shading, light from the top-left. Match the
attached icons' pixel size, outline weight and shading exactly. No text, no letters, no numbers, no
logos, no watermark.

Layout: EXACTLY 4 columns x 2 rows of equal SQUARE cells on a 1024x512 canvas (each cell 256x256),
TRANSPARENT background, no cell borders, no gridlines. One centred icon per cell, filling about 75% of
its cell, nothing crossing into another cell. Each icon is a single chunky object, readable at 48px.

Cells left to right, top row then bottom row:
1 GASOLINE: a red jerrycan (#E2483D) with a small golden fuel drop on its side.
2 DIESEL: an orange oil drum (#F08A24) with two dark bands and a black cap.
3 JET FUEL: a blue fuel drop (#3D8FE0) with a small white airplane silhouette across it.
4 LPG: a purple gas cylinder (#9C5BD6) with a silver valve on top.
5 LUBE: a teal motor-oil can (#2FB38E) with a long spout and a golden oil drip.
6 WAX: a stack of three pale green wax blocks (#2FB38E tint) with a tiny cream candle on top.
7 ASPHALT: a dark brown asphalt slab (#6D5A4A) with a small yellow road line and a few pebbles.
8 PLASTIC PELLETS: a small pink sack (#E36BB0) spilling round pink and white pellets.
```

---

## 2. `productLab.png` — ตึกแล็บสร้างสินค้า (5 เลเวล)

แนบอ้างอิง **2 ภาพ**: `assets/v5/pixel/source/cdu.png` (สไตล์หลักของทุกตึก) และ
`assets/v5/pixel/source/lab.png` (แล็บสร้างสูตร ตึกนี้ต้องดูเป็น "พี่น้อง" แต่แยกออกได้ชัด)

```
Production PIXEL ART sprite sheet for Refinery Story. Match reference image's crafted detailed pixel
clusters, dark 1px outlines, silver-metal 3-tone shading, orange pipes, yellow railings and cheerful
Japanese miniature tycoon art. View: orthogonal top-down 3/4, see roofs and ONLY SOUTH WALL. Ground
square axis-aligned, no diamond, no side wall, no perspective skew. Light top-left. Not vector, not
geometric placeholder, not smooth 3D.
Layout EXACTLY 3 columns x2 rows, 1536x1024, six 512px square cells. Five versions of ONE building:
L1,L2,L3 across top; L4,L5,EMPTY across bottom. Transparent surroundings; no text/labels/numbers/
gridlines. Every version same base dimensions and same building scale and anchor, consistent reference
pixel brush. Base longest edge 320 output px, bottom 48px above cell bottom. Base aspect specified
below; it must never grow between upgrades. Leave room above tall structures, nothing clipped or
crossing cells. Add details cumulatively, keep original main silhouette and colors through L5. No
smoke or flame animation baked in, no halo or glow.
The references are STYLE ONLY. Create ONLY the subject below, do NOT draw the reference distillation
tower. The second reference is the blue Formula Lab: this building is its sibling, same size and
build quality, but must be instantly distinguishable from it.
Foundation footprint 1x1 tiles. Subject: PRODUCT LAB: cute compact one-storey product development lab,
warm ORANGE/terracotta corrugated roof, ivory SOUTH wall, a wide front display window showing a shelf
of small coloured product bottles and cans (red, orange, blue, purple, teal), a front door with a small
green awning, a tiny white sample drum beside the door. L1 simple lab with display window; L2 add a
rooftop vent and a small loading pallet of boxes at the front; L3 add a little rooftop testing tank
with yellow railing; L4 add a second display window and a short conveyor with boxed products at the
front; L5 add a small rooftop sign shape WITHOUT any text and warm window lights, slightly grander but
same footprint.
```

---

## 3. `tab_products.png` — ไอคอนปุ่ม "สินค้า"

แนบอ้างอิง: `assets/v4/ui/tab_build.png`, `tab_staff.png`, `tab_blend.png` (ให้เข้าชุดกับปุ่มอื่น)

```
A single pixel art UI tab icon in the exact style of the attached icons: same chunky pixel size, same
dark outline weight, same 3-tone shading and light from the top-left, cheerful Kairosoft mobile game
look. Subject: a red fuel drum (#E2483D) standing next to a small cardboard product box with a yellow
price tag, a tiny golden star sparkle above them, meaning "finished products ready to sell". Centred,
filling about 80% of a square 1024x1024 canvas, TRANSPARENT background. No text, no letters, no
numbers, no logos, no watermark, no border.
```

---

## 4. `bg_products.png` และ `bg_lab.png` — ภาพหัวเมนู

แนบอ้างอิง: `art-src/gpt/bg_blend.png` (ภาพหัวเมนูเดิม ให้โทนเดียวกัน)
หมายเหตุ: ในเกมเห็นแค่แถบบาง ๆ ด้านบน และมีสีกรมท่าทับ ไม่ต้องละเอียดมาก แต่ส่วน **กลางภาพแนวนอน**
ควรมีของที่อ่านออกเพราะคือส่วนที่โชว์

**bg_products.png**
```
Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright
cheerful flat colours with simple 3-tone shading, palette: steel grey #C9D3DC/#9EABB8/#73818F, cream
#FFF6E3, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink
#14110F. No text, no letters, no numbers, no logos, no watermark. Match the attached background's
soft low-detail look.
Portrait 1024x1536. A refinery finished-goods warehouse: rows of shelves with coloured product drums
and cans (red, orange, blue, purple, teal), a forklift carrying a pallet, a tanker truck backing up to
a loading door, warm light. Soft, low detail, works behind UI. Put the most recognisable objects in a
horizontal band across the middle of the image.
```

**bg_lab.png**
```
Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright
cheerful flat colours with simple 3-tone shading, palette: steel grey #C9D3DC/#9EABB8/#73818F, cream
#FFF6E3, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink
#14110F. No text, no letters, no numbers, no logos, no watermark. Match the attached background's
soft low-detail look.
Portrait 1024x1536. A two-part refinery laboratory: on the left a research bench with racks of small
glowing catalyst vials in many colours and a microscope; on the right a product development table with
sample bottles lined up next to blank product cards and a small scale. Soft, low detail, works behind
UI. Put the most recognisable objects in a horizontal band across the middle of the image.
```

---

## 5. `card_frames.png` — กรอบการ์ดตามเกรด (ป๊อปอัปเปิดการ์ด)

```
Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright
cheerful flat colours with simple 3-tone shading. No text, no letters, no numbers, no logos, no
watermark.
Layout EXACTLY 3 columns x 2 rows of equal cells on a 1536x1024 canvas (each cell 512x512),
TRANSPARENT background, no gridlines. In each cell, centred, ONE empty trading-card FRAME in portrait
proportion 2:3 (about 300x450 px), with a fully TRANSPARENT empty centre (only the border is drawn),
border about 24px thick, slightly rounded corners. Frames, left to right, top row then bottom row:
1 grade D: plain dull pink-grey stone border.
2 grade C: plain light grey steel border with four rivets.
3 grade B: light blue border with small silver corner caps.
4 grade A: mint green border with silver corners and two tiny sparkles.
5 grade S: polished gold border with gold corner ornaments and four sparkles.
6 grade SS: rainbow-gold border with ornate corners, star at the top centre and many sparkles around
  the outside of the frame.
```

---

## 6. `catalyst_icons.png` — ไอคอนสารเร่ง 20 ชนิด (ถ้ามีเวลา)

แนบอ้างอิง: `oil_icons.png` จากข้อ 1 (ให้ชุดเดียวกัน)

```
Cute pixel art game icons in the exact style of the attached icons: same chunky pixel size, outline
weight, 3-tone shading, light from the top-left. No text, no letters, no numbers, no logos, no
watermark.
Layout: EXACTLY 5 columns x 4 rows of equal SQUARE cells on a 1280x1024 canvas (each cell 256x256),
TRANSPARENT background, no gridlines. One centred icon per cell, about 70% of the cell, readable at
40px. Every icon is a small laboratory flask or vial holding the item described, each with a clearly
different colour and silhouette detail:
Row 1: 1 Octane booster: red flask with a white lightning bolt. 2 Anti-freeze: icy light-blue flask
with a snowflake. 3 Detergent: white flask with bubbles. 4 Bio-blend: green flask with a leaf.
5 Dye: flask with a rainbow swirl.
Row 2: 6 Fragrance: pink flask with a flower. 7 Cetane: orange flask with a small flame. 8 Antioxidant:
purple flask with a shield. 9 Lubricity: golden flask with a drop and two tiny gears. 10 Stabilizer:
grey flask with a balance scale.
Row 3: 11 Corrosion guard: rust-brown flask with a bolt and a shield. 12 Anti-foam: pale flask with a
popped bubble. 13 Cold flow: cyan flask with a wavy arrow. 14 Clean burn: teal flask with a tiny clean
flame and sparkle. 15 Polymer: magenta flask with a chain of beads.
Row 4: 16 Adhesive: yellow flask with a sticky drip. 17 Recycled blend: green flask with a recycle loop
of arrows (no letters). 18 Premium package: gold flask with a crown. 19 Catalyst: silver flask with
an atom symbol. 20 Nano blend: dark blue flask with glowing dots.
```

---

## 7. `feature_graphic.png` — ภาพหน้าร้าน Google Play

แนบอ้างอิง: `art-src/gpt/bg_title.png` (ภาพหน้าแรกเกม)

```
Cute pixel art in the style of Kairosoft mobile games, chunky pixels, clean 1px dark outlines, bright
cheerful flat colours with simple 3-tone shading, palette: steel grey #C9D3DC/#9EABB8/#73818F, cream
#FFF6E3, safety yellow #F2C230, orange #F08A24, red #E2483D, blue #3D8FE0, teal #2FB38E, dark ink
#14110F. No text, no letters, no numbers, no logos, no watermark. Match the attached title art.
Landscape 1536x768. A cheerful small coastal oil refinery at sunset seen from a high 3/4 angle:
silver distillation tower, storage tanks, orange pipes, a red tanker truck on the road, workers in
hard hats waving, sea and a cargo ship on the right. Keep the LEFT 40% calmer (sky and soft hills) so
the game title can be added there later. Important objects stay away from the outer 8% edges.
```

ชื่อเกมบนภาพนี้: อย่าให้ GPT เขียน (ตัวหนังสือมักเพี้ยน) ส่งภาพมา แล้ว Claude วางชื่อ "Refinery Story"
ด้วยฟอนต์ในเกมให้ได้

---

## หลังได้ภาพ

ส่ง PNG มาในแชทพร้อมชื่อไฟล์ เช่น "oil_icons.png" Claude จะ:
- ตัดตามช่อง ลบพื้นหลัง/จุดสีหลุด ย่อแบบพิกเซล (nearest-neighbour) และลดสีให้เข้ากับชุดเดิม
- ใส่เข้าเกม: ไอคอนน้ำมันบนการ์ดและตัวกรอง, ตึกแล็บสร้างสินค้าแทนรูปเปลี่ยนสีชั่วคราว, ไอคอนปุ่มสินค้า,
  ภาพหัวเมนู, กรอบการ์ดในป๊อปอัป, ไอคอนสารเร่งในแล็บ
- ถ่ายภาพก่อน/หลังให้ดู และรันเช็กทั้งหมดก่อน push
