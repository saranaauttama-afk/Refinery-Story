"""Parts for the non-process groups (ART_ASSET_LIST §1): real buildings (walls, windows, roofs,
doors, AC units, dish), utility kit (stack, transformer, basin) and silos/spheres.
Camera sees the +z face (left, lit) and the +x face (right, shade); x/z are footprint axes, y up."""
import numpy as np
import parts as K

V = K.V
Y = K.PAD_H


def cyl_x(p, c, r, hh):
    q = p - c
    d = np.stack([np.hypot(q[..., 1], q[..., 2]) - r, np.abs(q[..., 0]) - hh], -1)
    return np.minimum(d.max(-1), 0) + np.linalg.norm(np.maximum(d, 0), axis=-1)


def cyl_z(p, c, r, hh):
    q = p - c
    d = np.stack([np.hypot(q[..., 0], q[..., 1]) - r, np.abs(q[..., 2]) - hh], -1)
    return np.minimum(d.max(-1), 0) + np.linalg.norm(np.maximum(d, 0), axis=-1)


# ---------------------------------------------------------------- buildings
def block(p, x0, z0, x1, z1, h, mat='wall', y0=None, trim='support', parapet=True):
    """Box building on the pad with a flat roof, a parapet lip and a coloured trim band at the top."""
    y0 = Y if y0 is None else y0
    c = V((x0 + x1) / 2, y0 + h / 2, (z0 + z1) / 2)
    hx, hz = (x1 - x0) / 2, (z1 - z0) / 2
    out = [(K.rbox(p, c, (hx, h / 2, hz), 0.02), mat)]
    out.append((K.box(p, V(c[0], y0 + h - 0.05, c[2]), (hx + 0.012, 0.05, hz + 0.012)), 'accent:' + trim))
    out.append((K.box(p, V(c[0], y0 + h + 0.005, c[2]), (hx - 0.05, 0.012, hz - 0.05)), 'roof'))
    if parapet:
        rim = np.maximum(K.box(p, V(c[0], y0 + h + 0.04, c[2]), (hx, 0.04, hz)),
                         -K.box(p, V(c[0], y0 + h + 0.04, c[2]), (hx - 0.05, 0.08, hz - 0.05)))
        out.append((rim, 'concrete'))
    return out


def gable(p, x0, z0, x1, z1, h, rise=0.35, mat='wall', roof='accent:support', along='x'):
    """Pitched-roof hall: walls up to h, roof ridge running along x (or z)."""
    c = V((x0 + x1) / 2, 0, (z0 + z1) / 2)
    hx, hz = (x1 - x0) / 2, (z1 - z0) / 2
    walls = K.rbox(p, V(c[0], Y + h / 2, c[2]), (hx, h / 2, hz), 0.02)
    q = p - V(c[0], Y + h, c[2])
    span = hz if along == 'x' else hx
    across = np.abs(q[..., 2]) if along == 'x' else np.abs(q[..., 0])
    lng = np.abs(q[..., 0]) - hx - 0.06 if along == 'x' else np.abs(q[..., 2]) - hz - 0.06
    slope = (q[..., 1] - rise * (1 - across / (span + 0.08))) / np.sqrt(1 + (rise / span) ** 2)
    roof_d = np.maximum.reduce([slope, -q[..., 1] + 0.0, across - span - 0.08, lng])
    gable_wall = np.maximum.reduce([q[..., 1] - rise * (1 - across / span), -q[..., 1], across - span,
                                    (np.abs(q[..., 0]) - hx if along == 'x' else np.abs(q[..., 2]) - hz)])
    return [(np.minimum(walls, gable_wall), mat), (roof_d, roof)]


def windows_z(p, x0, x1, z, y0, y1, n, w=0.18, frame='steel_dk'):
    """A row of n windows on the +z (lit) face at z."""
    xs = np.linspace(x0, x1, n + 2)[1:-1]
    yc, hh = (y0 + y1) / 2, (y1 - y0) / 2
    glass = [K.box(p, V(x, yc, z + 0.006), (w / 2, hh, 0.012)) for x in xs]
    fr = [K.box(p, V(x, yc, z), (w / 2 + 0.025, hh + 0.025, 0.012)) for x in xs]
    return [(K.umin(fr), frame), (K.umin(glass), 'glass')]


def windows_x(p, z0, z1, x, y0, y1, n, w=0.18, frame='steel_dk'):
    """A row of n windows on the +x (shade) face at x."""
    zs = np.linspace(z0, z1, n + 2)[1:-1]
    yc, hh = (y0 + y1) / 2, (y1 - y0) / 2
    glass = [K.box(p, V(x + 0.006, yc, z), (0.012, hh, w / 2)) for z in zs]
    fr = [K.box(p, V(x, yc, z), (0.012, hh + 0.025, w / 2 + 0.025)) for z in zs]
    return [(K.umin(fr), frame), (K.umin(glass), 'glass')]


