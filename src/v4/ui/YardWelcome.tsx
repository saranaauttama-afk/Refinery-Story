import { Pressable, StyleSheet, Text, View } from 'react-native'
import { text } from '../i18n'
import { GameIcon } from './GameIcon'
import { Enamel } from './GameChrome'
import { ui } from './theme'
export function YardWelcome({ count, onBuild }: { count: number; onBuild: () => void }) {
  return (
    <View style={s.card}>
      <Enamel />
      <GameIcon name="build" size={34} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={s.title}>{text({ en: 'YOUR LITTLE REFINERY', th: 'โรงกลั่นของคุณ' })}</Text>
        <Text style={s.caption}>
          {text({
            en: count + ' things placed · room for more',
            th: 'จัดวางแล้ว ' + count + ' ชิ้น',
          })}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text({ en: 'Open Build', th: 'เปิดเมนูสร้าง' })}
        onPress={onBuild}
        style={s.button}
      >
        <Enamel />
        <Text style={s.buttonText}>{text({ en: 'Build', th: 'สร้าง' })}</Text>
      </Pressable>
    </View>
  )
}
const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 72,
    padding: 8,
    backgroundColor: ui.paper,
    borderWidth: 3,
    borderColor: ui.ink,
    borderRadius: 9,
    boxShadow: '0px 3px 0px #173548',
  },
  title: { fontFamily: 'Kanit_600SemiBold', fontSize: 15, color: ui.navy },
  caption: { fontFamily: 'Kanit_400Regular', fontSize: 12, color: ui.muted },
  button: {
    minHeight: 44,
    minWidth: 58,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ui.build,
    borderWidth: 2,
    borderColor: ui.ink,
    borderRadius: 6,
  },
  buttonText: { fontFamily: 'Kanit_600SemiBold', fontSize: 17, color: ui.ink },
})
