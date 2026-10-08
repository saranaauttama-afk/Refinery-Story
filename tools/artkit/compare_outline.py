"""python3 compare_outline.py <variant> -> out/outline_<variant>.png  (variants: now, black, brown)"""
import sys, os
import style as S, render, distillation_unit as DU
v = sys.argv[1]
if v == 'black':
    S.OUTLINE_PX, S.INNER_DARKEN, S.RIM, S.INK = 2, 0.6, True, (34, 32, 44)
elif v == 'brown':
    S.OUTLINE_PX, S.INNER_DARKEN, S.RIM, S.INK = 2, 0.65, True, (62, 42, 36)
os.makedirs('out', exist_ok=True)
render.render(DU.LEVELS[1], 3, 3, f'out/outline_{v}.png')
