import { Text } from 'react-native'
import { useGame } from '../store/useGame'
import { combos } from '../data/combos'
import { buildingDef } from '../data/buildings'
import { buyHint } from '../sim/actions'
import { Button, styles } from './controls'
import { text } from '../i18n'
export function RecipeBook() {
  const { state: s, dispatch } = useGame()
  return (
    <>
      {combos.map(c => {
        const known = s.discoveredCombos.includes(c.id) || s.comboHints.includes(c.id)
        return (
          <Text key={c.id} style={styles.text}>
            {known
              ? `${text(c.name)} · ${c.members.map(id => (id === 'process' ? text({ en: 'Process unit', th: 'หน่วยผลิต' }) : text(buildingDef(id).name))).join(' + ')}`
              : '???'}{' '}
            {s.activeCombos.some(a => a.id === c.id) ? '✓' : ''}
          </Text>
        )
      })}
      {combos
        .filter(
          c => !c.hidden && !s.discoveredCombos.includes(c.id) && !s.comboHints.includes(c.id),
        )
        .map(c => (
          <Button
            key={c.id}
            label={{ en: `Buy hint: ${c.name.en} $500`, th: `ซื้อคำใบ้ ${c.name.th} $500` }}
            onPress={() => dispatch(s => buyHint(s, c.id))}
          />
        ))}
    </>
  )
}
