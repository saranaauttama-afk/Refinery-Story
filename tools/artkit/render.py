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

def render(scene, w, h, out_path=None, steps=260, crop=True, points=None, tile_w=None, raw=False):
    fwd, right, up = _camera()
    TW_ = tile_w or S.TILE_W
    s = TW_ / np.sqrt(2)                      # px per world unit
    W = (w + h) * TW_ // 2                    # §2: image width = (w+h) x 32 master
    H = int(W * S.MAX_HEIGHT_RATIO)
    bottom = np.array([w, 0, h], float)            # nearest footprint corner = bottom of image
    sy_b = -(bottom @ up) * s
    px, py = np.meshgrid(np.arange(W) + 0.5, np.arange(H) + 0.5)
    a = (px - h * TW_ / 2) / s                # screen -> camera-plane coords
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
    lam = np.clip(n @ L, 0, 1)
    shadow = np.ones(a.shape)
    occl = np.ones(a.shape)
    Ph, nh = P[hit], n[hit]
    if getattr(S, 'SHADOWS', False) and len(Ph):
        # soft shadow: march from the surface toward the light, keep the closest miss
        res = np.ones(len(Ph)); tt = np.full(len(Ph), 0.03)
        base = Ph + nh * 0.01
        for _ in range(48):
            d, _m = _eval(scene, base + L * tt[:, None])
            res = np.minimum(res, S.SHADOW_SOFTNESS * d / tt)
            tt += np.clip(d, 0.02, 0.25)
            if (tt > 6).all():
                break
        shadow[hit] = 1 - S.SHADOW_STRENGTH * (1 - np.clip(res, 0, 1))
    if getattr(S, 'AO', False) and len(Ph):
        acc = np.zeros(len(Ph)); w8 = 1.0
        for i in range(1, 6):
            h_ = 0.04 * i
            d, _m = _eval(scene, Ph + nh * h_)
            acc += w8 * (h_ - d); w8 *= 0.6
        occl[hit] = np.clip(1 - S.AO_STRENGTH * 3 * acc, 0.35, 1)
    shade = (lam * shadow * S.DIFFUSE + S.AMBIENT) * occl + np.clip(n @ Hh, 0, 1) ** S.SPEC_POWER * S.SPECULAR * shadow

    bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16 - 0.5
    dither = np.tile(bayer, (H // 4 + 1, W // 4 + 1))[:H, :W] * (S.DITHER_AMOUNT if getattr(S, 'DITHER', False) and not raw else 0)
    img = np.zeros((H, W, 4), np.uint8)
    darkest = {}
    lightest = {}
    for i, name in enumerate(names):
        sel = hit & (mat == i)
        ramp = np.array(S.ACCENTS[name[7:]] if name.startswith('accent:') else S.RAMPS[name])
        sh = shade[sel]
        if getattr(S, 'METAL_BAND', 0) and name in S.METALLIC:
            nr = n[sel] @ right
            band = np.exp(-((nr + 0.38) / 0.13) ** 2) * (np.abs(n[sel][:, 1]) < 0.75)
            sh = sh + S.METAL_BAND * band * shadow[sel]
        k = np.clip(np.floor((1 - sh) * len(ramp) * 1.05 + dither[sel] + 0.5 * bool(getattr(S, 'DITHER', False))).astype(int), 0, len(ramp) - 1)
        img[sel, :3] = ramp[k]; img[sel, 3] = 255
        darkest[i] = ramp[-1]
        lightest[i] = ramp[0]

    edge = np.zeros_like(hit)
    if raw:
        return Image.fromarray(img, 'RGBA'), (s, H, sy_b, right, up)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        h2 = np.roll(np.roll(hit, dy, 0), dx, 1)
        m2 = np.roll(np.roll(mat, dy, 0), dx, 1)
        t2 = np.roll(np.roll(t, dy, 0), dx, 1)
        edge |= hit & (~h2 | ((m2 != mat) & (t2 < t - 0.06)) | (t2 < t - S.OUTLINE_DEPTH_BREAK))
    if getattr(S, 'SELOUT', False):
        sil = np.zeros_like(hit)
        for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            sil |= hit & ~np.roll(np.roll(hit, dy, 0), dx, 1)
        for _ in range(getattr(S, 'OUTLINE_PX', 1) - 1):      # thicken the silhouette inward
            grow = np.zeros_like(sil)
            for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
                grow |= np.roll(np.roll(sil, dy, 0), dx, 1)
            sil = sil | (grow & hit)
        inner = edge & ~sil
        if getattr(S, 'RIM', False):
            # light-facing rim: surface pixels whose up-left neighbour is empty or far behind
            ul_hit = np.roll(np.roll(hit, 1, 0), 1, 1)
            ul_t = np.roll(np.roll(t, 1, 0), 1, 1)
            rim = hit & ~sil & ~inner & (~ul_hit | (ul_t > t + S.OUTLINE_DEPTH_BREAK))
            for i, col in lightest.items():
                img[rim & (mat == i), :3] = col
        for i, col in darkest.items():
            img[inner & (mat == i), :3] = (np.array(col) * getattr(S, 'INNER_DARKEN', 0.8)).astype(np.uint8)
        img[sil, :3] = S.INK; img[sil, 3] = 255
    else:
        img[edge, :3] = S.INK; img[edge, 3] = 255

    im = Image.fromarray(img, 'RGBA')
    top = (max(0, im.getbbox()[1] - 2) if im.getbbox() else 0) if crop else 0
    bottom = (im.getbbox()[3] if im.getbbox() else H) if crop else H   # §2: bottom edge = diamond's bottom corner
    im = im.crop((0, top, W, bottom)).resize((W * S.PIXEL, (bottom - top) * S.PIXEL), Image.NEAREST)
    if out_path:
        im.save(out_path)
    if points is None:
        return im
    # world points -> final image pixels (same mapping as the rays, then crop/scale)
    coords = []
    for pt in points:
        pt = np.asarray(pt, float)
        px_ = (pt @ right) * s + h * TW_ / 2
        py_ = H - sy_b - (pt @ up) * s
        coords.append(((px_) * S.PIXEL, (py_ - top) * S.PIXEL))
    return im, coords

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


def palette_image():
    """The artkit palette (every ramp/accent colour + ink) as a PIL palette image."""
    cols = [tuple(c) for ramp in list(S.RAMPS.values()) + list(S.ACCENTS.values()) for c in ramp] + [S.INK]
    cols = list(dict.fromkeys(cols))[:256]
    flat = [v for c in cols for v in c]
    pimg = Image.new('P', (1, 1)); pimg.putpalette(flat + [0] * (768 - len(flat)))
    return pimg


def render_pixel(scene, w, h, out_path=None, ss=4, points=None):
    """Supersampled render: draw at ss x the in-game pixel grid, box-downsample to the
    game grid, snap to the artkit palette, 1 game-px ink silhouette, then x2 nearest to
    master size (same look as normalize.py, so code art and normalized AI art match)."""
    game_tile = S.MASTER_TILE_W // 2
    big, (s, H, sy_b, right, up) = render(scene, w, h, tile_w=game_tile * ss, raw=True)
    gw = (w + h) * game_tile // 2
    small = big.resize((gw, big.height // ss), Image.BOX)
    a = np.array(small)
    a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    rgb = Image.fromarray(a[..., :3], 'RGB').quantize(palette=palette_image(), dither=Image.Dither.NONE).convert('RGB')
    out = np.array(rgb.convert('RGBA')); out[..., 3] = a[..., 3]
    hit = out[..., 3] > 0
    sil = np.zeros_like(hit)
    for dy, dx in ((0, 1), (1, 0), (0, -1), (-1, 0)):
        sil |= hit & ~np.roll(np.roll(hit, dy, 0), dx, 1)
    out[sil, :3] = S.INK
    im = Image.fromarray(out, 'RGBA')
    bb = im.getbbox()
    top, bottom = max(0, bb[1] - 1), bb[3]
    im = im.crop((0, top, gw, bottom)).resize((gw * 2, (bottom - top) * 2), Image.NEAREST)
    if out_path:
        im.save(out_path)
    if points is None:
        return im
    coords = []
    for pt in points:
        pt = np.asarray(pt, float)
        px_ = ((pt @ right) * s + h * game_tile * ss / 2) / ss
        py_ = (H - sy_b - (pt @ up) * s) / ss
        coords.append((px_ * 2, (py_ - top) * 2))
    return im, coords
