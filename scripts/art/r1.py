import sys,os,io,json,base64,time
sys.path.insert(0,'.')
import numpy as np
from PIL import Image
from collections import deque
from edit import call
def flood_clear(c,tol=70):
    a=np.array(c).astype(int); H,W=a.shape[:2]; seen=np.zeros((H,W),bool)
    q=deque([(y,x) for y in range(H) for x in (0,W-1)]+[(y,x) for x in range(W) for y in (0,H-1)])
    while q:
        y,x=q.popleft()
        if seen[y,x]: continue
        seen[y,x]=True
        p=a[y,x]
        lum=p[:3].mean()
        if p[3]==0 or (p[:3].max()-p[:3].min()<45 and lum>150) or (p[2]>p[0]+15 and lum<110 and lum>25):
            a[y,x]=0
            for v,u in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
                if 0<=v<H and 0<=u<W and not seen[v,u]: q.append((v,u))
    return Image.fromarray(a.astype('uint8'))
def b64(im):
    b=io.BytesIO(); im.save(b,'PNG'); return base64.b64encode(b.getvalue()).decode()
def style_sheet(names):
    cs=[flood_clear(Image.open(f'style/i_{n}.png')) for n in names]
    W=sum(c.width for c in cs)+4*len(cs)+4; H=max(c.height for c in cs)+4
    s=Image.new('RGBA',(W,H),(0,0,0,0)); x=2
    for c in cs: s.paste(c,(x,(H-c.height)//2),c); x+=c.width+4
    return s
def gen(desc,out,size=32,style=None,seed=1):
    body={'description':desc,'image_size':{'width':size,'height':size},'no_background':True,'seed':seed}
    if style is not None:
        body['style_image']={'image':{'type':'base64','base64':b64(style)},'size':{'width':style.width,'height':style.height},
                             'usage_description':'game HUD icon style: chunky pixels, thick dark outline, bright saturated colours'}
    r=call('/generate-image-v2',body); jid=r.get('background_job_id')
    for _ in range(120):
        time.sleep(5); j=call(f'/background-jobs/{jid}')
        if j.get('status')=='completed': break
        if j.get('status') in ('failed','error'): print(out,'failed',str(j)[:300]); return []
    imgs=[]
    def f(o):
        if isinstance(o,dict):
            if isinstance(o.get('base64'),str): imgs.append(o['base64'])
            for v in o.values(): f(v)
        elif isinstance(o,list):
            for v in o: f(v)
    f(j.get('last_response') or {})
    os.makedirs(out,exist_ok=True)
    for i,b in enumerate(imgs): open(f'{out}/{i:02d}.png','wb').write(base64.b64decode(b.split(',')[-1]))
    print(out,len(imgs),'images',j.get('usage'),flush=True); return imgs
