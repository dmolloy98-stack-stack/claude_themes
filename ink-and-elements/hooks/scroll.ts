// The scroll's story so far: which regions the brush has opened, what it has painted
// in them, where the traveler stands, and where the camera looks. Plain data and pure
// functions, so it can be tested without the app.

export type Element = 'water' | 'earth' | 'fire' | 'air'
export type Pose = 'idle' | 'work' | 'ask' | 'done' | 'trouble'
export const ELEMENTS: readonly Element[] = ['water', 'earth', 'fire', 'air']

export type Stage = { el: Element; x: number; at: number; seed: number; slots: number; closed: boolean }
export type Motif = { kind: string; el: Element; x: number; at: number; seed: number; flip: boolean }
export type Scroll = {
  stages: Stage[]
  motifs: Motif[]
  el: Element
  pose: Pose
  traveler: { from: number; to: number; at: number }
  cam: { from: number; to: number; at: number }
  // Where the brush last touched the paper: the newest motif's index, or -1.
  last: number
}

export const STAGE_W = 560
const SLOTS = 5
const SLOT_X = (i: number): number => 80 + i * 96
// Where the newest work sits on screen, from the left edge of the 1600-wide view.
export const FOCUS_X = 1120
const KEEP = 240

// What each element paints, in the order the brush reaches for them.
export const MOTIFS: Record<Element, readonly string[]> = {
  water: ['wave', 'pine', 'floes', 'boat', 'birds', 'waterfall'],
  earth: ['wall', 'pillars', 'pagoda', 'boulders', 'gate'],
  fire: ['volcano', 'flame', 'islands', 'shrine', 'lantern'],
  air: ['spire', 'wind', 'cloud', 'glider', 'bell', 'birds'],
}

// Which element a tool belongs to. Anything not listed keeps the current element.
export function elementFor(tool: string): Element | undefined {
  if (/^(Read|Grep|Glob|LS|NotebookRead|ToolSearch|ListMcpResourcesTool|ReadMcpResourceTool)$/.test(tool)) return 'water'
  if (/^(Edit|MultiEdit|Write|NotebookEdit)$/.test(tool)) return 'earth'
  if (/^(Bash|BashOutput|PowerShell|KillShell|KillBash|Monitor|TaskStop)$/.test(tool)) return 'fire'
  if (/^(WebFetch|WebSearch|Agent|Task|SendMessage|Skill)$/.test(tool) || tool.startsWith('mcp__')) return 'air'
  return undefined
}

export function newScroll(seed = Math.floor(Math.random() * 1e6)): Scroll {
  const el = ELEMENTS[seed % 4] ?? 'water'
  return {
    stages: [],
    motifs: [],
    el,
    pose: 'idle',
    traveler: { from: FOCUS_X - 400, to: FOCUS_X - 400, at: 0 },
    cam: { from: 0, to: 0, at: 0 },
    last: -1,
  }
}

function hash(n: number): number {
  let s = (n * 2654435761) >>> 0
  s ^= s >>> 15
  return s >>> 0
}

function nextStageX(scroll: Scroll): number {
  const prev = scroll.stages[scroll.stages.length - 1]
  // The first region starts so its first motif lands at the focus point.
  if (prev === undefined) return FOCUS_X - SLOT_X(0)
  // After a tea shop, leave it room before the next region starts.
  const lastX = scroll.motifs[scroll.motifs.length - 1]?.x ?? prev.x
  return Math.max(prev.x + STAGE_W, lastX + 140)
}

function openStage(scroll: Scroll, el: Element, now: number): Stage {
  const stage: Stage = { el, x: nextStageX(scroll), at: now, seed: hash(scroll.stages.length + 7), slots: 0, closed: false }
  scroll.stages.push(stage)
  return stage
}

function moveTo(scroll: Scroll, x: number, now: number): void {
  scroll.traveler = { from: travelerX(scroll, now), to: x, at: now }
  scroll.cam = { from: camX(scroll, now), to: x - FOCUS_X - 40, at: now }
}

// Where the traveler and camera are right now, partway through a move.
const MOVE_MS = 3000
function between(m: { from: number; to: number; at: number }, now: number): number {
  const t = Math.min(1, Math.max(0, (now - m.at) / MOVE_MS))
  return m.from + (m.to - m.from) * (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2)
}
export const travelerX = (s: Scroll, now: number): number => between(s.traveler, now)
export const camX = (s: Scroll, now: number): number => between(s.cam, now)

function trim(scroll: Scroll): void {
  if (scroll.motifs.length > KEEP) {
    const drop = scroll.motifs.length - KEEP
    scroll.motifs.splice(0, drop)
    scroll.last -= drop
    const firstX = scroll.motifs[0]?.x ?? 0
    scroll.stages = scroll.stages.filter(st => st.x + STAGE_W > firstX - STAGE_W)
  }
}

function addMotif(scroll: Scroll, stage: Stage, kind: string, x: number, now: number): void {
  const seed = hash(scroll.motifs.length * 31 + stage.seed)
  scroll.motifs.push({ kind, el: stage.el, x, at: now, seed, flip: seed % 3 === 0 })
  scroll.last = scroll.motifs.length - 1
  trim(scroll)
}

// One brushstroke of work: paint the next motif of this element along the trail.
export function paint(scroll: Scroll, el: Element, now: number): void {
  scroll.el = el
  let stage = scroll.stages[scroll.stages.length - 1]
  if (stage === undefined || stage.closed || stage.el !== el || stage.slots >= SLOTS) stage = openStage(scroll, el, now)
  const list = MOTIFS[el]
  const kind = list[(stage.seed + stage.slots) % list.length] ?? list[0]!
  const x = stage.x + SLOT_X(stage.slots)
  stage.slots += 1
  addMotif(scroll, stage, kind, x, now)
  moveTo(scroll, x + 74, now)
}

// A failed step: the brush slips and a blot of ink spreads beside the last work.
export function blot(scroll: Scroll, now: number): void {
  const stage = scroll.stages[scroll.stages.length - 1]
  const prev = scroll.motifs[scroll.last]
  if (stage === undefined || prev === undefined) return
  const seed = hash(scroll.motifs.length * 17 + 3)
  scroll.motifs.push({ kind: 'blot', el: stage.el, x: prev.x + 30, at: now, seed, flip: seed % 2 === 0 })
  scroll.last = scroll.motifs.length - 1
  trim(scroll)
}

// The task is done. If the brush painted anything, it ends the region with a tea
// shop and a red seal; a reply with no work just rests where it is.
export function rest(scroll: Scroll, painted: boolean, now: number): void {
  const stage = scroll.stages[scroll.stages.length - 1]
  if (!painted || stage === undefined) return
  const lastX = scroll.motifs[scroll.motifs.length - 1]?.x ?? stage.x
  const x = Math.max(stage.x + 90, lastX + 150)
  stage.slots = SLOTS
  stage.closed = true
  addMotif(scroll, stage, 'teahouse', x, now)
  moveTo(scroll, x + 120, now)
}

// How many motifs of each element are on the scroll, for the journey summary.
export function tally(scroll: Scroll): Record<Element, number> {
  const out: Record<Element, number> = { water: 0, earth: 0, fire: 0, air: 0 }
  for (const m of scroll.motifs) if (m.kind !== 'blot' && m.kind !== 'teahouse') out[m.el] += 1
  return out
}
