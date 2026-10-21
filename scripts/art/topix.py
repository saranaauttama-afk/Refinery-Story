import sys,os,io,json,base64,time
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from edit import call
from PIL import Image
def pro(src,dst,desc='clean pixel art game sprite, black outline'):
    im=Image.open(src); b=io.BytesIO(); im.save(b,'PNG')
    r=call(os.environ.get('EP','/image-to-pixelart-pro'),{'image':{'type':'base64','base64':base64.b64encode(b.getvalue()).decode()},'description':desc})
    jid=r.get('background_job_id') or r.get('id')
    for _ in range(100):
        time.sleep(4); j=call(f'/background-jobs/{jid}')
        if j.get('status') in ('completed','succeeded'): break
        if j.get('status') in ('failed','error'): print('fail',str(j)[:300]); return
    imgs=[]
    def f(o):
        if isinstance(o,dict):
            if isinstance(o.get('base64'),str): imgs.append(o['base64'])
            for v in o.values(): f(v)
        elif isinstance(o,list):
            for v in o: f(v)
    f(j.get('last_response') or j)
    open(dst,'wb').write(base64.b64decode(imgs[-1].split(',')[-1])); print(dst,Image.open(dst).size,flush=True)
if __name__=='__main__': pro(sys.argv[1],sys.argv[2])
