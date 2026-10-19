import { Onboarding } from './Onboarding'
import { Building2, FlaskConical, Users, Truck, Landmark } from 'lucide-react-native'
import { CompanyPanel } from './CompanyPanel'
import { Notices } from './Notices'
import { StaffPanel } from './StaffPanel'
import { RecipeBook } from './RecipeBook'
import { detectCombos } from '../sim/systems/combos'
import { combos } from '../data/combos'
import { CustomersPanel } from './CustomersPanel'
import { BlendPanel } from './BlendPanel'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { useGame } from '../store/useGame'
import { YardCanvas } from '../render/YardCanvas'
import { buildings, buildingDef } from '../data/buildings'
import { YARD } from '../data/balance'
import { place, move, demolish, upgrade, buyLand } from '../sim/actions'
import { buildingAt, canPlace, upgradeCost } from '../sim/systems/yard'
import { HUD } from './HUD'
import { Button, Sheet, styles } from './controls'
import { text } from '../i18n'
export function YardScreen() {
  const { state: s, dispatch } = useGame()
  const [panel, setPanel] = useState('')
  const [selected, setSelected] = useState('')
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number; uid?: string }>()
  const b = s.yard.buildings.find(b => b.uid === selected)
  return (
    <View style={{ flex: 1 }}>
      <HUD />
      <Onboarding onPlace={(id, x, y) => setGhost({ id, x, y })} />
      <YardCanvas
        state={s}
        ghost={ghost}
        onTile={(x, y) => {
          if (ghost) setGhost({ ...ghost, x, y })
          else {
            const b = buildingAt(s, x, y)
            if (b) {
              setSelected(b.uid)
              setPanel('info')
            }
          }
        }}
      />
      {ghost && (
        <View
          style={{
            backgroundColor: '#FFF6E3',
            borderTopWidth: 2,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <Text style={styles.text}>
            {detectCombos([
              ...s.yard.buildings.filter(b => b.uid !== ghost.uid),
              {
                uid: 'preview',
                defId: ghost.id,
                x: ghost.x,
                y: ghost.y,
                level: 1,
                staff: [],
                cost: 0,
              },
            ])
              .filter(c => c.members.includes('preview'))
              .map(c => text(combos.find(d => d.id === c.id)!.name))
              .join(' · ')}
          </Text>
          <Text style={styles.text}>
            {text({ en: 'Tap a tile, then confirm', th: 'แตะพื้นที่ แล้วกดยืนยัน' })}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 2 }}>
              <Button
                disabled={
                  !canPlace(s, ghost.id, ghost.x, ghost.y, ghost.uid) ||
                  s.money <
                    (ghost.uid
                      ? YARD.moveCost
                      : s.carriedBuildings[ghost.id]
                        ? 0
                        : buildingDef(ghost.id).cost)
                }
                label={{ en: 'Confirm', th: 'ยืนยัน' }}
                onPress={() => {
                  dispatch(s =>
                    ghost.uid
                      ? move(s, ghost.uid, ghost.x, ghost.y)
                      : place(s, ghost.id, ghost.x, ghost.y),
                  )
                  setGhost(undefined)
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={{ en: 'Cancel', th: 'ยกเลิก' }} onPress={() => setGhost(undefined)} />
            </View>
          </View>
        </View>
      )}
      <View
        style={{ flexDirection: 'row', backgroundColor: '#FFF6E3', justifyContent: 'space-around' }}
      >
        {[
          { id: 'build', en: 'Build', th: 'สร้าง' },
          { id: 'blend', en: 'Blend', th: 'ผสม' },
          { id: 'staff', en: 'Staff', th: 'คน' },
          { id: 'customers', en: 'Customers', th: 'ลูกค้า' },
          { id: 'company', en: 'Company', th: 'บริษัท' },
        ].map(tab => (
          <Button
            key={tab.id}
            icon={
              tab.id === 'build' ? (
                <Building2 size={20} />
              ) : tab.id === 'blend' ? (
                <FlaskConical size={20} />
              ) : tab.id === 'staff' ? (
                <Users size={20} />
              ) : tab.id === 'customers' ? (
                <Truck size={20} />
              ) : (
                <Landmark size={20} />
              )
            }
            label={tab}
            onPress={() => setPanel(tab.id)}
          />
        ))}
      </View>
      <Notices />

      {panel === 'company' && (
        <Sheet title={{ en: 'Company', th: 'บริษัท' }} onClose={() => setPanel('')}>
          <CompanyPanel />
          <Button label={{ en: 'Buy land', th: 'ซื้อที่ดิน' }} onPress={() => setPanel('land')} />
        </Sheet>
      )}
      {panel === 'staff' && (
        <Sheet title={{ en: 'Staff', th: 'พนักงาน' }} onClose={() => setPanel('')}>
          <StaffPanel />
        </Sheet>
      )}
      {panel === 'combos' && (
        <Sheet title={{ en: 'Recipe Book', th: 'ตำราคอมโบ' }} onClose={() => setPanel('')}>
          <RecipeBook />
        </Sheet>
      )}
      {panel === 'customers' && (
        <Sheet title={{ en: 'Customers', th: 'ลูกค้าและสัญญา' }} onClose={() => setPanel('')}>
          <CustomersPanel />
        </Sheet>
      )}
      {panel === 'blend' && (
        <Sheet title={{ en: 'Blend', th: 'ผสมผลิตภัณฑ์' }} onClose={() => setPanel('')}>
          <BlendPanel />
        </Sheet>
      )}
      {panel === 'build' && (
        <Sheet title={{ en: 'Build', th: 'สร้างอาคาร' }} onClose={() => setPanel('')}>
          {buildings
            .filter(
              b =>
                b.rank <= s.rank ||
                s.blueprints.includes(b.id) ||
                s.decos.includes(b.id) ||
                s.carriedBuildings[b.id],
            )
            .map(d => (
              <Button
                key={d.id}
                disabled={!s.carriedBuildings[d.id] && s.money < d.cost}
                label={{
                  en: `${d.name.en} · ${s.carriedBuildings[d.id] ? 'NG+ Free' : `$${d.cost}`}`,
                  th: `${d.name.th} · ${s.carriedBuildings[d.id] ? 'NG+ ฟรี' : `$${d.cost.toLocaleString()}`}`,
                }}
                onPress={() => {
                  setGhost({ id: d.id, x: 0, y: 0 })
                  setPanel('')
                }}
              />
            ))}
        </Sheet>
      )}
      {panel === 'info' && b && (
        <Sheet title={buildingDef(b.defId).name} onClose={() => setPanel('')}>
          <Text style={styles.text}>Lv {b.level}</Text>
          <Button
            label={{ en: 'Move $2k', th: 'ย้าย $2,000' }}
            onPress={() => {
              setGhost({ id: b.defId, x: b.x, y: b.y, uid: b.uid })
              setPanel('')
            }}
          />
          <Button
            disabled={b.level >= YARD.maxLevel || s.money < upgradeCost(b)}
            label={{
              en: `Upgrade $${upgradeCost(b).toFixed(0)}`,
              th: `อัปเกรด $${upgradeCost(b).toLocaleString()}`,
            }}
            onPress={() => dispatch(s => upgrade(s, b.uid))}
          />
          <Button
            label={{ en: 'Demolish (50% refund)', th: 'รื้อถอน (คืน 50%)' }}
            onPress={() => {
              dispatch(s => demolish(s, b.uid))
              setPanel('')
            }}
          />
        </Sheet>
      )}
      {panel === 'land' && (
        <Sheet
          title={{ en: 'Buy an 8×8 parcel', th: 'ซื้อที่ดิน 8×8' }}
          onClose={() => setPanel('')}
        >
          <Text style={styles.text}>
            {text({
              en: 'Rank 2 required. $20,000 per parcel.',
              th: 'ต้องแรงก์ 2 ราคาแปลงละ $20,000',
            })}
          </Text>
          {Array.from({ length: 25 }, (_, i) => ({ x: i % 5, y: Math.floor(i / 5) }))
            .filter(p => !s.yard.ownedParcels.includes(`${p.x},${p.y}`))
            .map(p => (
              <Button
                key={`${p.x},${p.y}`}
                label={{ en: `Parcel ${p.x},${p.y}`, th: `แปลง ${p.x},${p.y}` }}
                disabled={buyLand(s, p.x, p.y) === s}
                onPress={() => dispatch(s => buyLand(s, p.x, p.y))}
              />
            ))}
        </Sheet>
      )}
    </View>
  )
}
