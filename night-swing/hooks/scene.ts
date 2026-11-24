// The night-city backdrop: a wide comic-book harbor at night, with a suspension bridge,
// a river full of reflections, and an original masked web-slinger at work.
// Pure vector, no images or embedded fonts, so the app will draw it.

export type Pose = 'idle' | 'swing' | 'sense' | 'done' | 'ask'
export type Episode = 'bridge' | 'bank' | 'glider'
export const EPISODES: readonly Episode[] = ['bridge', 'bank', 'glider']

const INK = '#07080f'
const RED = '#d8232f'
const RED_DARK = '#8e1220'
const BLUE = '#1f4fd1'
const LENS = '#f4f7ff'
const WEB = '#f4f7ff'
const FONT_SFX = `font-family="Impact, 'Arial Black', 'Comic Sans MS', sans-serif" font-weight="900"`
const FONT_TALK = `font-family="'Comic Sans MS', 'Comic Neue', cursive" font-weight="700"`

// A small repeatable random, so the city looks the same on every redraw.
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// ---------- the hero ----------

// A limb drawn twice: thick ink underneath, color on top.
function limb(d: string, color: string, width: number): string {
  return (
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width + 4}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`
  )
}

// Mask head with big white lenses and a few web lines. (cx, cy) is its center; tilt in degrees.
function head(cx: number, cy: number, tilt: number): string {
  return (
    `<g transform="translate(${cx} ${cy}) rotate(${tilt})">` +
    `<ellipse rx="12" ry="14" fill="${RED}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M0 -14V14M-12 0H12M-9 -9Q0 -4 9 -9M-9 9Q0 4 9 9" stroke="${RED_DARK}" stroke-width="1" fill="none"/>` +
    `<path d="M-2 -2Q-6 -9 -10 -5Q-10 2 -3 2Z" fill="${LENS}" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M2 -2Q6 -9 10 -5Q10 2 3 2Z" fill="${LENS}" stroke="${INK}" stroke-width="2"/>` +
    `</g>`
  )
}

// Torso polygon with blue flanks and a small spider emblem.
function torso(points: string, flank: string, emblemX: number, emblemY: number): string {
  return (
    `<path d="${points}" fill="${RED}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${flank}" fill="${BLUE}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>` +
    `<g transform="translate(${emblemX} ${emblemY})" stroke="${INK}" stroke-width="1.4" fill="${INK}">` +
    `<ellipse rx="2" ry="3.4"/><path d="M-1 -2L-6 -6M1 -2L6 -6M-1 0L-6 0M1 0L6 0M-1 1L-6 5M1 1L6 5M-1 2L-4 8M1 2L4 8" fill="none"/>` +
    `</g>`
  )
}

// Hanging from a web line: the hand is at (0, 0) and the body falls below it.
function swingingHero(): string {
  return (
    `<g>` +
    limb('M-6 64L14 80L24 96', BLUE, 8) +
    limb('M22 92L26 100', RED, 9) +
    limb('M-10 64L-22 82L-12 98', BLUE, 8) +
    limb('M-14 94L-10 102', RED, 9) +
    torso('M-16 34L8 30L10 64L-12 68Z', 'M-14 54L10 52L10 64L-12 68Z', -3, 42) +
    limb('M2 32L2 0', RED, 7) +
    limb('M-14 38L-30 50L-38 40', RED, 7) +
    head(-6, 18, -12) +
    `</g>`
  )
}

// Crouched: (0, 0) is between the boots.
function perchedHero(lookUp: boolean): string {
  return (
    `<g>` +
    limb('M-14 0L-24 -18L-4 -30', BLUE, 9) +
    limb('M14 0L24 -16L4 -30', BLUE, 9) +
    limb('M-18 -1L-10 -1', RED, 9) +
    limb('M10 -1L18 -1', RED, 9) +
    torso('M-13 -26L13 -28L11 -60L-13 -58Z', 'M-13 -26L13 -28L12 -38L-13 -36Z', -1, -48) +
    limb('M8 -56L20 -36L9 -6', RED, 7) +
    limb('M-10 -56L-24 -40L-17 -6', RED, 7) +
    head(2, -72, lookUp ? -18 : 8) +
    `</g>`
  )
}

// Wavy danger lines around a head at (cx, cy).
function senseLines(cx: number, cy: number): string {
  return (
    `<g class="sense" transform="translate(${cx} ${cy})" fill="none" stroke="#ff4b2b" stroke-width="3" stroke-linecap="round">` +
    `<path d="M-22 -18Q-28 -24 -24 -30Q-20 -36 -26 -42"/>` +
    `<path d="M22 -18Q28 -24 24 -30Q20 -36 26 -42"/>` +
    `<path d="M-30 4Q-38 0 -36 -8Q-34 -14 -42 -18"/>` +
    `<path d="M30 4Q38 0 36 -8Q34 -14 42 -18"/>` +
    `<path d="M0 -30Q-4 -38 0 -44Q4 -50 0 -56"/>` +
    `</g>`
  )
}

// One run across the city: a web to each rooftop or bridge tower in turn. Each swing
// ends exactly where the next begins, so the hero flows from building to building.
// [anchor x, anchor y, web length]; the outer two anchor on buildings just off screen.
const RUN_ANGLE = 58
const RIGS: readonly (readonly [number, number, number])[] = [
  [-136, 175, 255],
  [200, 235, 141],
  [560, 160, 283],
  [1040, 160, 283],
  [1400, 235, 141],
  [1736, 175, 255],
]

