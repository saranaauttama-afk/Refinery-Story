"""Petrochemical Tank — purple band, pressure spheres (ART_ASSET_LIST §3). Footprints 2x2, 3x2, 3x3."""
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
ACC = 'petrochemical'
Y = K.PAD_H


def _link(p, pts):
    return K.pipe(p, pts, r=0.06) + K.elbows(p, pts, 0.06)


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2, extinguisher=(1.75, 1.45))
            + B.sphere_tank(p, 0.95, 0.95, 0.62, ACC)
            + _link(p, [(0.95, Y + 0.3, 1.5), (0.95, Y + 0.3, 1.8), (1.45, Y + 0.3, 1.8), (1.45, Y + 0.05, 1.8)])
            + K.valve(p, (1.2, Y + 0.3, 1.8), axis='x'))


def lv2(p):
    return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2, extinguisher=(2.8, 1.5))
            + B.sphere_tank(p, 0.9, 0.95, 0.6, ACC)
            + B.sphere_tank(p, 2.2, 0.85, 0.48, ACC, legs=5)
            + _link(p, [(0.9, Y + 0.3, 1.5), (0.9, Y + 0.3, 1.75), (2.2, Y + 0.3, 1.75), (2.2, Y + 0.3, 1.3)])
            + K.pump(p, 1.55, 1.55) + K.valve(p, (1.95, Y + 0.3, 1.75), axis='x'))


def lv3(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + B.sphere_tank(p, 0.9, 0.9, 0.6, ACC)
            + B.sphere_tank(p, 2.25, 0.85, 0.46, ACC, legs=5)
            + B.sphere_tank(p, 0.95, 2.25, 0.46, ACC, legs=5)
            + _link(p, [(0.95, Y + 0.3, 1.75), (1.75, Y + 0.3, 1.75), (2.25, Y + 0.3, 1.75), (2.25, Y + 0.3, 1.3)])
            + _link(p, [(1.4, Y + 0.3, 0.9), (1.75, Y + 0.3, 0.9), (1.75, Y + 0.3, 1.75)])
            + K.pump(p, 2.2, 2.3) + K.control_box(p, 2.55, 2.1))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
_top = lambda x, z, r: (x, Y + r + 0.35 + r + 0.16, z)
EMITTERS = {1: [('lamp', _top(0.95, 0.95, 0.62))], 2: [('lamp', _top(0.9, 0.95, 0.6))], 3: [('lamp', _top(0.9, 0.9, 0.6))]}
