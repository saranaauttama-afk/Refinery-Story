import assert from 'node:assert/strict'
import {writeFileSync,readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import {simulate} from './sim-run'
import {POLISH} from '../../src/v4/data/balance'
import {serialize,deserialize} from '../../src/v4/sim/save'
import {hints} from '../../src/v4/data/onboarding'
import {createNewGame} from '../../src/v4/sim/state'
import {tick} from '../../src/v4/sim/tick'
import {buildStarter} from '../../src/v4/sim/systems/starter'
const reports:Array<Omit<ReturnType<typeof simulate>,'state'>&{seed:number}>=[]
for(let seed=1;seed<=POLISH.reportSeeds;seed++){
 const r=simulate(seed)
 assert.ok(r.reached[5]>=3&&r.reached[5]<=5,`seed ${seed}: rank 5 ${r.reached[5]}`)
 assert.ok(r.reached[10]>=13&&r.reached[10]<=16,`seed ${seed}: rank 10 ${r.reached[10]}`)
 assert.ok(r.maxNegativeMonths<=6,`seed ${seed}: softlock`);assert.ok(r.unlocksFirst40Weeks>=5,`seed ${seed}: early unlocks`)
 assert.deepEqual(deserialize(serialize(r.state)),r.state,`seed ${seed}: late save roundtrip`)
 reports.push({seed,reached:r.reached,maxNegativeMonths:r.maxNegativeMonths,unlocksFirst40Weeks:r.unlocksFirst40Weeks,annual:r.annual})
}
const income=([1,5,10] as const).map(year=>{const samples=reports.map(r=>r.annual[year-1].profit),mean=Math.round(samples.reduce((n,v)=>n+v,0)/samples.length);const [low,high]=POLISH.incomeMeanBounds[year];assert.ok(mean>=low&&mean<=high,`year ${year} mean ${mean}`);return {year,target:POLISH.incomeTargets[year],mean,min:Math.min(...samples),max:Math.max(...samples)}})
assert.equal(hints.length,POLISH.hintLimit)
const clean=createNewGame();assert.throws(()=>deserialize(serialize({...clean,cuts:{}} as never)));assert.throws(()=>deserialize(serialize({...clean,settings:undefined} as never)));assert.throws(()=>deserialize(serialize({...clean,money:Infinity})))
// Frozen inputs catch accidental mutation in the running systems and starter action.
function freeze(value:unknown){if(value&&typeof value==='object'){Object.freeze(value);for(const v of Object.values(value))freeze(v)}}
freeze(clean);const starter=buildStarter(clean);freeze(starter);assert.notEqual(tick(starter),starter);assert.equal(clean.tick,0)
for(const name of readdirSync('src/v4/sim',{recursive:true}) as string[]){if(!name.endsWith('.ts'))continue;const source=readFileSync(join('src/v4/sim',name),'utf8');assert.doesNotMatch(source,/\b(?:Date\.now|Math\.random)\s*\(/);assert.doesNotMatch(source,/from\s+['"](?:react|react-native|expo|@shopify)/)}
if(process.argv.includes('--write-report')){
 writeFileSync('docs/v4/BALANCE-REPORT.json',JSON.stringify({seeds:POLISH.reportSeeds,years:16,policy:'Normal guarded actions; cautious hiring, three staged production lines; operating profit excludes construction, hiring and training capital spend.',income,reports},null,2)+'\n')
 writeFileSync('docs/v4/BALANCE-REPORT.md','# M8 balance report\n\n20 seeded runs × 16 years, using guarded game actions. Monthly operating profit is annual operating income minus upkeep, salaries, crude and incident costs, divided by 12; capital spending is tracked in cash but excluded from this metric.\n\n| Year | Target/month | Mean | Min | Max |\n|---|---:|---:|---:|---:|\n'+income.map(r=>`| ${r.year} | $${r.target.toLocaleString()} | $${r.mean.toLocaleString()} | $${r.min.toLocaleString()} | $${r.max.toLocaleString()} |`).join('\n')+'\n\nAll 20 runs pass rank-5/rank-10 timing, five early unlocks, no six-month debt lock and late-save roundtrip checks. Full annual results and reach times: [BALANCE-REPORT.json](BALANCE-REPORT.json). These are deterministic bot results, not human playtest or native frame-rate measurements.\n')
}
console.log(`M8 ${POLISH.reportSeeds} seeds × 16 years / pacing / no softlock / save integrity / sim isolation / hints passed; monthly mean ${income.map(r=>`Y${r.year} $${r.mean}`).join(', ')}`)