function cityRun(name: string, seconds: number, sensing: boolean, scale = 1.1): string {
  // time each swing by its web length, so long swings take longer
  const weights = RIGS.map(([, , l]) => 0.6 + l / 300)
  const total = weights.reduce((sum, w) => sum + w, 0)
  let at = 0
  let css = ''
  let out = ''
  RIGS.forEach(([ax, ay, l], i) => {
    const from = (at / total) * 100
    at += weights[i] ?? 0
    const to = (at / total) * 100
    const key = `${name}${i}`
    const resting = i === 2 ? 1 : 0
    css +=
      `@keyframes ${key} {` +
      ` 0% { opacity: 0; transform: rotate(${RUN_ANGLE}deg); }` +
      (from > 0 ? ` ${(from - 0.01).toFixed(2)}% { opacity: 0; transform: rotate(${RUN_ANGLE}deg); }` : '') +
      ` ${from.toFixed(2)}% { opacity: 1; transform: rotate(${RUN_ANGLE}deg); animation-timing-function: ease-in-out; }` +
      ` ${to.toFixed(2)}% { opacity: 1; transform: rotate(-${RUN_ANGLE}deg); }` +
      (to < 100 ? ` ${(to + 0.01).toFixed(2)}% { opacity: 0; transform: rotate(-${RUN_ANGLE}deg); } 100% { opacity: 0; transform: rotate(-${RUN_ANGLE}deg); }` : '') +
      ` }`
    out +=
      `<g transform="translate(${ax} ${ay})">` +
      `<g style="opacity:${resting}; transform: rotate(20deg); transform-origin: 0 0; animation: ${key} ${seconds}s linear infinite">` +
      `<path d="M0 0V${l}" stroke="${WEB}" stroke-width="2"/>` +
      `<g transform="translate(0 ${l}) scale(${scale})">${swingingHero()}${sensing ? senseLines(-6, 18) : ''}</g>` +
      `</g></g>`
  })
  return out + `<style>${css}</style>`
}

// ---------- comic bits ----------

// A jagged comic burst with a word in it.
function burst(x: number, y: number, word: string, fill: string, cls: string, scale = 1, delay = 0): string {
  return (
    `<g transform="translate(${x} ${y}) scale(${scale})"><g class="${cls}" style="animation-delay:${delay}s">` +
    `<path d="M0 -46L14 -26L40 -38L32 -12L62 -6L34 8L46 32L16 22L4 48L-8 22L-38 34L-28 8L-62 0L-30 -12L-40 -40L-12 -26Z" fill="${fill}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    `<text x="0" y="8" text-anchor="middle" ${FONT_SFX} font-size="21" fill="${INK}" letter-spacing="1">${word}</text>` +
    `</g></g>`
  )
}

// A rounded speech bubble with its top-left at (bx, by) and its tail pointing at (tx, ty).
function speech(bx: number, by: number, lines: string[], tx: number, ty: number, size = 21): string {
  const w = Math.max(...lines.map(l => l.length)) * size * 0.6 + 40
  const h = lines.length * (size + 5) + 22
  const r = 14
  const baseMid = Math.min(Math.max(tx, bx + 30), bx + w - 30)
  const text = lines
    .map((l, i) => `<text x="${bx + w / 2}" y="${by + 14 + size + i * (size + 5)}" text-anchor="middle" ${FONT_TALK} font-size="${size}" fill="${INK}">${l}</text>`)
    .join('')
  const tailUp = ty < by
  const edge = tailUp ? by : by + h
  const shape = tailUp
    ? `M${bx + r} ${by}H${baseMid - 12}L${tx} ${ty}L${baseMid + 12} ${by}H${bx + w - r}Q${bx + w} ${by} ${bx + w} ${by + r}V${by + h - r}Q${bx + w} ${by + h} ${bx + w - r} ${by + h}H${bx + r}Q${bx} ${by + h} ${bx} ${by + h - r}V${by + r}Q${bx} ${by} ${bx + r} ${by}Z`
    : `M${bx + r} ${by}H${bx + w - r}Q${bx + w} ${by} ${bx + w} ${by + r}V${by + h - r}Q${bx + w} ${edge} ${bx + w - r} ${edge}H${baseMid + 12}L${tx} ${ty}L${baseMid - 12} ${edge}H${bx + r}Q${bx} ${edge} ${bx} ${by + h - r}V${by + r}Q${bx} ${by} ${bx + r} ${by}Z`
  return (
    `<g class="bubble">` +
    `<path d="${shape}" fill="#fffdf2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>` +
    text +
    `</g>`
  )
}

// ---------- the villains (original designs) ----------

// A goggled scientist on four mechanical arms. (0, 0) is where the arms meet his back.
function mechVillain(): string {
  const arm = (cls: string, d: string) =>
    `<g class="${cls}">` +
    `<path d="${d}" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="#9aa6bd" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="7 3"/>` +
    `</g>`
  const claw = (x: number, y: number) =>
    `<path d="M${x} ${y}l-8 10M${x} ${y}l0 12M${x} ${y}l8 10" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
  return (
    `<g>` +
    arm('armA', 'M0 0Q-40 -10 -60 20Q-75 45 -70 70') + `<g class="armA">${claw(-70, 70)}</g>` +
    arm('armB', 'M0 0Q40 -10 60 20Q75 45 70 70') + `<g class="armB">${claw(70, 70)}</g>` +
    arm('armC', 'M0 0Q-50 -40 -70 -60Q-90 -80 -80 -100') + `<g class="armC">${claw(-80, -100)}</g>` +
    arm('armD', 'M0 0Q50 -40 70 -60Q90 -80 84 -102') + `<g class="armD">${claw(84, -102)}</g>` +
    // coat, legs and head
    limb('M-6 28L-10 56', '#2b2a3a', 8) + limb('M6 28L10 56', '#2b2a3a', 8) +
    `<path d="M-16 -14L16 -14L20 32L-20 32Z" fill="#2f6b3a" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M-8 -14L0 6L8 -14" fill="#e8e1c9" stroke="${INK}" stroke-width="2"/>` +
    limb('M-16 -8L-28 14', '#2f6b3a', 7) + limb('M16 -8L28 14', '#2f6b3a', 7) +
    `<ellipse cx="0" cy="-28" rx="13" ry="14" fill="#e9b48a" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M-13 -34Q-10 -44 0 -44Q10 -44 13 -34" fill="#3a2a1e" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="-5" cy="-29" r="5" fill="#ffd23f" stroke="${INK}" stroke-width="2.5"/>` +
    `<circle cx="6" cy="-29" r="5" fill="#ffd23f" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M-4 -19Q0 -16 5 -19" stroke="${INK}" stroke-width="2" fill="none"/>` +
    `</g>`
  )
}

