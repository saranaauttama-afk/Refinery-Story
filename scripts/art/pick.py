import numpy as np, os
from PIL import Image
from scipy import ndimage
def pick(name,x,y,out):
    sh=np.array(Image.open(f'r1/{name}_cut_sheet.png').convert('RGBA')); m=sh[:,:,3]>0
    lab,k=ndimage.label(m,structure=np.ones((3,3)))
    # nearest labelled pixel to (x,y), then grab that component + small bits within 3px (sparkles excluded)
    ys,xs=np.nonzero(lab); i=np.argmin((xs-x)**2+(ys-y)**2); L=lab[ys[i],xs[i]]
    sl=ndimage.find_objects(lab)[L-1]; p=sh[sl].copy(); p[lab[sl]!=L]=0
    im=Image.fromarray(p); os.makedirs('r1/pick',exist_ok=True); im.save(f'r1/pick/{out}.png'); return im
