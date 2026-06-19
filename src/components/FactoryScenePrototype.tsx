import { StyleSheet, Text, View } from 'react-native'
import Svg, { Path, Rect } from 'react-native-svg'

import { colors, radii, spacing } from '../theme'

type FactoryScenePrototypeProps = {
  nightMode?: boolean
}

function TankCluster({
  left,
  top,
  scale = 1,
  accent,
}: {
  left: number
  top: number
  scale?: number
  accent: string
}) {
  const size = 56 * scale
  return (
    <View style={[styles.cluster, { left, top }]}>
      <View style={[styles.tankLarge, { width: size, height: size, borderColor: accent }]} />
      <View
        style={[
          styles.tankMedium,
          { width: size * 0.78, height: size * 0.78, left: size * 0.62, top: size * 0.1, borderColor: accent },
        ]}
      />
      <View
        style={[
          styles.tankSmall,
          { width: size * 0.62, height: size * 0.62, left: size * 0.28, top: size * 0.62, borderColor: accent },
        ]}
      />
      <View style={[styles.tankShadow, { width: size * 2, top: size * 1.16 }]} />
    </View>
  )
}

function ProcessTower({
  left,
  top,
  height,
  accent,
}: {
  left: number
  top: number
  height: number
  accent: string
}) {
  return (
    <View style={[styles.processTower, { left, top, height }]}>
      <View style={[styles.towerShaft, { borderColor: accent }]} />
      <View style={[styles.towerHead, { backgroundColor: accent }]} />
      <View style={[styles.towerPipeBand, { backgroundColor: accent }]} />
      <View style={styles.towerShadow} />
    </View>
  )
}

function ZoneLabel({
  title,
  subtitle,
  left,
  top,
}: {
  title: string
  subtitle: string
  left: number
  top: number
}) {
  return (
    <View style={[styles.zoneLabel, { left, top }]}>
      <Text style={styles.zoneTitle}>{title}</Text>
      <Text style={styles.zoneSubtitle}>{subtitle}</Text>
    </View>
  )
}

