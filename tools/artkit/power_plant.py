"""Power Plant — yellow; turbine hall + stack, transformers (ART_ASSET_LIST §3). 3x3, 3x3 (busier), 4x3."""
import parts as K
import bparts as B

FOOTPRINT = {1: (3, 3), 2: (3, 3), 3: (4, 3)}
ACC = 'power'
Y = K.PAD_H


def hall(p, x0, z0, x1, z1, h):
    return (B.gable(p, x0, z0, x1, z1, h, rise=0.3, roof='accent:' + ACC, along='x')
            + B.windows_z(p, x0, x1, z1, Y + h * 0.55, Y + h * 0.85, 3, w=0.2)
            + B.door_z(p, x0 + 0.35, z1, w=0.34, h=0.5, stripes=True)
            + B.windows_x(p, z0, z1, x1, Y + h * 0.55, Y + h * 0.85, 2, w=0.2))


def lv1(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + hall(p, 0.3, 1.3, 2.3, 2.5, 0.9)
            + B.stack(p, 0.75, 0.65, 0.2, 2.4)
            + B.transformer(p, 2.55, 0.7) + B.transformer(p, 1.9, 0.6)
            + K.pipe(p, [(0.75, Y + 0.7, 0.85), (0.75, Y + 0.7, 1.3)], r=0.08, mat='steel_dk'))


def lv2(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 2.75))
            + hall(p, 0.3, 1.3, 2.3, 2.5, 1.0)
            + B.stack(p, 0.7, 0.6, 0.22, 2.7, bands=3)
            + B.stack(p, 1.3, 0.55, 0.16, 1.9)
            + B.transformer(p, 2.55, 0.7) + B.transformer(p, 2.0, 0.6) + B.transformer(p, 2.6, 1.15)
            + K.pipe(p, [(0.7, Y + 0.7, 0.82), (0.7, Y + 0.7, 1.3)], r=0.08, mat='steel_dk')
            + K.pipe(p, [(1.3, Y + 0.6, 0.71), (1.3, Y + 0.6, 1.3)], r=0.06, mat='steel_dk')
            + B.ac_unit(p, 1.8, Y + 1.0 + 0.05, 1.45))


def lv3(p):
    return (K.pad(p, 4, 3) + K.pad_details(p, 4, 3, extinguisher=(3.75, 2.75))
            + hall(p, 0.3, 1.3, 2.9, 2.5, 1.1)
            + B.stack(p, 0.7, 0.6, 0.22, 2.9, bands=3) + B.stack(p, 1.3, 0.55, 0.18, 2.3)
            + _cooling(p, 3.35, 0.95, 0.5, 1.1)
            + B.transformer(p, 3.4, 2.3) + B.transformer(p, 2.1, 0.6) + B.transformer(p, 3.4, 1.85)
            + K.pipe(p, [(0.7, Y + 0.7, 0.82), (0.7, Y + 0.7, 1.3)], r=0.08, mat='steel_dk')
            + K.pipe(p, [(2.9, Y + 0.45, 1.6), (3.0, Y + 0.45, 1.6), (3.0, Y + 0.45, 1.2)], r=0.07, mat='accent:' + ACC))


def _cooling(p, x, z, r, h):
    """Small hyperbolic cooling tower."""
    import numpy as np
    q = p - K.V(x, Y + h / 2, z)
    rr = np.hypot(q[..., 0], q[..., 2])
    t = q[..., 1] / (h / 2)
    prof = r * (0.72 + 0.28 * t ** 2)
    shell = np.maximum(np.abs(rr - prof) - 0.04, np.abs(q[..., 1]) - h / 2) * 0.8
    return [(shell, 'concrete'), (K.cyl_y(p, K.V(x, Y + h * 0.82, z), r * 0.95, 0.04), 'accent:' + ACC)]


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('smoke', (0.75, Y + 2.5, 0.65))],
            2: [('smoke', (0.7, Y + 2.8, 0.6)), ('smoke', (1.3, Y + 2.0, 0.55))],
            3: [('smoke', (0.7, Y + 3.0, 0.6)), ('smoke', (1.3, Y + 2.4, 0.55)), ('smoke', (3.35, Y + 1.2, 0.95))]}
