import sys,os,io,base64,time
sys.path.insert(0,'.')
from PIL import Image
from edit import call
from r1 import b64
def collect(j):
    imgs=[]
    def f(o):
        if isinstance(o,dict):
            if isinstance(o.get('base64'),str): imgs.append(o['base64'])
            for v in o.values(): f(v)
        elif isinstance(o,list):
            for v in o: f(v)
    f(j.get('last_response') or {}); return imgs
def ui(desc,out,w,h,concept,seed=1,palette=None):
    c=Image.open(f'style/u_{concept}.png').convert('RGBA'); c=c.resize((max(16,c.width//4),max(16,c.height//4)),Image.NEAREST)
    body={'description':desc,'image_size':{'width':w,'height':h},'no_background':True,'seed':seed,
          'concept_image':{'image':{'type':'base64','base64':b64(c)},'size':{'width':c.width,'height':c.height}}}
    if palette: body['color_palette']=palette
    r=call('/generate-ui-v2',body); jid=r['background_job_id']
    for _ in range(120):
        time.sleep(5); j=call(f'/background-jobs/{jid}')
        if j.get('status')=='completed': break
        if j.get('status') in ('failed','error'): print(out,'failed',str(j)[:300]); return
    imgs=collect(j); os.makedirs(out,exist_ok=True)
    for i,b in enumerate(imgs): open(f'{out}/{i:02d}.png','wb').write(base64.b64decode(b.split(',')[-1]))
    print(out,len(imgs),j.get('usage'),flush=True)
