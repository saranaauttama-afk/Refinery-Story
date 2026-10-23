import { Pressable, StyleSheet, Text, View } from 'react-native'
import { text } from '../i18n'
import { Enamel } from './GameChrome'
import { GameIcon, type GameIconName } from './GameIcon'
import { ui } from './theme'
const tabs = [
  { id: 'build', en: 'Build', th: 'สร้าง', color: ui.build },
  { id: 'blend', en: 'Products', th: 'สินค้า', color: ui.blend },
  { id: 'lab', en: 'Lab', th: 'แล็บ', color: '#9C5BD6' },
  { id: 'staff', en: 'Staff', th: 'ทีมงาน', color: ui.staff },
  { id: 'customers', en: 'Customers', th: 'ลูกค้า', color: ui.customers },
  { id: 'company', en: 'Company', th: 'บริษัท', color: ui.company },
]
export function GameDock({
  active,
  onTab,
  customerNotice,
}: {
  active: string
  onTab: (id: string) => void
  customerNotice: boolean
}) {
  return (
    <View accessibilityRole="tablist" style={s.dock}>
      {tabs.map(tab => {
        const selected = active === tab.id
        const orange = selected || (!active && tab.id === 'build')
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={text(tab)}
            accessibilityState={{ selected }}
            aria-selected={selected}
            onPress={() => onTab(tab.id)}
            style={({ pressed }) => [
              s.tab,
              { backgroundColor: orange ? '#F59A22' : ui.paper },
              pressed && { transform: [{ translateY: 2 }] },
            ]}
          >
            <Enamel />
            {selected && <View style={[s.marker, { backgroundColor: tab.color }]} />}
            <GameIcon name={tab.id as GameIconName} size={24} />
            <Text numberOfLines={1} style={[s.label, orange && { color: '#132E40' }]}>
              {text(tab)}
            </Text>
            {tab.id === 'customers' && customerNotice && <View style={s.notice} />}
          </Pressable>
        )
      })}
    </View>
  )
}
const s = StyleSheet.create({
  dock: {
    height: ui.dockHeight,
    flexDirection: 'row',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 3,
    backgroundColor: '#23465D',
    borderTopWidth: 2,
    borderColor: ui.ink,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
    borderWidth: 1.5,
    borderColor: ui.ink,
    borderRadius: 7,
    boxShadow: '0px 2px 0px #102B3A',
    overflow: 'hidden',
  },
  label: { fontFamily: 'Kanit_600SemiBold', fontSize: 11, lineHeight: 14, color: ui.navy },
  marker: { position: 'absolute', bottom: 2, left: 8, right: 8, height: 2 },
  notice: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 4,
    backgroundColor: ui.blend,
  },
})