export default function FactoryScenePrototype({ nightMode = false }: FactoryScenePrototypeProps) {
  return (
    <View style={[styles.scene, nightMode && styles.sceneNight]}>
      <View style={[styles.sky, nightMode && styles.skyNight]}>
        <View style={[styles.hazeBand, nightMode && styles.hazeBandNight]} />
        <View style={[styles.sunDisk, nightMode && styles.moonDisk]} />
      </View>

      <View style={styles.sea}>
        <View style={[styles.seaSheen, nightMode && styles.seaSheenNight]} />
      </View>

      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1000 1600" preserveAspectRatio="none" pointerEvents="none">
        <Path
          d="M0 318 C130 334 248 304 390 324 C520 344 642 430 774 412 C886 396 950 354 1000 330 L1000 0 L0 0 Z"
          fill={nightMode ? '#113553' : '#4F88A9'}
        />
        <Path
          d="M0 472 C122 430 290 450 420 504 C540 556 652 548 776 506 C874 474 940 444 1000 424 L1000 618 L0 618 Z"
          fill={nightMode ? '#35505B' : '#A69572'}
        />
        <Path
          d="M0 540 C152 504 284 560 406 560 C556 560 664 486 818 492 C902 496 958 520 1000 548 L1000 664 L0 664 Z"
          fill={nightMode ? '#466269' : '#C6B087'}
          opacity={0.85}
        />
        <Rect x="0" y="980" width="1000" height="620" fill={nightMode ? '#4D463B' : '#8E7B5F'} />
      </Svg>

      <View style={styles.harborEdge} />
      <View style={[styles.dock, nightMode && styles.dockNight]} />
      <View style={[styles.breakwater, nightMode && styles.breakwaterNight]} />

      <View style={[styles.refineryDistrict, nightMode && styles.refineryDistrictNight]} />
      <View style={[styles.processZone, nightMode && styles.processZoneNight]} />
      <View style={[styles.tankFarmZone, nightMode && styles.tankFarmZoneNight]} />
      <View style={[styles.supportZone, nightMode && styles.supportZoneNight]} />
      <View style={[styles.logisticsZone, nightMode && styles.logisticsZoneNight]} />
      <View style={[styles.loadingZone, nightMode && styles.loadingZoneNight]} />

      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 1000 1600" preserveAspectRatio="none" pointerEvents="none">
        <Path d="M50 1090 H960" stroke={nightMode ? '#7B684A' : '#69563D'} strokeWidth="16" strokeLinecap="round" opacity="0.9" />
        <Path d="M86 1180 H906" stroke={nightMode ? '#7B684A' : '#69563D'} strokeWidth="20" strokeLinecap="round" opacity="0.85" />
        <Path d="M120 970 C290 890 430 904 564 984 C670 1048 786 1062 924 1016" stroke={nightMode ? '#8E9A9C' : '#748388'} strokeWidth="8" strokeLinecap="round" opacity="0.9" />
        <Path d="M250 760 C352 720 436 724 548 778 C626 818 700 832 784 808" stroke={nightMode ? '#8E9A9C' : '#748388'} strokeWidth="7" strokeLinecap="round" opacity="0.84" />
        <Path d="M630 600 L700 520" stroke={nightMode ? '#5F777A' : '#7FAE74'} strokeWidth="5" opacity="0.7" />
        <Path d="M700 520 L794 498" stroke={nightMode ? '#5F777A' : '#7FAE74'} strokeWidth="5" opacity="0.7" />
      </Svg>

      <View style={styles.landmarks}>
        <TankCluster left={76} top={500} scale={1.16} accent={colors.blueDark} />
        <TankCluster left={188} top={604} scale={0.88} accent={colors.blueDark} />
        <TankCluster left={806} top={508} scale={0.96} accent={colors.teal} />
        <TankCluster left={742} top={622} scale={0.74} accent={colors.teal} />

        <ProcessTower left={446} top={462} height={204} accent={colors.orangeDark} />
        <ProcessTower left={522} top={430} height={238} accent={colors.orangeDark} />
        <ProcessTower left={602} top={492} height={186} accent={colors.orangeDark} />
        <ProcessTower left={670} top={558} height={142} accent={colors.orangeDark} />
        <View style={[styles.crackerBase, nightMode && styles.crackerBaseNight]} />
        <View style={[styles.pipeRack, { left: 430, top: 688, width: 252 }]} />
        <View style={[styles.pipeRack, { left: 366, top: 742, width: 204 }]} />
        <View style={[styles.pipeRack, { left: 612, top: 710, width: 168 }]} />

        <View style={[styles.labBlock, nightMode && styles.labBlockNight]}>
          <View style={styles.labAntenna} />
        </View>
        <View style={[styles.maintenanceYard, nightMode && styles.maintenanceYardNight]}>
          <View style={styles.yardBay} />
          <View style={styles.yardBay} />
          <View style={styles.yardBay} />
        </View>
        <View style={[styles.loadingStation, nightMode && styles.loadingStationNight]}>
          <View style={styles.loadingCanopy} />
          <View style={styles.loadingPad} />
          <View style={styles.loadingTruck} />
        </View>
      </View>

      <ZoneLabel title="Harbor Edge" subtitle="Sea intake · shipping corridor" left={48} top={256} />
      <ZoneLabel title="Tank Farm" subtitle="Bulk storage and transfer" left={68} top={420} />
      <ZoneLabel title="Process Units" subtitle="Distillation and cracking core" left={430} top={344} />
      <ZoneLabel title="Support District" subtitle="Lab · maintenance · utilities" left={720} top={444} />
      <ZoneLabel title="Logistics Yard" subtitle="Roads · loading · dispatch" left={570} top={924} />

      <View style={styles.captionCard}>
        <Text style={styles.captionEyebrow}>Factory Scene Prototype</Text>
        <Text style={styles.captionTitle}>World context first</Text>
        <Text style={styles.captionBody}>
          Sea, docks, zoning, towers, tank farms, and logistics landmarks establish refinery scale without showing a board.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: '#BDA783',
    overflow: 'hidden',
  },
  sceneNight: {
    backgroundColor: '#5B5247',
  },
  sky: {
    height: '18%',
    backgroundColor: '#89B7CF',
  },
  skyNight: {
    backgroundColor: '#13273F',
  },
  hazeBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    backgroundColor: 'rgba(255, 214, 161, 0.35)',
  },
  hazeBandNight: {
    backgroundColor: 'rgba(68, 104, 140, 0.28)',
  },
  sunDisk: {
    position: 'absolute',
    top: 54,
    right: 46,
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(255, 225, 156, 0.82)',
  },
  moonDisk: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(229, 238, 255, 0.72)',
  },
  sea: {
    position: 'absolute',
    top: '10%',
    left: 0,
    right: 0,
    height: '22%',
    backgroundColor: '#4E83A2',
  },
  seaSheen: {
    position: 'absolute',
    left: '8%',
    right: '38%',
    top: '28%',
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  seaSheenNight: {
    backgroundColor: 'rgba(184, 211, 231, 0.1)',
  },
  harborEdge: {
    position: 'absolute',
    top: '27%',
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#E3D1AC',
  },
  dock: {
    position: 'absolute',
    top: '33.5%',
    right: '6%',
    width: 116,
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: '#6D5C49',
    transform: [{ rotate: '-5deg' }],
  },
  dockNight: {
    backgroundColor: '#534739',
  },
  breakwater: {
    position: 'absolute',
    top: '34.4%',
    left: '6%',
    width: 170,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: '#85735D',
    transform: [{ rotate: '4deg' }],
  },
  breakwaterNight: {
    backgroundColor: '#5B5247',
  },
  refineryDistrict: {
    position: 'absolute',
    top: '35%',
    left: '16%',
    right: '10%',
    height: '34%',
    borderRadius: 48,
    backgroundColor: 'rgba(243, 233, 214, 0.16)',
    borderWidth: 2,
    borderColor: 'rgba(94, 80, 58, 0.22)',
  },
  refineryDistrictNight: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.09)',
  },
  processZone: {
    position: 'absolute',
    top: '39%',
    left: '40%',
    width: '34%',
    height: '25%',
    borderRadius: 38,
    backgroundColor: 'rgba(233, 146, 57, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(201, 106, 31, 0.28)',
  },
  processZoneNight: {
    backgroundColor: 'rgba(233, 146, 57, 0.07)',
  },
  tankFarmZone: {
    position: 'absolute',
    top: '40%',
    left: '6%',
    width: '26%',
    height: '22%',
    borderRadius: 34,
    backgroundColor: 'rgba(91, 141, 191, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(63, 110, 158, 0.28)',
  },
  tankFarmZoneNight: {
    backgroundColor: 'rgba(91, 141, 191, 0.06)',
  },
  supportZone: {
    position: 'absolute',
    top: '44%',
    right: '8%',
    width: '22%',
    height: '20%',
    borderRadius: 32,
    backgroundColor: 'rgba(155, 134, 194, 0.09)',
    borderWidth: 2,
    borderColor: 'rgba(155, 134, 194, 0.22)',
  },
  supportZoneNight: {
    backgroundColor: 'rgba(155, 134, 194, 0.05)',
  },
  logisticsZone: {
    position: 'absolute',
    bottom: '9%',
    left: '8%',
    right: '7%',
    height: '18%',
    borderRadius: 40,
    backgroundColor: 'rgba(64, 55, 45, 0.12)',
  },
  logisticsZoneNight: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  loadingZone: {
    position: 'absolute',
    bottom: '12%',
    right: '7%',
    width: '28%',
    height: '15%',
    borderRadius: 28,
    backgroundColor: 'rgba(127, 174, 116, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(92, 138, 82, 0.24)',
  },
  loadingZoneNight: {
    backgroundColor: 'rgba(127, 174, 116, 0.06)',
  },
  landmarks: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  cluster: {
    position: 'absolute',
    width: 180,
    height: 140,
  },
  tankLarge: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#F6F7F3',
    borderWidth: 4,
  },
  tankMedium: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#EFF2F4',
    borderWidth: 4,
  },
  tankSmall: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FAFBF7',
    borderWidth: 4,
  },
  tankShadow: {
    position: 'absolute',
    left: -10,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  processTower: {
    position: 'absolute',
    width: 44,
    alignItems: 'center',
  },
  towerShaft: {
    position: 'absolute',
    bottom: 12,
    width: 22,
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#F2F1EA',
    borderWidth: 4,
  },
  towerHead: {
    position: 'absolute',
    top: -6,
    width: 30,
    height: 14,
    borderRadius: 7,
  },
  towerPipeBand: {
    position: 'absolute',
    top: '42%',
    width: 34,
    height: 8,
    borderRadius: radii.pill,
  },
  towerShadow: {
    position: 'absolute',
    bottom: 0,
    width: 54,
    height: 14,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  labBlock: {
    position: 'absolute',
    right: '14%',
    top: '50%',
    width: 88,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: '#EEE8F4',
    borderWidth: 4,
    borderColor: colors.purple,
  },
  labBlockNight: {
    backgroundColor: '#D9D1E6',
  },
  labAntenna: {
    position: 'absolute',
    left: 48,
    top: -28,
    width: 4,
    height: 28,
    backgroundColor: colors.purple,
  },
  maintenanceYard: {
    position: 'absolute',
    left: '62%',
    top: '64%',
    width: 164,
    height: 86,
    borderRadius: radii.lg,
    backgroundColor: '#E5EEE2',
    borderWidth: 4,
    borderColor: colors.greenDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  maintenanceYardNight: {
    backgroundColor: '#D9E3D7',
  },
  yardBay: {
    width: 34,
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: '#F8FBF4',
    borderWidth: 2,
    borderColor: colors.greenDark,
  },
  loadingStation: {
    position: 'absolute',
    right: '8%',
    bottom: '15%',
    width: 200,
    height: 106,
    borderRadius: radii.lg,
    backgroundColor: '#E3DED6',
    borderWidth: 4,
    borderColor: '#6E7E8C',
  },
  loadingStationNight: {
    backgroundColor: '#C9C3BB',
  },
  loadingCanopy: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 14,
    height: 18,
    borderRadius: radii.pill,
    backgroundColor: '#B2BBC2',
  },
  loadingPad: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 18,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: '#C7BCA9',
  },
  loadingTruck: {
    position: 'absolute',
    right: 26,
    bottom: 24,
    width: 62,
    height: 22,
    borderRadius: radii.sm,
    backgroundColor: colors.orangeDark,
  },
  pipeRack: {
    position: 'absolute',
    width: 168,
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: '#9AAAB8',
    opacity: 0.85,
  },
  crackerBase: {
    position: 'absolute',
    left: '44%',
    top: '58%',
    width: 232,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: '#E7DED0',
    borderWidth: 3,
    borderColor: colors.steelDark,
  },
  crackerBaseNight: {
    backgroundColor: '#D8CDC0',
  },
  zoneLabel: {
    position: 'absolute',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: 'rgba(16, 24, 33, 0.64)',
    maxWidth: 210,
  },
  zoneTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  zoneSubtitle: {
    color: '#D7E0E8',
    fontSize: 11,
    marginTop: 2,
  },
  captionCard: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.lg,
    width: 430,
    backgroundColor: 'rgba(244, 234, 215, 0.92)',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.ink,
    padding: spacing.sm,
  },
  captionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  captionTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  captionBody: {
    marginTop: spacing.xs,
    color: colors.inkMuted,
    fontSize: 11,
    lineHeight: 16,
  },
})
