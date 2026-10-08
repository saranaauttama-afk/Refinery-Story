"""Maintenance Workshop — safety orange; garage hall, roller doors, small crane (ART_ASSET_LIST §3). 2x2, 3x2, 3x3."""
import parts as K
import bparts as B

FOOTPRINT = {1: (2, 2), 2: (3, 2), 3: (3, 3)}
ACC = 'support'
Y = K.PAD_H


def shop(p, x0, z0, x1, z1, h, doors=1):
    out = B.gable(p, x0, z0, x1, z1, h, rise=0.28, mat='brick', roof='steel_dk', along='x')
    out += [(K.box(p, K.V((x0 + x1) / 2, Y + h - 0.04, z1 + 0.005), ((x1 - x0) / 2, 0.04, 0.014)), 'accent:' + ACC)]
    xs = [x0 + (x1 - x0) * (k + 0.5) / doors for k in range(doors)]
    for x in xs:
        out += B.door_z(p, x, z1, w=min(0.55, (x1 - x0) / doors - 0.12), h=h * 0.72, stripes=True)
        # hazard frame around the door
        out += [(K.box(p, K.V(x, Y + h * 0.74, z1 + 0.01), (min(0.55, (x1 - x0) / doors - 0.12) / 2 + 0.03, 0.025, 0.012)), 'hazard')]
    out += B.windows_x(p, z0, z1, x1, Y + h * 0.45, Y + h * 0.75, 2, w=0.16)
    return out


def crane(p, x, z0, z1, h):
    """Small gantry crane: two legs and a beam with a hook block."""
    legs = [K.capsule(p, K.V(x, Y, zz), K.V(x, Y + h, zz), 0.035) for zz in (z0, z1)]
    beam = K.capsule(p, K.V(x, Y + h, z0), K.V(x, Y + h, z1), 0.05)
    hook = K.rbox(p, K.V(x, Y + h - 0.2, (z0 + z1) / 2), (0.05, 0.05, 0.05), 0.01)
    return [(K.umin(legs + [beam]), 'accent:' + ACC), (K.capsule(p, K.V(x, Y + h - 0.15, (z0 + z1) / 2), K.V(x, Y + h, (z0 + z1) / 2), 0.008), 'steel_dk'), (hook, 'hazard')]


def toolbox(p, x, z):
    return [(K.rbox(p, K.V(x, Y + 0.12, z), (0.14, 0.12, 0.09), 0.015), 'valve'), (K.box(p, K.V(x, Y + 0.25, z), (0.06, 0.012, 0.02)), 'steel_dk')]


def lv1(p):
    return (K.pad(p, 2, 2) + K.pad_details(p, 2, 2)
            + shop(p, 0.3, 0.3, 1.55, 1.35, 0.7)
            + toolbox(p, 1.75, 0.6) + B.bin_(p, 1.75, 1.0, ACC, s=0.12))


def lv2(p):
    return (K.pad(p, 3, 2) + K.pad_details(p, 3, 2, extinguisher=(2.8, 0.4))
            + shop(p, 0.3, 0.3, 2.2, 1.35, 0.75, doors=2)
            + toolbox(p, 2.5, 0.65) + B.bin_(p, 2.5, 1.05, ACC, s=0.12))


def lv3(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 0.4))
            + shop(p, 0.3, 0.3, 2.2, 1.45, 0.85, doors=2)
            + crane(p, 2.55, 0.45, 2.4, 1.1)
            + toolbox(p, 0.6, 2.1) + toolbox(p, 1.0, 2.15)
            + [(K.rbox(p, K.V(2.55, Y + 0.13, 1.45), (0.25, 0.13, 0.2), 0.03), 'steel_dk')]    # part on the crane bay
            + B.bin_(p, 1.6, 2.3, ACC, s=0.12))


LEVELS = {1: lv1, 2: lv2, 3: lv3}
EMITTERS = {1: [('lamp', (1.55, Y + 0.6, 1.36))], 2: [('lamp', (2.2, Y + 0.65, 1.36))], 3: [('lamp', (2.55, Y + 1.15, 0.45))]}
