import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useLang, useSettingsContext } from '../src/hooks/SettingsContext'
import { colors, radii, spacing } from '../src/theme'
import { text } from '../src/game/translations'

type ProductKey = keyof typeof text.storeScreen.products

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
  const { t } = useLang()
  const sp = text.storeScreen
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const pName = (id: string) => t(sp.products[id as ProductKey].title)
  const pDesc = (id: string) => t(sp.products[id as ProductKey].description)

  const handlePurchase = (product: Product) => {
    Alert.alert(
      t(sp.buyTitle(pName(product.id))),
      t(sp.buyBody(pDesc(product.id), product.price)),
      [
        { text: t(text.common.cancel), style: 'cancel' },
        {
          text: t(sp.buy),
          onPress: () => {
            setPurchasing(product.id)
            setTimeout(() => {
              if (product.id === 'remove_ads') {
                update('adsRemoved', true)
              }
              setPurchasing(null)
              Alert.alert(t(sp.purchaseComplete), t(sp.purchaseThanks(pName(product.id))))
            }, 600)
          },
        },
      ],
    )
  }

  const handleRestore = () => {
    Alert.alert(t(sp.restoreTitle), t(sp.restoreBody), [{ text: 'OK' }])
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{t(text.common.back)}</Text>
        </Pressable>
        <Text style={styles.title}>{t(sp.title)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(sp.removeAdsSection)}</Text>
          <View style={styles.card}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{pName(REMOVE_ADS.id)}</Text>
              <Text style={styles.cardDescription}>{pDesc(REMOVE_ADS.id)}</Text>
            </View>
            {settings.adsRemoved ? (
              <View style={styles.ownedBadge}>
                <Text style={styles.ownedLabel}>{t(sp.owned)}</Text>
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
          <Text style={styles.sectionTitle}>{t(sp.rewardedSection)}</Text>
          <Text style={styles.note}>{t(sp.rewardedNote)}</Text>
          {REWARDED_ADS.map((ad) => (
            <View key={ad.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {pName(ad.id)} ({ad.reward})
                </Text>
                <Text style={styles.cardDescription}>{pDesc(ad.id)}</Text>
              </View>
              <View style={styles.soonBadge}>
                <Text style={styles.soonLabel}>{t(sp.soon)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t(sp.boostsSection)}</Text>
          {CONSUMABLES.map((product) => (
            <View key={product.id} style={styles.card}>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>
                  {pName(product.id)} {product.reward ? `(${product.reward})` : ''}
                </Text>
                <Text style={styles.cardDescription}>{pDesc(product.id)}</Text>
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
          <Text style={styles.restoreLabel}>{t(sp.restore)}</Text>
        </Pressable>

        <Text style={styles.note}>{t(sp.demoNote)}</Text>
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
