import { useState } from 'react'
import { Text, View, Pressable } from 'react-native'
import { useGame } from '../store/useGame'
import { buyLand } from '../sim/actions'
import { YARD } from '../data/balance'
import { styles } from './controls'
import { Card, Row, SmallButton, Muted } from './cards'
import { text } from '../i18n'
import type { GameState } from '../sim/types'

const GRID = YARD.maxSize / YARD.parcel
const parcelCap = (s: GameState) => (s.rank >= 8 ? 25 : s.rank >= 6 ? 16 : s.rank >= 4 ? 9 : 5)

export function LandPanel() {
  const { state: s, dispatch } = useGame()
  const [picked, setPicked] = useState<{ x: number; y: number }>()
  const owned = (x: number, y: number) => s.yard.ownedParcels.includes(`${x},${y}`)
  const buyable = (x: number, y: number) => buyLand(s, x, y) !== s
  const adjacent = (x: number, y: number) =>
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) => owned(x + dx, y + dy))
  const reason = (x: number, y: number) => {
    if (owned(x, y)) return text({ en: 'Already yours', th: 'เป็นของเราแล้ว' })
    if (s.rank < 2) return text({ en: 'Needs rank 2', th: 'ต้องถึงแรงก์ 2' })
    if (!adjacent(x, y)) return text({ en: 'Must touch your land', th: 'ต้องติดกับที่ดินเดิม' })
    if (s.yard.ownedParcels.length >= parcelCap(s))
      return text({ en: 'Rank up to own more', th: 'ขึ้นแรงก์เพื่อซื้อเพิ่ม' })
    if (s.money < YARD.landCost) return text({ en: 'Not enough money', th: 'เงินไม่พอ' })
    return ''
  }
  return (
    <>
      <Muted>
        {text({
          en: `Each parcel is ${YARD.parcel}×${YARD.parcel} tiles · you own ${s.yard.ownedParcels.length} of ${parcelCap(s)} allowed at this rank`,
          th: `แปลงละ ${YARD.parcel}×${YARD.parcel} ช่อง · มีแล้ว ${s.yard.ownedParcels.length} จาก ${parcelCap(s)} แปลงที่แรงก์นี้ซื้อได้`,
        })}
      </Muted>
      <View style={{ alignSelf: 'center', marginVertical: 10, gap: 4 }}>
        {Array.from({ length: GRID }, (_, y) => (
          <View key={y} style={{ flexDirection: 'row', gap: 4 }}>
            {Array.from({ length: GRID }, (_, x) => {
              const mine = owned(x, y)
              const open = buyable(x, y)
              const on = picked?.x === x && picked?.y === y
              return (
                <Pressable
                  key={x}
                  accessibilityRole="button"
                  accessibilityLabel={`${x},${y}`}
                  onPress={() => setPicked({ x, y })}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 4,
                    borderWidth: on ? 3 : 2,
                    borderStyle: open && !mine ? 'dashed' : 'solid',
                    borderColor: mine || open ? '#14110F' : '#9E978A',
                    backgroundColor: mine
                      ? '#8DBF5A'
                      : on
                        ? '#F2C230'
                        : open
                          ? '#FFE7A3'
                          : '#D8D2C4',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {open && !mine && (
                    <Text style={{ fontFamily: 'PixelifySans_700Bold', fontSize: 18 }}>+</Text>
                  )}
                </Pressable>
              )
            })}
          </View>
        ))}
      </View>
      <Row gap={12}>
        <Muted>■ {text({ en: 'green: yours', th: 'เขียว: ของเรา' })}</Muted>
        <Muted>■ {text({ en: 'dashed: can buy', th: 'เส้นประ: ซื้อได้' })}</Muted>
        <Muted>■ {text({ en: 'grey: not yet', th: 'เทา: ยังไม่ได้' })}</Muted>
      </Row>
      {picked && (
        <Card>
          <Row>
            <Text style={[styles.heading, { flex: 1 }]}>
              {text({ en: `Parcel ${picked.x}, ${picked.y}`, th: `แปลง ${picked.x}, ${picked.y}` })}
            </Text>
            <Text style={styles.heading}>${YARD.landCost.toLocaleString()}</Text>
          </Row>
          {reason(picked.x, picked.y) ? (
            <Muted>{reason(picked.x, picked.y)}</Muted>
          ) : (
            <SmallButton
              label={text({ en: 'Buy this parcel', th: 'ซื้อแปลงนี้' })}
              onPress={() => {
                dispatch(s => buyLand(s, picked.x, picked.y))
                setPicked(undefined)
              }}
            />
          )}
        </Card>
      )}
    </>
  )
}
