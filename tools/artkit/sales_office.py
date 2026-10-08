"""Sales Office — safety orange; friendly office, awning, glass front (ART_ASSET_LIST §3). 2x2, 2x2 (busier), 3x2."""
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (2, 2), 3: (3, 2)}
ACC = 'support'
Y = K.PAD_H


def office(p, x0, z0, x1, z1, h, floors=1):
    out = B.block(p, x0, z0, x1, z1, h, mat='wall', trim=ACC)
    # glass shop front on the lit face, door in the middle
    out += [(K.box(p, K.V((x0 + x1) / 2, Y + 0.24, z1 + 0.006), ((x1 - x0) / 2 - 0.08, 0.17, 0.012)), 'glass')]
    out += [(K.umin([K.box(p, K.V(xx, Y + 0.24, z1 + 0.012), (0.014, 0.17, 0.014))
                     for xx in (x0 + 0.08, (x0 + x1) / 2 - 0.1, (x0 + x1) / 2 + 0.1, x1 - 0.08)]), 'steel_dk')]
    fh = (h - 0.5) / max(1, floors - 1) if floors > 1 else 0
    for f in range(1, floors):
        y0 = Y + 0.45 + (f - 1) * fh
        out += B.windows_z(p, x0, x1, z1, y0 + fh * 0.3, y0 + fh * 0.8, max(2, int((x1 - x0) / 0.3)), w=0.15)
    out += B.windows_x(p, z0, z1, x1, Y + 0.18, Y + 0.36, 2, w=0.18)
    if floors > 1:
        out += B.windows_x(p, z0, z1, x1, Y + 0.5 + fh * 0.3, Y + 0.5 + fh * 0.8, 2, w=0.15)
    return out


def sign(p, x, y, z, w=0.4):
    """Blank rooftop sign board (no text per spec) on two posts."""
    return [(K.box(p, K.V(x, y + 0.2, z), (w / 2, 0.1, 0.02)), 'accent:' + ACC),
            (K.box(p, K.V(x, y + 0.2, z + 0.021), (w / 2 - 0.04, 0.06, 0.005)), 'cab'),
            (K.umin([K.capsule(p, K.V(x + s * w * 0.35, y, z), K.V(x + s * w * 0.35, y + 0.1, z), 0.015) for s in (-1, 1)]), 'steel_dk')]


def planter(p, x, z):
    return [(K.rbox(p, K.V(x, Y + 0.06, z), (0.1, 0.06, 0.1), 0.015), 'concrete'),
            (K.sphere(p, K.V(x, Y + 0.17, z), 0.1), 'lamp')]


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2)
            + office(p, 0.3, 0.3, 1.6, 1.35, 0.55)
            + B.awning_z(p, 0.4, 1.5, 1.35, Y + 0.48, depth=0.22)
            + B.ac_unit(p, 0.7, Y + 0.59, 0.7)
            + planter(p, 1.75, 1.55))


def lv2(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2)
            + office(p, 0.3, 0.3, 1.6, 1.35, 0.95, floors=2)
            + B.awning_z(p, 0.4, 1.5, 1.35, Y + 0.48, depth=0.22)
            + sign(p, 0.95, Y + 0.99, 0.75)
            + B.ac_unit(p, 1.35, Y + 0.99, 0.6)
            + planter(p, 1.75, 1.55) + planter(p, 1.75, 0.5))


def lv3(p):
    return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2)
            + office(p, 0.3, 0.3, 2.3, 1.35, 1.3, floors=3)
            + B.awning_z(p, 0.4, 2.2, 1.35, Y + 0.48, depth=0.22)
            + sign(p, 1.3, Y + 1.34, 0.8, w=0.7)
            + B.ac_unit(p, 0.6, Y + 1.34, 0.6) + B.antenna(p, 2.0, Y + 1.34, 0.55, h=0.4)
            + planter(p, 2.6, 1.55) + planter(p, 2.6, 0.5))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [], 2: [], 3: [('lamp', (2.0, Y + 1.34 + 0.4, 0.55))]}
