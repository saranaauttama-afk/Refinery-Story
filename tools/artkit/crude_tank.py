"""Crude Tank lv1/lv2/lv3 — footprints 2x2, 3x2, 3x3 (src/game/v3/data.ts TANK)."""
import numpy as np
import parts as K

ACC = 'crude'
FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
LOW = K.PAD_H + 0.42

def inlet(p, cx, cz, r, angle=1.95, y=LOW, reach=0.3):
    """Wall flange -> out -> elbow -> down into the pad, with a safety clamp."""
    n = np.array([np.cos(angle), 0, np.sin(angle)])
    w = np.array([cx, 0, cz]) + n * r
    e = w + n * reach
    return (K.flange(p, w + n * 0.03 + [0, y, 0], n) +
            K.pipe(p, [w + [0, y, 0], e + [0, y, 0], e + [0, K.PAD_H, 0]],
                   clamps=[e + [0, K.PAD_H + 0.12, 0]]))

def link(p, a, b, y=LOW - 0.12):
    """Low pipe between two tank walls along the pad."""
    return K.pipe(p, [(a[0], y, a[1]), (b[0], y, b[1])], r=0.07)

def lv1(p):
    return K.pad(p, 2, 2) + K.tank(p, 1.0, 1.0, 0.68, 1.15, ACC) + inlet(p, 1.0, 1.0, 0.68)

def lv2(p):
    return (K.pad(p, 3, 2)
            + K.tank(p, 1.0, 1.0, 0.68, 1.2, ACC)
            + K.tank(p, 2.32, 1.0, 0.5, 0.85, ACC, rail_posts=10, ladder_angle=0.9, manhole_angle=3.6)
            + link(p, (1.68, 1.0), (1.82, 1.0))
            + inlet(p, 1.0, 1.0, 0.68))

def lv3(p):
    return (K.pad(p, 3, 3)
            + K.tank(p, 1.0, 1.0, 0.7, 1.3, ACC, seams=3)
            + K.tank(p, 2.3, 0.95, 0.52, 0.95, ACC, rail_posts=10, ladder_angle=-0.2, manhole_angle=3.6)
            + K.tank(p, 1.25, 2.3, 0.5, 0.8, ACC, rail_posts=10, ladder_angle=0.6, manhole_angle=4.2)
            + link(p, (1.7, 1.0), (1.78, 0.97))
            + K.pipe(p, [(1.1, LOW - 0.12, 1.7), (1.15, LOW - 0.12, 1.8)], r=0.07)
            + K.pipe(p, [(2.3, LOW - 0.1, 1.47), (2.3, LOW - 0.1, 2.3), (1.75, LOW - 0.1, 2.3)], r=0.07)
            + [(K.rbox(p, K.V(2.35, K.PAD_H + 0.13, 2.3), (0.2, 0.13, 0.16), 0.03), 'steel_dk')]   # pump
            + inlet(p, 1.25, 2.3, 0.5, angle=2.6, y=K.PAD_H + 0.32, reach=0.22))

LEVELS = {1: lv1, 2: lv2, 3: lv3}
