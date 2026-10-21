import sys
from PIL import Image
out=sys.argv[1]; fs=sys.argv[2:]
ims=[Image.open(f).convert('RGBA') for f in fs]
H=max(i.height for i in ims); W=sum(i.width for i in ims)+10*len(ims)
s=Image.new('RGBA',(W,H),(150,196,120,255)); x=0
for i in ims: s.paste(i,(x,H-i.height),i); x+=i.width+10
sc=max(1,min(4,1600//W)); s.resize((W*sc,H*sc),Image.NEAREST).save(out)
