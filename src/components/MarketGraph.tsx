import { StyleSheet, View } from 'react-native'
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg'

import { CRUDE_COST, getCrudeMarketMultiplier } from '../game/utils/gameCalculations'
import { MARKET_BALANCE } from '../game/data/balance'
import { colors } from '../theme'

// Crude price chart. The spot price is a deterministic sine wave around the
// base cost, so we can plot recent history AND the upcoming forecast — the whole
// point of the Dynamic Market is "buy when cheap", and seeing the dip coming
// lets players actually plan it. A "now" marker splits solid past from dashed
// forecast; the base price is a dashed reference line.
const PAD_L = 6
const PAD_R = 40
const PAD_T = 10
const PAD_B = 10
const SAMPLES = 64

function priceAt(tick: number): number {
  return CRUDE_COST * getCrudeMarketMultiplier(tick)
}

export default function MarketGraph({
  tickCount,
  width,
  height = 120,
  nowLabel = 'now',
}: {
  tickCount: number
  width: number
  height?: number
  nowLabel?: string
}) {
  const period = MARKET_BALANCE.crudePeriodTicks
  const startTick = tickCount - period * 0.5
  const endTick = tickCount + period // ~½ cycle of history + a full cycle ahead
  const span = endTick - startTick

  const yMin = CRUDE_COST * (1 - MARKET_BALANCE.crudeAmplitude)
  const yMax = CRUDE_COST * (1 + MARKET_BALANCE.crudeAmplitude)

  const plotW = width - PAD_L - PAD_R
  const plotH = height - PAD_T - PAD_B
  const x = (tick: number) => PAD_L + (plotW * (tick - startTick)) / span
  const y = (price: number) => PAD_T + plotH * (1 - (price - yMin) / (yMax - yMin))

  // Build the polyline, splitting at "now" into solid (past) and dashed (forecast).
  let pastD = ''
  let futureD = ''
  for (let i = 0; i <= SAMPLES; i++) {
    const tick = startTick + (span * i) / SAMPLES
    const px = x(tick)
    const py = y(priceAt(tick))
    if (tick <= tickCount) {
      pastD += `${pastD ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)} `
    } else {
      if (!futureD) {
        // bridge from the exact "now" point so the two halves meet
        futureD += `M${x(tickCount).toFixed(1)} ${y(priceAt(tickCount)).toFixed(1)} `
      }
      futureD += `L${px.toFixed(1)} ${py.toFixed(1)} `
    }
  }

  const nowPrice = priceAt(tickCount)
  const nowX = x(tickCount)
  const nowY = y(nowPrice)
  const cheap = nowPrice <= CRUDE_COST
  const lineColor = cheap ? colors.green : colors.orange
  const baseY = y(CRUDE_COST)

  return (
    <View style={styles.wrap}>
      <Svg width={width} height={height}>
        {/* base-price reference line */}
        <Line x1={PAD_L} y1={baseY} x2={width - PAD_R} y2={baseY} stroke={colors.creamBorder} strokeWidth={1} strokeDasharray="3 3" />
        <SvgText x={width - PAD_R + 4} y={baseY + 3} fontSize={9} fill={colors.inkMuted}>${CRUDE_COST}</SvgText>

        {/* history (solid) + forecast (dashed) */}
        <Path d={pastD} stroke={colors.blue} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Path d={futureD} stroke={colors.blue} strokeWidth={2} fill="none" strokeDasharray="4 4" opacity={0.55} strokeLinejoin="round" />

        {/* now marker */}
        <Line x1={nowX} y1={PAD_T} x2={nowX} y2={height - PAD_B} stroke={colors.inkMuted} strokeWidth={1} strokeDasharray="2 3" opacity={0.5} />
        <Circle cx={nowX} cy={nowY} r={5} fill={lineColor} stroke="#fff" strokeWidth={2} />
        <SvgText x={nowX + 8} y={nowY - 8} fontSize={11} fontWeight="700" fill={lineColor}>${Math.round(nowPrice)}</SvgText>
        <SvgText x={nowX + 2} y={height - 1} fontSize={8} fill={colors.inkMuted}>{nowLabel}</SvgText>
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
})
