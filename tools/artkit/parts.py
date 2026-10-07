"""Reusable SDF primitives and building parts. Each part returns a list of (dist, material)."""
import numpy as np

V = lambda *a: np.array(a, float)

# ---------------- primitives ----------------
def box(p, c, b):
    q = np.abs(p - c) - b
    return np.linalg.norm(np.maximum(q, 0), axis=-1) + np.minimum(q.max(-1), 0)

def rbox(p, c, b, r):
    return box(p, c, np.asarray(b, float) - r) - r

def cyl_y(p, c, r, hh):
    q = p - c
    d = np.stack([np.hypot(q[..., 0], q[..., 2]) - r, np.abs(q[..., 1]) - hh], -1)
    return np.minimum(d.max(-1), 0) + np.linalg.norm(np.maximum(d, 0), axis=-1)

def capsule(p, a, b, r):
    pa, ba = p - a, b - a
    h = np.clip((pa * ba).sum(-1) / (ba * ba).sum(), 0, 1)
    return np.linalg.norm(pa - ba * h[..., None], axis=-1) - r

def torus_y(p, c, R, r):
    q = p - c
    return np.hypot(np.hypot(q[..., 0], q[..., 2]) - R, q[..., 1]) - r

def disc(p, c, normal, r, half_t):
    q = p - c
    ax = q @ normal
    rad = np.linalg.norm(q - ax[..., None] * normal, axis=-1)
    return np.maximum(np.abs(ax) - half_t, rad - r)

def umin(ds):
    return np.minimum.reduce(ds) if len(ds) > 1 else ds[0]

# ---------------- parts ----------------
PAD_H = 0.12

def pad(p, w, h):
    """Thin dark concrete pad exactly filling the w x h footprint, one rim block per tile edge."""
    slab = rbox(p, V(w / 2, PAD_H / 2, h / 2), (w / 2, PAD_H / 2, h / 2), 0.02)
    rim = []
    for i in range(w):
        for z in (0.07, h - 0.07):
            rim.append(rbox(p, V(i + 0.5, PAD_H + 0.03, z), (0.44, 0.05, 0.065), 0.02))
    for j in range(h):
        for x in (0.07, w - 0.07):
            rim.append(rbox(p, V(x, PAD_H + 0.03, j + 0.5), (0.065, 0.05, 0.44), 0.02))
    return [(slab, 'pad'), (umin(rim), 'concrete')]

def tank(p, cx, cz, r, height, accent='crude', seams=2, rail_posts=12,
         ladder_angle=0.05, manhole_angle=2.6, rail=True, ladder=True):
    """Vertical storage tank on the pad: pedestals, wall, seams, accent band, cone roof,
    manhole, ring railing, side ladder."""
    y0 = PAD_H
    top = y0 + height
    rail_y = top + 0.17
    C = V(cx, 0, cz)
    at = lambda a, rr, y: V(cx + rr * np.cos(a), y, cz + rr * np.sin(a))
    out = []
    out.append((umin([rbox(p, at(a, r + 0.03, y0 + 0.06), (0.06, 0.09, 0.06), 0.015)
                      for a in np.linspace(0, 2 * np.pi, 8, endpoint=False) + 0.4]), 'concrete'))
    out.append((cyl_y(p, C + V(0, y0 + height / 2, 0), r, height / 2), 'steel'))
    out.append((umin([cyl_y(p, C + V(0, y0 + 0.1 + k * (height - 0.1) / (seams + 1), 0), r + 0.012, 0.016)
                      for k in range(1, seams + 1)]), 'steel_dk'))
    out.append((cyl_y(p, C + V(0, y0 + 0.07, 0), r + 0.015, 0.07), 'accent:' + accent))
    q = p - (C + V(0, top, 0))
    rr = np.hypot(q[..., 0], q[..., 2])
    cone = np.maximum(q[..., 1] - 0.09 * (1 - rr / r), np.maximum(rr - r, -q[..., 1]))
    out.append((cone * 0.8, 'roof'))
    out.append((torus_y(p, C + V(0, top, 0), r, 0.025), 'steel'))
    mh = at(manhole_angle, r * 0.48, top + 0.08)
    out.append((cyl_y(p, mh, min(0.13, r * 0.2), 0.04) - 0.01, 'steel'))
    out.append((cyl_y(p, mh + V(0, 0.06, 0), min(0.09, r * 0.14), 0.03) - 0.01, 'roof'))
    safety = []
    if rail:
        safety += [torus_y(p, C + V(0, rail_y, 0), r - 0.01, 0.03),
                   torus_y(p, C + V(0, rail_y - 0.08, 0), r - 0.01, 0.02)]
        safety += [capsule(p, at(a, r - 0.01, top), at(a, r - 0.01, rail_y), 0.024)
                   for a in np.linspace(0, 2 * np.pi, rail_posts, endpoint=False)]
    if ladder:
        n = V(np.cos(ladder_angle), 0, np.sin(ladder_angle)); tv = V(-np.sin(ladder_angle), 0, np.cos(ladder_angle))
        lb = C + n * (r + 0.09)
        safety += [capsule(p, lb + tv * s * 0.1 + V(0, y0, 0), lb + tv * s * 0.1 + V(0, rail_y + 0.05, 0), 0.028)
                   for s in (-1, 1)]
        safety += [capsule(p, lb - tv * 0.1 + V(0, y, 0), lb + tv * 0.1 + V(0, y, 0), 0.02)
                   for y in np.arange(y0 + 0.12, rail_y, 0.11)]
    if safety:
        out.append((umin(safety), 'safety'))
    return out

def pipe(p, points, r=0.09, mat='pipe', clamps=(), clamp_mat='safety'):
    """Pipe through a list of world points (elbows at each), optional clamp rings at given points."""
    segs = [capsule(p, V(*a), V(*b), r) for a, b in zip(points[:-1], points[1:])]
    out = [(umin(segs), mat)]
    if clamps:
        out.append((umin([cyl_y(p, V(*c), r + 0.02, 0.035) for c in clamps]), clamp_mat))
    return out

def flange(p, center, normal, r=0.15):
    n = np.asarray(normal, float); n /= np.linalg.norm(n)
    return [(disc(p, V(*center), n, r, 0.03), 'pipe')]
