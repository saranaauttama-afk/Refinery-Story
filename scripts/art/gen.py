import json,base64,sys,urllib.request,os
key=open(os.path.expanduser('~/.pixellab_key')).read().strip()
P={
 'cdu':'oil refinery distillation unit: one tall grey steel column with two safety-orange rings and a ladder, beside a squat orange furnace box with a dark door, on a concrete pad',
 'crudeTank':'wide low grey steel crude oil storage tank cylinder seen from a 3/4 isometric angle, black band around the middle, yellow rim railing and a side ladder, on a square concrete pad',
 'blend':'blending station: three short steel vats with red, blue and teal stripes around a central yellow mixer arm, on a concrete pad',
 'tank':'small grey steel product storage tank, short cylinder with a domed top and one red stripe, tiny ladder',
 'hydro':'hydrotreater unit: two grey steel reactor cylinders with orange bands joined by a yellow crosspipe, small grey control box, on a concrete pad',
 'reformer':'catalytic reformer: orange furnace box in front of three slim grey steel reactor cylinders with red bands and a yellow pipe, on a long concrete pad',
 'cracker':'big fluid catalytic cracker: tall grey riser column with a purple band and copper pipe, a fat grey regenerator vessel with purple band, low grey compressor block, on a large concrete pad',
 'tower':'mega refinery tower: a tall cream and light-blue modern industrial tower block with pink trim, blue window bands and a yellow antenna, on a large concrete pad',
 'loading':'truck loading bay: open orange flat canopy roof on four grey posts over a yellow-striped truck bay, on a concrete pad',
 'lab':'small white research laboratory building with a blue roof and a teal roof vent, one dark window',
 'control':'low white control room building with a blue roof, a dark window band with small lights and a black antenna',
 'canteen':'small cream staff canteen building with an orange-brown roof, a blue door and a white chimney',
 'pipe':'open pipe rack: two grey steel posts carrying three parallel pipes coloured red, orange and blue',
 'tree':'single round leafy green tree with a brown trunk on a small patch of ground',
 'lamp':'street lamp: grey steel pole with a yellow lamp head and black cap on a small concrete base',
 'sign':'blue company billboard sign on two grey legs with white text lines',
 'flag':'white flagpole with a red flag on a small concrete base',
 'goldTree':'golden decorative pine tree, shiny gold leaves and a brown trunk, prestige decoration',
 'goldSign':'shiny golden arrow-shaped signboard on a white post',
 'legend':'legend monument: purple statue of an oil worker with a yellow hard hat on a grey stone plinth',
 'awardproduct':'trophy monument: a red oil drop sculpture on a gold and white plinth',
 'awardsafety':'trophy monument: a teal shield with a white cross on a gold and white plinth',
 'awardeco':'trophy monument: a green sprouting plant sculpture with brown stem on a gold and white plinth',
 'awardrefinery':'trophy monument: a miniature grey refinery column and tank with a yellow pipe on a gold and white plinth',
}
pal='palette.png'
for id in sys.argv[1:]:
    img=open(f'init/{id}.png','rb').read()
    from PIL import Image; w,h=Image.open(f'init/{id}.png').size
    body={'description':'isometric pixel art game building, '+P[id]+', chunky readable shapes, Kairosoft style, light from top-left',
      'image_size':{'width':w,'height':h},'isometric':True,'no_background':True,
      'outline':'single color black outline','shading':'basic shading','detail':'medium detail',
      'init_image':{'type':'base64','base64':base64.b64encode(img).decode()},'init_image_strength':int(os.environ.get('STR','50')),
      'text_guidance_scale':8,'seed':1234}
    req=urllib.request.Request('https://api.pixellab.ai/v2/create-image-pixflux',data=json.dumps(body).encode(),headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
    import time
    for attempt in range(6):
        try:
            r=json.load(urllib.request.urlopen(req,timeout=180)); break
        except urllib.error.HTTPError as e:
            if e.code!=429: raise
            time.sleep(15)
    time.sleep(8)
    b=r['image']['base64'].split(',')[-1]
    os.makedirs('out',exist_ok=True)
    tag=os.environ.get('TAG','a')
    open(f'out/{id}_{tag}.png','wb').write(base64.b64decode(b)); print(id,r.get('usage'))
