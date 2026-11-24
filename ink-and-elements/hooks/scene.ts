// The ink-wash scroll: parchment, a winding trail, and a painting that a brush draws
// stroke by stroke while Claude works. Pure vector, no images or embedded fonts.

import { ELEMENTS, FOCUS_X, STAGE_W } from './scroll.ts'
import type { Element, Motif, Pose, Scroll, Stage } from './scroll.ts'

// [path, width, tone]: tone 1 is dense ink, 4 is the palest wash.
type Ink = readonly [string, number, number]
// [path, tone, tinted]: a soft wash, in ink or in the element's color.
type Wash = readonly [string, number, 0 | 1]
type Def = { layer: 'ground' | 'sky' | 'below'; ink: readonly Ink[]; wash?: readonly Wash[] }

const W = 1600
const H = 1000
const MOVE_S = 3
// Motifs, the traveler and the brush are drawn larger than their sketches.
const MS = 1.5

// The trail's height at a point along the scroll: a slow, wandering line.
export function trailY(x: number): number {
  return 700 + 26 * Math.sin(x / 190) + 11 * Math.sin(x / 67 + 1.3)
}

function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const r1 = (n: number): string => (Math.round(n * 10) / 10).toString()
// Seconds for an animation delay, to the hundredth.
const sec = (n: number): string => (Math.round(n * 100) / 100).toString()

// ---------- what the brush can paint ----------

