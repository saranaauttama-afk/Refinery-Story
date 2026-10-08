# artkit — code-drawn isometric pixel art

Renders building and vehicle sprites from code so every asset shares one
camera, light, palette and outline. Follows `Doc/ART_ASSET_LIST_V3.md` §1–§2
(2:1 isometric, 64×32 master tile, image width = (w+h)×32, bottom edge = the
footprint diamond's bottom corner).

```
pip install numpy pillow
cd tools/artkit
python3 build.py crude_tank   # out/crude_tank_lv1..3.png + sheet over the footprint templates
python3 build_trucks.py       # out/trucks/truck_<line>_<se|sw|nw|ne>.png  → assets/vehicles/
```

- `style.py` — the shared rules (tile size, camera, light, palette, product-line accents). Change here, everything follows.
- `render.py` — SDF raymarcher → toon shading with the palette ramps → ink outline → PNG at spec size.
- `parts.py` — reusable parts (pad, tank, railing, ladder, pipe, flange).
- `crude_tank.py`, `truck.py` — assets built from parts; numbers at the top of each call are the "sliders".

Trucks: 1×1 tile canvas, uncropped sideways, all facings trimmed by the same
amount, so the tile centre is always 16 master px above the bottom edge
(`TRUCK_ANCHOR_FROM_BOTTOM` in `src/components/v3/v3Vehicles.ts`).

Starter buildings (replace `assets/plants/starter/*` by filename):

```
python3 build.py distillation_unit   # 3x3, 4x4, 5x4 — columns, drum, pipe runs, catwalks
python3 build.py crude_tank          # 2x2, 3x2, 3x3 — dark brown band
python3 build.py gasoline_tank       # 2x2, 3x2, 3x3 — orange band
cp out/<name>_lv*.png ../../assets/plants/starter/
python3 build_ground.py              # yard ground atlas → assets/ground/ground_atlas.png
```
