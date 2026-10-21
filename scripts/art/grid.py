import sys,os
from PIL import Image, ImageDraw
d=sys.argv[1]; out=sys.argv[2]; sc=int(sys.argv[3]) if len(sys.argv)>3 else 3
fs=sorted(f for f in os.listdir(d) if f.endswith('.png'))
ims=[Image.open(f'{d}/{f}').convert('RGBA') for f in fs]
w=max(i.width for i in ims)*sc+8; h=max(i.height for i in ims)*sc+18; cols=8
sh=Image.new('RGBA',(w*cols,h*((len(ims)+cols-1)//cols)),(246,238,220,255)); dr=ImageDraw.Draw(sh)
for k,i in enumerate(ims):
    x=(k%cols)*w; y=(k//cols)*h; sh.paste(i.resize((i.width*sc,i.height*sc),Image.NEAREST),(x+4,y+14),i.resize((i.width*sc,i.height*sc),Image.NEAREST)); dr.text((x+2,y+1),str(k),fill=(0,0,0,255))
sh.save(out)
