"""Ground tile atlas for the V3 yard: python3 build_ground.py -> ../../assets/ground/ground_atlas.png

One row of 64x32 master diamonds (drawn at half size in game):
  0-3   grass: 0 light, 1 light + flowers, 2 dark, 3 dark + flowers (checkerboard)
  4-19  road, index 4 + mask  (mask bits: 1 = N(-y), 2 = E(+x), 4 = S(+y), 8 = W(-x) connected)
  20    parking lot
  21    sidewalk
Keep this layout in sync with src/components/v3/v3Ground.ts.
"""
import os
import numpy as np
from PIL import Image

TW, TH = 64, 32
N_CELLS = 22
rng = np.random.default_rng(7)

GRASS = [(126, 178, 74), (116, 168, 68), (136, 188, 82), (104, 152, 62), (150, 198, 96)]
ASPHALT = [(92, 96, 104), (84, 88, 96), (100, 104, 112)]
CURB = (196, 196, 188)
CURB_SHADE = (150, 150, 146)
LANE = (246, 206, 72)
PARK_LINE = (236, 236, 228)
WALK = [(206, 200, 186), (194, 188, 174)]
WALK_JOINT = (168, 162, 150)

px, py = np.meshgrid(np.arange(TW) + 0.5, np.arange(TH) + 0.5)
U = ((px - TW / 2) / (TW / 2) + py / (TH / 2)) / 2      # tile-local: u along +x (down-right)
Vv = (py / (TH / 2) - (px - TW / 2) / (TW / 2)) / 2     # v along +y (down-left)
INSIDE = (U >= 0) & (U <= 1) & (Vv >= 0) & (Vv <= 1)

def blank():
    return np.zeros((TH, TW, 4), np.uint8)

def put(img, mask, color):
    img[mask & INSIDE, :3] = color
    img[mask & INSIDE, 3] = 255

GRASS_DARK = [(114, 166, 66), (104, 156, 60), (124, 176, 74), (94, 142, 56), (138, 186, 88)]

def grass(variant):
    pal = GRASS if variant < 2 else GRASS_DARK
    flowers = variant in (1, 3)
    img = blank()
    put(img, INSIDE, pal[0])
    noise = rng.random((TH, TW))
    put(img, noise < 0.18, pal[1])
    put(img, (noise > 0.86) & (noise < 0.95), pal[2])
    # small tufts: a light pixel with a dark one under it
    for _ in range(7):
        x, y = rng.integers(8, TW - 8), rng.integers(4, TH - 4)
        if INSIDE[y, x] and INSIDE[y + 1, x]:
            img[y, x, :3] = pal[4]; img[y + 1, x, :3] = pal[3]
    if flowers:
        for _ in range(4):
            x, y = rng.integers(14, TW - 14), rng.integers(6, TH - 6)
            if INSIDE[y, x]:
                img[y, x, :3] = (250, 244, 220) if rng.random() < 0.5 else (250, 210, 90)
    return img

def road(mask):
    img = blank()
    put(img, INSIDE, ASPHALT[0])
    noise = rng.random((TH, TW))
    put(img, noise < 0.12, ASPHALT[1]); put(img, noise > 0.94, ASPHALT[2])
    n, e, s, w = bool(mask & 1), bool(mask & 2), bool(mask & 4), bool(mask & 8)
    c = 0.09
    # curbs on unconnected sides (shaded on the sides facing the viewer)
    if not n: put(img, Vv < c, CURB)
    if not w: put(img, U < c, CURB)
    if not e: put(img, U > 1 - c, CURB_SHADE)
    if not s: put(img, Vv > 1 - c, CURB_SHADE)
    # yellow dashed centre line toward each connected side
    lw = 0.035
    dash_u = (np.floor(U * 8) % 2) == 0
    dash_v = (np.floor(Vv * 8) % 2) == 0
    if w: put(img, (np.abs(Vv - 0.5) < lw) & (U < 0.5) & dash_u, LANE)
    if e: put(img, (np.abs(Vv - 0.5) < lw) & (U > 0.5) & dash_u, LANE)
    if n: put(img, (np.abs(U - 0.5) < lw) & (Vv < 0.5) & dash_v, LANE)
    if s: put(img, (np.abs(U - 0.5) < lw) & (Vv > 0.5) & dash_v, LANE)
    return img

def parking():
    img = road(15)
    put(img, INSIDE, ASPHALT[0])
    put(img, (rng.random((TH, TW)) < 0.12), ASPHALT[1])
    for k in (0.2, 0.5, 0.8):
        put(img, (np.abs(U - k) < 0.03) & (Vv > 0.15) & (Vv < 0.55), PARK_LINE)
    return img

def sidewalk():
    img = blank()
    put(img, INSIDE, WALK[0])
    put(img, ((np.floor(U * 3) + np.floor(Vv * 3)) % 2) == 0, WALK[1])
    put(img, (np.abs(U * 3 - np.round(U * 3)) < 0.06) | (np.abs(Vv * 3 - np.round(Vv * 3)) < 0.06), WALK_JOINT)
    return img

cells = [grass(i) for i in range(4)] + [road(m) for m in range(16)] + [parking(), sidewalk()]
assert len(cells) == N_CELLS
atlas = np.concatenate(cells, axis=1)
out = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'ground', 'ground_atlas.png')
os.makedirs(os.path.dirname(out), exist_ok=True)
Image.fromarray(atlas, 'RGBA').save(out)
print('saved', out, atlas.shape)
