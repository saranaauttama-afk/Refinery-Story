import { text } from '../i18n'
import React, { useState } from 'react'
import { View, Text } from 'react-native'
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { toScreen, toTile } from './iso'
import { YARD } from '../data/balance'
import { buildingDef } from '../data/buildings'
import { palette } from './palette'
import { canPlace } from '../sim/systems/yard'
import type { GameState } from '../sim/types'

function polygon(points:number[][]) {const p=Skia.Path.Make();points.forEach(([x,y],i)=>i?p.lineTo(x,y):p.moveTo(x,y));p.close();return p}
export function YardCanvas({state:s, ghost, onTile}:{state:GameState;ghost?:{id:string;x:number;y:number;uid?:string};onTile:(x:number,y:number)=>void}) {
 const [size,setSize]=useState({w:360,h:500});const [camera,setCamera]=useState({x:0,y:80,zoom:YARD.defaultZoom})
 const [start,setStart]=useState(camera)
 const pan=Gesture.Pan().minDistance(8).runOnJS(true).onStart(()=>setStart(camera)).onUpdate(e=>setCamera(c=>({...c,x:start.x+e.translationX,y:start.y+e.translationY})))
 const pinch=Gesture.Pinch().runOnJS(true).onStart(()=>setStart(camera)).onUpdate(e=>setCamera(c=>({...c,zoom:Math.min(YARD.maxZoom,Math.max(YARD.minZoom,start.zoom*e.scale))})))
 const tap=Gesture.Tap().maxDistance(8).runOnJS(true).onEnd(e=>{const p=toTile((e.x-size.w/2-camera.x)/camera.zoom,(e.y-camera.y)/camera.zoom);onTile(p.x,p.y)})
 const tiles=[];for(const parcel of s.yard.ownedParcels){const [px,py]=parcel.split(',').map(Number);for(let x=px*YARD.parcel;x<(px+1)*YARD.parcel;x++)for(let y=py*YARD.parcel;y<(py+1)*YARD.parcel;y++){const a=toScreen(x,y);tiles.push(<Path key={`${x},${y}`} path={polygon([[a.x,a.y],[a.x+16,a.y+8],[a.x,a.y+16],[a.x-16,a.y+8]])} color={palette.ground[(x+y)%2]} style="fill"/> )}}
 return <View style={{flex:1}} onLayout={e=>setSize({w:e.nativeEvent.layout.width,h:e.nativeEvent.layout.height})}><GestureDetector gesture={Gesture.Simultaneous(pan,pinch,tap)}><Canvas style={{flex:1,backgroundColor:'#B5DBEA'}}><Group transform={[{translateX:size.w/2+camera.x},{translateY:camera.y},{scale:camera.zoom}]}>{tiles}{[...s.yard.buildings].sort((a,b)=>a.x+a.y+buildingDef(a.defId).h-b.x-b.y-buildingDef(b.defId).h).map(b=>{const d=buildingDef(b.defId),p=toScreen(b.x,b.y),h=d.height;const shape=polygon([[p.x,p.y-h],[p.x+d.w*16,p.y+d.w*8-h],[p.x+(d.w-d.h)*16,p.y+(d.w+d.h)*8-h],[p.x-d.h*16,p.y+d.h*8-h]]);return <Group key={b.uid}><Path path={polygon([[p.x-d.h*16,p.y+d.h*8-h],[p.x+(d.w-d.h)*16,p.y+(d.w+d.h)*8-h],[p.x+(d.w-d.h)*16,p.y+(d.w+d.h)*8],[p.x-d.h*16,p.y+d.h*8]])} color={palette.steel[2]}/><Path path={shape} color={d.accent}/><Path path={shape} color={palette.outline} strokeWidth={1} style="stroke"/></Group>})}{ghost&&(()=>{const d=buildingDef(ghost.id),p=toScreen(ghost.x,ghost.y);return <Path path={polygon([[p.x,p.y],[p.x+d.w*16,p.y+d.w*8],[p.x+(d.w-d.h)*16,p.y+(d.w+d.h)*8],[p.x-d.h*16,p.y+d.h*8]])} color={canPlace(s,ghost.id,ghost.x,ghost.y,ghost.uid)?'#22C55E99':'#EF444499'}/>})()}</Group></Canvas></GestureDetector>{s.popups.map(p=>{const a=toScreen(p.x,p.y);return <Text pointerEvents="none" key={p.uid} style={{position:'absolute',left:size.w/2+camera.x+a.x*camera.zoom,top:camera.y+a.y*camera.zoom-60-(s.tick-p.tick)*6,color:'#B5653A',fontFamily:'PixelifySans_700Bold',fontSize:22}}>{text(p)}</Text>})}</View>
}
