import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { reduceV3Action } from '../../game/v3/actions'
import { V3_CRUDE_PRICE_CENTS } from '../../game/v3/data'
import { getV3CrudeUnitPriceCents } from '../../game/v3/fame'
import { getV3CrudeCapacity } from '../../game/v3/productInventory'
import type { V3Action, V3ActionEvent, V3GameState } from '../../game/v3/types'
import { fonts, pixelUi } from '../../theme'

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
  const unitCents = getV3CrudeUnitPriceCents(state)
  const affordable = Math.floor(state.world.moneyCents / unitCents)
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
        {t({ en: 'Stock', th: 'คงเหลือ' })}: {state.world.crudeOil.toFixed(1)}/{Math.floor(capacity)} · ${(unitCents / 100).toFixed(2)}/{t({ en: 'unit', th: 'หน่วย' })}{unitCents < V3_CRUDE_PRICE_CENTS ? ` (${t({ en: 'fame discount', th: 'ส่วนลดชื่อเสียง' })} −${Math.round((1 - unitCents / V3_CRUDE_PRICE_CENTS) * 100)}%)` : ''}
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
                <Text style={styles.price}>${((option.quantity * unitCents) / 100).toFixed(0)}</Text>
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
  card: { backgroundColor: pixelUi.surface, borderWidth: 2, borderColor: pixelUi.border, padding: 14, gap: 10 },
  title: { color: pixelUi.accent, fontFamily: fonts.brandDisplay, fontSize: 18 },
  row: { color: pixelUi.text, fontFamily: fonts.body, fontSize: 13 },
  buttons: { flexDirection: 'row', gap: 6 },
  gate: { flex: 1, minWidth: 0 },
  button: { backgroundColor: pixelUi.surfaceRaised, borderWidth: 2, borderColor: pixelUi.border, paddingVertical: 10, paddingHorizontal: 3, alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  buttonText: { color: pixelUi.text, fontFamily: fonts.brandHeading, fontSize: 12, textAlign: 'center' },
  price: { color: pixelUi.accent, fontFamily: fonts.brandHeading, fontSize: 12 },
  reason: { color: pixelUi.warning, fontSize: 11, marginTop: 2 },
  disabled: { opacity: 0.45 },
})
