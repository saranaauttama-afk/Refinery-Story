"""Normalize AI-generated building sprites into one consistent pixel-art set.

    python3 normalize.py <src_dir> <out_dir> [--colors 48]

For every <name>_lv<N>.png in src_dir (footprints from FOOTPRINTS below):
  1. hard alpha  — no semi-transparent halo (alpha >= 128 -> opaque)
  2. game-pixel grid — box-downsample to in-game size (1/2), the size it is drawn at
  3. shared palette — one palette (median cut over the whole set) for every sprite, no dither
  4. outline — 1 game-pixel black silhouette (2 px at master), same ink as artkit
  5. fit to spec — width (w+h)x32, pad's bottom tip moved onto x = w*32, nearest-neighbour x2
  6. report — size / height ratio / tip position per sprite
Writes the normalized PNGs and a report.json; the source files are never modified.
"""
import json, os, re, sys
import numpy as np
from PIL import Image

import style as S

FOOTPRINTS = {
    'distillation_unit': [(3, 3), (4, 4), (5, 4)], 'lubricant_plant': [(3, 3), (4, 4), (5, 4)],
    'jet_fuel_plant': [(3, 3), (4, 4), (5, 4)], 'petrochemical_plant': [(3, 3), (4, 4), (5, 4)],
    'polymer_plant': [(3, 3), (4, 4), (5, 4)],
    'crude_tank': [(2, 2), (3, 2), (3, 3)], 'gasoline_tank': [(2, 2), (3, 2), (3, 3)],
    'lubricant_tank': [(2, 2), (3, 2), (3, 3)], 'jet_fuel_tank': [(2, 2), (3, 2), (3, 3)],
    'petrochemical_tank': [(2, 2), (3, 2), (3, 3)], 'pellet_silo': [(2, 2), (3, 2), (3, 3)],
    'recycling_bunker': [(2, 2), (3, 2), (3, 3)], 'waste_treatment_plant': [(2, 2), (3, 2), (3, 3)],
    'maintenance_workshop': [(2, 2), (3, 2), (3, 3)],
    'laboratory': [(2, 2), (3, 3), (3, 3)], 'power_plant': [(3, 3), (3, 3), (4, 3)],
    'sales_office': [(2, 2), (2, 2), (3, 2)],
}
ALPHA_CUT = 128


def to_game_grid(im, target_w):
    """Hard alpha, then downsample so the pad spans exactly target_w game pixels."""
    a = np.array(im.convert('RGBA'))
    a[..., 3] = np.where(a[..., 3] >= ALPHA_CUT, 255, 0)
    im = Image.fromarray(a, 'RGBA').crop(Image.fromarray(a, 'RGBA').getbbox())
    k = target_w / im.width
    small = im.resize((target_w, max(1, round(im.height * k))), Image.BOX)
    s = np.array(small)
    s[..., 3] = np.where(s[..., 3] >= ALPHA_CUT, 255, 0)
    return Image.fromarray(s, 'RGBA')


def shared_palette(images, colors):
    """One palette for the whole set: median cut over all opaque pixels together."""
    px = np.concatenate([np.array(im)[..., :3][np.array(im)[..., 3] > 0] for im in images])
    strip = Image.fromarray(px.reshape(1, -1, 3).astype(np.uint8), 'RGB')
    pal = strip.quantize(colors=colors - 1, method=Image.Quantize.MEDIANCUT)
    flat = pal.getpalette()[: (colors - 1) * 3] + list(S.INK)       # ink is always in the palette
    pimg = Image.new('P', (1, 1)); pimg.putpalette(flat + [0] * (768 - len(flat)))
    return pimg


def quantize(im, palimg):
    rgb = im.convert('RGB').quantize(palette=palimg, dither=Image.Dither.NONE).convert('RGB')
    out = np.array(rgb.convert('RGBA')); out[..., 3] = np.array(im)[..., 3]
    return Image.fromarray(out, 'RGBA')


def outline(im):
    a = np.array(im); hit = a[..., 3] > 0
    sil = np.zeros_like(hit)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        sil |= hit & ~np.roll(np.roll(hit, dy, 0), dx, 1)
    a[sil, :3] = S.INK
    return Image.fromarray(a, 'RGBA')


def fit(im, w, h):
    """Place on a (w+h)*16-wide game canvas with the pad's bottom tip at x = w*16, bottom-aligned."""
    W = (w + h) * 16
    a = np.array(im); hit = a[..., 3] > 0
    bottom = np.nonzero(hit.any(1))[0].max()
    xs = np.nonzero(hit[bottom])[0]
    tip = (xs.min() + xs.max()) / 2
    dx = int(round(w * 16 - tip))
    canvas = Image.new('RGBA', (W, im.height), (0, 0, 0, 0))
    canvas.alpha_composite(im, (dx, 0)) if dx >= 0 else canvas.alpha_composite(im.crop((-dx, 0, im.width, im.height)), (0, 0))
    return canvas.crop((0, 0, W, im.height)), dx


def main():
    src, dst = sys.argv[1], sys.argv[2]
    colors = int(sys.argv[sys.argv.index('--colors') + 1]) if '--colors' in sys.argv else 48
    os.makedirs(dst, exist_ok=True)
    jobs = []
    for f in sorted(os.listdir(src)):
        m = re.match(r'(.+)_lv(\d)\.png$', f)
        if not m or m.group(1) not in FOOTPRINTS:
            continue
        w, h = FOOTPRINTS[m.group(1)][int(m.group(2)) - 1]
        jobs.append((f, w, h, to_game_grid(Image.open(os.path.join(src, f)), (w + h) * 16)))
    pal = shared_palette([j[3] for j in jobs], colors)
    report = {}
    for f, w, h, small in jobs:
        g = outline(quantize(small, pal))
        g, shift = fit(g, w, h)
        big = g.resize((g.width * 2, g.height * 2), Image.NEAREST)
        big.save(os.path.join(dst, f))
        report[f] = {'footprint': [w, h], 'size': list(big.size), 'height_ratio': round(big.height / big.width, 3),
                     'tip_shift_game_px': shift, 'over_height_limit': big.height > S.MAX_HEIGHT_RATIO * big.width,
                     'colors': len(set(map(tuple, np.array(big)[..., :3][np.array(big)[..., 3] > 0])))}
    json.dump(report, open(os.path.join(dst, 'report.json'), 'w'), indent=1)
    print(f'{len(jobs)} sprites -> {dst}  (palette {colors})')
    bad = [k for k, v in report.items() if v['over_height_limit'] or abs(v['tip_shift_game_px']) > 6]
    print('needs a look:', bad if bad else 'none')


if __name__ == '__main__':
    main()
