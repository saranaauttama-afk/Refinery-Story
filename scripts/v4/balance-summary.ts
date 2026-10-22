// Quick balance read-out without assertions: node --import tsx scripts/v4/balance-summary.ts [seeds]
import { simulate } from './sim-run'
import { POLISH } from '../../src/v4/data/balance'
const n = Number(process.argv[2] ?? POLISH.reportSeeds)
const rs = Array.from({ length: n }, (_, i) => simulate(i + 1))
const med = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length
const f = (v: number) => v.toFixed(1)
type R = (typeof rs)[number]
console.log('rank5 years:', rs.map(r => f(r.reached[5] ?? 99)).join(' '))
console.log('rank10 years:', rs.map(r => f(r.reached[10] ?? 99)).join(' '))
console.log(
  'first A/S/SS median:',
  [(r: R) => r.firstA, (r: R) => r.firstS, (r: R) => r.firstSS]
    .map(g => f(med(rs.map(r => g(r) || 99))))
    .join(' / '),
)
for (const y of [1, 5, 10])
  console.log(`profit Y${y} mean`, Math.round(mean(rs.map(r => r.annual[y - 1].profit))))
console.log('award wins/yr Y3-15', f(mean(rs.flatMap(r => r.awardWins.slice(2, 15)))))
console.log(
  'formulas Y5/Y15',
  f(mean(rs.map(r => r.annual[4].known))),
  f(mean(rs.map(r => r.annual[14].known))),
)
console.log(
  'cash months Y5/Y10',
  [5, 10]
    .map(y => f(mean(rs.map(r => r.annual[y - 1].money / Math.max(1, r.annual[y - 1].profit)))))
    .join(' / '),
)
console.log(
  'RD Y10',
  Math.round(mean(rs.map(r => r.annual[9].rd))),
  'max debt months',
  f(Math.max(...rs.map(r => r.maxNegativeMonths))),
)
