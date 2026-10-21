import sys, numpy as np
from PIL import Image
def runs(mask, minlen):
    out=[]; s=None
    for i,v in enumerate(list(mask)+[False]):
        if v and s is None: s=i
        if not v and s is not None:
            if i-s>=minlen: out.append((s,i))
            s=None
    return out
def cells(path):
    a=np.asarray(Image.open(path).convert('RGB')).astype(int)
    page=a[3,3]
    bg=(np.abs(a-page).sum(2)<24)
    cols=runs(bg.mean(0)<0.985, 80); rows=runs(bg.mean(1)<0.985, 80)
    return a, cols, rows
for p in sys.argv[1:]:
    a,c,r=cells(p); print(p, len(c), 'x', len(r), c, r)