// A grinning masked bomber standing on a bat-winged glider. (0, 0) is the glider's middle.
function gliderVillain(): string {
  return (
    `<g>` +
    `<path d="M-60 0Q-40 -10 -20 -6L0 -10L20 -6Q40 -10 60 0Q48 4 40 12Q30 4 20 10Q10 4 0 8Q-10 4 -20 10Q-30 4 -40 12Q-48 4 -60 0Z" fill="#2c7a2c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<circle cx="-34" cy="2" r="3" fill="#ffd23f"/><circle cx="34" cy="2" r="3" fill="#ffd23f"/>` +
    `<path class="jet" d="M-6 10L0 30L6 10Z" fill="#ff9a2b"/>` +
    limb('M-6 -10L-10 -30', '#5a2a82', 7) + limb('M6 -10L10 -30', '#5a2a82', 7) +
    `<path d="M-13 -30L13 -30L11 -58L-11 -58Z" fill="#5a2a82" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M-12 -40H12" stroke="#2c7a2c" stroke-width="5"/>` +
    limb('M-10 -54L-26 -42', '#2c7a2c', 6) + limb('M10 -54L24 -66', '#2c7a2c', 6) +
    `<circle cx="27" cy="-71" r="7" fill="#ff8a1e" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M24 -74l2 2l2 -2M25 -68h4" stroke="${INK}" stroke-width="1.5" fill="none"/>` +
    `<path d="M-12 -70Q-18 -88 -8 -82Q0 -92 8 -82Q18 -88 12 -70Q12 -58 0 -58Q-12 -58 -12 -70Z" fill="#3ea83e" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M-7 -74L-2 -71M7 -74L2 -71" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M-6 -64Q0 -60 6 -64" stroke="${INK}" stroke-width="2" fill="none"/>` +
    `</g>`
  )
}

// A masked robber with a money bag. (0, 0) is between his feet.
function robber(flip: boolean): string {
  return (
    `<g transform="scale(${flip ? -1 : 1} 1)">` +
    limb('M-5 -22L-10 0', '#22222c', 6) + limb('M5 -22L10 0', '#22222c', 6) +
    `<path d="M-10 -46H10L9 -22H-9Z" fill="#e8e8ee" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M-10 -40H10M-10 -34H10M-10 -28H10" stroke="${INK}" stroke-width="2.5"/>` +
    limb('M8 -42L20 -30', '#e8e8ee', 5) +
    `<path d="M16 -30Q12 -14 22 -12Q34 -12 32 -26Q30 -34 22 -32Z" fill="#c9a25a" stroke="${INK}" stroke-width="2.5"/>` +
    `<text x="24" y="-17" text-anchor="middle" ${FONT_SFX} font-size="11" fill="${INK}">$</text>` +
    `<circle cx="0" cy="-54" r="9" fill="#e9b48a" stroke="${INK}" stroke-width="2.5"/>` +
    `<path d="M-9 -56H9V-51H-9Z" fill="${INK}"/><circle cx="-4" cy="-54" r="1.6" fill="#fff"/><circle cx="4" cy="-54" r="1.6" fill="#fff"/>` +
    `<path d="M-9 -58Q0 -68 9 -58Z" fill="#22222c"/>` +
    `</g>`
  )
}

// A getaway van facing right. (0, 0) is the middle of its wheelbase on the road.
function van(): string {
  return (
    `<g>` +
    `<path d="M-46 -8V-38Q-46 -42 -42 -42H18L34 -24H44Q48 -24 48 -20V-8Z" fill="#3a4a63" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M20 -38L31 -26H20Z" fill="#9fd3ff" stroke="${INK}" stroke-width="2"/>` +
    `<path d="M-40 -32H12V-20H-40Z" fill="#2a3448"/>` +
    `<circle cx="-30" cy="-6" r="8" fill="${INK}"/><circle cx="30" cy="-6" r="8" fill="${INK}"/>` +
    `<circle cx="-30" cy="-6" r="3" fill="#888"/><circle cx="30" cy="-6" r="3" fill="#888"/>` +
    `<path d="M46 -18h6" stroke="#fff6b0" stroke-width="4"/>` +
    `</g>`
  )
}

// A police car facing right with a slow red and blue light bar.
function policeCar(): string {
  return (
    `<g>` +
    `<path d="M-40 -8V-20L-26 -22L-16 -34H14L24 -22L40 -20V-8Z" fill="#f2f4fa" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M-40 -16H40" stroke="#1f4fd1" stroke-width="4"/>` +
    `<path d="M-12 -30H10L16 -22H-18Z" fill="#9fd3ff" stroke="${INK}" stroke-width="1.5"/>` +
    `<rect class="sirenR" x="-10" y="-40" width="9" height="6" fill="#ff2a3a"/>` +
    `<rect class="sirenB" x="1" y="-40" width="9" height="6" fill="#2a6bff"/>` +
    `<circle cx="-24" cy="-6" r="7" fill="${INK}"/><circle cx="24" cy="-6" r="7" fill="${INK}"/>` +
    `</g>`
  )
}

