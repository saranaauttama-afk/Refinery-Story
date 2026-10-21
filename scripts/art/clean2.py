# Clean a PixelLab building: remove bg, normalise the ground slab to standard concrete (or drop the
# grass patch for decor), crop, and report the footprint centre + scale so the slab fills the tile.
import sys, json, numpy as np
from PIL import Image
from collections import deque
INK=np.array([20,17,15])
TOP=[np.array(c) for c in ([226,227,225],[208,209,207],[188,189,187])]
LEFT=[np.array(c) for c in ([178,180,180],[160,162,162])]
RIGHT=[np.array(c) for c in ([138,140,142],[118,120,122])]
def bgremove(a):
    H,W=a.shape[:2]; c=a[0,0].copy()
    if c[3]<128: return
    near=lambda p: p[3]>0 and np.abs(p[:3]-c[:3]).sum()<40
    seen=np.zeros((H,W),bool); q=deque([(0,0),(0,W-1),(H-1,0),(H-1,W-1)])
    while q:
        y,x=q.popleft()
        if not(0<=y<H and 0<=x<W) or seen[y,x]: continue
        seen[y,x]=True
        if not near(a[y,x]): continue
        a[y,x]=0; q.extend([(y+1,x),(y-1,x),(y,x+1),(y,x-1)])
def despeck(a,frac=0.02):
    op=a[:,:,3]>=128; H,W=op.shape; lab=-np.ones((H,W),int); sizes=[]
    for y in range(H):
        for x in range(W):
            if op[y,x] and lab[y,x]<0:
                n=len(sizes); q=deque([(y,x)]); lab[y,x]=n; c=0
                while q:
                    v,u=q.popleft(); c+=1
                    for dv in(-1,0,1):
                        for du in(-1,0,1):
                            s,t=v+dv,u+du
                            if 0<=s<H and 0<=t<W and op[s,t] and lab[s,t]<0: lab[s,t]=n; q.append((s,t))
                sizes.append(c)
    if not sizes: return
    big=max(sizes)
    for n,c in enumerate(sizes):
        if c<big*frac: a[lab==n]=0
    a[:,:,3]=np.where(a[:,:,3]>=128,255,0)
def geometry(a):
    op=a[:,:,3]>0; ys,xs=np.nonzero(op); tipy=ys.max(); h=tipy-ys.min()
    band=ys>=tipy-0.15*h; w0=xs[band].max()-xs[band].min()
    sel=ys>=tipy-(w0*0.6)
    lx,rx=xs[sel].min(),xs[sel].max()
    ly=np.nonzero(op[:,lx])[0]; ly=ly[ly>=tipy-w0*0.6].min()
    ry=np.nonzero(op[:,rx])[0]; ry=ry[ry>=tipy-w0*0.6].min()
    cx=(lx+rx)/2; cy=(ly+ry)/2; hw=(rx-lx)/2
    t=max(2,tipy-(cy+hw/2))
    return cx,cy,hw,t,tipy
def regions(shape,cx,cy,hw,t):
    H,W=shape; Y,X=np.mgrid[0:H,0:W]
    dx=np.abs(X-cx)/hw; top=dx+np.abs(Y-cy)/(hw/2)<=1.02
    edge=cy+(1-np.minimum(dx,1))*hw/2  # lower edge of top face at this x
    side=(~top)&(dx<=1.0)&(Y>edge-1)&(Y<=edge+t+1)
    return top, side&(X<cx), side&(X>=cx)
def lum(p): return p[...,:3]@[0.3,0.59,0.11]
def normalise_slab(a,cx,cy,hw,t):
    top,left,right=regions(a.shape[:2],cx,cy,hw,t); op=a[:,:,3]>0; L=lum(a)
    # sample slab colours near the three outer corners of the top face, and the side faces
    H,W=op.shape; Y,X=np.mgrid[0:H,0:W]
    corner=top&(((np.abs(X-(cx-hw))<hw*0.22)|(np.abs(X-(cx+hw))<hw*0.22)|(Y>cy+hw/2*0.7)))
    samp=a[corner&op&(L>70)][:,:3].astype(int)
    if len(samp)==0: return
    cols=np.unique(samp//8*8,axis=0)
    def slabby(px):
        d=np.abs(px[:,None,:]-cols[None,:,:]).sum(2).min(1); return d<36
    for reg,tones in ((top,TOP),(left,LEFT),(right,RIGHT)):
        m=reg&op; idx=np.nonzero(m)
        px=a[idx][:,:3].astype(int); l=lum(a[idx].astype(float))
        dark=l<=60
        ok=slabby(px)|((reg is not top)&~dark)
        if ok.sum()==0: continue
        lv=l[ok]; q=np.quantile(lv,[1/3,2/3]) if len(tones)==3 else [np.median(lv)]
        out=a[idx].copy()
        for k in np.nonzero(ok)[0]:
            v=l[k]; ti=sum(v<qq for qq in q); ti=min(ti,len(tones)-1)
            out[k,:3]=tones[len(tones)-1-ti] if len(tones)==3 else tones[0 if v>=q[0] else 1]
        out[dark,:3]=INK
        a[idx]=out
def drop_patch(a,cx,cy,hw,t):
    top,left,right=regions(a.shape[:2],cx,cy,hw,t); reg=top|left|right
    r,g,b=[a[:,:,i].astype(int) for i in range(3)]
    green=(g>r+8)&(g>b+8); brown=(r>g+6)&(g>b+4)&(r<200); yellow=(r>180)&(g>150)&(b<110)
    dark=lum(a.astype(float))<=60
    kill=reg&(green|brown|yellow|((left|right)&dark))
    a[kill]=0
    # outline pixels left floating around the removed patch
    for _ in range(2):
        op=a[:,:,3]>0; d=op&(lum(a.astype(float))<=60)&reg
        H,W=op.shape
        for y,x in zip(*np.nonzero(d)):
            nb=[(y+1,x),(y-1,x),(y,x+1),(y,x-1)]
            if not any(0<=v<H and 0<=u<W and op[v,u] and lum(a[v,u].astype(float))>60 for v,u in nb): a[y,x]=0
def run(src,dst,n,decor):
    a=np.array(Image.open(src).convert('RGBA')).astype(int)
    bgremove(a); despeck(a)
    cx,cy,hw,t,tipy=geometry(a)
    if decor: drop_patch(a,cx,cy,hw,t); despeck(a,0.05)
    else: normalise_slab(a,cx,cy,hw,t)
    im=Image.fromarray(a.astype('uint8')); bb=im.getbbox(); im=im.crop(bb); im.save(dst)
    target=n*32*(0.8 if decor else 1.0)
    return dict(w=im.width,h=im.height,ax=round(cx-bb[0],1),ay=round(cy-bb[1],1),scale=round(target/(2*hw),3))
if __name__=='__main__':
    print(json.dumps(run(sys.argv[1],sys.argv[2],int(sys.argv[3]),sys.argv[4]=='1')))
