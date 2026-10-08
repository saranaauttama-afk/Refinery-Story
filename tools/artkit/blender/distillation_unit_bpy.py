"""Experiment: Distillation Unit lv1 (3x3) modelled + rendered in Blender (pip install bpy).

    python3 tools/artkit/blender/distillation_unit_bpy.py out.png

Same camera as artkit (style.py): orthographic 2:1 isometric from the south
(elevation 30 deg, yaw 45 deg), light from the top-left, transparent background.
Footprint = x,y in [0,3] (Blender z up); the nearest corner (3,0) is the image's
bottom tip. The raw render is big and soft on purpose - normalize.py turns it
into the game pixel grid / palette / outline, same as the AI sprites.
"""
import math, sys
import bpy
from mathutils import Vector

import os
OUT = os.path.abspath(sys.argv[-1] if sys.argv[-1].endswith('.png') else 'du_lv1_blender.png')  # blender resolves relative paths oddly
RES_W = 768          # 4x master width (3+3)*32 -> normalize box-downsamples it

# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, rgb, metal=0.0, rough=0.45):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*[c / 255 for c in rgb], 1)
    b.inputs['Metallic'].default_value = metal
    b.inputs['Roughness'].default_value = rough
    return m

# palette leans on style.py (steel grey, gasoline orange, dark pad)
M = {
    'steel': mat('steel', (176, 180, 190), 0.15, 0.3),
    'steel_dk': mat('steel_dk', (110, 116, 130), 0.3, 0.5),
    'orange': mat('orange', (250, 120, 20), 0.0, 0.5),
    'pad': mat('pad', (70, 70, 78), 0.0, 0.9),
    'tile': mat('tile', (112, 112, 120), 0.0, 0.85),
    'grate': mat('grate', (80, 84, 96), 0.2, 0.7),
    'valve': mat('valve', (210, 56, 52), 0.1, 0.5),
}

def link(ob, m):
    ob.data.materials.append(M[m])
    for p in getattr(ob.data, 'polygons', []):
        p.use_smooth = True
    return ob

def box(c, size, m):
    bpy.ops.mesh.primitive_cube_add(location=c)
    ob = bpy.context.object; ob.scale = [s / 2 for s in size]
    ob.data.materials.append(M[m]); return ob

def cyl(c, r, h, m, axis='z', verts=32):
    rot = {'z': (0, 0, 0), 'x': (0, math.pi / 2, 0), 'y': (math.pi / 2, 0, 0)}[axis]
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=c, rotation=rot)
    ob = bpy.context.object
    ob.data.materials.append(M[m])
    bpy.ops.object.shade_auto_smooth()
    return ob

def sphere(c, r, m, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=c, segments=32, ring_count=16)
    ob = bpy.context.object; ob.scale = scale
    return link(ob, m)

def torus(c, R, r, m):
    bpy.ops.mesh.primitive_torus_add(location=c, major_radius=R, minor_radius=r, major_segments=40, minor_segments=8)
    return link(bpy.context.object, m)

def pipe(pts, r, m='orange'):
    """Pipe run as mesh cylinders between points + sphere elbows (curves didn't render reliably)."""
    for a, b in zip(pts, pts[1:]):
        a, b = Vector(a), Vector(b)
        d = b - a
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=r, depth=d.length, location=(a + b) / 2)
        ob = bpy.context.object
        ob.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        link(ob, m)
    for xyz in pts[1:-1]:
        sphere(xyz, r, m)

def flange(c, r, m='orange', axis='z'):
    return cyl(c, r * 1.5, r * 0.6, m, axis)

# ---------------------------------------------------------------- the model
PAD = 0.12
box((1.5, 1.5, PAD / 2), (3.0, 3.0, PAD), 'pad')
for i in range(6):                          # paving slabs like the reference pad
    for j in range(6):
        box((0.25 + i * 0.5, 0.25 + j * 0.5, PAD + 0.008), (0.46, 0.46, 0.016), 'tile')
Z0 = PAD + 0.016

# main column (back-left), dome top, three orange rings / platforms
CX, CY, CR, CH = 1.0, 1.9, 0.38, 3.5
cyl((CX, CY, Z0 + 0.1), CR + 0.06, 0.2, 'steel_dk')           # skirt
cyl((CX, CY, Z0 + CH / 2), CR, CH, 'steel')
sphere((CX, CY, Z0 + CH), CR, 'steel', scale=(1, 1, 0.6))
cyl((CX, CY, Z0 + CH + 0.3), 0.07, 0.25, 'steel_dk')          # top nozzle
for z in (1.1, 2.15, 3.1):
    cyl((CX, CY, Z0 + z), CR + 0.04, 0.14, 'orange')           # ring band
    cyl((CX, CY, Z0 + z - 0.05), CR + 0.2, 0.03, 'grate')     # platform deck
    torus((CX, CY, Z0 + z + 0.18), CR + 0.19, 0.03, 'orange')  # handrail
