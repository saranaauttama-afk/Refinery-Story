"""Lubricant Plant — gold/amber; blending vessels with agitators, barrels (ART_ASSET_LIST §3). 3x3, 4x4, 5x4."""
import parts as K
import process as P

FOOTPRINT = {1: (3, 3), 2: (4, 4), 3: (5, 4)}
ACC = 'lubricant'
Y = K.PAD_H


def lv1(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 1.25))
            + P.blender_vessel(p, 0.85, 0.85, 0.4, 0.9, ACC)
            + P.blender_vessel(p, 2.0, 0.85, 0.36, 0.75, ACC)
            + K.frame(p, 0.5, 1.55, 2.4, 1.85, 0.75)
            + P.pipes(p, [[(0.85, Y + 0.5, 1.25), (0.85, Y + 0.85, 1.7), (2.0, Y + 0.85, 1.7), (2.0, Y + 0.5, 1.21)]], ACC)
            + P.barrels(p, 0.8, 2.4, ACC) + P.barrels(p, 1.4, 2.45, ACC, n=2)
            + K.pump(p, 2.3, 2.4) + K.control_box(p, 2.6, 1.0)
            + K.valve(p, (1.4, Y + 0.85, 1.7), axis='x'))


def lv2(p):
    return (K.pad(p, 4, 4) + K.pad_details(p, 4, 4, extinguisher=(3.75, 3.2))
            + P.blender_vessel(p, 0.85, 0.85, 0.42, 1.0, ACC)
            + P.blender_vessel(p, 2.0, 0.85, 0.42, 1.0, ACC)
            + P.blender_vessel(p, 3.15, 0.9, 0.36, 0.8, ACC)
            + K.frame(p, 0.5, 1.6, 3.5, 1.95, 0.85)
            + P.pipes(p, [[(0.85, Y + 0.5, 1.27), (0.85, Y + 0.95, 1.78), (3.15, Y + 0.95, 1.78), (3.15, Y + 0.5, 1.26)],
                          [(2.0, Y + 0.5, 1.27), (2.0, Y + 0.95, 1.78)]], ACC)
            + K.drum(p, (0.9, Y + 0.38, 2.75), (2.3, Y + 0.38, 2.75), 0.28)
            + P.barrels(p, 2.95, 2.6, ACC) + P.barrels(p, 3.4, 3.1, ACC) + P.barrels(p, 2.85, 3.25, ACC, n=2)
            + K.pump(p, 1.2, 3.4) + K.control_box(p, 3.55, 1.6))


def lv3(p):
    return (K.pad(p, 5, 4) + K.pad_details(p, 5, 4, extinguisher=(4.75, 3.3))
            + P.blender_vessel(p, 0.85, 0.85, 0.42, 1.1, ACC)
            + P.blender_vessel(p, 2.0, 0.85, 0.42, 1.1, ACC)
            + P.blender_vessel(p, 3.15, 0.85, 0.42, 1.1, ACC)
            + P.column(p, 4.25, 1.0, 0.36, 2.0, ACC, platforms=(0.9, 1.6), ladder_angle=0.9)
            + K.frame(p, 0.5, 1.6, 3.6, 1.95, 0.95)
            + P.pipes(p, [[(0.85, Y + 0.5, 1.27), (0.85, Y + 1.05, 1.78), (4.25, Y + 1.05, 1.78), (4.25, Y + 1.05, 1.37)],
                          [(2.0, Y + 0.5, 1.27), (2.0, Y + 1.05, 1.78)], [(3.15, Y + 0.5, 1.27), (3.15, Y + 1.05, 1.78)],
                          [(4.25, Y + 2.4, 1.0), (4.25, Y + 2.55, 1.0), (4.65, Y + 2.55, 1.0), (4.65, Y + 0.4, 1.0), (4.65, Y + 0.4, 2.2)]], ACC)
            + K.drum(p, (0.9, Y + 0.4, 2.8), (2.6, Y + 0.4, 2.8), 0.3)
            + P.barrels(p, 3.0, 2.6, ACC) + P.barrels(p, 3.5, 2.6, ACC) + P.barrels(p, 3.25, 3.15, ACC) + P.barrels(p, 3.9, 3.2, ACC, n=2)
            + K.pump(p, 1.3, 3.45) + K.control_box(p, 4.5, 2.6))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('smoke', P.blender_top(0.85, 0.85, 0.4, 0.9))],
            2: [('smoke', P.blender_top(2.0, 0.85, 0.42, 1.0))],
            3: [('smoke', P.column_top(4.25, 1.0, 0.36, 2.0, 0.2)), ('lamp', P.column_top(4.25, 1.0, 0.36, 2.0))]}