// A villain wrapped in web, hanging from a strand. (0, 0) is the top of the strand.
function cocoon(faceColor: string): string {
  return (
    `<g class="dangle">` +
    `<path d="M0 0V60" stroke="${WEB}" stroke-width="2"/>` +
    `<path d="M-16 66Q-20 100 -10 128Q0 140 10 128Q20 100 16 66Q0 54 -16 66Z" fill="#e9ecf7" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M-16 76L16 88M-18 96L18 104M-14 116L14 124M-12 70L14 110M12 70L-14 112" stroke="#aab2cf" stroke-width="1.5"/>` +
    `<circle cx="0" cy="62" r="11" fill="${faceColor}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M-4 60l2 2l2 -2M2 60l2 2l2 -2M-4 67Q0 64 4 67" stroke="${INK}" stroke-width="1.5" fill="none"/>` +
    `</g>`
  )
}

// ---------- the city ----------

const W = 1600
const H = 900
const HORIZON = 560

function stars(): string {
  const r = rng(7)
  let out = ''
  for (let i = 0; i < 46; i++) {
    const x = Math.round(r() * W)
    const y = Math.round(r() * 330)
    const size = (0.7 + r() * 1.3).toFixed(1)
    out += `<circle class="star" style="animation-delay:-${(r() * 5).toFixed(1)}s" cx="${x}" cy="${y}" r="${size}" fill="#fff6d6"/>`
  }
  return out
}

// A building with a grid of windows, some lit. Returns the building and its lights' reflection.
function tower(x: number, w: number, top: number, base: number, seed: number, color: string): { body: string; glow: string } {
  const r = rng(seed)
  let body = `<rect x="${x}" y="${top}" width="${w}" height="${base - top}" fill="${color}"/>`
  let glow = ''
  const cols = Math.max(1, Math.floor((w - 6) / 9))
  const rows = Math.floor((base - top - 10) / 12)
  for (let c = 0; c < cols; c++) {
    for (let row = 0; row < rows; row++) {
      if (r() < 0.42) {
        const wx = x + 5 + c * 9
        const wy = top + 8 + row * 12
        const warm = r() < 0.8
        body += `<rect x="${wx}" y="${wy}" width="4" height="6" fill="${warm ? '#ffd35c' : '#9fd3ff'}" opacity="${(0.55 + r() * 0.45).toFixed(2)}"/>`
      }
    }
    if (r() < 0.5) {
      const gx = x + 6 + c * 9
      glow += `<rect class="shim" style="animation-delay:-${(r() * 4).toFixed(1)}s" x="${gx}" y="${HORIZON + 6 + Math.round(r() * 30)}" width="3" height="${Math.round(10 + r() * 40)}" fill="#ffd35c" opacity="0.35"/>`
    }
  }
  // a spire or water tank now and then
  if (r() < 0.3) body += `<path d="M${x + w / 2} ${top - 34}V${top}" stroke="${color}" stroke-width="3"/><circle class="beacon" cx="${x + w / 2}" cy="${top - 35}" r="2.5" fill="#ff3348"/>`
  else if (r() < 0.4) body += `<rect x="${x + 6}" y="${top - 14}" width="14" height="14" fill="${color}"/><path d="M${x + 4} ${top - 14}L${x + 13} ${top - 22}L${x + 22} ${top - 14}Z" fill="${color}"/>`
  return { body, glow }
}

function skyline(): string {
  let far = ''
  const rf = rng(3)
  for (let x = -20; x < W + 20; ) {
    const w = 30 + Math.round(rf() * 50)
    const top = HORIZON - 60 - Math.round(rf() * 120)
    far += `<rect x="${x}" y="${top}" width="${w}" height="${HORIZON - top}" fill="#1f1a4a"/>`
    x += w - 4
  }
  let near = ''
  let glow = ''
  const rn = rng(11)
  for (let x = -10; x < W + 10; ) {
    const w = 34 + Math.round(rn() * 46)
    const tall = x < 420 || x > 1180 ? 150 : 70
    const top = HORIZON - 30 - Math.round(rn() * tall)
    const t = tower(x, w, top, HORIZON, Math.round(rn() * 10000), '#151238')
    near += t.body
    glow += t.glow
    x += w + Math.round(rn() * 6)
  }
  return far + near + `<g>${glow}</g>`
}

