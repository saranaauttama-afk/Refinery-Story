import type { ComponentType } from 'react'
import { StyleSheet, View } from 'react-native'

import type { BuildingType } from '../game/types'
import { colors, radii } from '../theme'

type TileIconComponent = ComponentType<{
  size?: number | string
  color?: string
  strokeWidth?: number
}>

type BuildingSilhouetteProps = {
  type: BuildingType
  size: number
  accentColor: string
  surfaceColor: string
  Icon: TileIconComponent
}

const PRODUCT_PLANT_TYPES = new Set<BuildingType>([
  'lubricantPlant',
  'jetFuelPlant',
  'petrochemicalPlant',
  'polymerPlant',
])

function BuildingSilhouette({ type, size, accentColor, surfaceColor, Icon }: BuildingSilhouetteProps) {
  const iconSize = Math.max(12, Math.floor(size * 0.18))

  return (
    <View style={styles.root} pointerEvents="none">
      <View style={[styles.platformShadow, { width: size * 0.62 }]} />
      <View style={[styles.platform, { width: size * 0.66, backgroundColor: surfaceColor, borderColor: accentColor }]} />
      {type === 'crudeTank' || type === 'productTank' || type === 'lubricantTank' || type === 'jetFuelTank' || type === 'petrochemicalTank' || type === 'pelletSilo' ? (
        <View style={styles.storageWrap}>
          <View style={[styles.storageTankBack, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
          <View style={[styles.storageTank, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <View style={[styles.storageTankTop, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
            <Icon color={accentColor} size={iconSize} strokeWidth={2.2} />
          </View>
        </View>
      ) : type === 'distillationUnit' ? (
        <View style={styles.distillationWrap}>
          <View style={[styles.distillationTowerTall, { backgroundColor: colors.white, borderColor: accentColor }]} />
          <View style={[styles.distillationTowerMid, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
          <View style={[styles.distillationBand, { backgroundColor: accentColor }]} />
          <View style={[styles.distillationCore, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <Icon color={accentColor} size={iconSize} strokeWidth={2.1} />
          </View>
        </View>
      ) : PRODUCT_PLANT_TYPES.has(type) ? (
        <View style={styles.factoryWrap}>
          <View style={[styles.factoryBody, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <View style={[styles.factoryRoof, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
            <View style={[styles.factoryStackLeft, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
            <View style={[styles.factoryStackRight, { backgroundColor: colors.white, borderColor: accentColor }]} />
            <Icon color={accentColor} size={iconSize} strokeWidth={2.1} />
          </View>
        </View>
      ) : type === 'laboratory' ? (
        <View style={styles.labWrap}>
          <View style={[styles.labBody, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <View style={[styles.labCap, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
            <Icon color={accentColor} size={iconSize + 1} strokeWidth={2.1} />
          </View>
        </View>
      ) : type === 'maintenanceWorkshop' || type === 'salesOffice' ? (
        <View style={styles.supportWrap}>
          <View style={[styles.supportBody, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <View style={[styles.supportRoof, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
            <Icon color={accentColor} size={iconSize} strokeWidth={2.1} />
          </View>
        </View>
      ) : type === 'powerPlant' ? (
        <View style={styles.powerWrap}>
          <View style={[styles.powerStack, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
          <View style={[styles.powerBody, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <Icon color={accentColor} size={iconSize + 1} strokeWidth={2.2} />
          </View>
        </View>
      ) : (
        <View style={styles.wasteWrap}>
          <View style={[styles.wasteVat, { backgroundColor: colors.white, borderColor: accentColor }]}>
            <View style={[styles.wasteCap, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
            <Icon color={accentColor} size={iconSize} strokeWidth={2.1} />
          </View>
          <View style={[styles.wasteSideTank, { backgroundColor: surfaceColor, borderColor: accentColor }]} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  platformShadow: {
    position: 'absolute',
    bottom: 10,
    height: 8,
    borderRadius: radii.pill,
    backgroundColor: '#00000014',
  },
  platform: {
    position: 'absolute',
    bottom: 12,
    height: 10,
    borderRadius: radii.pill,
    borderWidth: 1.2,
  },
  storageWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 44,
    height: 44,
  },
  storageTankBack: {
    position: 'absolute',
    right: 3,
    bottom: 13,
    width: 12,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.2,
    opacity: 0.85,
  },
  storageTank: {
    width: 22,
    height: 28,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storageTankTop: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 8,
    borderRadius: 8,
    borderWidth: 1.2,
  },
  distillationWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  distillationTowerTall: {
    position: 'absolute',
    left: 8,
    bottom: 14,
    width: 10,
    height: 24,
    borderRadius: 5,
    borderWidth: 1.3,
  },
  distillationTowerMid: {
    position: 'absolute',
    left: 19,
    bottom: 14,
    width: 12,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.3,
  },
  distillationBand: {
    position: 'absolute',
    left: 14,
    bottom: 24,
    width: 16,
    height: 3,
    borderRadius: radii.pill,
  },
  distillationCore: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 16,
    height: 14,
    borderRadius: radii.sm,
    borderWidth: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factoryWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  factoryBody: {
    width: 30,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factoryRoof: {
    position: 'absolute',
    top: -6,
    width: 22,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.2,
  },
  factoryStackLeft: {
    position: 'absolute',
    left: 5,
    top: -10,
    width: 6,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.1,
  },
  factoryStackRight: {
    position: 'absolute',
    right: 6,
    top: -8,
    width: 6,
    height: 8,
    borderRadius: 3,
    borderWidth: 1.1,
  },
  labWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  labBody: {
    width: 26,
    height: 28,
    borderRadius: 13,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labCap: {
    position: 'absolute',
    top: -5,
    width: 12,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.1,
  },
  supportWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  supportBody: {
    width: 30,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportRoof: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.1,
  },
  powerWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  powerStack: {
    position: 'absolute',
    right: 8,
    bottom: 15,
    width: 8,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.2,
  },
  powerBody: {
    position: 'absolute',
    left: 8,
    bottom: 14,
    width: 24,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wasteWrap: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  wasteVat: {
    position: 'absolute',
    left: 8,
    bottom: 14,
    width: 24,
    height: 22,
    borderRadius: radii.md,
    borderWidth: 1.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wasteCap: {
    position: 'absolute',
    top: -4,
    width: 18,
    height: 6,
    borderRadius: 4,
    borderWidth: 1.1,
  },
  wasteSideTank: {
    position: 'absolute',
    right: 7,
    bottom: 14,
    width: 8,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.1,
  },
})

export default BuildingSilhouette
