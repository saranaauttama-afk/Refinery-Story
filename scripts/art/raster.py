import json,sys
from PIL import Image, ImageDraw
data=json.load(open('init/cmds.json'))
S=2
for id,d in data.items():
    n=d['w']+d['h']
    W=n*16; H=n*8+d['height']+8
    bottom=n*4  # diamond bottom tip y (logical, origin = footprint centre)
    ox=W/2; oy=H-bottom-8
    img=Image.new('RGBA',(W*S,H*S),(0,0,0,0)); dr=ImageDraw.Draw(img)
    for c in d['cmds']:
        col=c['color']
        if c['kind']=='polygon':
            pts=[((x+ox)*S,(y+oy)*S) for x,y in c['points']]
            dr.polygon(pts,fill=col,outline='#14110F')
        elif c['kind'] in('rect','ellipse'):
            box=[(c['x']+ox)*S,(c['y']+oy)*S,(c['x']+c['w']+ox)*S,(c['y']+c['h']+oy)*S]
            if box[2]<box[0]: box[0],box[2]=box[2],box[0]
            if box[3]<box[1]: box[1],box[3]=box[3],box[1]
            (dr.rectangle if c['kind']=='rect' else dr.ellipse)(box,fill=col,outline='#14110F')
        else:
            r=c['r']; dr.ellipse([(c['x']-r+ox)*S,(c['y']-r+oy)*S,(c['x']+r+ox)*S,(c['y']+r+oy)*S],fill=col,outline='#14110F')
    img.save(f'init/{id}.png'); print(id,img.size)
