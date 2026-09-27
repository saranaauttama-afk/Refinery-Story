import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

import { colors } from '../theme'

// A tiny session growth chart — plots a numeric series (cash over time) as an
// auto-scaled SVG line. Pure presentational; the parent supplies the series.
const PAD = 6

export default function HistoryGraph({
  data,
  width,
  height = 90,
  color = colors.green,
  emptyLabel = '—',
}: {
  data: number[]
  width: number
  height?: number
  color?: string
  emptyLabel?: string
}) {
  if (data.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const plotW = width - PAD * 2
  const plotH = height - PAD * 2
  const x = (i: number) => PAD + (plotW * i) / (data.length - 1)
  const y = (v: number) => PAD + plotH * (1 - (v - min) / range)

  let d = ''
  data.forEach((v, i) => {
    d += `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `
  })
  // area fill under the line
  const areaD = `${d}L${x(data.length - 1).toFixed(1)} ${(height - PAD).toFixed(1)} L${PAD} ${(height - PAD).toFixed(1)} Z`

  const lastX = x(data.length - 1)
  const lastY = y(data[data.length - 1])

  return (
    <Svg width={width} height={height}>
      <Path d={areaD} fill={color} opacity={0.12} />
      <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={lastX} cy={lastY} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
    </Svg>
  )
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.inkMuted, fontSize: 12 },
})
