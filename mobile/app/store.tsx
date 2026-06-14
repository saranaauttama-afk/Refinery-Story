import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useSettingsContext } from '../src/hooks/SettingsContext'
import { colors, radii, spacing } from '../src/theme'

type Product = {
  id: string
  title: string
  description: string
  price: string
  reward?: string
}

type RewardedAd = {
  id: string
  title: string
  reward: string
  description: string
}

const REMOVE_ADS: Product = {
  id: 'remove_ads',
  title: 'Remove Ads',
  description: 'Removes all ads, forever. One-time purchase.',
  price: '$2.99',
}

const REWARDED_ADS: RewardedAd[] = [
  {
    id: 'rewarded_cash',
    title: 'Watch Ad for Cash',
    reward: '+$500',
    description: 'Watch a short video ad for an instant cash bonus.',
  },
  {
    id: 'rewarded_double',
    title: 'Watch Ad for 2x Boost',
    reward: '2x rewards for 10 min',
    description: 'Watch a short video ad to double contract/event rewards for a limited time.',
  },
]

const CONSUMABLES: Product[] = [
  {
    id: 'cash_small',
    title: 'Starter Cash Pack',
    description: 'A small cash injection to speed up your early game.',
    price: '$0.99',
    reward: '+$5,000',
  },
  {
    id: 'cash_large',
    title: 'Investor Cash Pack',
    description: 'A larger cash injection for mid-game expansion.',
    price: '$4.99',
    reward: '+$50,000',
  },
  {
    id: 'rp_pack',
    title: 'Research Grant',
    description: 'Bonus research points to unlock upgrades faster.',
    price: '$1.99',
    reward: '+25 RP',
  },
]

// Mock store -- no real payment SDK wired up. Purchases are simulated via
// Alert confirmation and apply their effect directly to the local save.
export default function StoreScreen() {
  const router = useRouter()
  const { settings, update } = useSettingsContext()
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const handlePurchase = (product: Product) => {
    Alert.alert(
      `Buy ${product.title}?`,
      `${product.description}\n\nPrice: ${product.price}\n\n(This is a demo -- no real payment will be made.)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            setPurchasing(product.id)
            setTimeout(() => {
              if (product.id === 'remove_ads') {
                update('adsRemoved', true)
              }
              setPurchasing(null)
              Alert.alert('Purchase complete', `Thanks for supporting Refinery Story! (${product.title})`)
            }, 600)
          },
        },
      ],
    )
  }

  const handleRestore = () => {
    Alert.alert('Restore purchases', 'No previous purchases found on this device.', [{ text: 'OK' }])
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Store</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remove Ads</Text>
          <View style={styles.card}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{REMOVE_ADS.title}</Text>
              <Text style={styles.cardDescription}>{REMOVE_ADS.description}</Text>
            </View>
            {settings.adsRemoved ? (
              <View style={styles.ownedBadge}>
                <Text style={styles.ownedLabel}>Owned</Text>
              </View>
            ) : (
              <Pressable
                style={styles.buyButton}
                disabled={purchasing === REMOVE_ADS.id}
                onPress={() => handlePurchase(REMOVE_ADS)}
              >
                <Text style={styles.buyLabel}>{REMOVE_ADS.price}</Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewarded Ads</Text>
          <Text style={styles.note}>Coming soon -- watch a short video ad to earn these rewards for free.</Text>
          {REWARDED_ADS.map((ad) => (
            <View key={ad.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {ad.title} ({ad.reward})
                </Text>
                <Text style={styles.cardDescription}>{ad.description}</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonLabel}>Soon</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Boosts</Text>
          {CONSUMABLES.map((product) => (
            <View key={product.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {product.title} {product.reward ? `(${product.reward})` : ''}
                </Text>
                <Text style={styles.cardDescription}>{product.description}</Text>
              </View>
              <Pressable
                style={styles.buyButton}
                disabled={purchasing === product.id}
                onPress={() => handlePurchase(product)}
              >
                <Text style={styles.buyLabel}>{product.price}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable style={styles.restoreButton} onPress={handleRestore}>
          <Text style={styles.restoreLabel}>Restore Purchases</Text>
        </Pressable>

        <Text style={styles.note}>
          Demo store -- no real payment processor is connected. "Remove Ads" persists locally; the cash/RP boosts
          above are for illustration only and don't currently grant rewards.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  back: {
    fontSize: 15,
    color: colors.blue,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '800',
    color: colors.ink,
    fontSize: 14,
  },
  cardDescription: {
    color: colors.inkMuted,
    fontSize: 12,
    marginTop: 2,
  },
  buyButton: {
    backgroundColor: colors.gold,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buyLabel: {
    fontWeight: '800',
    color: colors.ink,
  },
  ownedBadge: {
    backgroundColor: colors.green,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  ownedLabel: {
    fontWeight: '800',
    color: colors.ink,
  },
  soonBadge: {
    backgroundColor: colors.cream,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.creamBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  soonLabel: {
    fontWeight: '700',
    color: colors.inkMuted,
    fontSize: 12,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  restoreLabel: {
    color: colors.blue,
    fontWeight: '700',
  },
  note: {
    color: colors.inkMuted,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
  },
})