// A stone suspension bridge across the river, towers at x 560 and 1040.
const DECK = 520
function bridge(): string {
  const T0 = 560
  const T1 = 1040
  const towers = [T0, T1]
  const top = 160
  let out = ''
  // main and side cables
  const cable = `M140 ${DECK}Q350 ${DECK - 40} ${T0} ${top + 18}Q800 ${DECK - 10} ${T1} ${top + 18}Q1250 ${DECK - 40} 1460 ${DECK}`
  out += `<path d="${cable}" fill="none" stroke="#c7cfe8" stroke-width="3"/>`
  // hangers
  for (let x = 180; x < 1440; x += 22) {
    if (Math.abs(x - T0) < 26 || Math.abs(x - T1) < 26) continue
    let y: number
    if (x < T0) {
      const t = (x - 140) / (T0 - 140)
      y = (1 - t) ** 2 * DECK + 2 * (1 - t) * t * (DECK - 40) + t ** 2 * (top + 18)
    } else if (x < T1) {
      const t = (x - T0) / (T1 - T0)
      y = (1 - t) ** 2 * (top + 18) + 2 * (1 - t) * t * (DECK - 10) + t ** 2 * (top + 18)
    } else {
      const t = (x - T1) / (1460 - T1)
      y = (1 - t) ** 2 * (top + 18) + 2 * (1 - t) * t * (DECK - 40) + t ** 2 * DECK
    }
    out += `<path d="M${x} ${y.toFixed(1)}V${DECK}" stroke="#8e97b8" stroke-width="1"/>`
  }
  // deck
  out += `<rect x="100" y="${DECK}" width="1400" height="14" fill="#2a2556" stroke="${INK}" stroke-width="2"/>`
  for (let x = 120; x < 1500; x += 48) out += `<circle cx="${x}" cy="${DECK - 3}" r="2.2" fill="#ffe08a"/>`
  // stone towers with twin pointed arches
  for (const tx of towers) {
    out +=
      `<path d="M${tx - 34} ${HORIZON + 30}V${top + 10}L${tx - 26} ${top}H${tx + 26}L${tx + 34} ${top + 10}V${HORIZON + 30}Z" fill="#3b3366" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      `<path d="M${tx - 24} ${DECK}V${top + 70}Q${tx - 15} ${top + 46} ${tx - 6} ${top + 70}V${DECK}Z" fill="#15123a"/>` +
      `<path d="M${tx + 6} ${DECK}V${top + 70}Q${tx + 15} ${top + 46} ${tx + 24} ${top + 70}V${DECK}Z" fill="#15123a"/>` +
      `<path d="M${tx - 34} ${top + 30}H${tx + 34}" stroke="${INK}" stroke-width="2"/>` +
      `<circle class="beacon" cx="${tx}" cy="${top - 4}" r="3" fill="#ff3348"/>`
  }
  // traffic: headlights one way, taillights the other
  for (let i = 0; i < 5; i++) {
    out += `<circle class="carR" style="animation-delay:-${i * 3.1}s" cx="100" cy="${DECK + 5}" r="2.4" fill="#fff6c8"/>`
    out += `<circle class="carL" style="animation-delay:-${i * 3.7 + 1}s" cx="1500" cy="${DECK + 9}" r="2.4" fill="#ff4a4a"/>`
  }
  return out
}

function water(): string {
  let out =
    `<rect x="0" y="${HORIZON}" width="${W}" height="${H - HORIZON}" fill="url(#river)"/>` +
    `<path d="M0 ${HORIZON}H${W}" stroke="#4a3f8a" stroke-width="2"/>`
  // moon path on the water
  for (let i = 0; i < 14; i++) {
    const y = HORIZON + 20 + i * 22
    const w = 30 + i * 9
    out += `<rect class="shim" style="animation-delay:-${(i * 0.37).toFixed(2)}s" x="${1250 - w / 2}" y="${y}" width="${w}" height="3" rx="1.5" fill="#fbefc9" opacity="0.4"/>`
  }
  // bridge light reflections
  for (let x = 120; x < 1500; x += 48) {
    out += `<rect class="shim" style="animation-delay:-${((x * 7) % 40) / 10}s" x="${x - 1.5}" y="${HORIZON + 40}" width="3" height="${24 + ((x * 13) % 30)}" fill="#ffe08a" opacity="0.3"/>`
  }
  // ripples
  const r = rng(21)
  for (let i = 0; i < 40; i++) {
    const x = Math.round(r() * W)
    const y = HORIZON + 30 + Math.round(r() * (H - HORIZON - 40))
    out += `<path class="ripple" style="animation-delay:-${(r() * 6).toFixed(1)}s" d="M${x} ${y}h${16 + Math.round(r() * 30)}" stroke="#6f66c9" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`
  }
  // a little ferry crossing
  out +=
    `<g class="ferry"><g transform="translate(0 ${HORIZON + 150})">` +
    `<path d="M-50 0H50L40 14H-40Z" fill="#e9ecf7" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M-32 0V-16H24V0Z" fill="#d8232f" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="-26" y="-12" width="6" height="5" fill="#ffd35c"/><rect x="-14" y="-12" width="6" height="5" fill="#ffd35c"/><rect x="-2" y="-12" width="6" height="5" fill="#ffd35c"/><rect x="10" y="-12" width="6" height="5" fill="#ffd35c"/>` +
    `<path d="M6 -16V-28" stroke="${INK}" stroke-width="4"/>` +
    `</g></g>`
  return out
}

// The bank on the near-left shore: a little classical front with an alarm light.
function bank(alarm: boolean): string {
  const x = 300
  const base = HORIZON + 4
  let cols = ''
  for (let i = 0; i < 5; i++) cols += `<rect x="${x + 14 + i * 30}" y="${base - 74}" width="12" height="62" fill="#cfd3e3" stroke="${INK}" stroke-width="2"/>`
  return (
    `<g>` +
    `<path d="M${x - 6} ${base - 78}L${x + 85} ${base - 116}L${x + 176} ${base - 78}Z" fill="#dfe3f0" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
    `<rect x="${x}" y="${base - 80}" width="170" height="8" fill="#dfe3f0" stroke="${INK}" stroke-width="2"/>` +
    cols +
    `<rect x="${x - 4}" y="${base - 12}" width="178" height="12" fill="#dfe3f0" stroke="${INK}" stroke-width="2"/>` +
    `<text x="${x + 85}" y="${base - 85}" text-anchor="middle" ${FONT_SFX} font-size="15" fill="${INK}" letter-spacing="3">BANK</text>` +
    (alarm ? `<circle class="alarm" cx="${x + 85}" cy="${base - 128}" r="7" fill="#ff2a3a"/>` : '') +
    `</g>`
  )
}

// The near city: tall skyscrapers close to us on both edges, framing the river.
// The hero's webs catch the rooftop corners at (200, 235) and (1400, 235).
function nearBuilding(x: number, w: number, top: number, pattern: string, body: string, sign = ''): string {
  return (
    `<rect x="${x}" y="${top}" width="${w}" height="${H - top + 10}" fill="${body}" stroke="${INK}" stroke-width="3"/>` +
    `<rect x="${x + 8}" y="${top + 16}" width="${w - 16}" height="${H - top}" fill="url(#${pattern})"/>` +
    `<rect x="${x - 6}" y="${top - 10}" width="${w + 12}" height="12" fill="${body}" stroke="${INK}" stroke-width="3"/>` +
    sign
  )
}

function nearCity(): string {
  return (
    // left edge
    nearBuilding(-60, 110, 120, 'nearA', '#120f30') +
    nearBuilding(60, 150, 235, 'nearB', '#1a1640',
      `<rect x="86" y="196" width="34" height="30" fill="#2a2556" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M82 196L103 182L124 196Z" fill="#2a2556" stroke="${INK}" stroke-width="3"/>` +
      `<path d="M92 226V235M114 226V235" stroke="${INK}" stroke-width="3"/>`) +
    // right edge
    nearBuilding(1390, 150, 235, 'nearA', '#1a1640',
      `<g transform="translate(1415 205)"><rect width="100" height="26" rx="4" fill="#0d0b26" stroke="${INK}" stroke-width="3"/>` +
      `<text class="neon" x="50" y="20" text-anchor="middle" ${FONT_SFX} font-size="19" fill="#ff5fa2" letter-spacing="2">PIZZA</text></g>` +
      `<path d="M1430 231V235M1500 231V235" stroke="${INK}" stroke-width="3"/>`) +
    nearBuilding(1550, 110, 120, 'nearB', '#120f30')
  )
}

