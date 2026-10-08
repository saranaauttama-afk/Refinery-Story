"""python3 sample_lv1.py <tag> -> out/du1_<tag>.png"""
import sys, os
import render, distillation_unit as DU
os.makedirs('out', exist_ok=True)
render.render(DU.LEVELS[1], 3, 3, f'out/du1_{sys.argv[1]}.png')