const DEFS: Record<string, Def> = {
  // Water: tundra, rivers and ice.
  wave: {
    layer: 'below',
    ink: [
      ['M-80 10Q-50 -30 -10 -34Q24 -36 30 -12Q34 6 14 6Q0 4 4 -10', 5, 1],
      ['M-70 20Q-30 6 10 16Q40 24 80 12', 3, 2],
      ['M-40 32Q0 24 50 32', 2, 3],
    ],
    wash: [['M-80 10Q-50 -30 -10 -34Q24 -36 30 -12Q34 6 14 6Q-20 22 -80 10Z', 3, 1]],
  },
  pine: {
    layer: 'ground',
    ink: [
      ['M0 2V-124', 4, 1],
      ['M0 -112L-24 -92M0 -112L22 -94M0 -88L-36 -62M0 -88L32 -64M0 -62L-46 -34M0 -62L42 -36', 4, 1],
      ['M-60 4Q0 -8 60 4', 3, 2],
    ],
    wash: [
      ['M-46 -32Q0 -50 42 -34Q0 -24 -46 -32Z', 4, 0],
      ['M0 -126L-46 -34H42Z', 4, 1],
    ],
  },
  floes: {
    layer: 'below',
    ink: [
      ['M-70 0L-40 -8L-10 -4L-24 6Z', 2.5, 1],
      ['M0 -2L40 -10L72 -2L50 8L10 8Z', 2.5, 1],
      ['M-60 16H-30M10 20H50M-20 28H20', 2, 3],
    ],
    wash: [['M-70 0L-40 -8L-10 -4L-24 6ZM0 -2L40 -10L72 -2L50 8L10 8Z', 3, 1]],
  },
  boat: {
    layer: 'below',
    ink: [
      ['M-50 -6Q0 12 50 -6', 4, 1],
      ['M0 -4V-82', 3, 1],
      ['M3 -78Q36 -50 5 -18', 3, 2],
      ['M-62 8H-20M10 12H62', 2, 3],
    ],
    wash: [['M3 -78Q36 -50 5 -18Z', 3, 1]],
  },
  waterfall: {
    layer: 'ground',
    ink: [
      ['M-60 2L-50 -140L-10 -150L-6 -60', 4, 1],
      ['M30 2L40 -120L72 -130', 4, 1],
      ['M-6 -148Q0 -70 2 -10M6 -146Q14 -70 12 -8M16 -140Q24 -80 24 -10', 2, 3],
    ],
    wash: [
      ['M-60 2L-50 -140L-10 -150L-6 -60L-6 2Z', 3, 0],
      ['M-30 -4Q10 -30 50 -4Q10 14 -30 -4Z', 3, 1],
    ],
  },
  birds: {
    layer: 'sky',
    ink: [
      ['M-30 0Q-22 -9 -14 0Q-6 -9 2 0', 2.2, 1],
      ['M20 -22Q26 -28 32 -22Q38 -28 44 -22', 2, 1],
      ['M-8 -40Q-2 -46 4 -40Q10 -46 16 -40', 1.8, 2],
    ],
  },
  // Earth: the great walled city.
  wall: {
    layer: 'ground',
    ink: [
      ['M-90 2V-60H90V2', 4, 1],
      ['M-90 -60V-74H-66V-60M-42 -60V-74H-18V-60M6 -60V-74H30V-60M54 -60V-74H78V-60', 3, 1],
      ['M-80 -40H-40M-20 -30H30M50 -44H80M-60 -16H-10M20 -12H70', 2, 3],
    ],
    wash: [['M-90 2V-60H90V2Z', 3, 1]],
  },
  pillars: {
    layer: 'ground',
    ink: [
      ['M-52 2V-96H-28V2', 4, 1],
      ['M-12 2V-140H14V2', 4, 1],
      ['M30 2V-70H52V2', 4, 1],
      ['M-40 -70L-44 -50M2 -110L-2 -90L4 -70', 1.5, 2],
      ['M72 -112L90 -120L100 -106L86 -98Z', 3, 1],
    ],
    wash: [['M-52 2V-96H-28V2ZM-12 2V-140H14V2ZM30 2V-70H52V2Z', 3, 1]],
  },
  pagoda: {
    layer: 'ground',
    ink: [
      ['M-62 -40Q0 -54 62 -40', 5, 1],
      ['M-46 -84Q0 -98 46 -84', 5, 1],
      ['M-32 -124Q0 -138 32 -124', 5, 1],
      ['M-40 2V-40M40 2V-40M-30 -44V-84M30 -44V-84M-20 -88V-124M20 -88V-124', 3, 1],
      ['M0 -134V-162', 3, 1],
    ],
    wash: [['M-40 2V-40H40V2ZM-30 -44V-84H30V-44ZM-20 -88V-124H20V-88Z', 3, 1]],
  },
  boulders: {
    layer: 'ground',
    ink: [
      ['M-70 2Q-74 -46 -30 -52Q4 -50 6 2', 4, 1],
      ['M10 2Q14 -30 44 -32Q70 -28 66 2', 4, 1],
      ['M-50 -30Q-40 -20 -44 -6M34 -20Q44 -14 40 -4', 2, 2],
    ],
    wash: [['M-70 2Q-74 -46 -30 -52Q4 -50 6 2ZM10 2Q14 -30 44 -32Q70 -28 66 2Z', 3, 1]],
  },
  gate: {
    layer: 'ground',
    ink: [
      ['M-70 2V-110M70 2V-110', 5, 1],
      ['M-92 -108Q0 -126 92 -108', 6, 1],
      ['M-80 -88H80', 4, 1],
      ['M-40 2V-46Q0 -78 40 -46V2', 3, 2],
    ],
    wash: [['M-70 2V-88H70V2Z', 4, 1]],
  },
  // Fire: the volcanic islands.
  volcano: {
    layer: 'ground',
    ink: [
      ['M-110 2L-24 -120Q0 -128 24 -120L110 2', 5, 1],
      ['M-12 -118Q-20 -70 -40 -30M10 -118Q18 -80 30 -40', 2.5, 2],
      ['M0 -132Q-20 -160 6 -180Q30 -200 10 -230Q-6 -250 14 -270', 4, 3],
    ],
    wash: [
      ['M-110 2L-24 -120Q0 -128 24 -120L110 2Z', 3, 0],
      ['M-16 -122Q0 -144 16 -122Q0 -114 -16 -122Z', 2, 1],
    ],
  },
  flame: {
    layer: 'ground',
    ink: [
      ['M0 2Q-30 -30 -10 -70Q0 -90 -6 -116Q24 -86 22 -50Q20 -20 0 2', 4, 1],
      ['M2 -14Q-12 -32 0 -56Q12 -36 2 -14', 3, 1],
      ['M-30 -100Q-40 -120 -24 -126Q-12 -124 -18 -112M30 -90Q44 -104 34 -116', 2.5, 2],
    ],
    wash: [['M0 2Q-30 -30 -10 -70Q0 -90 -6 -116Q24 -86 22 -50Q20 -20 0 2Z', 2, 1]],
  },
  islands: {
    layer: 'below',
    ink: [
      ['M-90 6Q-70 -40 -40 -30Q-20 -50 0 6', 4, 1],
      ['M20 6Q40 -26 70 -20Q86 -10 92 6', 4, 1],
      ['M-100 20H-40M-10 24H60', 2, 3],
    ],
    wash: [['M-90 6Q-70 -40 -40 -30Q-20 -50 0 6ZM20 6Q40 -26 70 -20Q86 -10 92 6Z', 3, 1]],
  },
  shrine: {
    layer: 'ground',
    ink: [
      ['M-62 2H62', 4, 1],
      ['M-40 2V-62M40 2V-62M-24 -70V-98M24 -70V-98', 3, 1],
      ['M-72 -58Q-42 -52 -32 -70H32Q42 -52 72 -58', 5, 1],
      ['M-52 -94Q-28 -88 -20 -104H20Q28 -88 52 -94', 5, 1],
    ],
    wash: [['M-72 -58Q-42 -52 -32 -70H32Q42 -52 72 -58ZM-52 -94Q-28 -88 -20 -104H20Q28 -88 52 -94Z', 2, 1]],
  },
  lantern: {
    layer: 'ground',
    ink: [
      ['M0 2V-60', 4, 1],
      ['M-14 -60Q-20 -84 0 -92Q20 -84 14 -60Z', 3, 1],
      ['M-18 -92H18M-14 -60H14', 3, 1],
    ],
    wash: [
      ['M-36 -76A36 36 0 1 0 36 -76A36 36 0 1 0 -36 -76Z', 3, 1],
      ['M-14 -60Q-20 -84 0 -92Q20 -84 14 -60Z', 2, 1],
    ],
  },
  // Air: temples on the mountain tops.
  spire: {
    layer: 'ground',
    ink: [
      ['M-90 2L-20 -150L10 -130L80 2', 4, 1],
      ['M-36 -148Q-16 -144 -12 -160H18Q22 -144 42 -148', 4, 1],
      ['M-12 -160V-186Q3 -200 18 -186V-160', 3, 1],
      ['M3 -198V-222', 2.5, 1],
    ],
    wash: [
      ['M-90 2L-20 -150L10 -130L80 2Z', 4, 0],
      ['M-12 -160V-186Q3 -200 18 -186V-160Z', 3, 1],
    ],
  },
  wind: {
    layer: 'sky',
    ink: [
      ['M-90 0Q-40 -10 0 0Q40 10 50 -10Q54 -28 36 -28Q24 -26 28 -14', 3, 1],
      ['M-70 26Q-20 18 30 26Q60 30 64 16', 2.5, 2],
      ['M-40 -34Q0 -44 30 -40', 2, 3],
    ],
  },
  cloud: {
    layer: 'sky',
    ink: [
      ['M-90 0Q-90 -26 -60 -24Q-54 -50 -24 -46Q-6 -70 22 -50Q50 -58 56 -30Q86 -30 84 0Z', 3, 2],
      ['M-50 -16Q-40 -30 -28 -20M10 -30Q22 -42 34 -30', 2, 2],
    ],
    wash: [['M-90 0Q-90 -26 -60 -24Q-54 -50 -24 -46Q-6 -70 22 -50Q50 -58 56 -30Q86 -30 84 0Z', 3, 1]],
  },
  glider: {
    layer: 'sky',
    ink: [
      ['M-60 0L0 -14L60 0L0 6Z', 3, 1],
      ['M0 -14V12', 2, 1],
      ['M-66 10Q-110 22 -150 10', 2, 3],
    ],
    wash: [['M-60 0L0 -14L60 0L0 6Z', 2, 1]],
  },
  bell: {
    layer: 'ground',
    ink: [
      ['M-50 2V-100M50 2V-100', 4, 1],
      ['M-66 -100Q0 -114 66 -100', 5, 1],
      ['M0 -102V-90', 2, 1],
      ['M-16 -90Q-18 -56 -26 -44H26Q18 -56 16 -90Z', 3, 1],
    ],
    wash: [['M-16 -90Q-18 -56 -26 -44H26Q18 -56 16 -90Z', 2, 1]],
  },
  // The end of a task.
  teahouse: {
    layer: 'ground',
    ink: [
      ['M-70 2H70', 4, 1],
      ['M-56 2V-72M56 2V-72', 4, 1],
      ['M-84 -68Q-52 -62 -42 -86H42Q52 -62 84 -68', 6, 1],
      ['M-20 2V-44H20V2', 3, 2],
      ['M30 -52H46V-34H30Z', 2, 2],
      ['M-70 -70V-56', 1.5, 1],
      ['M62 -92Q54 -108 64 -122Q74 -136 66 -152', 2, 3],
    ],
    wash: [
      ['M-56 2V-72H56V2Z', 4, 0],
      ['M-84 -68Q-52 -62 -42 -86H42Q52 -62 84 -68Z', 3, 0],
    ],
  },
  blot: {
    layer: 'ground',
    ink: [['M-50 -70L-56 -76M44 -40L52 -44M-20 -100L-22 -108M60 -80L64 -86', 3, 1]],
    wash: [
      ['M-34 -50Q-44 -80 -12 -86Q8 -104 30 -78Q54 -72 42 -46Q32 -22 0 -26Q-28 -18 -34 -50Z', 1, 0],
      ['M-30 -48Q-36 -74 -8 -78Q10 -92 26 -72Q44 -66 36 -48Q26 -30 0 -34Q-24 -28 -30 -48Z', 1, 0],
    ],
  },
}

