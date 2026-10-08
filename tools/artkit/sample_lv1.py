"""python3 sample_lv1.py <tag> [ss] -> out/du1_<tag>.png  (supersampled pixel pipeline)"""
import sys, os
import render, distillation_unit as DU
os.makedirs('out', exist_ok=True)
render.render_pixel(DU.LEVELS[1], 3, 3, f'out/du1_{sys.argv[1]}.png', ss=int(sys.argv[2]) if len(sys.argv) > 2 else 4)
