"""Jet Fuel Plant — sky blue; clean, high-tech: hydrotreater reactor, column, fin-fan cooler (ART_ASSET_LIST §3). 3x3, 4x4, 5x4."""
import parts as K
import process as P

FOOTPRINT = {1: (3, 3), 2: (4, 4), 3: (5, 4)}
ACC = 'jet'
Y = K.PAD_H


def lv1(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.6))
            + P.reactor(p, 0.9, 0.9, 0.42, 1.35, ACC)
            + P.column(p, 2.1, 0.85, 0.3, 1.9, ACC, platforms=(0.9, 1.5), ladder_angle=1.2)
            + P.air_cooler(p, 0.55, 1.8, 1.95, 2.35, 0.55, ACC)
            + P.pipes(p, [[(0.9, Y + 1.9, 0.9), (0.9, Y + 2.05, 0.9), (1.5, Y + 2.05, 0.9), (1.5, Y + 0.95, 2.05)],
                          [(2.1, Y + 0.4, 1.15), (2.1, Y + 0.4, 2.1), (1.95, Y + 0.4, 2.1)]], ACC)
            + K.pump(p, 2.45, 2.0) + K.control_box(p, 2.6, 1.3))


def lv2(p):
    return (K.pad(p, 4, 4) + K.pad_details(p, 4, 4, extinguisher=(3.75, 3.2))
            + P.reactor(p, 0.9, 0.9, 0.45, 1.6, ACC)
            + P.reactor(p, 2.0, 0.85, 0.38, 1.2, ACC)
            + P.column(p, 3.2, 0.95, 0.34, 2.4, ACC, platforms=(1.0, 1.9), ladder_angle=1.2)
            + P.air_cooler(p, 0.55, 2.0, 2.6, 2.6, 0.65, ACC)
            + P.pipes(p, [[(0.9, Y + 2.2, 0.9), (0.9, Y + 2.35, 0.9), (2.0, Y + 2.35, 0.9), (2.0, Y + 1.85, 0.85)],
                          [(2.0, Y + 0.45, 1.23), (2.0, Y + 0.45, 1.5), (3.2, Y + 0.45, 1.5), (3.2, Y + 0.45, 1.29)],
                          [(1.6, Y + 1.15, 2.3), (1.6, Y + 1.15, 1.5)]], ACC)
            + K.drum(p, (2.9, Y + 0.38, 2.4), (2.9, Y + 0.38, 3.5), 0.26)
            + K.pump(p, 1.3, 3.3) + K.control_box(p, 3.55, 1.8))


def lv3(p):
    return (K.pad(p, 5, 4) + K.pad_details(p, 5, 4, extinguisher=(4.75, 3.3))
            + P.reactor(p, 0.9, 0.9, 0.46, 1.8, ACC)
            + P.reactor(p, 2.05, 0.85, 0.4, 1.4, ACC)
            + P.column(p, 3.25, 0.95, 0.36, 2.7, ACC, platforms=(1.0, 1.9, 2.5), ladder_angle=1.2)
            + P.column(p, 4.3, 1.05, 0.28, 1.8, ACC, platforms=(1.0,), ladder_angle=1.0)
            + P.air_cooler(p, 0.55, 2.05, 3.2, 2.65, 0.7, ACC)
            + P.pipes(p, [[(0.9, Y + 2.4, 0.9), (0.9, Y + 2.55, 0.9), (2.05, Y + 2.55, 0.9), (2.05, Y + 2.1, 0.85)],
                          [(2.05, Y + 0.45, 1.25), (2.05, Y + 0.45, 1.6), (4.3, Y + 0.45, 1.6), (4.3, Y + 0.45, 1.33)],
                          [(3.25, Y + 3.05, 0.95), (3.25, Y + 3.2, 0.95), (3.75, Y + 3.2, 0.95), (3.75, Y + 1.3, 0.95), (3.75, Y + 1.3, 2.35)]], ACC)
            + K.drum(p, (3.5, Y + 0.38, 2.55), (4.6, Y + 0.38, 2.55), 0.26)
            + K.pump(p, 1.3, 3.35) + K.pump(p, 3.8, 3.4) + K.control_box(p, 4.55, 3.3))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('lamp', P.column_top(2.1, 0.85, 0.3, 1.9))],
            2: [('smoke', P.column_top(3.2, 0.95, 0.34, 2.4, 0.2)), ('lamp', P.column_top(3.2, 0.95, 0.34, 2.4))],
            3: [('smoke', P.column_top(3.25, 0.95, 0.36, 2.7, 0.2)), ('lamp', P.column_top(3.25, 0.95, 0.36, 2.7)), ('lamp', P.column_top(4.3, 1.05, 0.28, 1.8))]}
