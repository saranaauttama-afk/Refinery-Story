import { StyleSheet, Text, View } from 'react-native'

import type { StaffSkill } from '../game/types'
import { getSkillChannelMeta } from '../game/data/staffSkills'
import { useLang } from '../hooks/SettingsContext'
import { colors, radii } from '../theme'

// Renders a hire's numeric skills as a numbered chip row (1 / 2 / 3), each chip
// showing the channel icon + its label + the flat % it contributes. The rare
// Ace 3rd skill (last one, when isAce) gets a gold ★ treatment so a standout
// hire reads at a glance. Used on the recruit card, staff cards, and plant info.
export default function StaffSkillList({
  skills,
  isAce = false,
  compact = false,
}: {
  skills: StaffSkill[]
  isAce?: boolean
  compact?: boolean
}) {
  const { t } = useLang()
  if (!skills || skills.length === 0) return null
  return (
    <View style={styles.wrap}>
      {skills.map((skill, i) => {
        const meta = getSkillChannelMeta(skill.channel)
        // The Ace skill is the 3rd entry on an Ace hire.
        const ace = isAce && i === skills.length - 1 && skills.length >= 3
        const pct = `+${(skill.value * 100).toFixed(skill.value * 100 % 1 === 0 ? 0 : 1)}%`
        return (
          <View key={i} style={[styles.chip, ace && styles.chipAce, compact && styles.chipCompact]}>
            <Text style={[styles.num, ace && styles.numAce]}>{ace ? '★' : i + 1}</Text>
            <Text style={styles.icon}>{meta.icon}</Text>
            {!compact && <Text style={[styles.label, ace && styles.labelAce]}>{t(meta.short)}</Text>}
            <Text style={[styles.value, ace && styles.valueAce]}>{pct}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1ECE2',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipCompact: { paddingHorizontal: 5, paddingVertical: 2 },
  chipAce: { backgroundColor: '#FFF6DA', borderColor: colors.gold },
  num: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    backgroundColor: '#B9AE99',
    minWidth: 13,
    height: 13,
    borderRadius: 7,
    textAlign: 'center',
    overflow: 'hidden',
    lineHeight: 13,
  },
  numAce: { backgroundColor: colors.gold, color: '#7A5A00' },
  icon: { fontSize: 12 },
  label: { fontSize: 10, fontWeight: '700', color: colors.inkMuted },
  labelAce: { color: '#8A6A10' },
  value: { fontSize: 11, fontWeight: '900', color: colors.ink },
  valueAce: { color: '#8A6A10' },
})
