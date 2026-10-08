"""Petrochemical Plant — purple; reactor spheres, cracker column, flare stack (ART_ASSET_LIST §3). 3x3, 4x4, 5x4."""
import parts as K
import bparts as B
import process as P

FOOTPRINT = {1: (3, 3), 2: (4, 4), 3: (5, 4)}
ACC = 'petrochemical'
Y = K.PAD_H


def flare(p, x, z, h):
    """Thin flare stack with guy-wire-free lattice look: pole, tip, accent bands."""
    return ([(K.capsule(p, K.V(x, Y, z), K.V(x, Y + h, z), 0.06), 'steel_dk'),
             (K.cyl_y(p, K.V(x, Y + h + 0.06, z), 0.09, 0.06), 'steel'),
             (K.umin([K.cyl_y(p, K.V(x, Y + h - 0.2 - k * 0.25, z), 0.075, 0.04) for k in range(2)]), 'accent:' + ACC)])


def lv1(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.6))
            + P.column(p, 0.85, 0.9, 0.38, 2.2, ACC, platforms=(0.9, 1.7))
            + B.sphere_tank(p, 2.0, 1.0, 0.45, ACC, legs=5)
            + P.pipes(p, [[(0.85, Y + 2.55, 0.9), (0.85, Y + 2.72, 0.9), (1.5, Y + 2.72, 0.9), (1.5, Y + 1.3, 1.0), (1.55, Y + 1.3, 1.0)],
                          [(1.2, Y + 0.4, 1.1), (1.2, Y + 0.4, 2.1), (2.0, Y + 0.4, 2.1), (2.0, Y + 0.4, 1.5)]], ACC)
            + K.pump(p, 0.8, 2.3) + K.pump(p, 1.4, 2.4) + K.control_box(p, 2.6, 2.0))


def lv2(p):
    return (K.pad(p, 4, 4) + K.pad_details(p, 4, 4, extinguisher=(3.75, 3.2))
            + P.column(p, 0.9, 0.95, 0.42, 2.6, ACC, platforms=(0.9, 1.8, 2.4))
            + B.sphere_tank(p, 2.1, 1.0, 0.48, ACC, legs=5)
            + B.sphere_tank(p, 3.2, 1.0, 0.42, ACC, legs=5)
            + flare(p, 3.55, 2.9, 2.6)
            + P.pipes(p, [[(0.9, Y + 3.0, 0.95), (0.9, Y + 3.2, 0.95), (1.55, Y + 3.2, 0.95), (1.55, Y + 1.35, 1.0), (1.62, Y + 1.35, 1.0)],
                          [(1.3, Y + 0.4, 1.2), (1.3, Y + 0.4, 2.2), (3.2, Y + 0.4, 2.2), (3.2, Y + 0.4, 1.5)],
                          [(2.1, Y + 0.4, 2.2), (2.1, Y + 0.4, 1.55)]], ACC)
            + K.drum(p, (0.8, Y + 0.38, 2.9), (2.4, Y + 0.38, 2.9), 0.28)
            + K.pump(p, 1.3, 3.5) + K.control_box(p, 2.9, 3.4))


def lv3(p):
    return (K.pad(p, 5, 4) + K.pad_details(p, 5, 4, extinguisher=(4.75, 3.3))
            + P.column(p, 0.9, 0.95, 0.44, 2.9, ACC, platforms=(0.9, 1.8, 2.6))
            + P.reactor(p, 2.05, 0.85, 0.4, 1.5, ACC)
            + B.sphere_tank(p, 3.15, 1.0, 0.48, ACC, legs=5)
            + B.sphere_tank(p, 4.2, 1.0, 0.42, ACC, legs=5)
            + flare(p, 4.55, 3.0, 3.0)
            + P.pipes(p, [[(0.9, Y + 3.35, 0.95), (0.9, Y + 3.55, 0.95), (1.55, Y + 3.55, 0.95), (1.55, Y + 1.2, 0.95), (1.65, Y + 1.2, 0.95)],
                          [(2.05, Y + 0.45, 1.25), (2.05, Y + 0.45, 2.15), (4.2, Y + 0.45, 2.15), (4.2, Y + 0.45, 1.5)],
                          [(3.15, Y + 0.45, 2.15), (3.15, Y + 0.45, 1.55)]], ACC)
            + P.air_cooler(p, 0.6, 2.5, 2.4, 3.1, 0.6, ACC)
            + K.pump(p, 3.0, 3.3) + K.pump(p, 3.6, 3.3) + K.control_box(p, 4.0, 3.45))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('smoke', P.column_top(0.85, 0.9, 0.38, 2.2, 0.2)), ('lamp', P.column_top(0.85, 0.9, 0.38, 2.2))],
            2: [('smoke', (3.55, Y + 2.75, 2.9)), ('lamp', P.column_top(0.9, 0.95, 0.42, 2.6))],
            3: [('smoke', (4.55, Y + 3.15, 3.0)), ('lamp', P.column_top(0.9, 0.95, 0.44, 2.9))]}
