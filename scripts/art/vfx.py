import sys,os,time,json
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from edit import call
from dl import fetch
def vfx(desc,out,name):
    r=call('/vfx',{'description':desc,'artist':'lite','name':name,'game_pack':False}); jid=r.get('background_job_id'); print(out,str(r)[:200],flush=True)
    for _ in range(80):
        time.sleep(8); j=call(f'/background-jobs/{jid}')
        if j.get('status') in ('completed','failed','error'): break
    os.makedirs(out,exist_ok=True); json.dump(j,open(f'{out}/job.json','w'),default=str,indent=1)
    lr=j.get('last_response') or {}
    for f in (lr.get('files') or []):
        u=f.get('url') if isinstance(f,dict) else f; n=(f.get('name') if isinstance(f,dict) else None) or os.path.basename(u.split('?')[0])
        try: fetch(u,f'{out}/{n}'); print(' got',n)
        except Exception as e: print(' fail',n,str(e)[:80])
    print(out,j.get('status'),j.get('usage'),flush=True)