def door_z(p, x, z, w=0.26, h=0.42, mat='door', stripes=False):
    out = [(K.box(p, V(x, Y + h / 2, z + 0.008), (w / 2, h / 2, 0.014)), mat)]
    if stripes:      # roller door slats
        out.append((K.umin([K.box(p, V(x, Y + yy, z + 0.02), (w / 2 - 0.02, 0.008, 0.008))
                            for yy in np.arange(0.07, h, 0.07)]), 'steel_dk'))
    return out


def door_x(p, x, z, w=0.26, h=0.42, mat='door', stripes=False):
    out = [(K.box(p, V(x + 0.008, Y + h / 2, z), (0.014, h / 2, w / 2)), mat)]
    if stripes:
        out.append((K.umin([K.box(p, V(x + 0.02, Y + yy, z), (0.008, 0.008, w / 2 - 0.02))
                            for yy in np.arange(0.07, h, 0.07)]), 'steel_dk'))
    return out


def ac_unit(p, x, y, z, s=0.14):
    """Rooftop AC box with a round fan grille on top."""
    return [(K.rbox(p, V(x, y + s * 0.5, z), (s, s * 0.5, s * 0.75), 0.015), 'panel'),
            (K.cyl_y(p, V(x, y + s + 0.005, z), s * 0.55, 0.01), 'steel_dk')]


def dish(p, x, y, z, r=0.26, facing=(0.6, 0.7, 0.4)):
    """Satellite dish on a short mast."""
    n = np.asarray(facing, float); n /= np.linalg.norm(n)
    c = V(x, y + 0.3, z)
    q = p - c
    ax = q @ n
    rad = np.linalg.norm(q - ax[..., None] * n, axis=-1)
    bowl = np.maximum(np.abs(ax - 0.12 * (rad / r) ** 2) - 0.02, rad - r)
    return [(K.capsule(p, V(x, y, z), c, 0.03), 'steel_dk'), (bowl * 0.7, 'cab'),
            (K.capsule(p, c, c + n * 0.2, 0.012), 'steel_dk')]


def antenna(p, x, y, z, h=0.5):
    return [(K.capsule(p, V(x, y, z), V(x, y + h, z), 0.014), 'steel_dk'), (K.sphere(p, V(x, y + h, z), 0.03), 'valve')]


def awning_z(p, x0, x1, z, y, depth=0.22, accent='support'):
    """Striped awning sloping out from the +z face."""
    q = p - V((x0 + x1) / 2, y, z + depth / 2)
    slope = np.abs(q[..., 1] + q[..., 2] * 0.5) - 0.015
    d = np.maximum.reduce([slope, np.abs(q[..., 0]) - (x1 - x0) / 2, np.abs(q[..., 2]) - depth / 2])
    stripe = np.sin((p[..., 0]) * np.pi / 0.12) > 0
    return [(np.where(stripe, d, 9), 'accent:' + accent), (np.where(stripe, 9, d), 'cab')]


# ---------------------------------------------------------------- utility kit
def stack(p, x, z, r, h, accent='power', bands=2):
    """Chimney stack with coloured warning bands near the top."""
    c = V(x, 0, z)
    out = [(K.cyl_y(p, c + V(0, Y + h / 2, 0), r, h / 2), 'concrete')]
    out.append((K.umin([K.cyl_y(p, c + V(0, Y + h - 0.12 - k * 0.22, 0), r + 0.01, 0.06) for k in range(bands)]), 'accent:' + accent))
    out.append((K.cyl_y(p, c + V(0, Y + h + 0.02, 0), r + 0.03, 0.03), 'steel_dk'))
    out.append((np.maximum(K.cyl_y(p, c + V(0, Y + h + 0.03, 0), r - 0.03, 0.05), 0), 'tire'))   # dark mouth
    return out


def transformer(p, x, z, accent='power'):
    out = [(K.rbox(p, V(x, Y + 0.17, z), (0.18, 0.17, 0.13), 0.02), 'steel_dk')]
    out.append((K.umin([K.box(p, V(x - 0.12 + k * 0.08, Y + 0.17, z + 0.14), (0.02, 0.13, 0.01)) for k in range(4)]), 'steel'))   # fins
    out.append((K.umin([K.capsule(p, V(x - 0.1 + k * 0.1, Y + 0.34, z), V(x - 0.1 + k * 0.1, Y + 0.5, z), 0.025) for k in range(3)]), 'cab'))   # bushings
    out.append((K.box(p, V(x + 0.181, Y + 0.25, z), (0.006, 0.05, 0.06)), 'accent:' + accent))
    return out


