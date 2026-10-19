import { awardList, marketNames } from '../i18nLabels'
import { Text } from 'react-native'
import { useGame } from '../store/useGame'
import { investments } from '../data/investments'
import { invest, newGamePlus } from '../sim/actions'
import { Button, styles } from './controls'
import { RecipeBook } from './RecipeBook'
import { text } from '../i18n'
export function CompanyPanel() {
  const { state: s, dispatch, saveError, retrySave } = useGame()
  return (
    <>
      {saveError && (
        <>
          <Text style={styles.text}>{text(saveError)}</Text>
          <Button label={{ en: 'Retry save', th: 'ลองบันทึกอีกครั้ง' }} onPress={retrySave} />
        </>
      )}
      <Button
        label={{
          en: s.settings.sound ? 'Sound on' : 'Sound off',
          th: s.settings.sound ? 'เสียง: เปิด' : 'เสียง: ปิด',
        }}
        onPress={() =>
          dispatch(s => ({ ...s, settings: { ...s.settings, sound: !s.settings.sound } }))
        }
      />
      <Button
        label={{
          en: s.settings.haptics ? 'Haptics on' : 'Haptics off',
          th: s.settings.haptics ? 'สั่น: เปิด' : 'สั่น: ปิด',
        }}
        onPress={() =>
          dispatch(s => ({ ...s, settings: { ...s.settings, haptics: !s.settings.haptics } }))
        }
      />
      <Text style={styles.heading}>
        {text({ en: `Rank ${s.rank}`, th: `แรงก์ ${s.rank}` })} ·{' '}
        {text(marketNames[s.market.phase])}
      </Text>
      {investments.map(d => {
        const level = s.investments[d.id] ?? 0,
          step = d.steps[level]
        return (
          <Button
            key={d.id}
            disabled={!step || s.rank < d.rank || s.money < step.cost}
            label={{
              en: `${d.name.en} ${level}/4 ${step ? `${step.name.en} $${step.cost}` : 'Complete'}`,
              th: `${d.name.th} ${level}/4 ${step ? `${step.name.th} $${step.cost.toLocaleString()}` : 'ครบแล้ว'}`,
            }}
            onPress={() => dispatch(s => invest(s, d.id))}
          />
        )
      })}
      <Text style={styles.heading}>{text({ en: 'Awards', th: 'รางวัลประจำปี' })}</Text>
      {s.history.awards.map(a => (
        <Text key={a.year} style={styles.text}>
          Y{a.year}: {awardList(a.wins)} +{a.fame} ★
        </Text>
      ))}
      {s.evaluation !== null && (
        <>
          <Text style={styles.heading}>
            {text({ en: 'Final evaluation', th: 'ผลประเมิน 15 ปี' })}: {s.evaluation}
          </Text>
          <Button
            label={{ en: 'New Game+', th: 'เริ่มเกมใหม่+' }}
            onPress={() => dispatch(newGamePlus)}
          />
        </>
      )}
      <Text style={styles.heading}>{text({ en: 'Recipe Book', th: 'ตำราคอมโบ' })}</Text>
      <RecipeBook />
      {s.log.slice(-8).map((l, i) => (
        <Text key={i} style={styles.text}>
          {text(l)}
        </Text>
      ))}
    </>
  )
}
