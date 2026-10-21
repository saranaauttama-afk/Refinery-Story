import sys,os,io,base64,time,json
sys.path.insert(0,'.')
from PIL import Image
from edit import call
from r1 import b64
def styles(names):
    out=[]
    for n in names:
        im=Image.open(f'style/tile_{n}.png').convert('RGBA'); out.append({'base64':b64(im),'width':im.width,'height':im.height})
    return out
def tiles(desc,out,style_names=None,feature=None,seed=1,extra=None):
    body={'description':desc,'tile_type':'isometric','tile_size':32,'tile_view':'top-down','outline_mode':'segmentation','seed':seed}
    if style_names: body['style_images']=styles(style_names)
    if feature: body['tile_feature']=feature
    if extra: body.update(extra)
    r=call('/create-tiles-pro',body); tid=r.get('tile_id') or r.get('id'); print('job',tid,str(r)[:200],flush=True)
    from dl import fetch
    for _ in range(150):
        time.sleep(6)
        try: j=call(f'/tiles-pro/{tid}')
        except RuntimeError as e:
            if '423' in str(e): continue
            raise
        if j.get('storage_urls'): break
        if j.get('status') in ('failed','error'): print('failed',str(j)[:400]); return None
    os.makedirs(out,exist_ok=True); json.dump({k:v for k,v in j.items() if k!='storage_urls'},open(f'{out}/meta.json','w'),default=str)
    imgs=list(j['storage_urls'].items())
    for name,url in imgs: fetch(url,f'{out}/{name}.png')
    print(out,len(imgs),'images', j.get('usage'), j.get('kind'), flush=True); return j
