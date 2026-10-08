"""One side-by-side sheet: Blender render vs yard-v2 AI sprite (both through normalize.py)
vs the current artkit SDF sprite, all on the same 3x3 footprint diamond at 2x preview zoom.

    python3 tools/artkit/blender/compare_du.py <blender_raw.png> <out.png>
"""
import os, sys
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import normalize as N  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
w, h = 3, 3
raw, out = sys.argv[1], sys.argv[2]
ai = os.path.join(ROOT, 'assets/plants/yard-v2/distillation_unit_lv1.png')
sdf = os.path.join(ROOT, 'assets/plants/starter/distillation_unit_lv1.png')

smalls = [N.to_game_grid(Image.open(p), (w + h) * 16) for p in (raw, ai)]
pal = N.shared_palette(smalls, 48)                 # one shared palette, like a real set
norm = []
for s in smalls:
    g, _ = N.fit(N.outline(N.quantize(s, pal)), w, h)
    norm.append(g.resize((g.width * 2, g.height * 2), Image.NEAREST))
norm.append(Image.open(sdf).convert('RGBA'))
labels = ['Blender + normalize', 'yard-v2 AI + normalize', 'artkit SDF (now)']

Z = 2                                               # preview zoom
W = (w + h) * 32
Hmax = max(im.height for im in norm)
sheet = Image.new('RGBA', (len(norm) * (W * Z + 24) + 24, Hmax * Z + 60), (72, 120, 64, 255))
d = ImageDraw.Draw(sheet)
for i, im in enumerate(norm):
    x0 = 24 + i * (W * Z + 24); y0 = 36 + (Hmax - im.height) * Z
    # footprint diamond under the sprite (grass-tile check of anchor)
    by = 36 + Hmax * Z
    d.polygon([(x0, by - w * 16 * Z), (x0 + h * 32 * Z, by - (w + h) * 16 * Z), (x0 + W * Z, by - h * 16 * Z), (x0 + w * 32 * Z, by)],
              outline=(255, 255, 255, 160))
    sheet.alpha_composite(im.resize((im.width * Z, im.height * Z), Image.NEAREST), (x0, y0))
    d.text((x0, 10), labels[i], fill=(255, 255, 255, 255))
sheet.save(out)
print('->', out, [im.size for im in norm])
