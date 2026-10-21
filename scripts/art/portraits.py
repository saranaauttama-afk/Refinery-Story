import sys, os, numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from cut import cells
R='/home/claude/refinery-story'
N=80; UP=2
def pix(im):
    # Keep GPT's own detail: a clean high-quality downscale, no colour reduction.
    return im.convert('RGB').resize((N*UP,N*UP),Image.LANCZOS)
jobs={'staff_1':['operator','chemist'],'staff_2':['engineer','safety'],'staff_3':['manager','director']}
os.makedirs(f'{R}/assets/v4/portraits',exist_ok=True)
out=[]
for f in ['staff_1','staff_2','staff_3','customers_gas','customers_air','customers_shipping','customers_industrial','customers_government']:
    a,cols,rows=cells(f'{R}/art-src/gpt/{f}.png'); img=Image.fromarray(a.astype('uint8'))
    k=0
    for (y0,y1) in rows:
        for (x0,x1) in cols:
            w=x1-x0; h=y1-y0; s=min(w,h); yy=y0+int((h-s)*0.2); xx=x0+(w-s)//2
            p=pix(img.crop((xx+4,yy+4,xx+s-4,yy+s-4)))
            if f.startswith('staff'): name=f'{jobs[f][k//6]}_{k%6}'
            else: name=f"{f.split('_')[1]}_{k}"
            p.save(f'{R}/assets/v4/portraits/{name}.jpg',quality=90); out.append(p); k+=1
sheet=Image.new('RGB',(12*N*UP,7*N*UP),'white')
for i,p in enumerate(out): sheet.paste(p,((i%12)*N*UP,(i//12)*N*UP))
sheet.save('portraits_sheet.png'); print(len(out))
