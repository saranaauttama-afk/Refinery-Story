import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { copy, text } from '../src/v4/i18n'

export default function TitleScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.panel}>
        <Text style={styles.title}>{text(copy.title)}</Text>
        <Text style={styles.version}>V4-M0</Text>
        <Link href="/game" asChild>
          <Pressable accessibilityRole="button" style={styles.button}>
            <Text style={styles.buttonText}>{text(copy.newGame)}</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#8DBF5A', justifyContent: 'center', padding: 24 },
  panel: { backgroundColor: '#FFF6E3', borderColor: '#14110F', borderWidth: 2, borderRadius: 6, padding: 24, alignItems: 'center', gap: 16 },
  title: { fontFamily: 'PixelifySans_700Bold', fontSize: 36, color: '#14110F', textAlign: 'center' },
  version: { fontFamily: 'PixelifySans_700Bold', color: '#73818F', fontSize: 18 },
  button: { backgroundColor: '#F08A24', borderWidth: 2, borderColor: '#14110F', borderRadius: 6, paddingHorizontal: 32, paddingVertical: 12 },
  buttonText: { fontFamily: 'Baloo2_700Bold', fontSize: 22, color: '#14110F' },
})
