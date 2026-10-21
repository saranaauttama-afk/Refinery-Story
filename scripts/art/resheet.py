import sys,os,numpy as np
from PIL import Image
from scipy import ndimage
def resheet(d,out,cell=32,cols=8):
    import math; cell=Image.open(os.path.join(d,sorted(os.listdir(d))[0])).width; cols=int(math.sqrt(len([f for f in os.listdir(d) if f.endswith(".png")])))
    fs=sorted(f for f in os.listdir(d) if f.endswith('.png') and f[:2].isdigit())
    n=len(fs); rows=(n+cols-1)//cols
    sh=Image.new('RGBA',(cols*cell,rows*cell),(0,0,0,0))
    for i,f in enumerate(fs): sh.paste(Image.open(f'{d}/{f}').convert('RGBA'),((i%cols)*cell,(i//cols)*cell))
    a=np.array(sh); m=a[:,:,3]>0
    lab,k=ndimage.label(m,structure=np.ones((3,3)))
    objs=ndimage.find_objects(lab); os.makedirs(out,exist_ok=True); j=0
    sizes=ndimage.sum(m,lab,range(1,k+1))
    big=[i for i in range(k) if sizes[i]>=0.25*max(sizes)]
    # sort by position
    big.sort(key=lambda i:(objs[i][0].start//cell, objs[i][1].start))
    for i in big:
        sl=objs[i]; piece=a[sl].copy(); piece[lab[sl]!=i+1]=0
        # merge nearby small sparkles? keep main only
        Image.fromarray(piece).save(f'{out}/{j:02d}.png'); j+=1
    sh.save(out+'_sheet.png'); return j
if __name__=='__main__':
    for d in sys.argv[1:]: print(d,resheet(d,d+'_cut'))
