# Proper isometric cylinders as init images (2x): circle footprint → 2:1 ellipse.
from PIL import Image, ImageDraw
K='#14110F'
def tank(name, n, Wc, Hc, rx, body, band, accent, pad=True):
    im = Image.new('RGBA', (Wc, Hc), (0,0,0,0)); d = ImageDraw.Draw(im)
    tipy = Hc - 16; cy = tipy - 8*n; cx = Wc//2
    hw = 8*n*2  # diamond half width (2x)
    if pad: d.polygon([(cx,cy-hw//2),(cx+hw,cy),(cx,cy+hw//2),(cx-hw,cy)], fill='#D8D2C4', outline=K)
    ry = rx//2; top = cy - body
    d.ellipse([cx-rx, cy-ry, cx+rx, cy+ry], fill='#73818F', outline=K)        # base
    d.rectangle([cx-rx, top, cx+rx, cy], fill='#9EABB8')                     # side
    d.rectangle([cx-rx, top, cx-rx//3, cy], fill='#C9D3DC')                  # lit left
    d.line([(cx-rx, top), (cx-rx, cy)], fill=K, width=2); d.line([(cx+rx, top), (cx+rx, cy)], fill=K, width=2)
    by = top + body*0.45
    d.rectangle([cx-rx, by, cx+rx, by+band], fill=accent)
    d.ellipse([cx-rx, top-ry, cx+rx, top+ry], fill='#E4EAF0', outline=K)    # roof
    d.rectangle([cx+rx//2, top+4, cx+rx//2+4, cy+ry-4], fill='#F2C230', outline=K)  # ladder
    im.save(f'init/{name}.png'); print(name, im.size)
tank('crudeTank', 4, 128, 128, 44, 36, 7, '#3C3C46')
tank('tank', 2, 64, 96, 22, 34, 5, '#E2483D', pad=False)
