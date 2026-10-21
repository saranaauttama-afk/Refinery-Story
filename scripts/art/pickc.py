import numpy as np, os
from PIL import Image
from scipy import ndimage
def pick_cell(sheet,r,c,cell,out):
    sh=np.array(Image.open(sheet).convert('RGBA')); m=sh[:,:,3]>0
    lab,k=ndimage.label(m,structure=np.ones((3,3)))
    cy,cx=r*cell+cell//2, c*cell+cell//2
    ys,xs=np.nonzero(lab); i=np.argmin((xs-cx)**2+(ys-cy)**2); L=lab[ys[i],xs[i]]
    sl=ndimage.find_objects(lab)[L-1]; p=sh[sl].copy(); p[lab[sl]!=L]=0
    os.makedirs(os.path.dirname(out),exist_ok=True); Image.fromarray(p).save(out); return p.shape
