import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_CRUDE_PRICE_CENTS } from '../../game/v3/data'
import { getV3CrudeCapacity } from '../../game/v3/productInventory'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { fonts } from '../../theme'

type Props = {
  state: V3GameState
  apply: (action: V3Action) => void
  t: (value: BilingualTextValue) => string
  describe: (event: V3ActionEvent | null) => string
}

/** Crude purchasing: the only raw-material input, always reachable from the Supply sheet. */
export function V3SupplyPanel({ state, apply, t, describe }: Props) {
  const capacity = getV3CrudeCapacity(state)
  const room = Math.max(0, Math.floor(capacity - state.world.crudeOil + 1e-8))
  const affordable = Math.floor(state.world.moneyCents / V3_CRUDE_PRICE_CENTS)
  const fill = Math.min(room, affordable)
  const options = [
    { label: { en: 'Buy 5', th: 'ซื้อ 5' }, quantity: 5 },
    { label: { en: 'Buy 20', th: 'ซื้อ 20' }, quantity: 20 },
    { label: { en: `Fill tank (${fill})`, th: `เติมเต็มถัง (${fill})` }, quantity: Math.max(1, fill) },
  ]
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{t({ en: 'Buy crude oil', th: 'ซื้อน้ำมันดิบ' })}</Text>
      <Text style={styles.row}>
        {t({ en: 'Stock', th: 'คงเหลือ' })}: {state.world.crudeOil.toFixed(1)}/{Math.floor(capacity)} · ${(V3_CRUDE_PRICE_CENTS / 100).toFixed(0)}/{t({ en: 'unit', th: 'หน่วย' })}
      </Text>
      <View style={styles.buttons}>
        {options.map((option) => {
          const action = { type: 'trade', direction: 'buy', product: 'crude', quantity: option.quantity, sequence: state.nextActionSequence } as V3Action
          const result = reduceV3Action(state, action)
          const blocked = result.events[0]?.tone === 'success' ? null : result.events[0] ?? null
          return (
            <View key={option.label.en} style={styles.gate}>
              <Pressable
                accessibilityState={{ disabled: Boolean(blocked) }}
                disabled={Boolean(blocked)}
                onPress={() => apply(action)}
                style={[styles.button, blocked && styles.disabled]}
              >
                <Text style={styles.buttonText}>{t(option.label)}</Text>
                <Text style={styles.price}>${((option.quantity * V3_CRUDE_PRICE_CENTS) / 100).toFixed(0)}</Text>
              </Pressable>
              {blocked && <Text style={styles.reason}>{describe(blocked)}</Text>}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#6ACDB4', borderRadius: 10, padding: 12, gap: 8 },
  title: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { color: '#D5E2E9', fontSize: 13 },
  buttons: { flexDirection: 'row', gap: 6 },
  gate: { flex: 1 },
  button: { backgroundColor: '#1D4F45', borderWidth: 1, borderColor: '#6ACDB4', borderRadius: 8, paddingVertical: 10, alignItems: 'center', minHeight: 52, justifyContent: 'center' },
  buttonText: { color: '#E8F0F4', fontFamily: fonts.heading, fontSize: 13 },
  price: { color: '#FFD447', fontSize: 11 },
  reason: { color: '#FFAD8A', fontSize: 11, marginTop: 2 },
  disabled: { opacity: 0.45 },
})
