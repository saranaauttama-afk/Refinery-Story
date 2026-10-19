import { Text } from 'react-native'
import { useGame } from '../store/useGame'
import { customers } from '../data/customers'
import { bases } from '../data/bases'
import { customerUnlocked,roadPath } from '../sim/systems/customers'
import { acceptContract,deliverContract } from '../sim/actions'
import { Button,styles } from './controls'
import { text } from '../i18n'
export function CustomersPanel(){const {state:s,dispatch}=useGame();return <><Text style={styles.text}>{text({en:roadPath(s).length?'Road connected':'Connect gate to loading bay with roads',th:roadPath(s).length?'ถนนเชื่อมต่อแล้ว':'เชื่อมถนนจากประตูถึงลานจ่ายสินค้า'})}</Text><Text style={styles.heading}>{text({en:'Contracts',th:'สัญญา'})}</Text>{s.contracts.offers.map(c=><Button key={c.uid} label={{en:`Accept ${c.base} ${c.units} ${c.minGrade}`,th:`รับสัญญา ${text(bases.find(b=>b.id===c.base)!.name)} ${c.units} หน่วย เกรด ${c.minGrade}`}} onPress={()=>dispatch(s=>acceptContract(s,c.uid))}/>)}{s.contracts.active.map(c=><Button key={c.uid} label={{en:`Deliver ${c.base} (${c.delivered}/${c.units})`,th:`ส่งมอบ ${text(bases.find(b=>b.id===c.base)!.name)} (${c.delivered}/${c.units}) · เหลือ ${Math.max(0,c.deadline-s.tick)} ticks`}} onPress={()=>dispatch(s=>deliverContract(s,c.uid))}/>)}{customers.filter(c=>customerUnlocked(s,c)).map(c=><Text style={styles.text} key={c.id}>{text(c.name)} · {text(bases.find(b=>b.id===c.base)!.name)} ≥{c.minGrade} · ♥{s.customers[c.id]?.hearts??0}{s.customers[c.id]?.giftGiven?' 🎁':''}</Text>)}</>}