// ---------- the regions ----------

// A far ridge for each region, drawn as a pale wash with a fainter crest line.
function ridge(stage: Stage): { fill: string; crest: string } {
  const rand = rng(stage.seed)
  const x0 = stage.x - 60
  const x1 = stage.x + STAGE_W + 60
  const base = 560
  const pts: [number, number][] = []
  const n = 9
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    let h: number
    if (stage.el === 'water') h = 80 + rand() * 70 // low, jagged ice
    else if (stage.el === 'earth') h = i % 3 === 0 ? 70 : 130 + rand() * 30 // broad mesas
    else if (stage.el === 'fire') h = 60 + 150 * Math.max(0, 1 - Math.abs(i - 4.5) / 3) + rand() * 20 // a big cone
    else h = i % 2 === 0 ? 120 + rand() * 60 : 230 + rand() * 90 // needle peaks
    // Taper both ends down to the base so neighbouring regions blend.
    const edge = Math.min(i, n - i)
    pts.push([x, base - 1.35 * (edge === 0 ? 0 : edge === 1 ? h * 0.6 : h)])
  }
  const flat = stage.el === 'earth'
  let crest = `M${r1(pts[0]![0])} ${r1(pts[0]![1])}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i]!
    const [px, py] = pts[i - 1]!
    crest += flat && i % 3 !== 0 ? `H${r1(x)}` : `Q${r1((px + x) / 2)} ${r1(Math.min(py, y) - 12)} ${r1(x)} ${r1(y)}`
  }
  return { fill: `${crest}L${r1(x1)} ${base + 40}L${r1(x0)} ${base + 40}Z`, crest }
}

// Near the trail: ripples, stones, ash or a sea of cloud, depending on the region.
function ground(stage: Stage): Ink[] {
  const out: Ink[] = []
  const rand = rng(stage.seed + 99)
  for (let i = 0; i < 6; i++) {
    const x = stage.x + 30 + i * 90 + rand() * 30
    const y = trailY(x)
    if (stage.el === 'water') out.push([`M${r1(x)} ${r1(y + 50)}h${r1(30 + rand() * 40)}`, 2, 3])
    else if (stage.el === 'earth') out.push([`M${r1(x)} ${r1(y + 30)}q8 -10 18 0`, 3, 2])
    else if (stage.el === 'fire') out.push([`M${r1(x)} ${r1(y + 34)}l14 -6l12 6`, 2.5, 2])
    else out.push([`M${r1(x)} ${r1(y + 60)}q20 -18 40 0q20 -18 40 0`, 2, 3])
  }
  return out
}

// ---------- drawing helpers ----------

type Anim = { at: number; span: number } | null

// One brush line: a pale wet halo under a dense core, both drawn on when fresh.
function stroke(d: string, w: number, tone: number, anim: Anim, i: number, n: number): string {
  const delay = anim === null ? '' : ` style="animation-delay:${sec(anim.at + (anim.span * i) / Math.max(1, n))}s"`
  const cls = anim === null ? '' : ' drw'
  const halo = w >= 3 ? `<path d="${d}" class="s ink t4${anim === null ? '' : ' dr'}" stroke-width="${r1(w * 2.3)}" pathLength="1"${delay}/>` : ''
  return `${halo}<path d="${d}" class="s ink t${tone}${cls}" stroke-width="${w}" pathLength="1"${delay}/>`
}

function wash(d: string, tone: number, tint: 0 | 1, el: Element, anim: Anim, soft: boolean): string {
  const fill = tint === 1 ? `e-${el}` : 'inkf'
  const style = anim === null ? '' : ` style="animation-delay:${sec(anim.at)}s"`
  return `<path d="${d}" class="${fill} o${tone}${anim === null ? '' : ' fd'}"${soft ? ' filter="url(#soft)"' : ''}${style}/>`
}

function motifY(m: Motif, def: Def): number {
  const y = trailY(m.x)
  if (def.layer === 'sky') return 260 + (m.seed % 120)
  if (def.layer === 'below') return y + 80
  // Things on the ground stand just above or just below the trail, alternating.
  return y + (m.seed % 2 === 0 ? -6 : 50)
}

// The brush itself: (0, 0) is the tip.
function brushSvg(): string {
  return (
    `<path d="M0 0Q-7 -10 -6 -24H6Q7 -10 0 0Z" class="inkf"/>` +
    `<path d="M-6 -24H6V-32H-6Z" class="metal"/>` +
    `<path d="M0 -32V-130" class="s bamboo" stroke-width="7"/>` +
    `<path d="M-4 -64H4M-4 -100H4" class="s ink t3" stroke-width="2"/>`
  )
}

// ---------- the traveler ----------

// A small wanderer in a wide hat and robe; (0, 0) is between the feet.
function traveler(pose: Pose, el: Element): string {
  const hat = (tilt: number): string =>
    `<g transform="rotate(${tilt} 0 -50)"><path d="M-22 -50L0 -66L22 -50Q0 -46 -22 -50Z" class="inkf"/></g>`
  const robe = `<path d="M-9 -46L-15 -8H15L9 -46Z" class="inkf o2"/><path d="M-9 -46L-15 -8H15L9 -46Z" class="s ink t1" stroke-width="2.5"/>`
  const head = `<circle cx="0" cy="-48" r="4.5" class="inkf o2"/>`
  const legs = (spread: number): string => `<path d="M-6 -8L${-6 - spread} 0M6 -8L${6 + spread} 0" class="s ink t1" stroke-width="3"/>`
  const arm = (d: string): string => `<path d="${d}" class="s ink t1" stroke-width="3"/>`

  if (pose === 'done') {
    // Seated on a mat with a cup of tea, steam curling up.
    return (
      `<path d="M-30 2H34" class="s ink t2" stroke-width="4"/>` +
      `<path d="M-12 -38L-16 -4H18L12 -38Z" class="inkf o2"/><path d="M-12 -38L-16 -4H18L12 -38Z" class="s ink t1" stroke-width="2.5"/>` +
      `<circle cx="0" cy="-40" r="4.5" class="inkf o2"/>` +
      `<path d="M-22 -42L0 -58L22 -42Q0 -38 -22 -42Z" class="inkf"/>` +
      arm('M10 -26L24 -18') +
      `<path d="M22 -20H32L30 -12H24Z" class="inkf o1"/>` +
      `<path d="M27 -24Q22 -34 28 -42Q34 -50 28 -60" class="s ink t3 steam" stroke-width="2"/>`
    )
  }
  if (pose === 'ask') {
    // Stopped on the trail, map unrolled, looking back at you.
    return (
      legs(2) + robe + head + hat(-14) +
      arm('M-8 -36L-24 -30M8 -36L24 -30') +
      `<path d="M-26 -38H26V-22H-26Z" class="paper2"/><path d="M-26 -38H26V-22H-26Z" class="s ink t2" stroke-width="1.5"/>` +
      `<path d="M-20 -32Q-8 -28 0 -32T18 -30" class="s e-${el}s" stroke-width="1.5"/>` +
      `<g class="bob"><path d="M30 -92Q30 -106 42 -106Q54 -106 54 -94Q54 -84 42 -80V-72" class="s ink t2" stroke-width="3"/><circle cx="42" cy="-62" r="2.5" class="inkf"/></g>`
    )
  }
  if (pose === 'trouble') {
    return `<g transform="rotate(-10)">${legs(6)}${robe}${head}${hat(-20)}${arm('M-8 -36L-22 -44M8 -36L20 -24')}</g>`
  }
  if (pose === 'idle') {
    return legs(3) + robe + head + hat(0) + arm('M8 -36L14 -24') + `<path d="M15 -60L18 2" class="s ink t2" stroke-width="2.5"/>`
  }
  // Working: a bending stance for each element, with the element moving around it.
  if (el === 'water') {
    return (
      legs(6) + robe + head + hat(-6) + arm('M-8 -36L-26 -46M8 -36L28 -48') +
      `<path d="M-30 -50Q-50 -80 -10 -90Q30 -100 40 -70Q46 -50 30 -52" class="s e-waters flow" stroke-width="4"/>`
    )
  }
  if (el === 'earth') {
    return (
      legs(12) + robe + head + hat(0) + arm('M-8 -34L-24 -20M8 -34L24 -20') +
      `<g class="lift"><path d="M-12 -84L4 -92L18 -84L12 -72L-8 -72Z" class="e-earth o2"/><path d="M-12 -84L4 -92L18 -84L12 -72L-8 -72Z" class="s ink t1" stroke-width="2"/></g>`
    )
  }
  if (el === 'fire') {
    return (
      legs(9) + robe + head + hat(-4) + arm('M-8 -36L-18 -26M8 -36L30 -40') +
      `<g class="flick"><path d="M32 -40Q44 -58 40 -74Q56 -60 54 -44Q50 -36 32 -40Z" class="e-fire o1"/><path d="M36 -42Q44 -52 44 -62Q52 -52 48 -44Z" class="inkf o2"/></g>`
    )
  }
  return (
    legs(4) + robe + head + hat(0) + arm('M-8 -36L-12 -58M8 -36L12 -58') +
    `<path d="M-30 -66H30" class="s ink t1 spin" stroke-width="3"/>` +
    `<path d="M-40 -40Q-50 -70 -20 -80M40 -40Q50 -70 20 -80" class="s e-airs flow" stroke-width="2.5"/>`
  )
}

// The four element glyphs, drawn new for this theme, in the top corner.
function glyphs(active: Element, pose: Pose): string {
  const marks: Record<Element, string> = {
    water: 'M-10 -3Q-5 -8 0 -3T10 -3M-10 5Q-5 0 0 5T10 5',
    earth: 'M-9 7H9M-9 7V-4H9V7M-9 1H9',
    fire: 'M0 9Q-10 2 -4 -6Q-2 -2 0 -10Q8 -2 6 4Q4 9 0 9Z',
    air: 'M-10 2Q-10 -9 0 -9Q8 -9 8 -2Q8 4 2 4Q-2 4 -2 0',
  }
  return ELEMENTS.map((el, i) => {
    const on = el === active && pose !== 'idle'
    return (
      `<g transform="translate(${1498 + i * 0} ${92 + i * 46})">` +
      `<circle r="17" class="${on ? `e-${el} o2` : 'inkf o4'}"/>` +
      `<circle r="17" class="s ink ${on ? 't1' : 't3'}" stroke-width="${on ? 2.5 : 1.5}"/>` +
      `<path d="${marks[el]}" class="s ink ${on ? 't1' : 't3'}" stroke-width="2"/>` +
      `</g>`
    )
  }).join('')
}

// A red seal with an abstract carved mark, like an artist's stamp.
function seal(x: number, y: number, rot: number, fresh: Anim): string {
  const style = fresh === null ? '' : ` style="animation-delay:${sec(fresh.at)}s"`
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${rot})"><g class="${fresh === null ? '' : 'stamp'}"${style}>` +
    `<path d="M-17 -17H17V17H-17Z" class="seal"/>` +
    `<path d="M-10 -9H-2V9M-10 0H-3M3 -9H10M6 -9V2Q6 9 1 9M3 4H10" class="s paperS" stroke-width="2.6"/>` +
    `</g></g>`
  )
}

