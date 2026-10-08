"""กฎกลาง — every building reads from here so the whole set stays consistent.
Follows Doc/ART_ASSET_LIST_V3.md §1–§2."""
import colorsys
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
    'rail':     [(255, 226, 96), (240, 196, 52), (196, 150, 30), (140, 104, 24)],
    'grate':    [(112, 116, 126), (88, 92, 102), (68, 72, 82), (52, 55, 64)],
    'valve':    [(240, 90, 80), (210, 56, 52), (160, 36, 40), (110, 26, 30)],
    'panel':    [(214, 220, 214), (186, 194, 188), (150, 160, 154), (116, 126, 120)],
    'lamp':     [(150, 240, 140), (90, 210, 90), (60, 160, 60), (40, 110, 40)],
    'safety':   [(255, 176, 64), (247, 140, 30), (205, 98, 20), (150, 66, 18)],   # rails, ladders
}

# --- hue-shifted ramps: lit tones lean warm (yellow), shadow tones lean cool (blue) ---
def hue_ramp(base, n=5, spread=0.30, warm=0.10, cool=0.16, sat_boost=0.0):
    """Pixel-art style ramp from one mid colour: lighter steps drift toward yellow and
    pick up a little warmth, darker steps drift toward blue/violet and get cooler."""
    r, g, b = (c / 255 for c in base)
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    out = []
    for i in range(n):
        t = i / (n - 1) * 2 - 1                    # -1 lightest … +1 darkest
        li = min(0.97, max(0.06, l - t * spread))
        if t < 0:   # toward warm
            hi = h + (0.13 - h) * warm * -t if s > 0.05 else 0.12
            si = min(1, s + warm * -t * 0.9 + sat_boost)
        else:       # toward cool: neutrals and cool hues drift to blue; warm hues drift to red/violet
            if s <= 0.05:
                hi, si = 0.63, min(1, s + cool * t * 0.45)
            elif 0.3 <= h <= 0.8:
                hi, si = h + (0.64 - h) * cool * t, min(1, s + cool * t * 0.5)
            else:
                hw = h if h < 0.5 else h - 1           # warm hues around 0
                hi, si = hw - 0.35 * cool * t, min(1, s + sat_boost)
        rr, gg, bb = colorsys.hls_to_rgb(hi % 1, li, si)
        out.append((int(rr * 255), int(gg * 255), int(bb * 255)))
    return out

WARM_COOL = getattr(__import__('builtins'), 'ARTKIT_V1', False) is False
if WARM_COOL:
    RAMPS.update({
        'steel':    hue_ramp((176, 180, 188), 6, spread=0.36),
        'steel_dk': hue_ramp((132, 138, 150), 5, spread=0.26),
        'roof':     hue_ramp((184, 186, 192), 5, spread=0.24),
        'pipe':     hue_ramp((170, 174, 184), 5, spread=0.30),
        'concrete': hue_ramp((112, 112, 118), 5, spread=0.20),
        'pad':      hue_ramp((126, 122, 116), 5, spread=0.20),
        'grate':    hue_ramp((96, 100, 110), 4, spread=0.18),
        'cab':      hue_ramp((226, 228, 232), 5, spread=0.26),
        'panel':    hue_ramp((180, 192, 182), 4, spread=0.22),
        'tire':     hue_ramp((60, 60, 68), 4, spread=0.14),
        'rail':     hue_ramp((236, 190, 50), 4, spread=0.24),
        'valve':    hue_ramp((206, 58, 54), 4, spread=0.24),
        'glass':    hue_ramp((96, 150, 196), 4, spread=0.24),
        'hazard':   hue_ramp((234, 186, 40), 3, spread=0.16),
        'hazard_k': hue_ramp((52, 50, 58), 3, spread=0.10),
        'extinguisher': hue_ramp((214, 52, 48), 3, spread=0.2),
        'lamp':     hue_ramp((110, 220, 110), 4, spread=0.22),
        'plate':    hue_ramp((232, 230, 222), 3, spread=0.12),
    })

# accent per product line (§3)
ACCENTS = {
    'crude':         hue_ramp((86, 64, 56), 4, spread=0.16),
    'gasoline':      hue_ramp((240, 128, 32), 4, spread=0.26),
    'lubricant':     [(255, 214, 92), (238, 176, 40), (188, 128, 24), (130, 86, 20)],
    'jet':           [(140, 214, 255), (70, 170, 235), (36, 120, 190), (24, 80, 140)],
    'petrochemical': [(200, 150, 240), (156, 96, 210), (110, 60, 160), (72, 40, 110)],
    'polymer':       [(150, 230, 110), (99, 199, 77), (62, 137, 72), (38, 92, 56)],
}

# --- render quality v2 (set False to get the v1 look) ------------------------
SHADOWS = True          # soft cast shadows (buildings shade their own pad, pipes shade walls)
SHADOW_SOFTNESS = 10.0  # higher = harder edge
SHADOW_STRENGTH = 0.55
AO = True               # ambient occlusion: darker in corners, under platforms, where parts meet
AO_STRENGTH = 0.9
DITHER = True           # 4x4 ordered dither between ramp steps (classic pixel-art gradient)
DITHER_AMOUNT = 0.55
SELOUT = True           # inner lines use the material's own darkest tone; only the silhouette is ink

# --- outline ---------------------------------------------------------------
OUTLINE_DEPTH_BREAK = 0.25     # world units of depth jump that gets an ink line