// ---------- the episodes ----------

// The hero takes on the four-armed scientist on top of the left bridge tower.
function episodeBridge(sensing: boolean): string {
  return (
    `<g transform="translate(800 470)">${mechVillain()}</g>` +
    burst(700, 380, 'POW!', '#ffd23f', 'popA', 0.85, 0) +
    burst(910, 360, 'KRAK!', '#ff7a3a', 'popA', 0.85, 3.2) +
    cityRun('runA', 11, sensing) +
    `<g transform="translate(240 210)"><text class="popA" style="animation-delay:1.6s" ${FONT_SFX} font-size="26" fill="#ffd23f" stroke="${INK}" stroke-width="1.5">THWIP!</text></g>`
  )
}

// Robbers flee the bank in a van over the bridge, police in pursuit, the hero closing in.
function episodeBank(sensing: boolean): string {
  return (
    bank(true) +
    `<g transform="translate(484 ${HORIZON + 4})"><g class="runner">${robber(false)}</g></g>` +
    `<g class="chase"><g transform="translate(0 ${DECK})">` +
    `<g transform="translate(0 0)">${van()}</g>` +
    `<g transform="translate(-150 0)">${policeCar()}</g>` +
    `<g transform="translate(-6 -44) scale(0.8)">${robber(true)}</g>` +
    `</g></g>` +
    cityRun('runB', 10, sensing) +
    `<g transform="translate(320 420)"><text class="popA" ${FONT_SFX} font-size="24" fill="#ff3348" stroke="${INK}" stroke-width="1.5">WEE-OOO!</text></g>` +
    burst(1180, 430, 'STOP!', '#ffd23f', 'popA', 0.8, 2.5)
  )
}

// A grinning bomber on a glider tears across the sky; the hero gives chase.
function episodeGlider(sensing: boolean): string {
  return (
    `<g class="glide"><g transform="scale(1.3)">${gliderVillain()}</g>` +
    `<g transform="translate(34 -90)"><g class="bomb"><circle cx="0" cy="0" r="8" fill="#ff8a1e" stroke="${INK}" stroke-width="2.5"/></g></g>` +
    burst(34, 230, 'KA-BOOM!', '#ff7a3a', 'popB', 0.95, 0) +
    `</g>` +
    burst(1180, 380, 'ZAP!', '#ffd23f', 'popA', 0.8, 1.2) +
    cityRun('runC', 10, sensing)
  )
}

// A quiet patrol: one long lazy swing over the river.
function patrol(): string {
  return cityRun('runP', 16, false, 1)
}

// When it is your call: hanging upside down from the right tower's cable, waiting.
function askScene(): string {
  return (
    `<g class="dangle" style="transform-origin: 1110px 350px">` +
    `<path d="M1110 350V390" stroke="${WEB}" stroke-width="2"/>` +
    `<g transform="translate(1110 390) rotate(180) scale(1.3)">${perchedHero(true)}${senseLines(2, -72)}</g></g>` +
    speech(1160, 330, ['Your call,', 'chief!'], 1132, 420)
  )
}

// ---------- assembly ----------

