"""Shared kit for the process-plant group (ART_ASSET_LIST §1): accent pipe runs, dressed columns,
blending vessels, reactors, air coolers, extruders. Distillation keeps its own module."""
import numpy as np
import parts as K
import bparts as B

V = K.V
Y = K.PAD_H
LF = np.array([np.cos(1.15), 0, np.sin(1.15)])   # lit front-left normal
RF = np.array([np.cos(0.4), 0, np.sin(0.4)])     # front-right normal


def pipes(p, runs, acc, r=0.055):
    out = []
    for pts in runs:
        out += K.pipe(p, pts, r=r, mat='accent:' + acc) + K.elbows(p, pts, r)
    return out


def grey_pipes(p, runs, r=0.035):
    out = []
    for pts in runs:
        out += K.pipe(p, pts, r=r, mat='pipe') + K.elbows(p, pts, r)
    return out


def column(p, cx, cz, r, h, acc, platforms=(), ladder_angle=0.35):
    c = np.array([cx, Y, cz])
    return (K.column(p, cx, cz, r, h, platforms=platforms, ladder_angle=ladder_angle)
            + [(K.cyl_y(p, V(cx, Y + h * 0.82, cz), r + 0.012, 0.05), 'accent:' + acc)]
            + K.manway(p, c + LF * (r + 0.01) + [0, 0.42, 0], LF)
            + K.gauge(p, c + RF * (r + 0.01) + [0, h * 0.55, 0], RF)
            + K.lamp(p, (cx, Y + h + r + 0.22, cz)))


def column_top(cx, cz, r, h, extra=0.22):
    return (cx, Y + h + r + extra, cz)


def blender_vessel(p, cx, cz, r, h, acc):
    """Short vertical mixing vessel: domed top, agitator motor + gearbox, accent band and legs."""
    y0 = Y + 0.22
    c = V(cx, 0, cz)
    out = [(K.cyl_y(p, c + V(0, y0 + h / 2, 0), r, h / 2), 'steel')]
    out.append((np.maximum(K.sphere(p, c + V(0, y0 + h, 0), r), (y0 + h) - p[..., 1]), 'steel'))   # upper-half dome
    out.append((K.cyl_y(p, c + V(0, y0 + h * 0.5, 0), r + 0.012, h * 0.14), 'accent:' + acc))
    out.append((K.umin([K.capsule(p, V(cx + r * 0.8 * np.cos(a), Y, cz + r * 0.8 * np.sin(a)),
                                   V(cx + r * 0.8 * np.cos(a), y0 + 0.05, cz + r * 0.8 * np.sin(a)), 0.03)
                        for a in (0.4, 2.0, 3.6, 5.2)]), 'steel_dk'))
    top = y0 + h + r
    out.append((K.rbox(p, V(cx, top + 0.06, cz), (0.1, 0.06, 0.1), 0.02), 'steel_dk'))      # gearbox
    out.append((K.cyl_y(p, V(cx, top + 0.2, cz), 0.07, 0.09) - 0.01, 'valve'))               # motor
    return out


def blender_top(cx, cz, r, h):
    return (cx, Y + 0.22 + h + r + 0.32, cz)


def barrels(p, x, z, acc, n=3):
    """A small cluster of drums (product barrels) on a pallet."""
    out = [(K.box(p, V(x, Y + 0.02, z), (0.22, 0.02, 0.16)), 'heap')]
    pts = [(x - 0.1, z - 0.06), (x + 0.1, z - 0.06), (x, z + 0.08)][:n]
    out.append((K.umin([K.cyl_y(p, V(px, Y + 0.14, pz), 0.075, 0.1) for px, pz in pts]), 'accent:' + acc))
    out.append((K.umin([K.cyl_y(p, V(px, Y + 0.24, pz), 0.065, 0.006) for px, pz in pts]), 'steel_dk'))
    return out