// ---------- the fixed frame ----------

// Art that stays put in the margins while the scroll pans: a pale sun, mist and far
// peaks behind the painting, and a cliff with a leaning pine in front of it.
function frameBack(el: Element): string {
  return (
    `<circle cx="250" cy="190" r="66" class="seal o3"/>` +
    `<path d="M-40 520Q300 470 620 520Q300 560 -40 520Z" class="e-${el} o3" filter="url(#soft)"/>` +
    `<g mask="url(#fadeDown)"><path d="M1240 640L1320 360L1380 440L1450 240L1530 400L1600 330V640Z" class="inkf o3" filter="url(#soft)"/></g>` +
    `<path d="M1240 640L1320 360L1380 440L1450 240L1530 400L1600 330" class="s ink t4" stroke-width="2.5"/>`
  )
}

// A pine-needle cluster: a fan of short strokes over a soft wash, as a brush paints it.
function needles(x: number, y: number, r: number): string {
  let d = ''
  for (let a = -170; a <= -10; a += 20) {
    const t = (a * Math.PI) / 180
    d += `M${r1(x)} ${r1(y)}L${r1(x + Math.cos(t) * r)} ${r1(y + Math.sin(t) * r * 0.55)}`
  }
  return (
    `<path d="M${x - r} ${y}Q${x} ${y - r * 0.8} ${x + r} ${y}Z" class="inkf o3" filter="url(#soft)"/>` +
    `<path d="${d}" class="s ink t1" stroke-width="2.4"/>`
  )
}

