"""Distillation Unit lv1/lv2/lv3 — footprints 3x3, 4x4, 5x4 (src/game/v3/data.ts LINE).
Process plant (ART_ASSET_LIST §1): columns, drum, pipe runs, catwalks, ladders; orange = gasoline line."""
import numpy as np
import parts as K

FOOTPRINT = {1: (3, 3), 2: (4, 4), 3: (5, 4)}
ACC = 'gasoline'
Y = K.PAD_H

LF = np.array([np.cos(1.15), 0, np.sin(1.15)])   # lit front-left normal
RF = np.array([np.cos(0.4), 0, np.sin(0.4)])     # front-right normal

def dress(p, cx, cz, r, height):
    """Column details: manway, pressure gauge, two side nozzles, top lamp."""
    c = np.array([cx, Y, cz])
    top = Y + height + r
    return (K.manway(p, c + LF * (r + 0.01) + [0, 0.45, 0], LF)
            + K.gauge(p, c + RF * (r + 0.01) + [0, height * 0.55, 0], RF)
            + K.nozzle(p, c + RF * r + [0, height * 0.3, 0], RF, r=0.04, length=0.12)
            + K.nozzle(p, c + LF * r + [0, height * 0.75, 0], LF, r=0.035, length=0.1)
            + K.lamp(p, (cx, top + 0.22, cz)))

def top_of(cx, cz, r, height, extra=0.22):
    return (cx, Y + height + r + extra, cz)

def pipes(p, runs, r=0.055):
    out = []
    for pts in runs:
        out += K.pipe(p, pts, r=r, mat='accent:' + ACC)
    return out

def lv1(p):
    return (K.pad(p, 3, 3) + K.pad_details(p, 3, 3, extinguisher=(2.75, 1.7))
            + K.column(p, 1.0, 1.0, 0.42, 2.3, platforms=(0.9, 1.75), ladder_angle=0.35)
            + dress(p, 1.0, 1.0, 0.42, 2.3)
            + K.drum(p, (0.85, Y + 0.42, 2.25), (2.35, Y + 0.42, 2.25), 0.3)
            + K.control_box(p, 2.45, 1.05)
            + pipes(p, [
                [(1.0, Y + 2.55, 1.0), (1.0, Y + 2.75, 1.0), (1.75, Y + 2.75, 1.0), (1.75, Y + 0.6, 1.0), (1.75, Y + 0.6, 1.95)],
                [(1.42, Y + 0.35, 1.25), (1.42, Y + 0.35, 1.95)],
                [(2.6, Y + 0.25, 2.25), (2.8, Y + 0.25, 2.25), (2.8, Y + 0.25, 1.6)],
            ])
            + K.valve(p, (1.75, Y + 1.2, 1.0), axis='x')
            + K.valve(p, (2.8, Y + 0.45, 1.9)))

def lv2(p):
    return (K.pad(p, 4, 4) + K.pad_details(p, 4, 4, extinguisher=(3.75, 3.2))
            + K.column(p, 1.0, 1.1, 0.45, 2.7, platforms=(0.9, 1.8, 2.45), ladder_angle=0.4)
            + K.column(p, 2.75, 0.95, 0.36, 2.0, platforms=(1.0, 1.65), ladder_angle=0.9)
            + dress(p, 1.0, 1.1, 0.45, 2.7) + dress(p, 2.75, 0.95, 0.36, 2.0)
            + K.frame(p, 1.55, 0.7, 2.25, 1.5, 1.4)
            + K.drum(p, (0.9, Y + 0.45, 3.0), (2.9, Y + 0.45, 3.0), 0.33)
            + K.control_box(p, 3.45, 2.2)
            + pipes(p, [
                [(1.0, Y + 3.0, 1.1), (1.0, Y + 3.2, 1.1), (2.0, Y + 3.2, 1.1), (2.0, Y + 1.55, 1.1), (2.75, Y + 1.55, 1.1)],
                [(2.75, Y + 2.25, 0.95), (2.75, Y + 2.45, 0.95), (3.35, Y + 2.45, 0.95), (3.35, Y + 0.6, 0.95), (3.35, Y + 0.6, 2.7)],
                [(1.45, Y + 0.4, 1.3), (1.45, Y + 0.4, 2.7)],
                [(3.2, Y + 0.3, 3.0), (3.55, Y + 0.3, 3.0), (3.55, Y + 0.3, 3.5)],
            ])
            + K.valve(p, (3.35, Y + 1.2, 0.95), axis='x')
            + K.valve(p, (1.45, Y + 0.65, 2.0)))