const STYLE = `<style>
  .star { animation: twinkle 5s ease-in-out infinite; }
  @keyframes twinkle { 0%, 100% { opacity: 0.9; } 50% { opacity: 0.3; } }
  .beacon { animation: beacon 2.4s ease-in-out infinite; }
  @keyframes beacon { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .shim { animation: shim 4s ease-in-out infinite; }
  @keyframes shim { 0%, 100% { opacity: 0.4; transform: translateX(0); } 50% { opacity: 0.15; transform: translateX(3px); } }
  .ripple { animation: ripple 6s ease-in-out infinite; }
  @keyframes ripple { 0%, 100% { opacity: 0.5; transform: translateX(0); } 50% { opacity: 0.1; transform: translateX(12px); } }
  .carR { animation: carR 16s linear infinite; }
  @keyframes carR { from { transform: translateX(0); } to { transform: translateX(1400px); } }
  .carL { animation: carL 18s linear infinite; }
  @keyframes carL { from { transform: translateX(0); } to { transform: translateX(-1400px); } }
  .ferry { animation: ferry 60s linear infinite; }
  @keyframes ferry { from { transform: translateX(-120px); } to { transform: translateX(1720px); } }
  .pendulum { transform-origin: 0 0; animation: swing 3.2s ease-in-out infinite alternate; }
  @keyframes swing { from { transform: rotate(-30deg); } to { transform: rotate(28deg); } }
  .popA { animation: pop 6.4s ease-in-out infinite; opacity: 0; }
  .popB { animation: pop 5s ease-in-out infinite; opacity: 0; }
  @keyframes pop { 0%, 55%, 100% { opacity: 0; } 65%, 85% { opacity: 1; } }
  .sense { animation: tingle 1.6s ease-in-out infinite; }
  @keyframes tingle { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
  .bubble { animation: bob 4s ease-in-out infinite; }
  @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .dangle { animation: dangle 5s ease-in-out infinite alternate; }
  @keyframes dangle { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
  .armA { animation: armA 2.6s ease-in-out infinite alternate; }
  .armB { animation: armB 3s ease-in-out infinite alternate; }
  .armC { animation: armC 2.2s ease-in-out infinite alternate; }
  .armD { animation: armD 2.8s ease-in-out infinite alternate; }
  @keyframes armA { from { transform: rotate(-10deg); } to { transform: rotate(14deg); } }
  @keyframes armB { from { transform: rotate(12deg); } to { transform: rotate(-12deg); } }
  @keyframes armC { from { transform: rotate(-16deg); } to { transform: rotate(8deg); } }
  @keyframes armD { from { transform: rotate(10deg); } to { transform: rotate(-18deg); } }
  .alarm { animation: alarm 1.2s ease-in-out infinite; }
  @keyframes alarm { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }
  .sirenR { animation: alarm 1s ease-in-out infinite; }
  .sirenB { animation: alarm 1s ease-in-out infinite; animation-delay: -0.5s; }
  .runner { animation: runner 9s ease-in-out infinite; }
  @keyframes runner { 0% { transform: translateX(0); opacity: 1; } 40% { transform: translateX(110px); opacity: 1; } 45%, 100% { transform: translateX(110px); opacity: 0; } }
  .chase { animation: chase 12s linear infinite; }
  @keyframes chase { from { transform: translateX(80px); } to { transform: translateX(1560px); } }
  .glide { animation: glide 14s ease-in-out infinite; }
  @keyframes glide {
    0% { transform: translate(1500px, 140px); }
    25% { transform: translate(1050px, 250px); }
    50% { transform: translate(700px, 160px); }
    75% { transform: translate(1100px, 90px); }
    100% { transform: translate(1500px, 140px); }
  }
  .bomb { animation: bomb 5s ease-in infinite; }
  @keyframes bomb { 0%, 10% { transform: translateY(0); opacity: 0; } 12% { opacity: 1; } 62% { transform: translateY(320px); opacity: 1; } 64%, 100% { transform: translateY(320px); opacity: 0; } }
  .jet { animation: alarm 0.8s ease-in-out infinite; }
  .neon { animation: neon 7s ease-in-out infinite; }
  @keyframes neon { 0%, 70%, 100% { opacity: 1; } 75% { opacity: 0.5; } 80% { opacity: 1; } }
</style>`

const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#05071a"/>
    <stop offset="0.5" stop-color="#151443"/>
    <stop offset="0.85" stop-color="#3a1d5c"/>
    <stop offset="1" stop-color="#6b2449"/>
  </linearGradient>
  <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a1f57"/>
    <stop offset="0.4" stop-color="#140f36"/>
    <stop offset="1" stop-color="#07061a"/>
  </linearGradient>
  <radialGradient id="moonGlow">
    <stop offset="0" stop-color="#ffe9b0" stop-opacity="0.5"/>
    <stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/>
  </radialGradient>
  <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
    <circle cx="6" cy="6" r="1.8" fill="#ff5fa2"/>
  </pattern>
  <linearGradient id="dotFade" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0.25" stop-color="#fff" stop-opacity="0"/>
    <stop offset="0.6" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="dotMask"><rect width="${W}" height="${H}" fill="url(#dotFade)"/></mask>
  <pattern id="nearA" width="78" height="102" patternUnits="userSpaceOnUse">
    <rect x="4" y="8" width="12" height="18" fill="#ffd35c"/><rect x="30" y="8" width="12" height="18" fill="#0d0b26"/><rect x="56" y="8" width="12" height="18" fill="#ffd35c" opacity="0.8"/>
    <rect x="4" y="42" width="12" height="18" fill="#0d0b26"/><rect x="30" y="42" width="12" height="18" fill="#ffd35c" opacity="0.9"/><rect x="56" y="42" width="12" height="18" fill="#0d0b26"/>
    <rect x="4" y="76" width="12" height="18" fill="#ffd35c" opacity="0.75"/><rect x="30" y="76" width="12" height="18" fill="#0d0b26"/><rect x="56" y="76" width="12" height="18" fill="#9fd3ff" opacity="0.7"/>
    <path d="M0 34H78M0 68H78" stroke="#07080f" stroke-width="1.5" opacity="0.6"/>
  </pattern>
  <pattern id="nearB" width="78" height="102" patternUnits="userSpaceOnUse">
    <rect x="4" y="8" width="12" height="18" fill="#0d0b26"/><rect x="30" y="8" width="12" height="18" fill="#ffd35c" opacity="0.85"/><rect x="56" y="8" width="12" height="18" fill="#0d0b26"/>
    <rect x="4" y="42" width="12" height="18" fill="#ffd35c"/><rect x="30" y="42" width="12" height="18" fill="#0d0b26"/><rect x="56" y="42" width="12" height="18" fill="#ffd35c" opacity="0.7"/>
    <rect x="4" y="76" width="12" height="18" fill="#0d0b26"/><rect x="30" y="76" width="12" height="18" fill="#ffd35c" opacity="0.9"/><rect x="56" y="76" width="12" height="18" fill="#0d0b26"/>
    <path d="M0 34H78M0 68H78" stroke="#07080f" stroke-width="1.5" opacity="0.6"/>
  </pattern>
