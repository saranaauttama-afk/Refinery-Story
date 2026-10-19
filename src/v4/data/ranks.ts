import { PROGRESSION as P } from './balance'
const unlocks=[['cdu','tank','gate','blend','gasoline','diesel'],['hydro','lab','land2','training:lab'],['reformer','hire:university','investment:highway'],['cracker','lpg','jet','investment:airport'],['control','hire:fair','investment:port'],['lube','asphalt','land4'],['hire:headhunter','investment:industrial','wax','pellet'],['director','yard40','flag'],['tower','goldTree','goldSign'],['ending','mascot','legend']]
export const ranks=P.rankFame.map((fame,i)=>({rank:i+1,fame,unlocks:unlocks[i]}))
