"""กฎกลาง — every building reads from here so the whole set stays consistent.
Follows Doc/ART_ASSET_LIST_V3.md §1–§2."""
import numpy as np

# --- grid / size (§2) ---------------------------------------------------
MASTER_TILE_W, MASTER_TILE_H = 64, 32   # master asset scale (2x in-game)
PIXEL = 1                                # each art pixel = 2x2 master pixels (chunky pixel look)
TILE_W, TILE_H = MASTER_TILE_W // PIXEL, MASTER_TILE_H // PIXEL   # internal render tile
MAX_HEIGHT_RATIO = 1.25                  # height <= 1.25 x width

# --- camera: true 2:1 isometric from the south ------------------------------
YAW = np.radians(45)
ELEV = np.radians(30)                    # sin(30°) = 0.5  ->  exact 2:1 diamonds

# --- light: top-left, shadows fall bottom-right ------------------------------
LIGHT_SCREEN = (-0.75, 0.6, 0.45)        # (screen-right, screen-up, toward-camera)
AMBIENT = -0.08
DIFFUSE = 1.15
SPECULAR, SPEC_POWER = 0.8, 24

# --- palette: ramps light -> dark ------------------------------------------
INK = (46, 47, 57)
RAMPS = {
    'steel':    [(232, 233, 236), (208, 209, 212), (174, 178, 187), (137, 143, 156), (104, 109, 124)],
    'steel_dk': [(190, 192, 198), (160, 164, 174), (124, 129, 142), (96, 100, 114)],
    'roof':     [(222, 223, 227), (198, 199, 205), (175, 179, 188), (150, 155, 167)],
    'pipe':     [(214, 216, 222), (176, 180, 190), (136, 141, 154), (100, 105, 118)],
    'concrete': [(118, 120, 130), (92, 94, 104), (70, 72, 82), (55, 56, 66)],
    'pad':      [(104, 106, 116), (84, 86, 96), (66, 68, 78), (52, 53, 63)],
    'glass':    [(150, 200, 230), (96, 150, 190), (60, 96, 130), (40, 60, 86)],
    'tire':     [(80, 80, 88), (58, 58, 66), (42, 42, 50), (30, 30, 36)],
    'cab':      [(250, 250, 252), (226, 228, 234), (190, 194, 204), (150, 155, 168)],
    'safety':   [(255, 176, 64), (247, 140, 30), (205, 98, 20), (150, 66, 18)],   # rails, ladders
}
# accent per product line (§3)
ACCENTS = {
    'crude':         [(118, 92, 78), (84, 64, 56), (60, 46, 42), (40, 32, 32)],
    'gasoline':      RAMPS['safety'],
    'lubricant':     [(255, 214, 92), (238, 176, 40), (188, 128, 24), (130, 86, 20)],
    'jet':           [(140, 214, 255), (70, 170, 235), (36, 120, 190), (24, 80, 140)],
    'petrochemical': [(200, 150, 240), (156, 96, 210), (110, 60, 160), (72, 40, 110)],
    'polymer':       [(150, 230, 110), (99, 199, 77), (62, 137, 72), (38, 92, 56)],
}

# --- outline ---------------------------------------------------------------
OUTLINE_DEPTH_BREAK = 0.25     # world units of depth jump that gets an ink line