def lv3(p):
    return (K.pad(p, 5, 4) + K.pad_details(p, 5, 4, extinguisher=(4.75, 3.3))
            + K.column(p, 1.0, 1.15, 0.42, 2.35, platforms=(0.8, 1.6), ladder_angle=0.3)
            + K.column(p, 2.4, 0.9, 0.48, 3.0, platforms=(0.9, 1.8, 2.6), ladder_angle=0.6)
            + K.column(p, 3.95, 1.0, 0.38, 2.05, platforms=(1.0, 1.7), ladder_angle=0.9)
            + dress(p, 1.0, 1.15, 0.42, 2.35) + dress(p, 2.4, 0.9, 0.48, 3.0) + dress(p, 3.95, 1.0, 0.38, 2.05)
            + K.frame(p, 1.5, 0.55, 1.95, 1.6, 1.25)
            + K.frame(p, 2.95, 0.55, 3.45, 1.5, 1.25)
            + K.drum(p, (1.3, Y + 0.48, 3.0), (3.7, Y + 0.48, 3.0), 0.36)
            + K.control_box(p, 4.45, 2.6)
            + pipes(p, [
                [(2.4, Y + 3.45, 0.9), (2.4, Y + 3.65, 0.9), (3.2, Y + 3.65, 0.9), (3.2, Y + 1.4, 0.9)],
                [(1.0, Y + 2.6, 1.15), (1.0, Y + 2.8, 1.15), (1.75, Y + 2.8, 1.15), (1.75, Y + 1.35, 1.15), (2.0, Y + 1.35, 1.15)],
                [(3.95, Y + 2.35, 1.0), (3.95, Y + 2.55, 1.0), (4.5, Y + 2.55, 1.0), (4.5, Y + 0.6, 1.0), (4.5, Y + 0.6, 2.3)],
                [(1.0, Y + 0.4, 1.6), (1.0, Y + 0.4, 2.7)],
                [(2.4, Y + 0.35, 1.4), (2.4, Y + 0.35, 2.65)],
                [(3.9, Y + 0.35, 3.0), (4.3, Y + 0.35, 3.0), (4.3, Y + 0.35, 3.6)],
                [(3.2, Y + 1.4, 1.5), (3.2, Y + 0.7, 1.5), (3.2, Y + 0.7, 2.65)],
            ])
            + K.valve(p, (4.5, Y + 1.3, 1.0), axis='x')
            + K.valve(p, (1.0, Y + 0.65, 2.2))
            + K.valve(p, (4.3, Y + 0.6, 3.3)))

LEVELS = {1: lv1, 2: lv2, 3: lv3}

# Effects animated in game: steam from the tallest column's top nozzle, red aviation lamp on every column.
EMITTERS = {
    1: [('smoke', top_of(1.0, 1.0, 0.42, 2.3, 0.2)), ('lamp', top_of(1.0, 1.0, 0.42, 2.3))],
    2: [('smoke', top_of(1.0, 1.1, 0.45, 2.7, 0.2)), ('lamp', top_of(1.0, 1.1, 0.45, 2.7)), ('lamp', top_of(2.75, 0.95, 0.36, 2.0))],
    3: [('smoke', top_of(2.4, 0.9, 0.48, 3.0, 0.2)), ('lamp', top_of(1.0, 1.15, 0.42, 2.35)),
        ('lamp', top_of(2.4, 0.9, 0.48, 3.0)), ('lamp', top_of(3.95, 1.0, 0.38, 2.05))],
}
