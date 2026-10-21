import numpy as np, os
from PIL import Image
T=Image.open('gptprops/sheet6.png').convert('RGB'); W,H=T.size; cw,ch=W//3,H//2
names=['concrete','asphalt','quay','grass','sand','water']
os.makedirs('gptw',exist_ok=True)
S=32  # texture pixels per tile edge; tiles repeat every 2x2
for k,n in enumerate(names):
    c=T.crop(((k%3)*cw+6,(k//3)*ch+6,(k%3+1)*cw-6,(k//3+1)*ch-6)).resize((2*S,2*S),Image.LANCZOS)
    tex=np.array(c)
    for i in range(2):
        for j in range(2):
            out=np.zeros((16,32,4),np.uint8)
            for py in range(16):
                for px in range(32):
                    X=px+0.5; Y=py+0.5
                    a=(X-16)/32+Y/16; b=Y/16-(X-16)/32
                    if 0<=a<1 and 0<=b<1:
                        out[py,px,:3]=tex[int((j+b)*S)%(2*S), int((i+a)*S)%(2*S)]; out[py,px,3]=255
            Image.fromarray(out).save(f'gptw/t_{n}{i}{j}.png')
    print(n,tex.reshape(-1,3).mean(0).astype(int))
# props: target on-screen width in world px (1 tile = 32 wide)
P={'s1/gantry':60,'s1/crane':40,'s1/cont_red':26,'s1/cont_blue':26,'s1/stack3':24,'s1/stack2':24,'s1/bollard':8,'s1/lamp':16,
   's1/barrier':20,'s1/crates':20,'s1/drums':18,'s1/cones':18,
   's7/pier_long':120,'s7/pier_l':112,'s7/ramp':60,
   's2/warehouse_blue':78,'s2/warehouse_long':96,'s2/office':56,'s2/tankpipe':60,'s2/piperack':76,'s2/substation':58,
   's2/watertower':36,'s2/gasstation':58,'s2/chimney':26}
for k,w in P.items():
    im=Image.open(f'gptprops/{k}.png').convert('RGBA'); a=np.array(im).astype(int)
    if k.startswith('s7'):
        r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]; water=(b>r+60)&(b>g+15); a[water]=0
    im=Image.fromarray(a.astype('uint8')); im=im.crop(im.getbbox())
    h=round(im.height*w/im.width); sm=im.resize((w,h),Image.LANCZOS)
    arr=np.array(sm); arr[:,:,3]=np.where(arr[:,:,3]>110,255,0); Image.fromarray(arr).save(f'gptw/p_{k.split("/")[1]}.png')
print('ok')
