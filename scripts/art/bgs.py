from PIL import Image
import os; R=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..'); S=f'{R}/art-src/gpt'; O=f'{R}/assets/v4/art'
import os; os.makedirs(O,exist_ok=True)
def pix(im, f, colors=64, up=2):
    w,h=im.size; small=im.resize((w//f,h//f),Image.BOX).quantize(colors=colors,method=Image.Quantize.MEDIANCUT).convert('RGB')
    return small.resize((small.width*up,small.height*up),Image.NEAREST)
# title: full portrait
pix(Image.open(f'{S}/bg_title.png').convert('RGB'),4).save(f'{O}/title.png')
for n in ['rank','award']:
    pix(Image.open(f'{S}/scene_{n}.png').convert('RGB'),4).save(f'{O}/scene_{n}.png')
# header bands (6.5:1) from each menu background, y = centre of the band
bands={'build':760,'blend':330,'staff':880,'customers':980,'company':560}
for n,yc in bands.items():
    im=Image.open(f'{S}/bg_{n}.png').convert('RGB'); h=int(1024/6.5)
    pix(im.crop((0,yc-h//2,1024,yc-h//2+h)),4).save(f'{O}/header_{n}.png')
for f in sorted(os.listdir(O)): print(f, Image.open(f'{O}/{f}').size, os.path.getsize(f'{O}/{f}')//1024,'KB')
