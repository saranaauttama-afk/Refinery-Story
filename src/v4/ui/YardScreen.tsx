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
import { EventToast } from './EventToast'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { BuildingSprite } from '../render/BuildingSprite'
import { ui } from './theme'
import { useGame } from '../store/useGame'
import { YardCanvas } from '../render/YardCanvas'
import { buildings, buildingDef } from '../data/buildings'
import { YARD } from '../data/balance'
import { place, move } from '../sim/actions'
import { buildingAt, canPlace } from '../sim/systems/yard'
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
  const fits = ghost ? canPlace(s, ghost.id, ghost.x, ghost.y, ghost.uid) : false
  const unchangedMove =
    !!ghost?.uid &&
    s.yard.buildings.some(b => b.uid === ghost.uid && b.x === ghost.x && b.y === ghost.y)
  const previewCombos = ghost
    ? detectCombos([
        ...s.yard.buildings.filter(b => b.uid !== ghost.uid),
        {
          uid: 'preview',
          defId: ghost.id,
          x: ghost.x,
          y: ghost.y,
          level: s.yard.buildings.find(b => b.uid === ghost.uid)?.level ?? 1,
          staff: [],
          cost: 0,
        },
      ])
        .filter(c => c.members.includes('preview'))
        .filter(c => {
          const d = combos.find(d => d.id === c.id)!
          return !d.hidden || s.discoveredCombos.includes(d.id)
        })
    : []
  return (
    <View style={{ flex: 1, backgroundColor: ui.paper }}>
      <HUD />
      {!ghost && !panel && <Onboarding onPlace={(id, x, y) => setGhost({ id, x, y })} />}
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
              if ((a.tab === 'lab' || a.tab === 'building') && a.target) {
                setSelected(a.target)
                setPanel('info')
                return
              }
              setBlendStation(a.target)
              setPanel(a.tab)
            }}
          />
        )}
        {!ghost && <EventToast />}
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BuildingSprite
              id={ghost.id}
              level={s.yard.buildings.find(b => b.uid === ghost.uid)?.level ?? 1}
              size={58}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.heading}>{text(buildingDef(ghost.id).name)}</Text>
              <Text style={[styles.text, { fontSize: 13, color: fits ? '#1E6E57' : '#B42318' }]}>
                {text(
                  fits
                    ? { en: 'Ready · tap to reposition', th: 'วางได้ · แตะลานเพื่อปรับตำแหน่ง' }
                    : {
                        en: 'Blocked · choose an empty owned tile',
                        th: 'วางไม่ได้ · เลือกช่องว่างในที่ดินของเรา',
                      },
                )}
              </Text>
              <Text style={[styles.text, { fontSize: 12 }]}>
                {buildingDef(ghost.id).w}×{buildingDef(ghost.id).h} · {ghost.x}, {ghost.y}
              </Text>
            </View>
          </View>
          {!!previewCombos.length && (
            <Text numberOfLines={2} style={[styles.text, { fontSize: 13, color: '#1E6E57' }]}>
              {previewCombos.map(c => text(combos.find(d => d.id === c.id)!.name)).join(' · ')}
            </Text>
          )}
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 2 }}>
              <Button
                disabled={
                  unchangedMove ||
                  !canPlace(s, ghost.id, ghost.x, ghost.y, ghost.uid) ||
                  s.money <
                    (ghost.uid
                      ? YARD.moveCost
                      : s.carriedBuildings[ghost.id]
                        ? 0
                        : buildingDef(ghost.id).cost)
                }
                color={ui.customers}
                label={{ en: 'Confirm', th: 'ยืนยันวาง' }}
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
              <Button
                color={ui.paper}
                label={{ en: 'Cancel', th: 'ยกเลิก' }}
                onPress={() => setGhost(undefined)}
              />
            </View>
          </View>
        </View>
      )}
      <View
        style={{
          height: 78,
          flexDirection: 'row',
          backgroundColor: ui.navy,
          borderTopWidth: 2,
          borderColor: ui.ink,
          paddingHorizontal: 5,
          gap: 4,
          paddingVertical: 6,
        }}
      >
        {[
          { id: 'build', en: 'Build', th: 'สร้าง', color: '#F08A24' },
          { id: 'blend', en: 'Blend', th: 'ผสม', color: '#E2483D' },
          { id: 'staff', en: 'Staff', th: 'คน', color: '#3D8FE0' },
          { id: 'customers', en: 'Customers', th: 'ลูกค้า', color: '#2FB38E' },
          { id: 'company', en: 'Company', th: 'บริษัท', color: '#B184E3' },
        ].map(tab => (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={text(tab)}
            accessibilityState={{ selected: panel === tab.id }}
            onPress={() => {
              setGhost(undefined)
              setBlendStation(undefined)
              setPanel(panel === tab.id ? '' : tab.id)
            }}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              borderWidth: 2,
              borderColor: ui.ink,
              borderRadius: 5,
              backgroundColor: pressed || panel === tab.id ? tab.color : ui.paper,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            })}
          >
            <View
              style={{
                backgroundColor: tab.color,
                width: 30,
                height: 25,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 3,
              }}
            >
              {tab.id === 'build' ? (
                <Building2 size={19} />
              ) : tab.id === 'blend' ? (
                <FlaskConical size={19} />
              ) : tab.id === 'staff' ? (
                <Users size={19} />
              ) : tab.id === 'customers' ? (
                <Truck size={19} />
              ) : (
                <Landmark size={19} />
              )}
            </View>
            <Text style={[styles.text, { fontSize: 12, fontFamily: 'Kanit_600SemiBold' }]}>
              {text(tab)}
            </Text>
          </Pressable>
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
            key={b.uid}
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
