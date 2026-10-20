import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react-native'
import { View, Text, Pressable } from 'react-native'
import { useGame } from '../store/useGame'
import { hints, type HintStep } from '../data/onboarding'
import { roadPath } from '../sim/systems/customers'
import type { GameState } from '../sim/types'
import { text } from '../i18n'
import { styles } from './controls'
import { buildingDef } from '../data/buildings'
import { canBorrow, takeLoan } from '../sim/actions'
import { LOAN } from '../data/balance'

const has = (s: GameState, id: string) => s.yard.buildings.some(b => b.defId === id)

function stepDone(s: GameState, step: HintStep): boolean {
  switch (step.id) {
    case 'gate':
      return has(s, 'gate')
    case 'road':
      return roadPath(s).length > 0
    case 'crude':
      return has(s, 'crudeTank') && has(s, 'cdu')
    case 'blend':
      return has(s, 'blend') && has(s, 'tank')
    case 'sale':
      return s.year.sold > 0 || s.history.awards.length > 0
    case 'recipe':
      return s.triedPairs.length >= 2
  }
}

// First step that is neither done nor skipped; null once the guide is finished.
export function currentHint(s: GameState): number | null {
  for (let i = s.hintIndex; i < hints.length; i++) if (!stepDone(s, hints[i])) return i
  return null
}

// Next building this step still needs, with its suggested tile.
export function nextPlacement(s: GameState, index: number) {
  return hints[index].place.find(p => !has(s, p.id))
}

export function Onboarding({ onPlace }: { onPlace: (id: string, x: number, y: number) => void }) {
  const { state: s, dispatch } = useGame()
  const [expanded, setExpanded] = useState(true)
  const index = currentHint(s)
  if (index === null) return null
  const step = hints[index]
  const target = nextPlacement(s, index)
  // Out of cash mid-setup: offer a start-up loan instead of a dead end.
  const shortOfCash = !!target && canBorrow(s, buildingDef(target.id).cost)
  return (
    <View
      style={{
        backgroundColor: '#F5E8C7',
        padding: 8,
        borderBottomWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text({ en: 'Toggle guide', th: 'ย่อหรือขยายคำแนะนำ' })}
          onPress={() => setExpanded(!expanded)}
          style={{ flexDirection: 'row', alignItems: 'center', minHeight: 40, gap: 4 }}
        >
          <Text style={[styles.heading, { fontSize: 14, flex: 1 }]}>
            {text({
              en: `STARTER GUIDE ${index + 1}/${hints.length}`,
              th: `เริ่มโรงกลั่น ${index + 1}/${hints.length}`,
            })}
          </Text>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Pressable>
        {expanded && (
          <Text numberOfLines={3} style={[styles.text, { fontSize: 13, lineHeight: 19 }]}>
            {text(step)}
          </Text>
        )}
      </View>
      {shortOfCash && (
        <Pressable
          accessibilityRole="button"
          onPress={() => dispatch(takeLoan)}
          style={{
            backgroundColor: '#2FB38E',
            borderWidth: 2,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
            minHeight: 40,
            justifyContent: 'center',
          }}
        >
          <Text style={styles.text}>
            {text({
              en: `Borrow $${LOAN.amount.toLocaleString()}`,
              th: `กู้ $${LOAN.amount.toLocaleString()}`,
            })}
          </Text>
        </Pressable>
      )}
      {target && !shortOfCash && (
        <Pressable
          accessibilityRole="button"
          onPress={() => onPlace(target.id, target.x, target.y)}
          style={{
            backgroundColor: '#F2C230',
            borderWidth: 2,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 4,
            minHeight: 40,
            justifyContent: 'center',
          }}
        >
          <Text style={styles.text}>{text({ en: 'Place', th: 'วาง' })}</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        style={{ minWidth: 40, minHeight: 40, justifyContent: 'center' }}
        onPress={() => dispatch(s => ({ ...s, hintIndex: index + 1 }))}
      >
        <Text style={styles.text}>{text({ en: 'Skip', th: 'ข้าม' })} ›</Text>
      </Pressable>
    </View>
  )
}
