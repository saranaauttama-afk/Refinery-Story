import json,base64,sys,urllib.request,os,time,io
import numpy as np
from PIL import Image
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from clean2 import bgremove, despeck
key=open(os.path.expanduser('~/.pixellab_key')).read().strip()
H={'Authorization':'Bearer '+key,'Content-Type':'application/json'}
def call(path,body=None):
    for a in range(10):
        try:
            req=urllib.request.Request('https://api.pixellab.ai/v2'+path,data=json.dumps(body).encode() if body else None,headers=H,method='POST' if body else 'GET')
            return json.load(urllib.request.urlopen(req,timeout=180))
        except urllib.error.HTTPError as e:
            if e.code in (429,500,502,503): time.sleep(8+a*4); continue
            raise RuntimeError(f'{e.code} {e.read()[:300]}')
        except Exception as e: time.sleep(8)
def prep(src):
    a=np.array(Image.open(src).convert('RGBA')).astype(int); bgremove(a); despeck(a)
    im=Image.fromarray(a.astype('uint8')); im=im.crop(im.getbbox())
    W=(im.width+3)//4*4; Hh=(im.height+3)//4*4
    c=Image.new('RGBA',(W,Hh),(0,0,0,0)); c.paste(im,((W-im.width)//2,Hh-im.height)); return c
def edit(src,desc,dst,seed=1):
    im=prep(src); b=io.BytesIO(); im.save(b,'PNG')
    r=call('/edit-image-pixen',{'image':{'type':'base64','base64':base64.b64encode(b.getvalue()).decode()},'description':desc,'seed':seed,'no_background':True})
    jid=r.get('background_job_id') or r.get('job_id') or r.get('id')
    for _ in range(90):
        j=call(f'/background-jobs/{jid}')
        st=j.get('status')
        if st in ('completed','succeeded','done'): break
        if st in ('failed','error','cancelled'): print(dst,'FAILED',json.dumps(j)[:300],flush=True); return
        time.sleep(4)
    imgs=[]
    def find(o):
        if isinstance(o,dict):
            if 'base64' in o and isinstance(o['base64'],str): imgs.append(o['base64'])
            for v in o.values(): find(v)
        elif isinstance(o,list):
            for v in o: find(v)
    find(j)
    if not imgs: print(dst,'no image',json.dumps(j)[:400],flush=True); return
    open(dst,'wb').write(base64.b64decode(imgs[0].split(',')[-1])); print(dst,'ok',flush=True)
if __name__=='__main__':
    edit(sys.argv[1],sys.argv[2],sys.argv[3])
