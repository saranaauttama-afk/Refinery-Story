import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { Canvas,Picture,Skia } from '@shopify/react-native-skia'
import { drawCommands } from './draw'
import { rect,circle,poly } from './buildings/shapes'
import { sprites } from './buildings'
export function TitleScene(){const {width,height}=useWindowDimensions();const picture=useMemo(()=>{const recorder=Skia.PictureRecorder(),c=recorder.beginRecording({x:0,y:0,width,height});drawCommands(c,[rect(0,0,width,height,'#F3BD8B'),rect(0,height*.2,width,height*.25,'#E99B78'),circle(width*.7,height*.25,50,'#F2C230'),poly([[0,height*.5],[width*.5,height*.33],[width,height*.5],[width,height],[0,height]],'#4FA3D9')]);c.translate(width*.45,height*.42);c.scale(2,2);for(const [id,x,y] of [['crudeTank',-40,8],['cdu',0,0],['cracker',35,10],['loading',65,20]] as const){c.save();c.translate(x,y);drawCommands(c,sprites[id](3,id==='cdu'?'#3C3C46':'#4FA3D9',0));c.restore()}return recorder.finishRecordingAsPicture()},[width,height]);return <Canvas pointerEvents="none" style={{position:'absolute',inset:0}}><Picture picture={picture}/></Canvas>}
