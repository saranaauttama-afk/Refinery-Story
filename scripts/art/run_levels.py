import sys,os,json; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from edit import edit
from concurrent.futures import ThreadPoolExecutor
NOUN={'cdu':'distillation tower','crudeTank':'crude oil tank','tank':'storage tank','blend':'blending station','hydro':'hydrotreater',
 'reformer':'reformer','cracker':'cracker','tower':'mega tower','loading':'loading bay','pipe':'pipe rack',
 'lab':'laboratory building','control':'control room building','canteen':'canteen building'}
HOUSE={'lab','control','canteen','tower'}
KEEP=' Keep the same grey concrete slab, the same camera angle and the same size; only change the building itself.'
IND={2:'Add a few extra pipes and a small ladder with a safety railing to the {n}.',
     3:'Add one more matching piece of equipment beside the {n} and an extra coloured band on it.',
     4:'Make the {n} bigger and busier: a taller main part, more pipes and a walkway.',
     5:'Turn the {n} into its deluxe version: shiny golden trim and small glowing warning lights on top.'}
HOU={2:'Add an air-conditioning unit and a small sign board to the {n}.',
     3:'Add a small extra wing or annex to the {n} with a matching roof.',
     4:'Make the {n} bigger: add a second storey with windows.',
     5:'Turn the {n} into its deluxe version: shiny golden trim, a rooftop antenna with a glowing light, polished windows.'}
picks=json.load(open('picks.json'))
def chain(id):
    src=f'n/{id}_{picks[id]}.png'
    for lv in (2,3,4,5):
        dst=f'n/{id}_L{lv}.png'
        if not os.path.exists(dst):
            t=(HOU if id in HOUSE else IND)[lv].format(n=NOUN[id])+KEEP
            edit(src,t,dst,seed=lv)
        if not os.path.exists(dst): return
        src=dst
ids=sys.argv[1].split(',') if len(sys.argv)>1 else list(NOUN)
with ThreadPoolExecutor(5) as ex: list(ex.map(chain,ids))
