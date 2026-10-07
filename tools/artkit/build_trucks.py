"""python3 build_trucks.py -> out/trucks/truck_<line>_<dir>.png (1x1 tile canvas, uncropped:
anchor = tile centre at (32, H-16) in master px, identical for every direction)."""
import os
from PIL import Image
import render, truck

LINES = ['crude', 'gasoline', 'lubricant', 'jet', 'petrochemical', 'polymer']
os.makedirs('out/trucks', exist_ok=True)
row = []
for line in LINES:
    for d in truck.DIRS:
        im = render.render(truck.oriented(line, d), 1, 1, f'out/trucks/truck_{line}_{d}.png', crop=False)
        row.append(im)
# trim every sprite by the same amount so all facings keep one anchor
top = min(im.getbbox()[1] for im in row) - 2
for (line, d), im in zip([(l, d) for l in LINES for d in truck.DIRS], row):
    im.crop((0, top, im.width, im.height)).save(f'out/trucks/truck_{line}_{d}.png')
row = [im.crop((0, top, im.width, im.height)) for im in row]
print('size', row[0].size, '(copy out/trucks/*.png to assets/vehicles/)')
sheet = Image.new('RGBA', (64 * 4, row[0].height * len(LINES)), (235, 232, 224, 255))
for i, im in enumerate(row):
    sheet.alpha_composite(im, ((i % 4) * 64, (i // 4) * im.height))
sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST).save('out/trucks_sheet.png')
