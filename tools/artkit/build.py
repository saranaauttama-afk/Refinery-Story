"""python3 build.py crude_tank  -> out/crude_tank_lv1..3.png + out/crude_tank_sheet.png"""
import sys, importlib, os, time
from PIL import Image, ImageDraw
import render
import os.path
TPL = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'Docs', 'templates')

name = sys.argv[1] if len(sys.argv) > 1 else 'crude_tank'
mod = importlib.import_module(name)
os.makedirs('out', exist_ok=True)
ims = []
effects = {}
for lv, fn in mod.LEVELS.items():
    w, h = mod.FOOTPRINT[lv]
    t0 = time.time()
    emit = getattr(mod, 'EMITTERS', {}).get(lv, [])
    im, coords = render.render(fn, w, h, f'out/{name}_lv{lv}.png', points=[pt for _, pt in emit])
    effects[f'{name}_lv{lv}'] = {'size': list(im.size), 'emitters': [
        {'kind': kind, 'x': round(x / im.width, 4), 'y': round(y / im.height, 4)} for (kind, _), (x, y) in zip(emit, coords)]}
    print(f'lv{lv} {w}x{h} -> {im.size} ({time.time()-t0:.1f}s)')
    ims.append((lv, w, h, im))
# contact sheet with the footprint diamond drawn faintly behind (spec check)
pad = 24
W = sum(i[3].width for i in ims) + pad * (len(ims) + 1)
H = max(i[3].height for i in ims) + pad * 2 + 20
sheet = Image.new('RGBA', (W, H), (235, 232, 224, 255)); d = ImageDraw.Draw(sheet)
x = pad
for lv, w, h, im in ims:
    y = H - pad - 20 - im.height
    bx, by = x, y + im.height        # bottom-left of image
    # overlay the game's own footprint template (assets/Docs/templates) to prove alignment
    tpl = Image.open(f'{TPL}/footprint_{w}x{h}.png').convert('RGBA')
    sheet.alpha_composite(tpl, (bx, by - tpl.height))
    sheet.alpha_composite(im, (x, y))
    d.text((x, H - pad - 12), f'lv{lv}  {w}x{h}  {im.width}x{im.height}', fill=(40, 40, 40))
    x += im.width + pad
sheet.save(f'out/{name}_sheet.png')
import json
json.dump(effects, open(f'out/{name}_effects.json', 'w'), indent=1)