def basin(p, x, z, r, depth=0.22, water='water', bridge=True):
    """Round settling basin: concrete ring wall with water, plus a rotating scraper bridge."""
    c = V(x, 0, z)
    wall = np.maximum(K.cyl_y(p, c + V(0, Y + depth / 2, 0), r, depth / 2), -K.cyl_y(p, c + V(0, Y + depth / 2 + 0.05, 0), r - 0.07, depth / 2 + 0.02))
    out = [(wall, 'concrete'), (K.cyl_y(p, c + V(0, Y + depth - 0.06, 0), r - 0.07, 0.01), water)]
    if bridge:
        out.append((K.box(p, c + V(0, Y + depth + 0.07, 0) + V(r * 0.5, 0, r * 0.25), (r * 0.55, 0.03, 0.06)), 'accent:olive'))
        out.append((K.cyl_y(p, c + V(0, Y + depth + 0.06, 0), 0.08, 0.08), 'steel_dk'))
    return out


def sphere_tank(p, x, z, r, accent, legs=6):
    """Pressure sphere on legs with an equator band and a top platform."""
    cy = Y + r + 0.35
    c = V(x, cy, z)
    out = [(K.sphere(p, c, r), 'steel')]
    out.append((K.torus_y(p, c, r + 0.005, 0.045), 'accent:' + accent))
    lg = [K.capsule(p, V(x + (r * 0.92) * np.cos(a), Y, z + (r * 0.92) * np.sin(a)),
                    V(x + (r * 0.92) * np.cos(a), cy, z + (r * 0.92) * np.sin(a)), 0.035)
          for a in np.linspace(0, 2 * np.pi, legs, endpoint=False) + 0.3]
    out.append((K.umin(lg), 'steel_dk'))
    out.append((K.cyl_y(p, c + V(0, r + 0.01, 0), r * 0.3, 0.02), 'grate'))
    out.append((K.torus_y(p, c + V(0, r + 0.12, 0), r * 0.3, 0.018), 'rail'))
    return out


def silo(p, x, z, r, h, accent='polymer', cone=0.35):
    """Tall silo with a cone bottom on a ring of legs, accent band and roof hatch."""
    yb = Y + 0.45                 # bottom of the cylinder
    c = V(x, 0, z)
    body = K.cyl_y(p, c + V(0, yb + cone + h / 2, 0), r, h / 2)
    q = p - (c + V(0, yb + cone, 0))
    rr = np.hypot(q[..., 0], q[..., 2])
    cn = np.maximum(rr - r * np.clip((q[..., 1] + cone) / cone, 0.15, 1), np.maximum(q[..., 1], -q[..., 1] - cone))
    out = [(np.minimum(body, cn * 0.8), 'steel')]
    out.append((K.cyl_y(p, c + V(0, yb + cone + h * 0.7, 0), r + 0.012, h * 0.08), 'accent:' + accent))
    out.append((K.umin([K.cyl_y(p, c + V(0, yb + cone + h * f, 0), r + 0.01, 0.012) for f in (0.25, 0.45)]), 'steel_dk'))
    q2 = p - (c + V(0, yb + cone + h, 0))
    rr2 = np.hypot(q2[..., 0], q2[..., 2])
    out.append((np.maximum(q2[..., 1] - 0.14 * (1 - rr2 / r), np.maximum(rr2 - r, -q2[..., 1])) * 0.8, 'roof'))
    legs = [K.capsule(p, V(x + r * 0.85 * np.cos(a), Y, z + r * 0.85 * np.sin(a)),
                      V(x + r * 0.85 * np.cos(a), yb + cone * 0.6, z + r * 0.85 * np.sin(a)), 0.035)
            for a in np.linspace(0, 2 * np.pi, 4, endpoint=False) + np.pi / 4]
    out.append((K.umin(legs), 'steel_dk'))
    return out


def conveyor(p, a, b, w=0.12):
    """Inclined belt conveyor in a truss between two world points."""
    a, b = V(*a), V(*b)
    out = [(K.capsule(p, a, b, 0.045), 'accent:support')]
    out.append((K.capsule(p, a + V(0, -0.07, 0), b + V(0, -0.07, 0), 0.025), 'steel_dk'))
    return out


def bin_(p, x, z, accent, s=0.16):
    """Wheelie bin / skip with a coloured lid."""
    return [(K.rbox(p, V(x, Y + s, z), (s * 0.8, s, s * 0.7), 0.02), 'accent:' + accent),
            (K.rbox(p, V(x, Y + 2 * s + 0.015, z), (s * 0.85, 0.02, s * 0.75), 0.008), 'steel_dk')]
