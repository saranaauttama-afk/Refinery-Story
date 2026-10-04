import type { ImageSourcePropType } from 'react-native'

const CLIENT_ART = {
  local: require('../../assets/clients/local.png'),
  industrial: require('../../assets/clients/industrial.png'),
  corporate: require('../../assets/clients/corporate.png'),
}

// Contact identity stays consistent across an offer, its active order and
// repeat orders. Branch choices change the product, never the contact.
export function getV3ClientArt(templateId: string): ImageSourcePropType {
  const route = templateId.split(':')[0]
  if (route === 'airline' || route === 'showcase') return CLIENT_ART.corporate
  if (route === 'fleet' || route === 'materials' || route === 'performance') return CLIENT_ART.industrial
  return CLIENT_ART.local
}
