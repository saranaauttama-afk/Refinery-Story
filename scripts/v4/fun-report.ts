// Prints the "is it too easy?" numbers from the bot. Usage: npx tsx scripts/v4/fun-report.ts [seeds]
import { simulate } from './sim-run'
import { additives } from '../../src/v4/data/additives'
import { bases } from '../../src/v4/data/bases'
const n = Number(process.argv[2] ?? 10)
const runs = Array.from({ length: n }, (_, i) => simulate(i + 1))
const pairs = additives.length * bases.length
const avg = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
const med = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
console.log('rank5', runs.map(r => r.reached[5]?.toFixed(1) ?? '-').join(' '))
console.log('rank10', runs.map(r => r.reached[10]?.toFixed(1) ?? '-').join(' '))
console.log('firstSS median', med(runs.map(r => r.firstSS || 99)).toFixed(1))
console.log('Y  income/mo  money  rd  known%  wins  money/expMonths')
for (const y of [1, 2, 3, 5, 8, 10, 12, 15]) {
  const a = runs.map(r => r.annual[y - 1])
  const wins = avg(runs.map(r => r.awardWins[y - 1] ?? 0))
  const months = avg(a.map(x => x.money / Math.max(1, x.expenses / 12)))
  console.log(
    y,
    Math.round(avg(a.map(x => x.profit))),
    Math.round(avg(a.map(x => x.money))),
    Math.round(avg(a.map(x => x.rd))),
    Math.round((avg(a.map(x => x.known)) / pairs) * 100),
    wins.toFixed(1),
    months.toFixed(0),
  )
}