def reactor(p, cx, cz, r, h, acc):
    """Thick-walled reactor: vertical vessel with elliptical heads, skirt, accent rings, top nozzle."""
    y0 = Y + 0.18
    c = V(cx, 0, cz)
    q = p - (c + V(0, y0 + h / 2, 0))
    rr = np.hypot(q[..., 0], q[..., 2])
    body = np.maximum(rr - r, np.abs(q[..., 1]) - h / 2)
    heads = np.minimum(np.linalg.norm(np.stack([q[..., 0], (q[..., 1] - h / 2) * 1.8, q[..., 2]], -1), axis=-1) - r,
                       np.linalg.norm(np.stack([q[..., 0], (q[..., 1] + h / 2) * 1.8, q[..., 2]], -1), axis=-1) - r) / 1.8
    out = [(np.minimum(body, heads), 'steel')]
    out.append((K.cyl_y(p, c + V(0, Y + 0.09, 0), r * 0.85, 0.09), 'concrete'))
    out.append((K.umin([K.cyl_y(p, c + V(0, y0 + h * f, 0), r + 0.014, 0.035) for f in (0.2, 0.8)]), 'accent:' + acc))
    out.append((K.cyl_y(p, c + V(0, y0 + h + r / 1.8 + 0.08, 0), 0.06, 0.08), 'steel_dk'))
    return out


def air_cooler(p, x0, z0, x1, z1, h, acc):
    """Fin-fan air cooler: box bank on a frame with round fan shrouds on top."""
    out = K.frame(p, x0, z0, x1, z1, h, deck=False)
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    out.append((K.rbox(p, V(cx, Y + h + 0.1, cz), ((x1 - x0) / 2 + 0.05, 0.1, (z1 - z0) / 2 + 0.05), 0.02), 'steel_dk'))
    n = max(1, int(round((x1 - x0) / 0.45)))
    fans = [K.cyl_y(p, V(x0 + (x1 - x0) * (k + 0.5) / n, Y + h + 0.22, cz), min(0.2, (z1 - z0) / 2), 0.03) for k in range(n)]
    out.append((K.umin(fans), 'accent:' + acc))
    out.append((K.umin([K.cyl_y(p, V(x0 + (x1 - x0) * (k + 0.5) / n, Y + h + 0.255, cz), 0.04, 0.01) for k in range(n)]), 'steel_dk'))
    return out


def extruder(p, x0, x1, z, acc, h=0.32):
    """Extruder line along x: long barrel housing, feed hopper, motor block, die head."""
    cx = (x0 + x1) / 2
    out = [(K.rbox(p, V(cx, Y + h / 2, z), ((x1 - x0) / 2, h / 2, 0.16), 0.03), 'accent:' + acc)]
    out.append((B.cyl_x(p, V(cx + 0.05, Y + h + 0.06, z), 0.08, (x1 - x0) / 2 - 0.1), 'steel'))
    hx = x0 + 0.25
    q = p - V(hx, Y + h + 0.2, z)
    rr = np.hypot(q[..., 0], q[..., 2])
    hop = np.maximum(rr - (0.08 + 0.6 * np.clip(q[..., 1] + 0.12, 0, 0.3)), np.abs(q[..., 1]) - 0.14)
    out.append((hop * 0.8, 'steel'))
    out.append((K.rbox(p, V(x0 + 0.12, Y + h + 0.08, z), (0.11, 0.1, 0.12), 0.02), 'valve'))
    out.append((K.rbox(p, V(x1 - 0.06, Y + h * 0.7, z), (0.06, 0.1, 0.1), 0.02), 'steel_dk'))
    return out


def pellet_belt(p, x0, x1, z):
    """Low cooling bath / belt carrying strands out of the die."""
    return [(K.rbox(p, V((x0 + x1) / 2, Y + 0.12, z), ((x1 - x0) / 2, 0.06, 0.12), 0.02), 'steel_dk'),
            (K.box(p, V((x0 + x1) / 2, Y + 0.185, z), ((x1 - x0) / 2 - 0.04, 0.008, 0.09)), 'water')]
