import type { EngineInterface, Register, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import { buildScene, sceneAlt } from './scene.ts'
import { blot, elementFor, newScroll, paint, rest, tally } from './scroll.ts'
import type { Element, Pose } from './scroll.ts'

// Parchment by day, lamp-lit parchment by night. Accents from the four element washes
// and the red of an artist's seal.
const { theme, problems } = makeColors({
  label: 'Ink and Elements',
  roles: {
    accent: '#2f4f86', // river indigo
    danger: '#b5352a', // seal red
    success: '#4c7a3c', // bamboo green
    warning: '#9a7432', // earth ochre
    pro: '#6a4c86', // dusk violet
  },
  light: {
    gray: {
      anchors: {
        'surface-0': '#ebe0c6',
        'surface-1': '#f1e8d3',
        'surface-2': '#f7f0e1',
        'text-primary': '#1d1914',
        'text-secondary': '#463d31',
        'text-muted': '#615545',
      },
    },
    git: { added: '#4c7a3c', removed: '#b5352a', modified: '#9a7432', merged: '#2f4f86' },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#1c1813',
        'surface-1': '#241f19',
        'surface-2': '#2b251e',
        'surface-3': '#312a22',
        'text-primary': '#efe6d3',
        'text-secondary': '#cfc3ad',
        'text-muted': '#aa9e89',
      },
    },
    git: { added: '#86b872', removed: '#e0705f', modified: '#d4ad63', merged: '#8fa9dc' },
  },
})

// Message colors that follow the mode: a fresh parchment slip for you, a slightly
// warmer sheet for Claude's letters.
const inputs = theme.inputs as { light?: Record<string, string>; dark?: Record<string, string> } | undefined
if (inputs?.light !== undefined && inputs.dark !== undefined) {
  Object.assign(inputs.light, {
    'bg-user-message': '#f8f1e2',
    'text-user-message': '#1d1914',
    'bg-assistant-message': '#f3ead6',
    'text-assistant-message': '#1d1914',
  })
  Object.assign(inputs.dark, {
    'bg-user-message': '#2e271f',
    'text-user-message': '#efe6d3',
    'bg-assistant-message': '#241f19',
    'text-assistant-message': '#efe6d3',
  })
}

const SEAL = '#b5352a'

// Calligraphy-like serif type, parchment slips for you and brushed-ink letters for Claude.
const slip = {
  backgroundColor: 'bg-user-message',
  color: 'text-user-message',
  borderColor: 'border-strong',
  borderWidth: 1,
  radius: 2,
  padding: 14,
  shadow: { x: 0, y: 2, blur: 8, color: '#3a2a1426' },
} as const
const STYLE: ThemeStyle = {
  Text: { fontFamily: ['serif'], fontSize: 16, lineHeight: 25 },
  Heading: { fontFamily: ['serif'], fontWeight: 'bold', color: 'text-danger', letterSpacing: 1 },
  UserMessage: [
    { ...slip, rotate: -0.6 },
    { ...slip, rotate: 0.5 },
  ],
  AssistantMessage: {
    backgroundColor: 'bg-assistant-message',
    color: 'text-assistant-message',
    radius: 3,
    paddingX: 18,
    paddingY: 14,
    shadow: { x: 0, y: 1, blur: 14, color: '#3a2a141f' },
  },
  ToolUse: {
    backgroundColor: 'surface-1',
    color: 'text-secondary',
    fontFamily: ['code'],
    radius: 3,
    paddingX: 10,
  },
}

// Wind over paper and a sparse plucked string; a brush swish for each tool call and
// a temple bell when the painting is sealed.
const SOUND: ThemeSound = {
  ambience: {
    layers: [
      { wave: 'pink', drone: true, gain: 0.1, filter: { type: 'lowpass', hz: 500, to: 900 }, tremolo: { hz: 0.07, depth: 0.6 } },
      { wave: 'crackle', scatter: 0.25, gain: 0.025, filter: { type: 'highpass', hz: 3200 } },
      { wave: 'triangle', notes: ['D5', 'E5', 'G5', 'A5', 'B5', 'D6'], scatter: 0.05, gain: 0.05, attack: 0.01, release: 2.5 },
    ],
    reverb: 0.45,
  },
  cues: {
    tool: { layers: [{ wave: 'pink', gain: 0.12, attack: 0.02, release: 0.18, filter: { type: 'bandpass', hz: 1800, to: 600 } }] },
    send: { layers: [{ wave: 'bell', notes: ['A5'], gain: 0.1, release: 1 }] },
    done: {
      layers: [
        { wave: 'sine', notes: ['G4'], gain: 0.18, attack: 0.002, release: 0.08 },
        { wave: 'bell', notes: ['D5', 'A5', 'D6'], step: 0.18, gain: 0.13, release: 1.6 },
      ],
      reverb: 0.5,
    },
    ask: { layers: [{ wave: 'bell', notes: ['E6', 'B5'], step: 0.25, gain: 0.11, release: 1.2 }] },
    error: {
      layers: [
        { wave: 'brown', gain: 0.22, release: 0.4, filter: { type: 'lowpass', hz: 220 } },
        { wave: 'sine', notes: ['D3'], gain: 0.12, release: 0.5, glide: -5 },
      ],
    },
    compact: { layers: [{ wave: 'pink', gain: 0.1, release: 0.4, filter: { type: 'bandpass', hz: 1400, to: 300 } }] },
  },
}