// In front of the passing scroll: the cliff and its pine on the left, reeds and
// ripples along the foot of the right margin.
function frameFront(): string {
  let reeds = ''
  for (let i = 0; i < 9; i++) {
    const x = 1440 + i * 18
    const h = 90 + ((i * 37) % 70)
    reeds += `M${x} 1000Q${x - 6} ${1000 - h / 2} ${x + (i % 2 === 0 ? -14 : 12)} ${1000 - h}`
  }
  return (
    `<path d="M0 1000V300Q40 292 64 330Q100 370 92 440Q130 490 122 570Q170 630 150 710Q200 780 186 870L210 1000Z" class="inkf o4" filter="url(#soft)"/>` +
    `<path d="M0 1000V340Q30 336 46 376Q76 416 68 486Q100 536 92 606Q136 666 120 746Q164 816 150 896L170 1000Z" class="inkf o3"/>` +
    `<path d="M0 300Q40 292 64 330Q100 370 92 440Q130 490 122 570Q170 630 150 710Q200 780 186 870L210 1000" class="s ink t1" stroke-width="6"/>` +
    `<path d="M30 420Q52 450 44 500M76 560Q92 600 84 640M112 700Q128 740 120 780M24 620Q40 680 32 740M56 820Q72 860 64 920" class="s ink t2" stroke-width="3"/>` +
    `<path d="M56 335Q110 282 190 262Q240 250 296 266" class="s ink t1" stroke-width="11"/>` +
    `<path d="M62 330Q112 288 188 270" class="s ink t3" stroke-width="4"/>` +
    `<path d="M140 280Q160 246 150 214M214 258Q246 228 288 230" class="s ink t1" stroke-width="5"/>` +
    needles(150, 214, 44) + needles(288, 230, 50) + needles(306, 268, 38) + needles(212, 256, 32) + needles(96, 300, 28) +
    `<path d="${reeds}" class="s ink t1" stroke-width="4"/>` +
    `<path d="M1300 960H1420M1340 980H1460M240 960H340M220 980H320" class="s ink t3" stroke-width="2.5"/>`
  )
}

