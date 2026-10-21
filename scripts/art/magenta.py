import sys,os,numpy as np
from PIL import Image
from scipy import ndimage
def cut(src,outdir,names,minfrac=0.15):
    a=np.array(Image.open(src).convert('RGBA')).astype(int)
    r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    bg=(r>170)&(b>170)&(g<110)&(np.abs(r-b)<90)
    # soften: pixels very magenta-tinted near edges also bg
    a[bg]=0
    m=a[:,:,3]>0
    # clean magenta fringe on kept pixels
    fr=m&(r>150)&(b>140)&(g<120)
    a[fr]=0; m=a[:,:,3]>0
    lab,k=ndimage.label(ndimage.binary_closing(m,np.ones((5,5))),structure=np.ones((3,3)))
    sizes=ndimage.sum(m,lab,range(1,k+1)); objs=ndimage.find_objects(lab)
    keep=[i for i in range(k) if sizes[i]>minfrac*np.median(sorted(sizes)[-len(names):])]
    H,W=a.shape[:2]
    # name by grid cell of the object's centre; cols x rows inferred from the name count
    cols=int(os.environ.get('COLS','4')); rows=(len(names)+cols-1)//cols
    def cell(i):
        sl=objs[i]; cy=(sl[0].start+sl[0].stop)/2; cx=(sl[1].start+sl[1].stop)/2
        return int(cy/(H/rows))*cols+int(cx/(W/cols))
    keep=sorted(keep,key=lambda i:-sizes[i])[:len(names)]; keep.sort(key=cell)
    os.makedirs(outdir,exist_ok=True); out=[]
    for i in keep:
        n=names[cell(i)]
        sl=objs[i]; p=a[sl].copy(); p[lab[sl]!=i+1]=0
        Image.fromarray(p.astype('uint8')).save(f'{outdir}/{n}.png'); out.append((n,p.shape[:2]))
    return len(keep),out
if __name__=='__main__':
    names=sys.argv[3].split(',')
    print(cut(sys.argv[1],sys.argv[2],names))
