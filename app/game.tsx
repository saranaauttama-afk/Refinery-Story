import { Link } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { copy, text } from '../src/v4/i18n'

export default function GameScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>{text(copy.placeholder)}</Text>
      <Link href="/" style={styles.link}>{text(copy.back)}</Link>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 24, backgroundColor: '#FFF6E3' },
  title: { fontFamily: 'Baloo2_700Bold', fontSize: 24, color: '#14110F', textAlign: 'center' },
  link: { fontFamily: 'Baloo2_400Regular', fontSize: 18, color: '#2F7DB8', padding: 12 },
})
