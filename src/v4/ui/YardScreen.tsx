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
import { yardAlerts } from '../sim/systems/alerts'
import { help } from './help'
import { EventToast } from './EventToast'
import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'
import { BuildingSprite } from '../render/BuildingSprite'
import { ui } from './theme'
import { useGame } from '../store/useGame'
import { YardCanvas } from '../render/YardCanvas'
import { buildingDef } from '../data/buildings'
import { YARD } from '../data/balance'
import { place, move } from '../sim/actions'
import { buildingAt, canPlace } from '../sim/systems/yard'
import { HUD } from './HUD'
import type { GameState } from '../sim/types'
import { Button, Sheet } from './controls'
import { type } from './theme'
import { text } from '../i18n'
// Start the placement preview somewhere it already fits.
function firstFreeSpot(s: GameState, id: string) {
  for (let y = 0; y < s.yard.size; y++)
    for (let x = 0; x < s.yard.size; x++) if (canPlace(s, id, x, y)) return { x, y }
  return { x: 0, y: 0 }
}
/** Roads, pipes, tanks and decor are usually placed several in a row. */
const repeatsByDefault = (id: string) =>
  ['road', 'pipe', 'tank'].includes(id) || buildingDef(id).category === 'deco'
type Ghost = {
  id: string
  x: number
  y: number
  uid?: string
  repeat: boolean
  placed: number
  spent: number
}
export function YardScreen() {
  const { state: s, dispatch } = useGame()
  const [panel, setPanel] = useState('')
  const [bell, setBell] = useState(false)
  const [selected, setSelected] = useState('')
  const [blendStation, setBlendStation] = useState<string>()
  const [companyView, setCompanyView] = useState<string>()
  const [ghost, setGhost] = useState<Ghost>()
  const b = s.yard.buildings.find(b => b.uid === selected)
  const alerts = yardAlerts(s)
  const cost = (g: Ghost) =>
    g.uid ? YARD.moveCost : s.carriedBuildings[g.id] ? 0 : buildingDef(g.id).cost
  const fits = ghost ? canPlace(s, ghost.id, ghost.x, ghost.y, ghost.uid) : false
  const unchangedMove =
    !!ghost?.uid &&
    s.yard.buildings.some(b => b.uid === ghost.uid && b.x === ghost.x && b.y === ghost.y)
  const canConfirm = !!ghost && !unchangedMove && fits && s.money >= cost(ghost)
  const startPlacing = (id: string) => {
    setGhost({ id, ...firstFreeSpot(s, id), repeat: repeatsByDefault(id), placed: 0, spent: 0 })
    setPanel('')
  }
  const confirm = (g: Ghost, x = g.x, y = g.y) => {
    if (!canPlace(s, g.id, x, y, g.uid) || s.money < cost(g)) return
    dispatch(s => (g.uid ? move(s, g.uid, x, y) : place(s, g.id, x, y)))
    if (g.repeat && !g.uid) setGhost({ ...g, x, y, placed: g.placed + 1, spent: g.spent + cost(g) })
    else setGhost(undefined)
  }
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
  const openTab = (id: string) => {
    setGhost(undefined)
    setBell(false)
    setBlendStation(undefined)
    setCompanyView(undefined)
    setPanel(panel === id ? '' : id)
  }
  return (
    <View style={{ flex: 1, backgroundColor: ui.paper }}>
      <HUD alerts={alerts.length} bellOpen={bell} onBell={() => setBell(v => !v)} />
      {!ghost && !panel && !bell && (
        <Onboarding
          onPlace={(id, x, y) => setGhost({ id, x, y, repeat: false, placed: 0, spent: 0 })}
        />
      )}
      <View style={{ flex: 1 }}>
        <YardCanvas
          state={s}
          ghost={ghost}
          lift={panel === 'build' ? 0.3 : panel ? 0.62 : 0}
          onTile={(x, y) => {
            setBell(false)
            if (ghost) {
              // In repeat mode a tap places straight away; otherwise it moves the preview.
              if (ghost.repeat && !ghost.uid && canPlace(s, ghost.id, x, y)) confirm(ghost, x, y)
              else setGhost({ ...ghost, x, y })
            } else {
              const b = buildingAt(s, x, y)
              if (b) {
                setSelected(b.uid)
                setPanel('info')
              }
            }
          }}
        />
        {!ghost && <EventToast />}
        {bell && !ghost && (
          <Alerts
            onOpen={a => {
              setBell(false)
              if ((a.tab === 'lab' || a.tab === 'building') && a.target) {
                setSelected(a.target)
                setPanel('info')
                return
              }
              setBlendStation(a.target)
              setPanel(a.tab)
            }}
            onLog={() => {
              setBell(false)
              setCompanyView('events')
              setPanel('company')
            }}
          />
        )}
      </View>
      {ghost && (
        <View
          style={{
            backgroundColor: ui.paper,
            borderTopWidth: 3,
            borderColor: ui.ink,
            padding: 10,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BuildingSprite
              id={ghost.id}
              level={s.yard.buildings.find(b => b.uid === ghost.uid)?.level ?? 1}
              size={48}
            />
            <View style={{ flex: 1 }}>
              <Text style={type.title}>{text(buildingDef(ghost.id).name)}</Text>
              <Text
                style={[type.small, !ghost.placed && { color: fits ? '#1E6E57' : '#B42318' }]}
                numberOfLines={2}
              >
                {ghost.placed
                  ? text({
                      en: `Placed ${ghost.placed} · spent $${ghost.spent.toLocaleString()} · tap the next tile`,
                      th: `วางแล้ว ${ghost.placed} · ใช้ไป $${ghost.spent.toLocaleString()} · แตะช่องถัดไป`,
                    })
                  : previewCombos.length
                    ? previewCombos
                        .map(c => text(combos.find(d => d.id === c.id)!.name))
                        .join(' · ')
                    : text(
                        fits
                          ? ghost.repeat && !ghost.uid
                            ? { en: 'Tap tiles to place', th: 'แตะช่องบนลานเพื่อวางทีละช่อง' }
                            : { en: 'Tap the yard to move it', th: 'แตะลานเพื่อเลื่อนตำแหน่ง' }
                          : { en: 'Blocked here', th: 'ตรงนี้วางไม่ได้ แตะช่องว่าง' },
                      )}
              </Text>
            </View>
            {!ghost.uid && (
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: ghost.repeat }}
                onPress={() => setGhost({ ...ghost, repeat: !ghost.repeat })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderWidth: 2,
                    borderColor: ui.ink,
                    borderRadius: 4,
                    backgroundColor: ghost.repeat ? ui.navy : ui.paper,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ghost.repeat && <Text style={{ color: ui.paper, fontSize: 14 }}>✓</Text>}
                </View>
                <Text style={type.body}>{text({ en: 'Keep placing', th: 'วางต่อ' })}</Text>
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                color={ui.paper}
                label={ghost.placed ? { en: 'Done', th: 'เสร็จ' } : { en: 'Cancel', th: 'ยกเลิก' }}
                onPress={() => setGhost(undefined)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                disabled={!canConfirm}
                color={ui.customers}
                label={{
                  en: `✓ ${ghost.uid ? 'Move' : 'Place'} ${cost(ghost) ? `$${cost(ghost).toLocaleString()}` : ''}`,
                  th: `✓ ${ghost.uid ? 'ย้าย' : 'วาง'} ${cost(ghost) ? `$${cost(ghost).toLocaleString()}` : ''}`,
                }}
                onPress={() => confirm(ghost)}
              />
            </View>
          </View>
        </View>
      )}
      {!ghost && (
        <View
          style={{
            height: 64,
            flexDirection: 'row',
            backgroundColor: ui.paper,
            borderTopWidth: 3,
            borderColor: ui.ink,
          }}
        >
          {[
            { id: 'build', en: 'Build', th: 'สร้าง', color: '#F08A24', tint: '#FBE0C4' },
            { id: 'blend', en: 'Blend', th: 'ผสม', color: '#E2483D', tint: '#F6D6D2' },
            { id: 'staff', en: 'Staff', th: 'คน', color: '#3D8FE0', tint: '#D6E6F7' },
            { id: 'customers', en: 'Customers', th: 'ลูกค้า', color: '#2FB38E', tint: '#CDEFE3' },
            { id: 'company', en: 'Company', th: 'บริษัท', color: '#B184E3', tint: '#E8DAF6' },
          ].map(tab => (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityLabel={text(tab)}
              accessibilityState={{ selected: panel === tab.id }}
              onPress={() => openTab(tab.id)}
              style={({ pressed }) => ({
                flex: 1,
                minWidth: 0,
                backgroundColor: pressed || panel === tab.id ? tab.tint : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              })}
            >
              {panel === tab.id && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 10,
                    right: 10,
                    height: 3,
                    backgroundColor: tab.color,
                  }}
                />
              )}
              <View
                style={{
                  width: 32,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                  backgroundColor: panel === tab.id ? tab.tint : 'transparent',
                }}
              >
                {tab.id === 'build' ? (
                  <Building2 size={22} color={tab.color} />
                ) : tab.id === 'blend' ? (
                  <FlaskConical size={22} color={tab.color} />
                ) : tab.id === 'staff' ? (
                  <Users size={22} color={tab.color} />
                ) : tab.id === 'customers' ? (
                  <Truck size={22} color={tab.color} />
                ) : (
                  <Landmark size={22} color={tab.color} />
                )}
              </View>
              <Text
                style={[
                  type.small,
                  {
                    color: ui.ink,
                    fontFamily: panel === tab.id ? 'Kanit_600SemiBold' : 'Kanit_400Regular',
                  },
                ]}
              >
                {text(tab)}
              </Text>
              {tab.id === 'customers' && alerts.some(a => a.tab === 'customers') && (
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: '28%',
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#E2483D',
                    borderWidth: 2,
                    borderColor: ui.ink,
                  }}
                />
              )}
            </Pressable>
          ))}
        </View>
      )}
      <Notices />

      {panel === 'company' && (
        <Sheet title={{ en: 'Company', th: 'บริษัท' }} onClose={() => setPanel('')}>
          <CompanyPanel
            key={companyView ?? 'menu'}
            initialView={companyView}
            onLand={() => setPanel('land')}
            onCombos={() => setPanel('combos')}
          />
        </Sheet>
      )}
      {panel === 'staff' && (
        <Sheet
          title={{ en: 'Staff', th: 'พนักงาน' }}
          help={help.staff}
          onClose={() => setPanel('')}
        >
          <StaffPanel />
        </Sheet>
      )}
      {panel === 'combos' && (
        <Sheet
          title={{ en: 'Recipe Book', th: 'ตำราคอมโบ' }}
          help={help.combos}
          onClose={() => setPanel('company')}
        >
          <RecipeBook />
        </Sheet>
      )}
      {panel === 'customers' && (
        <Sheet
          title={{ en: 'Customers', th: 'ลูกค้า' }}
          help={help.customers}
          onClose={() => setPanel('')}
        >
          <CustomersPanel />
        </Sheet>
      )}
      {panel === 'blend' && (
        <Sheet title={{ en: 'Blend', th: 'ผสม' }} help={help.blend} onClose={() => setPanel('')}>
          <BlendPanel station={blendStation} />
        </Sheet>
      )}
      {panel === 'build' && (
        <Sheet title={{ en: 'Build', th: 'สร้าง' }} low onClose={() => setPanel('')}>
          <BuildPanel onPick={startPlacing} />
        </Sheet>
      )}
      {panel === 'info' && b && (
        <Sheet title={buildingDef(b.defId).name} onClose={() => setPanel('')}>
          <BuildingInfo
            key={b.uid}
            uid={b.uid}
            onMove={() => {
              setGhost({
                id: b.defId,
                x: b.x,
                y: b.y,
                uid: b.uid,
                repeat: false,
                placed: 0,
                spent: 0,
              })
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
