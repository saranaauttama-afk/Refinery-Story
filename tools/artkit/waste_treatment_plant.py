"""Waste Treatment Plant — olive; settling basins and pumps (ART_ASSET_LIST §3). 2x2, 3x2, 3x3."""
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
ACC = 'olive'
Y = K.PAD_H


def pumphouse(p, x0, z0, x1, z1):
    return (B.block(p, x0, z0, x1, z1, 0.45, trim=ACC)
            + B.door_z(p, (x0 + x1) / 2, z1, w=0.2, h=0.3) + B.windows_x(p, z0, z1, x1, Y + 0.2, Y + 0.33, 1, w=0.14))


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2, extinguisher=(1.8, 0.4))
            + B.basin(p, 0.85, 0.85, 0.62)
            + pumphouse(p, 1.35, 1.35, 1.8, 1.8)
            + K.pipe(p, [(1.45, Y + 0.18, 0.85), (1.6, Y + 0.18, 0.85), (1.6, Y + 0.18, 1.35)], r=0.05, mat='accent:' + ACC))


def lv2(p):
    return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2, extinguisher=(2.8, 1.5))
            + B.basin(p, 0.8, 0.9, 0.6) + B.basin(p, 2.15, 0.8, 0.55, water='sludge')
            + pumphouse(p, 1.55, 1.35, 2.15, 1.8)
            + K.pipe(p, [(1.4, Y + 0.18, 0.9), (1.6, Y + 0.18, 0.9), (1.6, Y + 0.18, 1.35)], r=0.05, mat='accent:' + ACC)
            + K.pump(p, 2.55, 1.55))


def lv3(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + B.basin(p, 0.8, 0.8, 0.58) + B.basin(p, 2.15, 0.8, 0.55, water='sludge') + B.basin(p, 0.8, 2.15, 0.55)
            + pumphouse(p, 1.6, 1.6, 2.6, 2.4) + B.ac_unit(p, 2.1, Y + 0.45, 2.0)
            + K.pipe(p, [(1.38, Y + 0.18, 0.8), (1.6, Y + 0.18, 0.8), (1.6, Y + 0.18, 1.6)], r=0.05, mat='accent:' + ACC)
            + K.pipe(p, [(1.35, Y + 0.18, 2.15), (1.6, Y + 0.18, 2.15)], r=0.05, mat='accent:' + ACC)
            + K.pump(p, 2.5, 2.7))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('lamp', (1.575, Y + 0.55, 1.575))], 2: [('lamp', (1.85, Y + 0.55, 1.575))], 3: [('lamp', (2.5, Y + 0.55, 1.7))]}
