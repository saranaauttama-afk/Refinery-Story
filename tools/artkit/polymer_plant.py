"""Polymer Plant — green; extruders, cooling belt, small silos, conveyor (ART_ASSET_LIST §3). 3x3, 4x4, 5x4."""
import parts as K
import bparts as B
import process as P

FOOTPRINT = {1: (3, 3), 2: (4, 4), 3: (5, 4)}
ACC = 'polymer'
Y = K.PAD_H


def lv1(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + B.silo(p, 0.8, 0.8, 0.42, 1.1, ACC)
            + P.reactor(p, 1.95, 0.85, 0.36, 1.0, ACC)
            + P.extruder(p, 0.45, 1.9, 1.85, ACC)
            + P.pellet_belt(p, 1.95, 2.7, 1.85)
            + B.conveyor(p, (0.8, Y + 2.1, 0.8), (0.65, Y + 0.65, 1.85))
            + P.pipes(p, [[(1.95, Y + 0.4, 1.2), (1.95, Y + 0.4, 1.5), (1.4, Y + 0.4, 1.5), (1.4, Y + 0.45, 1.7)]], ACC)
            + B.bin_(p, 2.5, 2.5, ACC, s=0.13) + K.control_box(p, 0.7, 2.55))


def lv2(p):
    return (K.pad(p, 4, 4) + K.pad_details(p, 4, 4, extinguisher=(3.75, 3.2))
            + B.silo(p, 0.8, 0.8, 0.42, 1.3, ACC) + B.silo(p, 1.8, 0.8, 0.42, 1.15, ACC)
            + P.reactor(p, 3.0, 0.9, 0.42, 1.3, ACC)
            + P.extruder(p, 0.45, 2.2, 2.0, ACC) + P.pellet_belt(p, 2.25, 3.3, 2.0)
            + P.extruder(p, 0.45, 2.2, 2.85, ACC) + P.pellet_belt(p, 2.25, 3.3, 2.85)
            + B.conveyor(p, (0.8, Y + 2.3, 0.8), (0.65, Y + 0.65, 2.0))
            + B.conveyor(p, (1.8, Y + 2.15, 0.8), (0.65, Y + 0.65, 2.85))
            + P.pipes(p, [[(3.0, Y + 0.4, 1.32), (3.0, Y + 0.4, 1.6), (1.5, Y + 0.4, 1.6), (1.5, Y + 0.45, 1.85)]], ACC)
            + B.bin_(p, 3.55, 2.0, ACC, s=0.13) + B.bin_(p, 3.55, 2.85, ACC, s=0.13))


def lv3(p):
    return (K.pad(p, 5, 4) + K.pad_details(p, 5, 4, extinguisher=(4.75, 3.3))
            + B.silo(p, 0.8, 0.8, 0.42, 1.4, ACC) + B.silo(p, 1.8, 0.8, 0.42, 1.25, ACC) + B.silo(p, 2.8, 0.8, 0.42, 1.1, ACC)
            + P.reactor(p, 4.0, 0.95, 0.44, 1.6, ACC)
            + P.extruder(p, 0.45, 2.4, 2.0, ACC) + P.pellet_belt(p, 2.45, 3.7, 2.0)
            + P.extruder(p, 0.45, 2.4, 2.85, ACC) + P.pellet_belt(p, 2.45, 3.7, 2.85)
            + B.conveyor(p, (0.8, Y + 2.4, 0.8), (0.65, Y + 0.65, 2.0))
            + B.conveyor(p, (1.8, Y + 2.25, 0.8), (0.65, Y + 0.65, 2.85))
            + P.pipes(p, [[(4.0, Y + 0.45, 1.38), (4.0, Y + 0.45, 1.6), (1.5, Y + 0.45, 1.6), (1.5, Y + 0.45, 1.85)]], ACC)
            + B.bin_(p, 4.0, 2.0, ACC, s=0.14) + B.bin_(p, 4.0, 2.85, ACC, s=0.14) + K.control_box(p, 4.55, 2.4))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('smoke', (1.95, Y + 1.6, 0.85))], 2: [('smoke', (3.0, Y + 1.95, 0.9))], 3: [('smoke', (4.0, Y + 2.3, 0.95))]}
