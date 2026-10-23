# Formula Lab

**อัปเดต (product cards):** แล็บแยกเป็น 2 อาคาร — **แล็บสร้างสูตร** (`lab`) วิจัยสารเร่ง และ
**แล็บสร้างสินค้า** (`productLab`) พัฒนาการ์ดสินค้า 3 ขั้น (ฐาน/การ์ด → ช่องสารเร่ง → ดูเกรดที่คาด)
อัปเกรดแล้วการ์ดเดิมเลื่อนเกรด (key เดิม สถานีผลิตต่อได้เลย) ตั้งชื่อการ์ดเองได้ สถานีผสมเลือก
"การ์ดสินค้า" แทนการเลือกฐาน + สูตร มีป๊อปอัปเปิดการ์ดเมื่อพัฒนาเสร็จ และป้ายเกรดบนสถานีในแผนที่
เซฟเก่า: แล็บที่เคยสลับเป็นโหมดผสมสูตรจะกลายเป็นแล็บสร้างสินค้า

**สรุปภาษาไทย:** ห้องแล็บแต่ละห้องเลือกหน้าที่ได้ 2 แบบ — **แล็บสารเร่ง** วิจัยได้สารเร่งแบบสุ่ม
(เกรด D–SS + จำนวน) และ **แล็บผสมสูตร** เอาน้ำมันฐานหรือสูตรเดิม + สารเร่ง 1–3 ช่องมาผสมเป็น
**สูตรถาวร** สถานีผสมเลือกสูตรแล้วผลิตตามเกรดของสูตร โดยใช้สารเร่งอย่างละ 1 หน่วยต่อ 6 ล็อต
(สารหมด = กลับไปผลิตเกรด C ธรรมดา) เพดานเกรดคือ **สารเร่งที่ดีที่สุดที่ใส่** และสารเกรดสูงได้ตามปี
(A ปี 3, S ปี 6, SS ปี 9) อัปเกรดแล็บ/นักเคมี/ประสบการณ์ช่วยเพิ่มโอกาส

Replaces the old system where every lot's grade came from a stats score and labs only
unlocked base × additive pairs (first SS around year 4).

## Loop

1. **Catalyst Lab** (a `lab` building with role `catalyst`, the default). A job takes 2 weeks
   (shorter at higher lab level) and costs $3k + RD (60 + 20 per year). It returns one random
   unlocked additive as a catalyst with a grade and 4 + 1/level units, plus a little fame.
   - Odds by effective level: lab level + Chem of assigned staff / 200 + 0.2 per year.
   - Ceiling by year: B in Y1–2, A Y3–5, S Y6–8, SS from Y9.
   - 4% of jobs leave a lab note: a good catalyst pair or a secret formula hint.
2. **Formula Lab** (role `formula`, switch in the lab sheet while idle). A mix takes 1 week
   and $2k. Start from the plain base (grade D) or a known formula; add catalysts from stock
   (2 units each). Slots: 1 (Y1–2), 2 (Y3–5), 3 (Y6+); a formula holds at most 3 catalysts.
   - Grade = average of inputs + base×catalyst fit (`data/compatibility.ts`) + catalyst pair
     synergy (`data/formulaLab.ts`) + secret bonus + luck (±0.6, nudged up by lab level).
   - **Cap = best catalyst used.** A formula can't ratchet itself past its catalysts.
   - Never worse: a known formula keeps its better grade; the catalysts are spent anyway.
   - Pity: after 4 mixes that don't beat their best input, the next gets +1.
   - Catalysts are spent and the grade rolled when the mix starts; it shows when it ends.
3. **Blend stations** pick plain (grade C) or a formula of that base. Every 6 lots use one unit
   of each of the formula's catalysts (lowest grade first); if one is out, lots are plain C.

Secret formulas (8, one per base) get +1 grade, ×1.3 price and 50 fame, but don't lift the
cap. Grade prices/fame: D 0.8/0, C 1/1, B 1.2/3, A 1.5/4, S 2/7, SS 2.7/10. Buyers want C
(starter) or B; contracts want C (Y1–2), B (Y3–5), A (Y6+). Award score still comes from lot
stats, scaled by grade.

Old saves load with plain recipes and an empty Formula Lab (old pair research is dropped).

## Pacing (bot, 20 seeds × 16 years, `npm run v4:check`)

First lot of A / S / SS: median year 2.1 / 5.2 / 8.3 (i.e. early in years 3, 6 and 9).
Rank 5 in years 3–4, rank 10 in years 12–15, monthly profit Y1 $47k, Y5 $245k, Y10 $2.7M.
The bot builds a second lab early, upgrades labs when cash is spare, and mixes greedily;
real players will be slower. `node --import tsx scripts/v4/balance-summary.ts` prints all
of this without assertions; `scripts/v4/formula-lab-sim.ts` checks the lab rules alone.

## Not done

- Product Lab art is the Lab sprite hue-shifted (`scripts/art/build-product-lab.ts`, chained
  after `npm run art:v5`); a proper sprite can replace it later.
- Fame and price tables were retuned to keep rank pacing; needs a human playtest.