for z in (0.6, 1.6, 2.6):                                      # shell seams
    torus((CX, CY, Z0 + z), CR, 0.012, 'steel_dk')
# ladder on the lit (left) side
LX, LY = CX - 0.06, CY - CR - 0.07
for dx in (-0.08, 0.08):
    cyl((LX + dx * 0.7, LY + dx * 0.7, Z0 + 1.45), 0.012, 2.9, 'steel_dk')
for k in range(24):
    cyl((LX, LY, Z0 + 0.1 + k * 0.12), 0.008, 0.2, 'steel_dk', axis='x').rotation_euler[2] = math.radians(45)
# orange overhead line climbing the column's left side and over the top
pipe([(0.45, 1.35, Z0 + 0.05), (0.45, 1.35, Z0 + CH + 0.15), (CX, CY, Z0 + CH + 0.45)], 0.075)

# horizontal reflux drum (front-right), saddles, nozzles
DX, DY0, DY1, DZ, DR = 2.15, 0.55, 2.45, Z0 + 0.52, 0.42
cyl((DX, (DY0 + DY1) / 2, DZ), DR, DY1 - DY0, 'steel', axis='y')
for y in (DY0, DY1):
    sphere((DX, y, DZ), DR, 'steel', scale=(1, 0.45, 1))
for y in (DY0 + 0.35, DY1 - 0.35):
    box((DX, y, Z0 + 0.12), (0.6, 0.12, 0.24), 'steel_dk')     # saddle
    torus((DX, y, DZ), DR, 0.016, 'steel_dk') .rotation_euler[0] = math.pi / 2
cyl((DX, DY1 - 0.4, DZ + DR + 0.06), 0.05, 0.12, 'steel_dk')
# drum top -> up and across to the column (the big orange loop in the reference)
pipe([(DX, DY1 - 0.4, DZ + DR + 0.1), (DX, DY1 - 0.4, Z0 + 1.55), (DX, CY, Z0 + 1.55), (CX + CR, CY, Z0 + 1.55)], 0.08)
flange((DX, DY1 - 0.4, Z0 + 1.2), 0.06)
# column bottom -> drum front cap
pipe([(CX + 0.3, CY - 0.3, Z0 + 0.35), (CX + 0.3, 0.75, Z0 + 0.35), (DX - 0.6, 0.75, Z0 + 0.35), (DX - 0.6, 0.35, Z0 + 0.35)], 0.06, 'orange')

# pumps + valves on the front-left of the pad
for px, py in ((0.45, 0.5), (0.95, 0.4)):
    box((px, py, Z0 + 0.08), (0.28, 0.2, 0.16), 'steel_dk')
    cyl((px, py, Z0 + 0.25), 0.08, 0.18, 'orange')
    cyl((px, py, Z0 + 0.37), 0.05, 0.06, 'valve')
pipe([(0.45, 0.5, Z0 + 0.34), (0.45, 1.3, Z0 + 0.34), (CX - 0.2, 1.3, Z0 + 0.34), (CX - 0.2, CY - CR, Z0 + 0.34)], 0.05, 'steel_dk')
pipe([(0.95, 0.4, Z0 + 0.34), (1.4, 0.4, Z0 + 0.34)], 0.05, 'steel_dk')
cyl((1.0, 1.25, Z0 + 0.34), 0.06, 0.05, 'valve', axis='y')

# ---------------------------------------------------------------- camera + light
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'
cam.rotation_euler = (math.radians(60), 0, math.radians(45))   # elevation 30 -> exact 2:1
bpy.context.view_layer.update()
view = cam.matrix_world.to_3x3() @ Vector((0, 0, -1))
target = Vector((1.5, 1.5, 1.55))
cam.location = target - view * 30
cam.data.ortho_scale = 5.6
cam.data.clip_end = 100
bpy.context.view_layer.update()

sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN'))
sc.collection.objects.link(sun)
right = cam.matrix_world.to_3x3() @ Vector((1, 0, 0))
up = cam.matrix_world.to_3x3() @ Vector((0, 1, 0))
L = (-0.75 * right + 0.6 * up - 0.45 * view).normalized()       # style.LIGHT_SCREEN
sun.rotation_euler = (-L).to_track_quat('-Z', 'Y').to_euler()
sun.data.energy = 3.2
sun.data.angle = math.radians(3)
world = bpy.data.worlds.new('w'); sc.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = 48
sc.cycles.use_denoising = False
sc.render.film_transparent = True
sc.render.resolution_x = RES_W
sc.render.resolution_y = int(RES_W * 1.25)
sc.render.resolution_percentage = 100
sc.view_settings.view_transform = 'Standard'
sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('wrote', OUT)
