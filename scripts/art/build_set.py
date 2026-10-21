import json,sys,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from clean2 import run
N=dict(cdu=4,crudeTank=4,blend=4,tank=2,hydro=4,reformer=5,cracker=6,tower=6,loading=4,lab=2,control=3,canteen=3,pipe=2,
 tree=2,lamp=2,sign=2,flag=2,goldTree=2,goldSign=2,legend=2,awardproduct=2,awardsafety=2,awardeco=2,awardrefinery=2)
DECOR={'tree','lamp','sign','flag','goldTree','goldSign','legend','awardproduct','awardsafety','awardeco','awardrefinery'}
R='/home/claude/refinery-story/assets/v4/sprites'
picks=json.load(open('picks.json')); meta={}
tier=sys.argv[1] if len(sys.argv)>1 else '1'
for id,tag in picks.items():
    src=f'n/{id}_{tag}.png' if tier=='1' else f'n/{id}_L{tier}.png'
    if not os.path.exists(src): continue
    meta[f'{id}:{tier}']=run(src,f'{R}/{id}_L{tier}.png',N[id],id in DECOR)
old=json.load(open(f'{R}/meta.json')) if os.path.exists(f'{R}/meta.json') else {}
old.update(meta); json.dump(old,open(f'{R}/meta.json','w'),indent=0,sort_keys=True); print(len(meta))