</defs>`

// Built once: the city never changes, only what happens in it.
const CITY =
  `<rect width="${W}" height="${H}" fill="url(#sky)"/>` +
  `<circle cx="1250" cy="140" r="130" fill="url(#moonGlow)"/>` +
  `<circle cx="1250" cy="140" r="58" fill="#fbefc9"/>` +
  `<circle cx="1232" cy="126" r="9" fill="#efdcaa"/><circle cx="1268" cy="160" r="13" fill="#efdcaa"/><circle cx="1262" cy="116" r="5" fill="#efdcaa"/>` +
  stars() +
  skyline() +
  `<rect width="${W}" height="${H}" fill="url(#dots)" mask="url(#dotMask)" opacity="0.12"/>` +
  water() +
  bridge() +
  nearCity()

// A tangle of web in the top-left corner, pinned there at any window shape.
const CORNER_WEB = `
  <svg x="0" y="0" width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="xMinYMin meet">
    <g transform="scale(0.9)" fill="none" stroke="#dfe6ff" stroke-opacity="0.5" stroke-width="1.6">
      <path d="M0 0L180 0M0 0L150 70M0 0L100 130M0 0L40 170M0 0L0 190"/>
      <path d="M50 0Q54 20 42 30Q30 40 20 52Q10 60 0 60"/>
      <path d="M100 0Q106 34 86 52Q68 72 48 90Q28 108 0 112"/>
      <path d="M150 0Q158 46 130 74Q104 102 78 128Q50 152 0 160"/>
    </g>
  </svg>`

// The close-up: a rooftop pinned to the right edge with the hero crouched on it.
function closeUp(): string {
  return `
  <svg x="0" y="0" width="100%" height="100%" viewBox="0 0 420 1000" preserveAspectRatio="xMaxYMax meet">
    <g stroke="${INK}" stroke-width="3">
      <rect x="220" y="560" width="200" height="460" fill="#18143e"/>
      <rect x="212" y="548" width="216" height="16" fill="#241e52"/>
      <rect x="380" y="490" width="26" height="58" fill="#241e52"/>
    </g>
    <g fill="#ffd35c" opacity="0.85">
      <rect x="240" y="600" width="12" height="16"/><rect x="290" y="600" width="12" height="16"/><rect x="390" y="600" width="12" height="16"/>
      <rect x="265" y="650" width="12" height="16"/><rect x="340" y="650" width="12" height="16"/>
      <rect x="240" y="700" width="12" height="16"/><rect x="315" y="700" width="12" height="16"/><rect x="390" y="700" width="12" height="16"/>
    </g>
    <path d="M393 490V440" stroke="${INK}" stroke-width="3"/>
    <circle class="beacon" cx="393" cy="438" r="5" fill="#ff3348"/>
    <g transform="translate(300 548) scale(1.8)">
      ${perchedHero(false)}
      ${speech(-118, -150, ['Mission', 'complete!'], -24, -84, 18)}
    </g>
  </svg>`
}

const VILLAIN_FACE: Record<Episode, string> = { bridge: '#e9b48a', bank: '#e9b48a', glider: '#3ea83e' }

export function buildScene(pose: Pose, episode: Episode): string {
  let action = ''
  if (pose === 'swing' || pose === 'sense') {
    const sensing = pose === 'sense'
    action = episode === 'bridge' ? episodeBridge(sensing) : episode === 'bank' ? episodeBank(sensing) : episodeGlider(sensing)
  } else if (pose === 'ask') {
    action = askScene()
  } else if (pose === 'idle') {
    action = patrol()
  } else {
    // done: the villain of the last job hangs webbed under the bridge, and the close-up below
    action = `<g transform="translate(800 ${DECK + 14})">${cocoon(VILLAIN_FACE[episode])}</g>` + (episode === 'bank' ? bank(false) + `<g transform="translate(520 ${HORIZON + 4})">${policeCar()}</g>` : '')
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">` +
    STYLE +
    DEFS +
    `<svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice">` +
    CITY +
    action +
    `</svg>` +
    CORNER_WEB +
    (pose === 'done' ? closeUp() : '') +
    `</svg>`
  )
}

const EPISODE_ALT: Record<Episode, string> = {
  bridge: 'fights a four-armed scientist on top of the bridge tower',
  bank: 'chases bank robbers and their getaway van across the bridge',
  glider: 'chases a grinning bomber on a glider over the river',
}

export function sceneAlt(pose: Pose, episode: Episode): string {
  const city = 'a moonlit comic-book harbor with a suspension bridge'
  if (pose === 'swing' || pose === 'sense') return `Over ${city}, a masked web-slinger ${EPISODE_ALT[episode]}`
  if (pose === 'ask') return `Over ${city}, a masked web-slinger hangs upside down from the bridge cable: Your call, chief`
  if (pose === 'done') return `A masked web-slinger crouches on a rooftop above ${city}: Mission complete`
  return `A masked web-slinger swings on patrol over ${city}`
}
