// Static projection QA; this is not a device screenshot.
// node --import tsx scripts/render-yard-art-check.cjs
const fs = require('node:fs')
const path = require('node:path')
const sharp = require('sharp')
const { createInitialV3GameState } = require('../src/game/v3/state.ts')
const { getV3SpritePlacements, getV3IsoBounds, v3IsoPoint } = require('../src/game/v3/yardView.ts')
const { V3_YARD_BACKDROP: b } = require('../src/game/v3/yardBackdrop.ts')
const { getV3DecorSvg } = require('../src/art/decorArt.ts')
const { V3_DECOR_KINDS } = require('../src/game/v3/decorData.ts')
const assert = require('node:assert/strict')
const anchors = require('../assets/plants/yard-v2/anchors.json')
const dir = path.join(__dirname, '../assets/plants/yard-v2')
const source = fs.readFileSync(path.join(__dirname, '../src/components/v3/v3Art.ts'), 'utf8')
const names = Object.fromEntries([...source.matchAll(/(\w+): '([\w_]+)',/g)].map(m=>[m[1],m[2]]))
const png = filename => 'data:image/png;base64,' + fs.readFileSync(filename).toString('base64')
async function main() {
  const files = fs.readdirSync(dir).filter(n=>n.endsWith('.png'))
  assert.equal(files.length, 51)
  for (const filename of files) {
    const m = await sharp(path.join(dir, filename)).metadata()
    assert.ok(m.hasAlpha, filename + ' must be transparent')
    await sharp(path.join(dir, filename)).raw().toBuffer() // full decode catches truncated PNGs
  }
  const state = createInitialV3GameState()
  const bounds = getV3IsoBounds(state)
  const width = 780, height = 1000
  const scale = Math.max(width/b.width, height/b.height, Math.min(width / (bounds.maxX-bounds.minX), height / (bounds.maxY-bounds.minY)) * 1.3)
  const clamp = (value,low,high) => Math.max(low,Math.min(value,high))
  const tx = clamp(width/2-(bounds.minX+bounds.maxX)/2*scale,width-(b.x+b.width)*scale,-b.x*scale)
  const ty = clamp(height/2-(bounds.minY+bounds.maxY)/2*scale,height-(b.y+b.height)*scale,-b.y*scale)
  let world = `<image href="${png(path.join(__dirname,'../assets/bg/yard_backdrop.png'))}" x="${b.x}" y="${b.y}" width="${b.width}" height="${b.height}"/>`
  for (const sprite of getV3SpritePlacements(state)) {
    const name = names[sprite.type], file = path.join(dir, `${name}_lv${sprite.level}.png`)
    const m = await sharp(file).metadata()
    const anchor = anchors[name][sprite.level-1]
    const bottom = v3IsoPoint(sprite.x+sprite.w,sprite.y+sprite.h)
    const padAnchor = sprite.w/(sprite.w+sprite.h)
    const drawWidth = Math.min(sprite.footprintWidth,sprite.footprintWidth*padAnchor/anchor,sprite.footprintWidth*(1-padAnchor)/(1-anchor))*0.98
    const h = drawWidth*m.height/m.width
    const corners = [[sprite.x,sprite.y],[sprite.x+sprite.w,sprite.y],[sprite.x+sprite.w,sprite.y+sprite.h],[sprite.x,sprite.y+sprite.h]].map(([x,y])=>v3IsoPoint(x,y)).map(p=>`${p.sx},${p.sy}`).join(' ')
    world += `<polygon points="${corners}" fill="#7D8585" stroke="#485458" stroke-width="1"/><image href="${png(file)}" x="${bottom.sx-drawWidth*anchor}" y="${sprite.bottomY-h}" width="${drawWidth}" height="${h}"/>`
  }
  const out = path.join(__dirname,'../.build/yard-v2-qa')
  fs.mkdirSync(out,{recursive:true})
  await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#2A6FB8"/><g transform="translate(${tx} ${ty}) scale(${scale})">${world}</g></svg>`)).png().toFile(path.join(out,'starter-yard.png'))
  const layers = []
  for (const [index, kind] of V3_DECOR_KINDS.entries()) {
    layers.push({ input: await sharp(Buffer.from(getV3DecorSvg(kind))).resize(96,128,{fit:'contain',background:'#D5DDD1'}).png().toBuffer(), left:(index%5)*120+12, top:Math.floor(index/5)*140 })
  }
  await sharp({create:{width:600,height:420,channels:4,background:'#D5DDD1'}}).composite(layers).png().toFile(path.join(out,'decor.png'))
  console.log('PASS: 51 alpha PNGs decode, starter yard projection and all 15 decoration SVGs render')
}
main().catch(error=>{console.error(error);process.exitCode=1})