// ---------- the whole scroll ----------

const STYLE = `
.paper{fill:#efe4c9}.paper2{fill:#f6eedb}.fib{stroke:#b49c70}
.ink{stroke:#1d1914}.inkf{fill:#1d1914}.metal{fill:#6f6252}.bamboo{stroke:#a8834f}
.seal{fill:#b5352a}.paperS{stroke:#f3e9d2}
.e-water{fill:#2f4f86}.e-earth{fill:#9a7432}.e-fire{fill:#bf3f26}.e-air{fill:#5f93b3}
.e-waters{stroke:#2f4f86}.e-earths{stroke:#9a7432}.e-fires{stroke:#bf3f26}.e-airs{stroke:#5f93b3}
.vig{fill:#6b4f26}
@media (prefers-color-scheme: dark){
.paper{fill:#201b15}.paper2{fill:#2e271f}.fib{stroke:#57472f}
.ink{stroke:#ece1c9}.inkf{fill:#ece1c9}.metal{fill:#a09078}.bamboo{stroke:#c19a5f}
.seal{fill:#c8473a}.paperS{stroke:#201b15}
.e-water{fill:#7f9fd6}.e-earth{fill:#c9a35a}.e-fire{fill:#e0704f}.e-air{fill:#8fc0dc}
.e-waters{stroke:#7f9fd6}.e-earths{stroke:#c9a35a}.e-fires{stroke:#e0704f}.e-airs{stroke:#8fc0dc}
.vig{fill:#000000}
}
.s{fill:none;stroke-linecap:round;stroke-linejoin:round}
.t1{opacity:.95}.t2{opacity:.7}.t3{opacity:.46}.t4{opacity:.16}
.o1{opacity:.6}.o2{opacity:.4}.o3{opacity:.24}.o4{opacity:.12}
.dr{stroke-dasharray:1 1;animation:draw .9s ease-out both}
.drw{stroke-dasharray:1 1;animation:draw .9s ease-out both,settle 3s ease-out both}
@keyframes draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes settle{from{opacity:1}}
.fd{animation:fade 1.6s ease-in both}
@keyframes fade{from{opacity:0}}
.stamp{animation:stamp .5s ease-out both}
@keyframes stamp{0%{opacity:0;transform:scale(1.6)}60%{opacity:1;transform:scale(.94)}}
.hover{animation:hover 3.2s ease-in-out infinite alternate}
@keyframes hover{from{transform:translate(0,0) rotate(0deg)}to{transform:translate(4px,-8px) rotate(3deg)}}
.lifted{animation:hover 5s ease-in-out infinite alternate}
.shake{animation:shake .5s ease-in-out 3}
@keyframes shake{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.bob{animation:bob 2.6s ease-in-out infinite alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-4px)}}
.flow{stroke-dasharray:18 10;animation:flow 2.4s linear infinite}
@keyframes flow{from{stroke-dashoffset:56}}
.lift{animation:lift 2.2s ease-in-out infinite alternate}
@keyframes lift{from{transform:translateY(6px)}to{transform:translateY(-6px)}}
.flick{animation:flick 1.6s ease-in-out infinite alternate;transform-origin:32px -40px}
@keyframes flick{from{transform:scale(.9)}to{transform:scale(1.08)}}
.spin{animation:spin 2s ease-in-out infinite alternate;transform-origin:0 -66px}
@keyframes spin{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
.steam{animation:steam 4s ease-in-out infinite alternate}
@keyframes steam{from{opacity:.15;transform:translateY(2px)}to{opacity:.45;transform:translateY(-3px)}}
.glow{animation:glow 4s ease-in-out infinite alternate}
@keyframes glow{from{opacity:.18}to{opacity:.32}}
`

