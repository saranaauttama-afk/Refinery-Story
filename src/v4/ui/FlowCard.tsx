import { Text, View } from 'react-native'
import { useGame } from '../store/useGame'
import { flowSummary } from '../sim/systems/plant'
import { styles } from './controls'
import { Card, Row, Bar, Muted } from './cards'
import { text } from '../i18n'

const names = {
  crude: { en: 'Crude in', th: 'น้ำมันดิบเข้า' },
  refine: { en: 'Refining', th: 'กลั่นเป็นฐาน' },
  blend: { en: 'Production', th: 'ผลิต' },
  sell: { en: 'Buyers', th: 'ลูกค้ารับไป' },
}
const advice = {
  crude: {
    en: 'Build or upgrade a CDU / crude tank.',
    th: 'สร้างหรืออัปเกรดหอกลั่นและถังน้ำมันดิบ',
  },
  refine: {
    en: 'Build or upgrade the unit that makes your base, or overhaul worn plants.',
    th: 'สร้างหรืออัปเกรดหน่วยผลิตน้ำมันฐาน หรือซ่อมเครื่องที่เสื่อม',
  },
  blend: { en: 'Add or upgrade a production line.', th: 'เพิ่มหรืออัปเกรดสายการผลิต' },
  sell: {
    en: 'Sell more kinds of product, or invest in the Highway.',
    th: 'ขายสินค้าหลายชนิดขึ้น หรือลงทุนทางหลวง',
  },
}

/** Units per week each stage can handle; the slowest one limits the refinery. */
export function FlowCard() {
  const { state: s } = useGame()
  const { stages, bottleneck } = flowSummary(s)
  const max = Math.max(1, ...stages.map(st => st.units))
  return (
    <Card>
      <Text style={styles.heading}>
        {text({ en: 'Oil flow per week', th: 'การไหลของน้ำมันต่อสัปดาห์' })}
      </Text>
      {stages.map(st => (
        <Row key={st.id}>
          <Text
            style={[
              styles.text,
              { width: 104, fontSize: 13 },
              st.id === bottleneck && { fontFamily: 'Kanit_600SemiBold', color: '#B42318' },
            ]}
          >
            {text(names[st.id])}
          </Text>
          <Bar
            value={st.units / max}
            color={st.id === bottleneck ? '#E2483D' : '#4FA3D9'}
            height={8}
          />
          <View style={{ width: 56, alignItems: 'flex-end' }}>
            <Text style={[styles.text, { fontSize: 13 }]}>
              {Math.round(st.units).toLocaleString()}
            </Text>
          </View>
        </Row>
      ))}
      <Muted>
        {text({ en: 'Bottleneck: ', th: 'คอขวด: ' })}
        {text(names[bottleneck])} · {text(advice[bottleneck])}
      </Muted>
    </Card>
  )
}
