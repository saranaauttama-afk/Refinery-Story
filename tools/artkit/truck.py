"""Tanker truck for yard traffic. Modelled facing +x on a 1x1 tile, rotated for 4 directions.
Directions match the yard: se = +x, sw = +y (artkit z), nw = -x, ne = -y."""
import numpy as np
import parts as K

V = K.V
DIRS = {'se': 0.0, 'sw': np.pi / 2, 'nw': np.pi, 'ne': -np.pi / 2}

def cyl_x(p, c, r, hh):
    q = p - c
    d = np.stack([np.hypot(q[..., 1], q[..., 2]) - r, np.abs(q[..., 0]) - hh], -1)
    return np.minimum(d.max(-1), 0) + np.linalg.norm(np.maximum(d, 0), axis=-1)

def cyl_z(p, c, r, hh):
    q = p - c
    d = np.stack([np.hypot(q[..., 0], q[..., 1]) - r, np.abs(q[..., 2]) - hh], -1)
    return np.minimum(d.max(-1), 0) + np.linalg.norm(np.maximum(d, 0), axis=-1)

def model(p, accent):
    out = []
    out.append((K.rbox(p, V(0.5, 0.115, 0.5), (0.4, 0.035, 0.17), 0.01), 'tire'))            # chassis
    out.append((K.rbox(p, V(0.8, 0.27, 0.5), (0.11, 0.13, 0.17), 0.035), 'cab'))            # cab
    out.append((K.rbox(p, V(0.9, 0.3, 0.5), (0.025, 0.06, 0.14), 0.01), 'glass'))           # windscreen
    out.append((K.rbox(p, V(0.8, 0.31, 0.5), (0.07, 0.045, 0.175), 0.01), 'glass'))         # side windows
    out.append((cyl_x(p, V(0.36, 0.29, 0.5), 0.15, 0.27) - 0.02, 'accent:' + accent))       # tank
    out.append((K.umin([cyl_x(p, V(x, 0.29, 0.5), 0.172, 0.012) for x in (0.16, 0.36, 0.56)]), 'steel'))
    out.append((K.cyl_y(p, V(0.36, 0.46, 0.5), 0.05, 0.02), 'steel'))                       # hatch
    out.append((K.umin([cyl_z(p, V(x, 0.075, 0.5 + s * 0.17), 0.065, 0.03)
                        for x in (0.22, 0.42, 0.8) for s in (-1, 1)]), 'tire'))
    return out

def oriented(accent, direction):
    a = DIRS[direction]
    ca, sa = np.cos(a), np.sin(a)
    def scene(p):
        q = p.copy()
        x, z = p[..., 0] - 0.5, p[..., 2] - 0.5
        # rotate world point back into the +x-facing model frame
        q[..., 0] = ca * x + sa * z + 0.5
        q[..., 2] = -sa * x + ca * z + 0.5
        return model(q, accent)
    return scene
