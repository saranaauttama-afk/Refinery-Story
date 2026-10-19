import { Skia,rect as skRect,type SkCanvas } from '@shopify/react-native-skia'
import { ink,type Command } from './buildings/shapes'
export function drawCommands(canvas:SkCanvas,commands:Command[]){
 const paint=Skia.Paint();paint.setAntiAlias(false)
 for(const c of commands){paint.setColor(Skia.Color(c.color));paint.setStyle(0)
  const draw=()=>{if(c.kind==='polygon'){const path=Skia.Path.Make();c.points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.close();canvas.drawPath(path,paint)}else if(c.kind==='circle')canvas.drawCircle(c.x,c.y,c.r,paint);else if(c.kind==='ellipse')canvas.drawOval(skRect(c.x,c.y,c.w,c.h),paint);else canvas.drawRect(skRect(c.x,c.y,c.w,c.h),paint)}
  draw();paint.setColor(Skia.Color(ink));paint.setStyle(1);paint.setStrokeWidth(1);draw()
 }
}
