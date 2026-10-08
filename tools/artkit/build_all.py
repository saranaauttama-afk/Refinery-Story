"""Build every building and install it into the game:

    python3 build_all.py [name ...]      # default: all 17 buildings

Renders each module with build.py (2 at a time), copies out/<name>_lv*.png to
assets/plants/artkit/ and merges every out/<name>_effects.json into
assets/plants/artkit/effects.json (read by src/components/v3/v3Art.ts).
"""
import json, os, shutil, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, '..', '..', 'assets', 'plants', 'artkit')
ALL = ['distillation_unit', 'crude_tank', 'gasoline_tank', 'lubricant_plant', 'lubricant_tank',
       'jet_fuel_plant', 'jet_fuel_tank', 'petrochemical_plant', 'petrochemical_tank', 'polymer_plant',
       'pellet_silo', 'power_plant', 'laboratory', 'maintenance_workshop', 'waste_treatment_plant',
       'recycling_bunker', 'sales_office']

names = sys.argv[1:] or ALL


def build(name):
    r = subprocess.run([sys.executable, 'build.py', name], cwd=HERE, capture_output=True, text=True)
    return name, r.returncode, (r.stdout + r.stderr).strip().splitlines()[-1:]


with ThreadPoolExecutor(max_workers=os.cpu_count() or 2) as ex:
    for name, code, tail in ex.map(build, names):
        print(f'{name}: {"ok" if code == 0 else "FAILED"} {tail}')
        if code:
            sys.exit(1)

os.makedirs(DEST, exist_ok=True)
fx_path = os.path.join(DEST, 'effects.json')
effects = json.load(open(fx_path)) if os.path.exists(fx_path) else {}
for name in names:
    for lv in (1, 2, 3):
        shutil.copy(os.path.join(HERE, 'out', f'{name}_lv{lv}.png'), DEST)
    effects.update(json.load(open(os.path.join(HERE, 'out', f'{name}_effects.json'))))
json.dump(dict(sorted(effects.items())), open(fx_path, 'w'), indent=1)
print(f'installed {len(names)} buildings -> {os.path.normpath(DEST)}')
