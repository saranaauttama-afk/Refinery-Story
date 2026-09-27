import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native'

import type { WorkerType } from '../game/types'

const PORTRAITS: Record<WorkerType, ImageSourcePropType> = {
  operator: require('../../assets/staff/portraits/operator.png'),
  mechanic: require('../../assets/staff/portraits/mechanic.png'),
  salesAgent: require('../../assets/staff/portraits/sales-agent.png'),
  safetyOfficer: require('../../assets/staff/portraits/safety-officer.png'),
  chemist: require('../../assets/staff/portraits/chemist.png'),
  logisticsCoordinator: require('../../assets/staff/portraits/logistics-coordinator.png'),
  fuelSpecialist: require('../../assets/staff/portraits/fuel-specialist.png'),
  aviationSpecialist: require('../../assets/staff/portraits/aviation-specialist.png'),
  chemicalEngineer: require('../../assets/staff/portraits/chemical-engineer.png'),
  polymerEngineer: require('../../assets/staff/portraits/polymer-engineer.png'),
}

export default function StaffPortrait({ type, size = 64, style }: { type: WorkerType; size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={PORTRAITS[type]} resizeMode="contain" style={[{ width: size, height: size }, style]} />
}
