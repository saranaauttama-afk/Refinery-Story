// Mulberry32: state and result are explicit, so saves preserve the random stream.
export function random(rng: number): [number, number] {
  const next = (rng + 0x6d2b79f5) >>> 0
  let t = Math.imul(next ^ (next >>> 15), next | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next]
}
