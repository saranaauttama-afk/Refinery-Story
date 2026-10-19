import { INVESTMENT_BALANCE } from './balance'
import type { LocalizedText } from '../i18n'
const chain = (
  id: keyof typeof INVESTMENT_BALANCE,
  name: LocalizedText,
  steps: LocalizedText[],
) => ({
  id,
  name,
  rank: INVESTMENT_BALANCE[id].rank,
  steps: steps.map((name, i) => ({ name, cost: INVESTMENT_BALANCE[id].costs[i] })),
})
const stimulus = { en: 'Stimulus', th: 'กระตุ้นเศรษฐกิจ' },
  shelter = { en: 'Shelter', th: 'ที่กำบัง' }
export const investments = [
  chain('highway', { en: 'Highway', th: 'ทางหลวง' }, [
    { en: 'Rest Stop', th: 'จุดพักรถ' },
    stimulus,
    shelter,
    { en: 'Logistics Hub', th: 'ศูนย์โลจิสติกส์' },
  ]),
  chain('port', { en: 'Port', th: 'ท่าเรือ' }, [
    { en: 'Jetty', th: 'ท่าเทียบเรือ' },
    stimulus,
    shelter,
    { en: 'Deep-sea Terminal', th: 'ท่าเรือน้ำลึก' },
  ]),
  chain('industrial', { en: 'Industrial Park', th: 'นิคมอุตสาหกรรม' }, [
    { en: 'Land Prep', th: 'เตรียมพื้นที่' },
    stimulus,
    shelter,
    { en: 'Petrochem Zone', th: 'เขตปิโตรเคมี' },
  ]),
  chain('airport', { en: 'Airport', th: 'สนามบิน' }, [
    { en: 'Fuel Depot', th: 'คลังเชื้อเพลิง' },
    stimulus,
    shelter,
    { en: 'Hub Airport', th: 'สนามบินศูนย์กลาง' },
  ]),
]
