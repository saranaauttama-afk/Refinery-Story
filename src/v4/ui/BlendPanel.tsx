import { Text } from 'react-native'
import { bases } from '../data/bases'
import { additives } from '../data/additives'
import { pairCompat } from '../data/compatibility'
import { useGame } from '../store/useGame'
import { selectBlend } from '../sim/actions'
import { predictedScore,gradeFor } from '../sim/systems/blending'
import { Button,styles } from './controls'
import { text } from '../i18n'
export function BlendPanel(){const {state:s,dispatch}=useGame();const score=predictedScore(s)
 return <><Text style={styles.text}>{text({en:'Current recipe',th:'สูตรปัจจุบัน'})}: {text(bases.find(b=>b.id===s.blend.base)!.name)} + {s.blend.additive?text(additives.find(a=>a.id===s.blend.additive)!.name):text({en:'None',th:'ไม่ใส่สาร'})} · {score.toFixed(0)}–{score.toFixed(0)} ({gradeFor(score)})</Text>{bases.filter(b=>b.rank<=s.rank).map(b=><Button key={b.id} label={b.name} onPress={()=>dispatch(s=>selectBlend(s,b.id,s.blend.additive))}/>)}<Button label={{en:'No additive',th:'ไม่ใส่สารเติมแต่ง'}} onPress={()=>dispatch(s=>selectBlend(s,s.blend.base,null))}/>{additives.filter(a=>s.unlockedAdditives.includes(a.id)).map(a=>{const tried=s.triedPairs.includes(`${s.blend.base}:${a.id}`);return <Button key={a.id} label={{en:`${a.name.en} · ${tried?pairCompat(s.blend.base,a.id):'First Try'}`,th:`${a.name.th} · ${tried?pairCompat(s.blend.base,a.id):'ลองครั้งแรก'}`}} onPress={()=>dispatch(s=>selectBlend(s,s.blend.base,a.id))}/>})}<Text style={styles.text}>{text({en:'Stored lots',th:'ล็อตในถัง'})}: {s.tanks.length} · {text({en:'Crude',th:'น้ำมันดิบ'})} {s.crude}</Text></>
}
