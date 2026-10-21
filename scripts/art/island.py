import random
from PIL import Image
def load(d,n): return Image.open(f'r4/{d}/tile_{n}.png').convert('RGBA')
GS=[load('grass_sand',i) for i in range(16)]; SW=[load('sand_water',i) for i in range(16)]
FLAT={k:[load('ground',a),load('ground',b)] for k,(a,b) in {'grass':(0,8),'grassf':(1,9),'grassd':(2,10),'locked':(3,11),'concrete':(4,12),'sand':(5,13),'shallow':(6,14),'deep':(7,15)}.items()}
def build(N=26,land=(5,21),sand=1,yard=(9,17),own=(9,17),seed=1):
    rnd=random.Random(seed)
    # vertex terrain: 0 water,1 sand,2 grass
    V=[[0]*(N+1) for _ in range(N+1)]
    for y in range(N+1):
        for x in range(N+1):
            if land[0]<=x<=land[1] and land[0]<=y<=land[1]: V[y][x]=2
            elif land[0]-sand<=x<=land[1]+sand and land[0]-sand<=y<=land[1]+sand: V[y][x]=1
    W=N*32+64; H=N*16+64
    img=Image.new('RGBA',(W,H),(52,140,190,255))
    ox=W//2; oy=16
    for s in range(2*N):
        for x in range(N):
            y=s-x
            if not 0<=y<N: continue
            # corners: N=(x,y) W=(x,y+1) E=(x+1,y) S=(x+1,y+1)
            cN,cW,cE,cS=V[y][x],V[y+1][x],V[y][x+1],V[y+1][x+1]
            cs=[cS,cW,cE,cN]
            px=ox+(x-y)*16-16; py=oy+(x+y)*8
            if min(cs)==2:
                if yard[0]<=x<yard[1] and yard[0]<=y<yard[1]: t=rnd.choice(FLAT['concrete'])
                elif own[0]-4<=x<own[1]+4 and own[0]-4<=y<own[1]+4: t=rnd.choice(FLAT['grass']+FLAT['grassf'][:1])
                else: t=rnd.choice(FLAT['locked'])
                img.alpha_composite(t,(px,py))
            elif min(cs)>=1:
                m=sum(1<<i for i,c in enumerate(cs) if c==2); img.alpha_composite(GS[m],(px,py))
            else:
                m=sum(1<<i for i,c in enumerate(cs) if c>=1); img.alpha_composite(SW[m],(px,py))
    return img
if __name__=='__main__':
    im=build(); im.save('r4_island.png'); im.resize((im.width*2,im.height*2),0).save('r4_island_x2.png'); print(im.size)
