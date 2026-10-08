"""Quick look: python3 preview.py out.png name[:lv] name[:lv] ...  -> one sheet on grass green, 1x scale."""
import importlib, sys
from PIL import Image, ImageDraw
import render

out, specs = sys.argv[1], sys.argv[2:]
tiles = []
for spec in specs:
    name, _, lv = spec.partition(':')
    mod = importlib.import_module(name)
    for l in ([int(lv)] if lv else sorted(mod.LEVELS)):
        w, h = mod.FOOTPRINT[l]
        tiles.append((f'{name} {l}', render.render(mod.LEVELS[l], w, h)))
pad = 10
W = sum(t[1].width for t in tiles) + pad * (len(tiles) + 1)
H = max(t[1].height for t in tiles) + pad * 2 + 14
sheet = Image.new('RGBA', (W, H), (86, 134, 72, 255)); d = ImageDraw.Draw(sheet)
x = pad
for label, im in tiles:
    sheet.alpha_composite(im, (x, H - pad - im.height))
    d.text((x, 2), label, fill=(255, 255, 255))
    x += im.width + pad
sheet.save(out)
print(out, sheet.size)
