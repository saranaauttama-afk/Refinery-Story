// Generates src/components/iconRegistry.ts from assets/icons/*.svg.
// The repo has no svg-transformer, so we inline each icon's XML and render it
// with react-native-svg's SvgXml (see GameIcon.tsx). Re-run after adding or
// editing an icon:  node scripts/gen-icons.js
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '..', 'assets', 'icons')
const out = path.join(__dirname, '..', 'src', 'components', 'iconRegistry.ts')

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.svg')).sort()

const entries = files.map((f) => {
  let xml = fs.readFileSync(path.join(dir, f), 'utf8').trim()
  // Strip stray loose hex-colour text nodes sitting between tags (a couple of
  // source files have e.g. ">#5B6B78  <rect" which would render as literal text).
  xml = xml.replace(/>(\s*)#[0-9A-Fa-f]{3,8}(\s*)</g, '><')
  const key = f.replace(/\.svg$/, '')
  return `  ${JSON.stringify(key)}: ${JSON.stringify(xml)},`
}).join('\n')

const banner = '// AUTO-GENERATED from assets/icons/*.svg by scripts/gen-icons.js — do not edit by hand.\n'
fs.writeFileSync(out, `${banner}export const ICON_XML: Record<string, string> = {\n${entries}\n}\n`)
console.log(`wrote ${files.length} icons → ${path.relative(path.join(__dirname, '..'), out)}`)
