"""Pellet Silo — green tall silos (ART_ASSET_LIST §3). Footprints 2x2, 3x2, 3x3."""
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
ACC = 'polymer'
Y = K.PAD_H


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2, extinguisher=(1.75, 1.45))
            + B.silo(p, 0.95, 0.95, 0.5, 1.35, ACC)
            + B.bin_(p, 1.55, 1.55, 'polymer', s=0.12)
            + K.pipe(p, [(0.95, Y + 0.5, 0.95), (0.95, Y + 0.25, 1.55), (0.95, Y + 0.25, 1.75)], r=0.05))


def lv2(p):
    return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2, extinguisher=(2.8, 1.5))
            + B.silo(p, 0.85, 0.95, 0.5, 1.45, ACC)
            + B.silo(p, 2.05, 0.9, 0.46, 1.25, ACC)
            + B.conveyor(p, (0.85, K.PAD_H + 2.45, 0.95), (2.05, K.PAD_H + 2.2, 0.9))
            + K.pipe(p, [(0.85, Y + 0.5, 0.95), (0.85, Y + 0.25, 1.6), (2.05, Y + 0.25, 1.6), (2.05, Y + 0.5, 0.9)], r=0.05))


def lv3(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + B.silo(p, 0.85, 0.85, 0.5, 1.6, ACC)
            + B.silo(p, 2.1, 0.85, 0.46, 1.4, ACC)
            + B.silo(p, 0.9, 2.1, 0.46, 1.3, ACC)
            + B.conveyor(p, (0.85, Y + 2.6, 0.85), (2.1, Y + 2.35, 0.85))
            + B.conveyor(p, (0.85, Y + 2.6, 0.85), (0.9, Y + 2.25, 2.1))
            + B.bin_(p, 2.2, 2.2, 'polymer', s=0.14) + K.control_box(p, 2.6, 1.85))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('lamp', (0.95, Y + 0.45 + 0.35 + 1.35 + 0.16, 0.95))],
            2: [('lamp', (0.85, Y + 0.45 + 0.35 + 1.45 + 0.16, 0.95))],
            3: [('lamp', (0.85, Y + 0.45 + 0.35 + 1.6 + 0.16, 0.85))]}