// Paper: a warm sheet with faint fibers, darker toward the edges.
function paper(): string {
  const rand = rng(4242)
  let fibers = ''
  for (let i = 0; i < 70; i++) {
    const x = rand() * W
    const y = rand() * H
    const len = 30 + rand() * 90
    fibers += `M${r1(x)} ${r1(y)}q${r1(len / 2)} ${r1(rand() * 6 - 3)} ${r1(len)} ${r1(rand() * 4 - 2)}`
  }
  return (
    `<rect width="${W}" height="${H}" class="paper"/>` +
    `<path d="${fibers}" class="s fib" stroke-width="1" opacity=".35"/>` +
    `<rect width="${W}" height="${H}" class="vig" mask="url(#edgeMask)" opacity=".28"/>`
  )
}

function secondsSince(at: number, now: number): number {
  return (now - at) / 1000
}

// Everything the camera can see, given the scroll and the time.
export function buildScene(scroll: Scroll, now: number): string {
  // A burst of quick strokes pans at most about one screen, so the scene stays small.
  const cam = { ...scroll.cam, from: Math.min(Math.max(scroll.cam.from, scroll.cam.to - 900), scroll.cam.to + 900) }
  const camElapsed = secondsSince(cam.at, now)
  const moving = camElapsed < MOVE_S && cam.from !== cam.to
  const left = Math.min(cam.from, cam.to) - 300
  const right = Math.max(cam.from, cam.to) + W + 300
  const visible = (x: number): boolean => x > left && x < right

  let far = ''
  let near = ''
  for (const stage of scroll.stages) {
    if (!visible(stage.x) && !visible(stage.x + STAGE_W)) continue
    const fresh = secondsSince(stage.at, now)
    const anim: Anim = fresh < 4 ? { at: -fresh, span: 0.6 } : null
    const { fill, crest } = ridge(stage)
    far += `<g mask="url(#fadeDown)">${wash(fill, 3, 0, stage.el, anim, true)}</g>`
    far += wash(`M${stage.x + 40} 360Q${stage.x + STAGE_W / 2} 250 ${stage.x + STAGE_W - 40} 380Q${stage.x + STAGE_W / 2} 460 ${stage.x + 40} 360Z`, 4, 1, stage.el, anim, true)
    far += stroke(crest, 2, 3, anim, 0, 1)
    const g = ground(stage)
    g.forEach(([d, w, t], i) => (near += stroke(d, w, t, anim === null ? null : { at: anim.at + 0.4, span: 0.8 }, i, g.length)))
  }

  // The trail, up to where the traveler is headed. The newest stretch is drawn fresh.
  const tx = scroll.traveler.to
  const tFrom = Math.max(scroll.traveler.from, tx - 900)
  const tElapsed = secondsSince(scroll.traveler.at, now)
  const start = Math.max(FOCUS_X - 460, left)
  const trailPath = (a: number, b: number): string => {
    let d = `M${r1(a)} ${r1(trailY(a))}`
    for (let x = a + 24; x < b; x += 24) d += `L${r1(x)} ${r1(trailY(x))}`
    return d + `L${r1(b)} ${r1(trailY(b))}`
  }
  let trail = ''
  const oldEnd = tElapsed < MOVE_S ? Math.max(start, tFrom) : tx
  if (oldEnd > start) {
    trail += `<path d="${trailPath(start, oldEnd)}" class="s ink t4" stroke-width="11"/>`
    trail += `<path d="${trailPath(start, oldEnd)}" class="s ink t2" stroke-width="2.2" stroke-dasharray="14 10"/>`
  }
  if (tElapsed < MOVE_S && tx > oldEnd) {
    const st = ` style="animation-delay:${sec(-tElapsed)}s;animation-duration:${MOVE_S}s"`
    trail += `<path d="${trailPath(oldEnd, tx)}" class="s ink t4 dr" stroke-width="11" pathLength="1"${st}/>`
    trail += `<path d="${trailPath(oldEnd, tx)}" class="s ink t2 dr" stroke-width="2.2" pathLength="1"${st}/>`
  }

  // The motifs, oldest first. The newest one draws itself, brush and all.
  let motifs = ''
  let freshMotifs = ''
  let brush = ''
  scroll.motifs.forEach((m, i) => {
    if (!visible(m.x)) return
    const def = DEFS[m.kind]
    if (def === undefined) return
    const y = motifY(m, def)
    const age = secondsSince(m.at, now)
    const fresh = age < 4
    const span = m.kind === 'teahouse' ? 2.4 : 1.6
    const anim: Anim = fresh ? { at: -age, span } : null
    const flip = m.flip && m.kind !== 'teahouse' && m.kind !== 'blot' ? ` scale(${-MS} ${MS})` : ` scale(${MS})`
    let body = ''
    for (const [d, tone, tint] of def.wash ?? []) {
      body += wash(d, tone, tint, m.el, anim === null ? null : { at: anim.at + span * 0.7, span: 0 }, true)
    }
    def.ink.forEach(([d, w, tone], j) => (body += stroke(d, w, tone, anim, j, def.ink.length)))
    if (m.kind === 'teahouse') {
      body += `<path d="M-74 -62Q-80 -54 -74 -46Q-68 -54 -74 -62Z" class="seal glow"/>`
      body += seal(-104, 46, -4, anim === null ? null : { at: anim.at + span + 0.4, span: 0 })
    }
    const shake = m.kind === 'blot' && fresh ? ' class="shake"' : ''
    const group = `<g transform="translate(${r1(m.x)} ${r1(y)})${flip}"><g${shake}>${body}</g></g>`
    if (fresh) freshMotifs += group
    else motifs += group

    // The brush rides the first line of the newest motif while it draws.
    if (i === scroll.last && fresh && scroll.pose !== 'ask') {
      const first = def.ink[0]![0].replace(/M/g, ' M').trim().split(' M')[0]!.replace(/^M?/, 'M')
      const ride = `offset-path:path('${first}');offset-rotate:0deg;animation:ride ${r1(span * 0.8)}s ease-in-out both;animation-delay:${sec(-age)}s`
      brush =
        `<g transform="translate(${r1(m.x)} ${r1(y)})${flip}"><g style="${ride}">` +
        `<g transform="rotate(${m.flip ? -24 : 24})">${brushSvg()}</g></g></g>`
    }
  })

  // The traveler, walking along the trail to the newest work.
  const pose = scroll.pose
  const walking = tElapsed < MOVE_S && tFrom !== tx
  const ty = trailY(tx)
  const walk = walking
    ? `<style>@keyframes walk{from{transform:translate(${r1(tFrom - tx)}px,${r1(trailY(tFrom) - ty)}px)}}</style>` +
      `<g style="animation:walk ${MOVE_S}s ease-in-out both;animation-delay:${sec(-tElapsed)}s">`
    : '<g>'
  const figure = `${walk}<g transform="translate(${r1(tx)} ${r1(ty)}) scale(${MS})">${traveler(pose, scroll.el)}</g></g>`

  // With no stroke in progress, the brush hovers over the scroll, or lies at rest.
  if (brush === '') {
    if (pose === 'work' || pose === 'trouble') {
      brush = `<g transform="translate(${r1(tx + 100)} ${r1(ty - 210)})"><g class="${pose === 'trouble' ? 'shake' : 'hover'}"><g transform="rotate(24) scale(1.3)">${brushSvg()}</g></g></g>`
    } else if (pose === 'ask') {
      brush = `<g transform="translate(${r1(tx + 40)} ${r1(ty - 300)})"><g class="lifted"><g transform="rotate(32) scale(1.3)">${brushSvg()}</g></g></g>`
    } else {
      brush = `<g transform="translate(${r1(tx + 90)} ${r1(ty + 110)})"><g transform="rotate(-70) scale(1.3)">${brushSvg()}</g></g>`
    }
  }

  const camStyle = moving
    ? `<style>@keyframes pan{from{transform:translateX(${r1(-cam.from)}px)}}</style>` +
      `<g style="transform:translateX(${r1(-cam.to)}px);animation:pan ${MOVE_S}s ease-in-out both;animation-delay:${sec(-camElapsed)}s">`
    : `<g transform="translate(${r1(-cam.to)} 0)">`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<style>${STYLE}@keyframes ride{from{offset-distance:0%}to{offset-distance:100%}}</style>` +
    `<defs>` +
    `<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>` +
    `<radialGradient id="edge" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="#fff" stop-opacity="0"/><stop offset="100%" stop-color="#fff" stop-opacity=".9"/></radialGradient>` +
    `<linearGradient id="fall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff" stop-opacity=".6"/><stop offset=".86" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    `<mask id="fadeDown" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#fall)"/></mask>` +
    `<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>` +
    `<mask id="edgeMask"><rect width="${W}" height="${H}" fill="url(#edge)"/></mask>` +
    `</defs>` +
    paper() +
    frameBack(scroll.el) +
    camStyle +
    `<g>${far}</g><g>${trail}${near}</g><g filter="url(#rough)">${motifs}</g>${freshMotifs}${figure}${brush}` +
    `</g>` +
    frameFront() +
    glyphs(scroll.el, pose) +
    `</svg>`
  )
}

const PLACES: Record<Element, string> = {
  water: 'an icy river valley',
  earth: 'a great walled city',
  fire: 'volcanic islands',
  air: 'mountain-top temples',
}

export function sceneAlt(scroll: Scroll): string {
  const where = scroll.stages.length === 0 ? 'a blank sheet of parchment' : PLACES[scroll.el]
  const doing: Record<Pose, string> = {
    idle: 'A brush rests beside the scroll.',
    work: 'A brush is painting the scene stroke by stroke as a traveler walks the trail.',
    ask: 'The brush has lifted and the traveler has stopped, map in hand, waiting for you.',
    done: 'The traveler sits with tea outside a small tea shop, and a red seal marks the painting finished.',
    trouble: 'A blot of ink has spilled on the scroll and the brush has paused.',
  }
  return `An ink-wash painting on parchment showing ${where}. ${doing[scroll.pose]}`
}
