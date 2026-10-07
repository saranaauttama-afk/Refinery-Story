import type { ImageSourcePropType } from 'react-native'

import type { V3TruckDir, V3TruckLine } from '../../game/v3/traffic'

/**
 * Tanker sprites rendered by code (artkit: tools/artkit, truck.py), one per
 * product-line colour × facing. Canvas is a 1×1 tile at master scale (64 px
 * wide); the tile centre sits TRUCK_ANCHOR_FROM_BOTTOM master px above the
 * image's bottom edge for every facing, so all four line up.
 */
export const TRUCK_ART: Record<V3TruckLine, Record<V3TruckDir, ImageSourcePropType>> = {
  crude: { se: require('../../../assets/vehicles/truck_crude_se.png'), sw: require('../../../assets/vehicles/truck_crude_sw.png'), nw: require('../../../assets/vehicles/truck_crude_nw.png'), ne: require('../../../assets/vehicles/truck_crude_ne.png') },
  gasoline: { se: require('../../../assets/vehicles/truck_gasoline_se.png'), sw: require('../../../assets/vehicles/truck_gasoline_sw.png'), nw: require('../../../assets/vehicles/truck_gasoline_nw.png'), ne: require('../../../assets/vehicles/truck_gasoline_ne.png') },
  lubricant: { se: require('../../../assets/vehicles/truck_lubricant_se.png'), sw: require('../../../assets/vehicles/truck_lubricant_sw.png'), nw: require('../../../assets/vehicles/truck_lubricant_nw.png'), ne: require('../../../assets/vehicles/truck_lubricant_ne.png') },
  jet: { se: require('../../../assets/vehicles/truck_jet_se.png'), sw: require('../../../assets/vehicles/truck_jet_sw.png'), nw: require('../../../assets/vehicles/truck_jet_nw.png'), ne: require('../../../assets/vehicles/truck_jet_ne.png') },
  petrochemical: { se: require('../../../assets/vehicles/truck_petrochemical_se.png'), sw: require('../../../assets/vehicles/truck_petrochemical_sw.png'), nw: require('../../../assets/vehicles/truck_petrochemical_nw.png'), ne: require('../../../assets/vehicles/truck_petrochemical_ne.png') },
  polymer: { se: require('../../../assets/vehicles/truck_polymer_se.png'), sw: require('../../../assets/vehicles/truck_polymer_sw.png'), nw: require('../../../assets/vehicles/truck_polymer_nw.png'), ne: require('../../../assets/vehicles/truck_polymer_ne.png') },
}

export const TRUCK_MASTER_WIDTH = 64
export const TRUCK_ANCHOR_FROM_BOTTOM = 16