const SCENE = 'ink-and-elements'
const LOOK: ThemeSetArgs = {
  colors: theme,
  backdrop: { scene: SCENE, glass: { blur: 6, opacity: 0.35 } },
  sound: SOUND,
  style: STYLE,
}

const WORKING: Record<Element, string> = {
  water: '💧 The brush follows the river…',
  earth: '🪨 The brush shapes stone…',
  fire: '🔥 The brush feeds the flame…',
  air: '🌬️ The brush rides the wind…',
}
const SEALED = [
  'The scroll is sealed. Tea is ready.',
  'Ink dries, the lantern is lit. Done.',
  'The traveler rests. The painting is finished.',
  'One more stretch of the trail, painted.',
  'Stamped and sealed. Pour yourself a cup.',
]
// Original sayings, in the spirit of a tea-shop keeper.
const PROVERBS = [
  'A river does not argue with the stone. It simply finds the next line.',
  'Even the tallest wall began as one honest brick.',
  'Watched fire cooks the rice. Forgotten fire burns the house.',
  'You cannot hold the wind. You can only learn which way it blows.',
  'Pour the tea slowly. A hurried cup spills on the scroll.',
  'When the brush hesitates, the ink pools. Commit to the stroke.',
  'A blot is only a mountain you had not planned.',
  'Rest is not the end of the journey. It is part of the map.',
  'Read twice, cut once, paint once.',
  'The trail behind you is proof that the trail ahead exists.',
  'Cold water and patience will open any frozen lock.',
  'The lantern does not hurry the night. It simply keeps burning.',
]

const pick = (list: readonly string[]): string => list[Math.floor(Math.random() * list.length)] ?? list[0]!

// One clock for both the hooks and the drawing, so fresh strokes line up.
const now = (): number => (typeof Date === 'function' ? Date.now() : 0)

// Session state the hooks share. A reload starts the scroll over, which is fine for a look.
const scroll = newScroll()
let applied = false
let paintedThisTurn = 0

function setPose($: EngineInterface, next: Pose): void {
  scroll.pose = next
  $.ui.invalidate('ui.render')
}

// Apply the look once: at session start, or at the first turn if the mod loaded mid-session.
async function applyLook($: EngineInterface): Promise<void> {
  if (applied) return
  applied = true
  const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
  if (unpainted !== undefined) $.ui.toast(unpainted)

  let set
  try {
    set = await $.theme.set(LOOK)
  } catch (error) {
    // An older build may not take sound or style: keep the colors and the scene.
    $.ui.log(String(error))
    try {
      set = await $.theme.set({ colors: theme, backdrop: LOOK.backdrop })
    } catch (error2) {
      $.ui.log(String(error2))
      applied = false
      return
    }
  }
  if (!set.isDrawn) $.ui.status(set.reason)
}

function journey(): string {
  const t = tally(scroll)
  const total = t.water + t.earth + t.fire + t.air
  if (total === 0) return 'The scroll is still blank. Give the brush some work.'
  return `So far the brush has painted ${total} scenes: 💧 ${t.water} water, 🪨 ${t.earth} earth, 🔥 ${t.fire} fire, 🌬️ ${t.air} air.`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await applyLook($)
    await $.command.register({ name: 'proverb', description: 'A word of tea-shop wisdom, and how far the scroll has come' })
    return next(e)
  })

  on('command.run', { command: 'proverb' }, () => ({ text: `🍵 ${pick(PROVERBS)}\n\n${journey()}` }))

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.scene !== SCENE) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={buildScene(scroll, now())} alt={sceneAlt(scroll)} isInteractive />
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await applyLook($)
      paintedThisTurn = 0
      setPose($, 'work')
      $.ui.status(WORKING[scroll.el])
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'AskUserQuestion') {
      setPose($, 'ask')
      $.ui.status('🗺️ The traveler waits for your word')
      const answer = await next(e)
      setPose($, 'work')
      $.ui.status(WORKING[scroll.el])
      return answer
    }
    // Each tool call is one more stroke on the scroll, in its element's region.
    paint(scroll, elementFor(e.tool) ?? scroll.el, now())
    paintedThisTurn += 1
    if (scroll.pose !== 'ask') scroll.pose = 'work'
    $.ui.invalidate('ui.render')
    $.ui.status(WORKING[scroll.el])

    const ran = await next(e)
    if (ran.deny === undefined && ran.isError === true) {
      blot(scroll, now())
      setPose($, 'trouble')
      $.ui.status('💧 A blot of ink: something went wrong')
    }
    return ran
  })

  on('turn.complete', ($, e, next) => {
    if (e.agentId === undefined) {
      $.ui.status(undefined)
      if (e.reason === 'answer') {
        rest(scroll, paintedThisTurn > 0, now())
        setPose($, 'done')
        $.ui.toast(pick(SEALED))
      } else if (e.reason === 'aborted') {
        setPose($, 'idle')
      } else {
        blot(scroll, now())
        setPose($, 'idle')
        $.ui.toast('The brush slipped. Try again?')
      }
    }
    return next(e)
  })
}
