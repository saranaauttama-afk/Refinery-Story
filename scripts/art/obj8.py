import sys,os,io,base64,time,json
sys.path.insert(0,'.')
from PIL import Image
from edit import call
from r1 import b64
from dl import fetch
def square(im,s=None):
    s=s or max(im.size); c=Image.new('RGBA',(s,s),(0,0,0,0)); c.paste(im,((s-im.width)//2,(s-im.height)//2)); return c
def obj8(desc,out,style=None,size=None,view='high top-down',palette=None):
    body={'description':desc,'view':view}
    if style is not None: body['style_image']={'type':'base64','base64':b64(style)}
    else: body['size']=size
    if palette: body['target_palette']=palette
    r=call('/create-8-direction-object',body); oid=r.get('object_id'); print(out,'object',oid,str(r)[:160],flush=True)
    for _ in range(200):
        time.sleep(6)
        try: j=call(f'/objects/{oid}')
        except RuntimeError as e:
            if '423' in str(e) or '404' in str(e): continue
            raise
        st=j.get('status')
        if st in ('completed','review','failed','error'): break
    os.makedirs(out,exist_ok=True); json.dump(j,open(f'{out}/meta.json','w'),default=str,indent=1)
    urls=[]
    def f(o,p=''):
        if isinstance(o,dict):
            for k,v in o.items(): f(v,p+'/'+k)
        elif isinstance(o,list):
            for i,v in enumerate(o): f(v,p+f'/{i}')
        elif isinstance(o,str) and o.startswith('http') and ('.png' in o or 'image' in o): urls.append((p,o))
    f(j)
    for p,u in urls:
        name=p.strip('/').replace('/','_')
        try: fetch(u,f'{out}/{name}.png')
        except Exception as e: print('dl fail',p,str(e)[:80])
    print(out,st,len(urls),'urls',flush=True); return j
