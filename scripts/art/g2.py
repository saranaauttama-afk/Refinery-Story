import json,base64,sys,urllib.request,os,time
key=open(os.path.expanduser('~/.pixellab_key')).read().strip()
PAL={'type':'base64','base64':base64.b64encode(open(os.path.join(os.path.dirname(__file__),'palette.png'),'rb').read()).decode()}
STYLE=('isometric pixel art game building in Kairosoft style, 2:1 isometric view, cute chunky readable shapes, '
 'bright cheerful colors, light from the top-left, ')
BASE=', standing on a plain light grey concrete square slab with thin tile seams, clean, no dirt, no grass, no text'
def gen(id,w,h,tag,seed,subj,extra=None,base=BASE,pal=True):
    body={'description':STYLE+subj+base,'image_size':{'width':w,'height':h},'isometric':True,'no_background':True,
      'outline':'single color black outline','shading':'medium shading','detail':'highly detailed','text_guidance_scale':8,'seed':seed}
    if pal: body['color_image']=PAL
    if extra: body.update(extra)
    req=urllib.request.Request('https://api.pixellab.ai/v2/create-image-pixflux',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
    for a in range(8):
        try: r=json.load(urllib.request.urlopen(req,timeout=180)); break
        except urllib.error.HTTPError as e:
            if e.code not in (429,500,502,503): print(id,e.code,e.read()[:300],flush=True); return
            time.sleep(10+a*5)
        except Exception as e: print(id,'err',e,flush=True); time.sleep(10)
    else: return
    os.makedirs('n',exist_ok=True)
    open(f'n/{id}_{tag}.png','wb').write(base64.b64decode(r['image']['base64'].split(',')[-1])); print(id,tag,'ok',flush=True)
