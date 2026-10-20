import { Onboarding } from './Onboarding'
import { BuildPanel } from './BuildPanel'
import { LandPanel } from './LandPanel'
import { BuildingInfo } from './BuildingInfo'
import { Building2, FlaskConical, Users, Truck, Landmark } from 'lucide-react-native'
import { CompanyPanel } from './CompanyPanel'
import { Notices } from './Notices'
import { StaffPanel } from './StaffPanel'
import { RecipeBook } from './RecipeBook'
import { detectCombos } from '../sim/systems/combos'
import { combos } from '../data/combos'
import { CustomersPanel } from './CustomersPanel'
import { BlendPanel } from './BlendPanel'
import { Alerts } from './Alerts'
import { useState } from 'react'
import { View, Text } from 'react-native'
import { useGame } from '../store/useGame'
import { YardCanvas } from '../render/YardCanvas'
import { buildings, buildingDef } from '../data/buildings'
import { YARD } from '../data/balance'
import { place, move, demolish, upgrade, buyLand } from '../sim/actions'
import { buildingAt, canPlace, upgradeCost } from '../sim/systems/yard'
import { HUD } from './HUD'
import type { GameState } from '../sim/types'
import { Button, Sheet, styles } from './controls'
import { text } from '../i18n'
// Start the placement preview somewhere it already fits.
function firstFreeSpot(s: GameState, id: string) {
  for (let y = 0; y < s.yard.size; y++)
    for (let x = 0; x < s.yard.size; x++) if (canPlace(s, id, x, y)) return { x, y }
  return { x: 0, y: 0 }
}
export function YardScreen() {
  const { state: s, dispatch } = useGame()
  const [panel, setPanel] = useState('')
  const [selected, setSelected] = useState('')
  const [blendStation, setBlendStation] = useState<string>()
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number; uid?: string }>()
  const b = s.yard.buildings.find(b => b.uid === selected)
  return (
    <View style={{ flex: 1 }}>
      <HUD />
      <Onboarding onPlace={(id, x, y) => setGhost({ id, x, y })} />
      <View style={{ flex: 1 }}>
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
        {!ghost && !panel && (
          <Alerts
            onOpen={a => {
              const station = a.id.startsWith('idle:') ? a.id.split(':')[1] : undefined
              setBlendStation(station)
              setPanel(a.tab)
            }}
          />
        )}
      </View>
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
          { id: 'build', en: 'Build', th: 'สร้าง', color: '#F08A24' },
          { id: 'blend', en: 'Blend', th: 'ผสม', color: '#E2483D' },
          { id: 'staff', en: 'Staff', th: 'คน', color: '#3D8FE0' },
          { id: 'customers', en: 'Customers', th: 'ลูกค้า', color: '#2FB38E' },
          { id: 'company', en: 'Company', th: 'บริษัท', color: '#B184E3' },
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
            color={tab.color}
            onPress={() => {
              setBlendStation(undefined)
              setPanel(tab.id)
            }}
          />
        ))}
      </View>
      <Notices />

      {panel === 'company' && (
        <Sheet title={{ en: 'Company', th: 'บริษัท' }} onClose={() => setPanel('')}>
          <CompanyPanel onLand={() => setPanel('land')} onCombos={() => setPanel('combos')} />
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
          <BlendPanel station={blendStation} />
        </Sheet>
      )}
      {panel === 'build' && (
        <Sheet title={{ en: 'Build', th: 'สร้างอาคาร' }} onClose={() => setPanel('')}>
          <BuildPanel
            onPick={id => {
              setGhost({ id, ...firstFreeSpot(s, id) })
              setPanel('')
            }}
          />
        </Sheet>
      )}
      {panel === 'info' && b && (
        <Sheet title={buildingDef(b.defId).name} onClose={() => setPanel('')}>
          <BuildingInfo
            uid={b.uid}
            onMove={() => {
              setGhost({ id: b.defId, x: b.x, y: b.y, uid: b.uid })
              setPanel('')
            }}
            onClose={() => setPanel('')}
            onRecipe={() => {
              setBlendStation(b.uid)
              setPanel('blend')
            }}
          />
        </Sheet>
      )}
      {panel === 'land' && (
        <Sheet title={{ en: 'Buy land', th: 'ซื้อที่ดิน' }} onClose={() => setPanel('company')}>
          <LandPanel />
        </Sheet>
      )}
    </View>
  )
}
