"""Renderer: SDF raymarch -> toon shade with style ramps -> ink outline -> PNG at spec size.
A building is a function  scene(p) -> list[(distance_array, material_name)]
with the footprint occupying x in [0, w], z in [0, h] (1 unit = 1 tile edge), y up."""
import numpy as np
from PIL import Image
import style as S

def _camera():
    fwd = -np.array([np.cos(S.ELEV) * np.sin(S.YAW), np.sin(S.ELEV), np.cos(S.ELEV) * np.cos(S.YAW)])
    right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right)
    up = np.cross(right, fwd)
    return fwd, right, up

def render(scene, w, h, out_path=None, steps=260, crop=True):
    fwd, right, up = _camera()
    s = S.TILE_W / np.sqrt(2)                      # px per world unit
    W = (w + h) * S.TILE_W // 2                    # §2: image width = (w+h) x 32 master
    H = int(W * S.MAX_HEIGHT_RATIO)
    bottom = np.array([w, 0, h], float)            # nearest footprint corner = bottom of image
    sy_b = -(bottom @ up) * s
    px, py = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
    a = (px - h * S.TILE_W / 2) / s                # screen -> camera-plane coords
    b = -(py - H + sy_b) / s
    orig = a[..., None] * right + b[..., None] * up - fwd * 30
    t = np.zeros(a.shape); hit = np.zeros(a.shape, bool)
    for _ in range(steps):
        d, _ = _eval(scene, orig + fwd * t[..., None])
        hit |= d < 1e-3
        t = np.where(hit, t, t + d * 0.9)
        if (hit | (t > 80)).all():
            break
    hit &= t < 80
    P = orig + fwd * t[..., None]
    _, mat = _eval(scene, P)
    names = _names(scene, P)
    e = 1e-3
    n = np.stack([_eval(scene, P + o)[0] - _eval(scene, P - o)[0] for o in np.eye(3) * e], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True) + 1e-9

    L = S.LIGHT_SCREEN[0] * right + S.LIGHT_SCREEN[1] * up - S.LIGHT_SCREEN[2] * fwd
    L /= np.linalg.norm(L)
    Hh = (L - fwd) / np.linalg.norm(L - fwd)
    shade = np.clip(n @ L, 0, 1) * S.DIFFUSE + S.AMBIENT + np.clip(n @ Hh, 0, 1) ** S.SPEC_POWER * S.SPECULAR

    img = np.zeros((H, W, 4), np.uint8)
    for i, name in enumerate(names):
        sel = hit & (mat == i)
        ramp = np.array(S.ACCENTS[name[7:]] if name.startswith('accent:') else S.RAMPS[name])
        k = np.clip(((1 - shade[sel]) * len(ramp) * 1.05).astype(int), 0, len(ramp) - 1)
        img[sel, :3] = ramp[k]; img[sel, 3] = 255

    edge = np.zeros_like(hit)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        h2 = np.roll(np.roll(hit, dy, 0), dx, 1)
        m2 = np.roll(np.roll(mat, dy, 0), dx, 1)
        t2 = np.roll(np.roll(t, dy, 0), dx, 1)
        edge |= hit & (~h2 | ((m2 != mat) & (t2 < t - 0.06)) | (t2 < t - S.OUTLINE_DEPTH_BREAK))
    img[edge, :3] = S.INK; img[edge, 3] = 255

    im = Image.fromarray(img, 'RGBA')
    top = (max(0, im.getbbox()[1] - 2) if im.getbbox() else 0) if crop else 0
    im = im.crop((0, top, W, H)).resize((W * S.PIXEL, (H - top) * S.PIXEL), Image.NEAREST)
    if out_path:
        im.save(out_path)
    return im

# scenes return [(dist, name), ...]; materials are indexed by first appearance
def _names(scene, P):
    seen = []
    for _, nm in scene(P[:1, :1]):
        if nm not in seen:
            seen.append(nm)
    return seen

def _eval(scene, p):
    parts = scene(p)
    names = []
    for _, nm in parts:
        if nm not in names:
            names.append(nm)
    d = np.stack([x[0] for x in parts], -1)
    ids = np.array([names.index(x[1]) for x in parts])
    return d.min(-1), ids[d.argmin(-1)]
