"""python3 compare_quality.py -> out/quality_compare.png (v1 vs v2 renderer, lv1 starters)."""
import importlib, os
from PIL import Image, ImageDraw
import style as S, render
os.makedirs('out', exist_ok=True)
items = [('crude_tank', 1), ('gasoline_tank', 2), ('distillation_unit', 1)]
rows = []
for v2 in (False, True):
    S.SHADOWS = S.AO = S.DITHER = S.SELOUT = v2
    row = []
    for name, lv in items:
        mod = importlib.import_module(name)
        w, h = mod.FOOTPRINT[lv]
        row.append(render.render(mod.LEVELS[lv], w, h))
    rows.append(row)
cw = max(im.width for r in rows for im in r) + 16; ch = max(im.height for r in rows for im in r) + 24
sheet = Image.new('RGBA', (cw * len(items), ch * 2), (235, 232, 224, 255)); d = ImageDraw.Draw(sheet)
for y, (label, row) in enumerate(zip(('v1 (now)', 'v2: shadows + AO + dither + sel-out'), rows)):
    d.text((6, y * ch + 4), label, fill=(150, 40, 40))
    for x, im in enumerate(row):
        sheet.alpha_composite(im, (x * cw + (cw - im.width) // 2, y * ch + ch - im.height - 2))
sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST).save('out/quality_compare.png')
print(sheet.size)
