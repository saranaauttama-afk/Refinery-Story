"""Shared storage-tank layouts (ART_ASSET_LIST §1 'Storage': big clean tanks, a ladder or ring
platform, one or two short outlet pipes). Footprints 2x2, 3x2, 3x3 (data.ts TANK)."""
import numpy as np
import parts as K

FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
LOW = K.PAD_H + 0.42
FRONT = np.pi / 4            # facing the camera
LEFT_FRONT = 1.25            # visible lit side (toward +z)

def inlet(p, cx, cz, r, angle=1.95, y=LOW, reach=0.3):
    n = np.array([np.cos(angle), 0, np.sin(angle)])
    w = np.array([cx, 0, cz]) + n * r
    e = w + n * reach
    return (K.flange(p, w + n * 0.03 + [0, y, 0], n) +
            K.pipe(p, [w + [0, y, 0], e + [0, y, 0], e + [0, K.PAD_H, 0]], clamps=[e + [0, K.PAD_H + 0.12, 0]]))

def link(p, a, b, y=LOW - 0.12):
    return K.pipe(p, [(a[0], y, a[1]), (b[0], y, b[1])], r=0.07)

def dressed_tank(p, cx, cz, r, height, accent, plate=True, **kw):
    """Tank + weld seams, name plate, a side nozzle and roof vents."""
    y0 = K.PAD_H
    top = y0 + height
    n_plate = np.array([np.cos(LEFT_FRONT), 0, np.sin(LEFT_FRONT)])
    n_noz = np.array([np.cos(0.35), 0, np.sin(0.35)])
    out = K.tank(p, cx, cz, r, height, accent, **kw)
    out += K.weld_lines(p, cx, cz, r, y0 + 0.16, top - 0.02, count=8)
    if plate:
        out += K.plate(p, np.array([cx, y0 + height * 0.36, cz]) + n_plate * (r + 0.012), n_plate, w=0.26 * r / 0.68 + 0.08, h=0.13, accent=accent)
    out += K.nozzle(p, np.array([cx, y0 + 0.28, cz]) + n_noz * r, n_noz, r=0.045, length=0.1)
    vents = [K.cyl_y(p, K.V(cx + r * 0.45 * np.cos(a), top + 0.08, cz + r * 0.45 * np.sin(a)), 0.035, 0.05) for a in (0.2, 3.9)]
    out.append((K.umin(vents), 'steel_dk'))
    return out

def levels(accent):
    def lv1(p):
        return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2, extinguisher=(1.75, 1.45))
                + dressed_tank(p, 1.0, 1.0, 0.68, 1.15, accent) + inlet(p, 1.0, 1.0, 0.68))

    def lv2(p):
        return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2, extinguisher=(2.8, 1.5))
                + dressed_tank(p, 1.0, 1.0, 0.68, 1.2, accent)
                + dressed_tank(p, 2.32, 1.0, 0.5, 0.85, accent, plate=False, rail_posts=10, ladder_angle=0.9, manhole_angle=3.6)
                + link(p, (1.68, 1.0), (1.82, 1.0))
                + inlet(p, 1.0, 1.0, 0.68))

    def lv3(p):
        return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
                + dressed_tank(p, 1.0, 1.0, 0.7, 1.3, accent, seams=3)
                + dressed_tank(p, 2.3, 0.95, 0.52, 0.95, accent, plate=False, rail_posts=10, ladder_angle=-0.2, manhole_angle=3.6)
                + dressed_tank(p, 1.25, 2.3, 0.5, 0.8, accent, rail_posts=10, ladder_angle=0.6, manhole_angle=4.2)
                + link(p, (1.7, 1.0), (1.78, 0.97))
                + K.pipe(p, [(2.3, LOW - 0.1, 1.47), (2.3, LOW - 0.1, 2.3), (1.75, LOW - 0.1, 2.3)], r=0.07)
                + [(K.rbox(p, K.V(2.35, K.PAD_H + 0.13, 2.3), (0.2, 0.13, 0.16), 0.03), 'steel_dk')]   # pump
                + inlet(p, 1.25, 2.3, 0.5, angle=2.6, y=K.PAD_H + 0.32, reach=0.22))

    return {1: lv1, 2: lv2, 3: lv3}

def _rail_top(cx, cz, r, height, a=0.05):
    return (cx + (r - 0.01) * np.cos(a), K.PAD_H + height + 0.17 + 0.05, cz + (r - 0.01) * np.sin(a))

# Effects the game animates on top of the sprite (world points → image fractions at build time).
EMITTERS = {
    1: [('lamp', _rail_top(1.0, 1.0, 0.68, 1.15))],
    2: [('lamp', _rail_top(1.0, 1.0, 0.68, 1.2))],
    3: [('lamp', _rail_top(1.0, 1.0, 0.7, 1.3))],
}
