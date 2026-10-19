export type Command = {kind:'polygon';points:number[][];color:string}|{kind:'rect'|'ellipse';x:number;y:number;w:number;h:number;color:string}|{kind:'circle';x:number;y:number;r:number;color:string}
export const ink='#14110F'
export const poly=(points:number[][],color:string):Command=>({kind:'polygon',points,color})
export const rect=(x:number,y:number,w:number,h:number,color:string):Command=>({kind:'rect',x,y,w,h,color})
export const ellipse=(x:number,y:number,w:number,h:number,color:string):Command=>({kind:'ellipse',x,y,w,h,color})
export const circle=(x:number,y:number,r:number,color:string):Command=>({kind:'circle',x,y,r,color})
export function box(x:number,y:number,w:number,d:number,h:number,top='#C9D3DC',left='#9EABB8',right='#73818F'):Command[]{return [poly([[x,y-h],[x+w,y+w/2-h],[x+w-d,y+(w+d)/2-h],[x-d,y+d/2-h]],top),poly([[x-d,y+d/2-h],[x+w-d,y+(w+d)/2-h],[x+w-d,y+(w+d)/2],[x-d,y+d/2]],left),poly([[x+w,y+w/2-h],[x+w-d,y+(w+d)/2-h],[x+w-d,y+(w+d)/2],[x+w,y+w/2]],right)]}
export function tank(x:number,y:number,r:number,h:number,accent:string):Command[]{return [ellipse(x-r,y-r/2,r*2,r,'#73818F'),rect(x-r,y-h,r*2,h,'#9EABB8'),rect(x-r,y-h/2,r*2,3,accent),ellipse(x-r,y-h-r/2,r*2,r,'#C9D3DC'),rect(x+r-3,y-h+3,2,h-2,'#B5653A')]}
export function detail(level:number,accent:string):Command[]{const commands:Command[]=[];if(level>=3)commands.push(...box(4,-2,7,5,12),rect(-16,-10,30,2,'#F2C230'),rect(-14,-16,1,6,ink),rect(12,-16,1,6,ink));if(level>=5)commands.push(rect(0,-42,1,20,ink),rect(1,-42,7,5,accent),circle(-5,-30,2,'#F2C230'));return commands}
