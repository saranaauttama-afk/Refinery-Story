import { StyleSheet, Text, View } from 'react-native'

import type { BilingualTextValue } from '../../game/types'
import { V3_SPOT_PRICE_CENTS } from '../../game/v3/data'
import { getV3HotFamily, getV3MarketForecast } from '../../game/v3/market'
import type { V3GameState, V3ProductFamily } from '../../game/v3/types'
import { getV3Calendar } from '../../game/v3/yardView'
import { fonts } from '../../theme'

const NAMES: Record<V3ProductFamily, BilingualTextValue> = {
  gasoline: { en: 'Gasoline', th: 'เบนซิน' },
  lubricants: { en: 'Lubricants', th: 'น้ำมันหล่อลื่น' },
  jetFuel: { en: 'Jet fuel', th: 'น้ำมันเครื่องบิน' },
  petrochemicals: { en: 'Petrochemicals', th: 'ปิโตรเคมี' },
  plasticPellets: { en: 'Plastic pellets', th: 'เม็ดพลาสติก' },
}

/** Spot market board: this month's price and a 3-month forecast per family. */
export function V3MarketPanel({ state, t }: { state: V3GameState; t: (value: BilingualTextValue) => string }) {
  const calendar = getV3Calendar(state.world.tickCount)
  const hot = getV3HotFamily(calendar.year)
  return (
    <View style={styles.card}>
      <Text style={styles.title}>📈 {t({ en: 'Spot market', th: 'ตลาดขายทันที' })}</Text>
      <Text style={styles.muted}>{t({
        en: `Prices follow the seasons. Product of year ${calendar.year}: ${NAMES[hot].en} (+10%). Contract quotes are not affected.`,
        th: `ราคาขึ้นลงตามฤดู สินค้าแห่งปีที่ ${calendar.year}: ${NAMES[hot].th} (+10%) ราคางานลูกค้าไม่เปลี่ยนตามตลาด`,
      })}</Text>
      {(Object.keys(NAMES) as V3ProductFamily[]).map((family) => {
        const forecast = getV3MarketForecast(state, family, 3)
        const now = forecast[0]
        const trend = forecast[1] > now + 0.005 ? '↑' : forecast[1] < now - 0.005 ? '↓' : '→'
        return (
          <View key={family} style={styles.row}>
            <Text style={[styles.name, family === hot && styles.hot]}>{family === hot ? '🔥 ' : ''}{t(NAMES[family])}</Text>
            <Text style={[styles.price, now >= 1.1 ? styles.up : now <= 0.9 ? styles.down : null]}>
              ${(V3_SPOT_PRICE_CENTS[family] * now / 100).toFixed(2)} ({Math.round(now * 100)}%) {trend}
            </Text>
            <Text style={styles.forecast}>{forecast.slice(1).map((value) => `${Math.round(value * 100)}`).join(' · ')}</Text>
          </View>
        )
      })}
      <Text style={styles.muted}>{t({ en: 'Right column: next 3 months (% of list price).', th: 'คอลัมน์ขวา: 3 เดือนถัดไป (% ของราคาปกติ)' })}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0D2B40', borderWidth: 1, borderColor: '#274B63', borderRadius: 10, padding: 12, gap: 6 },
  title: { color: '#FFD447', fontFamily: fonts.heading, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#D5E2E9', fontSize: 13, flex: 1.2 },
  hot: { color: '#FFAD8A', fontFamily: fonts.heading },
  price: { color: '#E8F0F4', fontSize: 13, flex: 1.4, fontFamily: fonts.heading },
  up: { color: '#6ACDB4' },
  down: { color: '#FF8A7A' },
  forecast: { color: '#8FA9BA', fontSize: 11, flex: 1 },
  muted: { color: '#8FA9BA', fontSize: 11, lineHeight: 16 },
})
