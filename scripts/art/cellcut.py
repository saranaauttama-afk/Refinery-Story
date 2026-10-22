"""Cut a magenta sheet laid out on a regular grid: one object per cell.
usage: python3 cellcut.py sheet.png outdir cols rows name,name,...  ('_' skips a cell)"""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage
src, out, cols, rows, names = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5].split(',')
a = np.array(Image.open(src).convert('RGBA')).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
bg = (r > 150) & (b > 150) & (g < 120) & (np.abs(r - b) < 80)
# Magenta-tinted fringe pixels next to the background go too.
near = ndimage.binary_dilation(bg, np.ones((3, 3)))
fringe = near & (r > 120) & (b > 120) & (g < 140) & (r - g > 60) & (b - g > 60)
a[bg | fringe] = 0
m = a[..., 3] > 0
lab, k = ndimage.label(m, structure=np.ones((3, 3)))
idx_all = range(1, k + 1)
sizes = ndimage.sum(m, lab, idx_all)
cents = ndimage.center_of_mass(m, lab, idx_all)
H, W = m.shape
os.makedirs(out, exist_ok=True)
for idx, n in enumerate(names):
    if n == '_': continue
    cy, cx = divmod(idx, cols)
    y0, y1, x0, x1 = cy * H / rows, (cy + 1) * H / rows, cx * W / cols, (cx + 1) * W / cols
    mine = [i for i in range(k) if y0 <= cents[i][0] < y1 and x0 <= cents[i][1] < x1]
    if not mine: print('empty', n); continue
    big = max(sizes[i] for i in mine)
    keep = np.isin(lab, [i + 1 for i in mine if sizes[i] >= 0.01 * big and sizes[i] >= 12])
    p = a.copy(); p[~keep] = 0
    im = Image.fromarray(p.astype('uint8'))
    im.crop(im.getbbox()).save(f'{out}/{n}.png')
print('ok', out)
