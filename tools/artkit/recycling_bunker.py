"""Recycling Bunker — lime green; concrete bunker bays with bales, bins (ART_ASSET_LIST §3). 2x2, 3x2, 3x3."""
import numpy as np
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
ACC = 'lime'
Y = K.PAD_H


def bay(p, x0, z0, x1, z1, h=0.42):
    """U-shaped concrete bay (open toward +z, the camera) with a pile of bales inside."""
    outer = K.box(p, K.V((x0 + x1) / 2, Y + h / 2, (z0 + z1) / 2), ((x1 - x0) / 2, h / 2, (z1 - z0) / 2))
    inner = K.box(p, K.V((x0 + x1) / 2, Y + h / 2 + 0.06, (z0 + z1) / 2 + 0.08), ((x1 - x0) / 2 - 0.07, h / 2 + 0.02, (z1 - z0) / 2))
    walls = np.maximum(outer, -inner)
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    bales = [K.rbox(p, K.V(cx + dx, Y + 0.12 + dy, cz + dz), (0.13, 0.1, 0.12), 0.03)
             for dx, dy, dz in ((-0.15, 0, -0.05), (0.15, 0, -0.05), (0.0, 0.2, -0.08), (-0.1, 0, 0.22), (0.18, 0, 0.2))]
    stripe = K.box(p, K.V(cx, Y + h - 0.04, z1), ((x1 - x0) / 2, 0.035, 0.012))
    return [(walls, 'concrete'), (K.umin(bales), 'heap'), (stripe, 'accent:' + ACC)]


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2, extinguisher=(1.75, 1.45))
            + bay(p, 0.25, 0.25, 1.35, 1.25)
            + B.bin_(p, 1.6, 0.6, ACC) + B.bin_(p, 1.6, 1.0, ACC) + B.bin_(p, 0.6, 1.6, 'support', s=0.13))


def lv2(p):
    return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2, extinguisher=(2.8, 1.5))
            + bay(p, 0.25, 0.25, 1.3, 1.25) + bay(p, 1.35, 0.25, 2.4, 1.25)
            + B.bin_(p, 2.65, 0.6, ACC) + B.bin_(p, 2.65, 1.0, ACC)
            + B.bin_(p, 0.6, 1.6, 'support', s=0.13) + B.bin_(p, 1.0, 1.6, ACC, s=0.13))


def lv3(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + bay(p, 0.25, 0.25, 1.3, 1.25) + bay(p, 1.35, 0.25, 2.4, 1.25)
            + B.gable(p, 0.3, 1.6, 1.5, 2.6, 0.55, rise=0.25, roof='accent:' + ACC)
            + B.door_z(p, 0.9, 2.6, w=0.5, h=0.42, stripes=True)
            + B.conveyor(p, (1.6, Y + 0.25, 2.1), (2.2, Y + 0.75, 1.3))
            + B.bin_(p, 2.15, 2.2, ACC) + B.bin_(p, 2.55, 2.2, ACC) + B.bin_(p, 2.6, 0.6, 'support', s=0.13))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [], 2: [], 3: [('lamp', (1.5, Y + 0.6, 2.62))]}
