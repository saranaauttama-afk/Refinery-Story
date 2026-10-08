"""Laboratory — teal; white lab block, AC units, dish/antenna at Lv3 (ART_ASSET_LIST §3). 2x2, 3x3, 3x3."""
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (3, 3), 3: (3, 3)}
ACC = 'teal'
Y = K.PAD_H


def lab(p, x0, z0, x1, z1, h, floors=1):
    out = B.block(p, x0, z0, x1, z1, h, trim=ACC)
    fh = (h - 0.12) / floors
    for f in range(floors):
        y0 = Y + 0.1 + f * fh
        out += B.windows_z(p, x0 + 0.05, x1 - 0.05, z1, y0 + fh * 0.35, y0 + fh * 0.8, max(2, int((x1 - x0) / 0.32)), w=0.16)
        out += B.windows_x(p, z0 + 0.05, z1 - 0.05, x1, y0 + fh * 0.35, y0 + fh * 0.8, max(2, int((z1 - z0) / 0.32)), w=0.16)
    out += [(K.box(p, K.V(x1 + 0.012, Y + 0.06, (z0 + z1) / 2), (0.012, 0.05, (z1 - z0) / 2)), 'accent:' + ACC)]
    return out


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2)
            + lab(p, 0.3, 0.3, 1.55, 1.5, 0.75)
            + B.door_z(p, 0.65, 1.5, w=0.2, h=0.32, mat='glass')
            + B.ac_unit(p, 0.7, Y + 0.79, 0.7) + B.antenna(p, 1.3, Y + 0.79, 0.55, h=0.35))


def lv2(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + lab(p, 0.3, 0.3, 2.0, 1.7, 1.15, floors=2)
            + lab(p, 2.05, 0.6, 2.65, 1.7, 0.6)
            + B.door_z(p, 0.7, 1.7, w=0.24, h=0.34, mat='glass')
            + B.ac_unit(p, 0.7, Y + 1.19, 0.7) + B.ac_unit(p, 1.2, Y + 1.19, 0.7)
            + B.antenna(p, 1.75, Y + 1.19, 0.55, h=0.45)
            + B.bin_(p, 2.5, 2.3, ACC, s=0.12))


def lv3(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + lab(p, 0.3, 0.3, 2.0, 1.75, 1.5, floors=3)
            + lab(p, 2.05, 0.6, 2.7, 1.75, 0.75)
            + B.door_z(p, 0.7, 1.75, w=0.24, h=0.34, mat='glass')
            + B.awning_z(p, 0.45, 0.95, 1.75, Y + 0.44, depth=0.2, accent=ACC)
            + B.dish(p, 1.2, Y + 1.54, 0.85, r=0.3)
            + B.ac_unit(p, 0.6, Y + 1.54, 0.6) + B.ac_unit(p, 2.35, Y + 0.79, 1.0)
            + B.antenna(p, 1.8, Y + 1.54, 0.5, h=0.5))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('lamp', (1.3, Y + 0.79 + 0.35, 0.55))],
            2: [('lamp', (1.75, Y + 1.19 + 0.45, 0.55))],
            3: [('lamp', (1.8, Y + 1.54 + 0.5, 0.5))]}
