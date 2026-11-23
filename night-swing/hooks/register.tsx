import type { EngineInterface, Register, ThemeSetArgs, ThemeSound, ThemeStyle } from 'claude-code'

import { makeColors } from './make-colors.js'
import { buildScene, EPISODES, sceneAlt } from './scene.ts'
import type { Episode, Pose } from './scene.ts'

// Night city: deep navy surfaces, hero red, web blue, comic yellow.
const { theme, problems } = makeColors({
  label: 'Night Swing',
  only: 'dark',
  roles: {
    accent: '#e2303c',
    danger: '#ff3d6e',
    success: '#3ddc84',
    warning: '#ffc233',
    pro: '#5b8cff',
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0a0e22',
        'surface-1': '#10152e',
        'surface-2': '#151b3a',
        'surface-3': '#1a2142',
        'text-primary': '#eef1ff',
        'text-secondary': '#c4cae8',
        'text-muted': '#9ea6cc',
      },
    },
    git: { added: '#3ddc84', removed: '#ff3d6e', modified: '#ffc233', merged: '#5b8cff' },
  },
})

const INK = '#07080f'

// Comic panels: the reply in an inked panel with a red drop shadow,
// the person's message in a yellow caption box with a blue one.
const STYLE: ThemeStyle = {
  Text: { fontFamily: ['sans'], fontSize: 15, lineHeight: 23 },
  Heading: { fontFamily: ['cursive'], fontWeight: 'bold', color: '#ffd23f', letterSpacing: 1 },
  AssistantMessage: {
    backgroundColor: '#10152ef2',
    color: '#eef1ff',
    borderColor: '#e8ecff',
    borderWidth: 3,
    radius: 4,
    padding: 16,
    shadow: { x: 6, y: 6, blur: 0, color: '#d8232f' },
  },
  UserMessage: [
    {
      backgroundColor: '#ffd23f',
      color: '#1a1206',
      borderColor: INK,
      borderWidth: 3,
      radius: 2,
      padding: 14,
      shadow: { x: 5, y: 5, blur: 0, color: '#1f4fd1' },
      rotate: -1,
    },
    {
      backgroundColor: '#ffd23f',
      color: '#1a1206',
      borderColor: INK,
      borderWidth: 3,
      radius: 2,
      padding: 14,
      shadow: { x: 5, y: 5, blur: 0, color: '#1f4fd1' },
      rotate: 1,
    },
  ],
  ToolUse: {
    backgroundColor: '#0d1230f0',
    color: '#c4cae8',
    fontFamily: ['code'],
    borderColor: '#1f4fd1',
    borderWidth: 2,
    radius: 4,
    paddingX: 10,
  },
}

// Night-city hum, a web-shooter thwip on each tool call, a fanfare on landing.
const SOUND: ThemeSound = {
  ambience: {
    layers: [
      { wave: 'brown', drone: true, gain: 0.18, filter: { type: 'lowpass', hz: 380 } },
      { wave: 'pink', drone: true, gain: 0.06, filter: { type: 'bandpass', hz: 500, to: 900 }, tremolo: { hz: 0.08, depth: 0.6 } },
      { wave: 'sine', notes: ['A5', 'E5'], scatter: 0.03, gain: 0.04, glide: -5, attack: 0.6, release: 2.5 },
      { wave: 'crackle', scatter: 0.3, gain: 0.05, filter: { type: 'highpass', hz: 2500 } },
    ],
    reverb: 0.35,
  },
  cues: {
    tool: { layers: [{ wave: 'white', gain: 0.18, attack: 0.004, release: 0.09, filter: { type: 'bandpass', hz: 4200, to: 900 } }] },
    send: { layers: [{ wave: 'triangle', notes: ['E5', 'B5'], step: 0.06, gain: 0.25, release: 0.25 }] },
    done: {
      layers: [
        { wave: 'square', notes: ['C5', 'E5', 'G5', 'C6'], step: 0.09, gain: 0.12, release: 0.35, filter: { type: 'lowpass', hz: 2400 } },
        { wave: 'white', gain: 0.12, attack: 0.004, release: 0.12, filter: { type: 'bandpass', hz: 3500, to: 700 } },
      ],
      reverb: 0.3,
    },
    ask: { layers: [{ wave: 'bell', notes: ['B5', 'F6', 'B5', 'F6'], step: 0.07, gain: 0.18, release: 0.4, tremolo: { hz: 14, depth: 0.5 } }] },
    error: { layers: [{ wave: 'saw', notes: ['E3', 'Bb2'], step: 0.14, gain: 0.14, release: 0.4, filter: { type: 'lowpass', hz: 900 } }] },
    compact: { layers: [{ wave: 'white', gain: 0.12, release: 0.3, filter: { type: 'bandpass', hz: 2000, to: 400 } }] },
  },
}

const SCENE = 'night-swing'
const LOOK: ThemeSetArgs = {
  colors: theme,
  overrideColorScheme: 'dark',
  backdrop: { scene: SCENE, glass: { blur: 8, tint: '#0a0e22', opacity: 0.5 } },
  sound: SOUND,
  style: STYLE,
}

const LANDINGS = ['THWIP! Mission complete.', 'BAMF! Stuck the landing.', 'KRAKA-THOOM! Done and dusted.', 'ZAP! Another one webbed up.', 'SWOOSH! Rooftop reached.']
const QUIPS = [
  'With great prompts comes great responsibility.',
  'Your friendly neighborhood coding assistant, reporting in.',
  'My spider-sense says that bug is in the last file you touched.',
  'Is it a bird? Is it a plane? No, it is a passing test suite.',
  'Web-slinging through your codebase, one file at a time.',
  'Never trust a regex that looks too friendly.',
  'Swing first, refactor later.',
]

const pick = (list: readonly string[]): string => list[Math.floor(Math.random() * list.length)] ?? list[0]!

// Session state the hooks share. A reload starts these over, which is fine for a look.
let pose: Pose = 'idle'
let applied = false
let episode: Episode = EPISODES[Math.floor(Math.random() * EPISODES.length)] ?? 'bridge'
let toolsThisJob = 0

const WORKING = '🕸️ Web-slinging through the city…'

// Change the hero's pose and redraw the backdrop.
function setPose($: EngineInterface, next: Pose): void {
  if (pose === next) return
  pose = next
  $.ui.invalidate('ui.render')
}

// Move on to a different job: a new villain or a new crime.
function nextEpisode($: EngineInterface): void {
  const others = EPISODES.filter(one => one !== episode)
  episode = others[Math.floor(Math.random() * others.length)] ?? episode
  toolsThisJob = 0
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
      set = await $.theme.set({ colors: theme, overrideColorScheme: 'dark', backdrop: LOOK.backdrop })
    } catch (error2) {
      $.ui.log(String(error2))
      applied = false
      return
    }
  }
  if (!set.isDrawn) $.ui.status(set.reason)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await applyLook($)
    await $.command.register({ name: 'spidey', description: 'A word from your friendly neighborhood web-slinger' })
    return next(e)
  })

  on('command.run', { command: 'spidey' }, () => ({ text: `🕷️ ${pick(QUIPS)}` }))

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.scene !== SCENE) return next(e)
    const { Svg } = $.ui.resolve(e)
    return <Svg source={buildScene(pose, episode)} alt={sceneAlt(pose, episode)} isInteractive />
  })

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      await applyLook($)
      nextEpisode($)
      setPose($, 'swing')
      $.ui.status(WORKING)
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool === 'AskUserQuestion') {
      setPose($, 'ask')
      $.ui.status('🕷️ Spider-sense: your call, chief')
      const answer = await next(e)
      setPose($, 'swing')
      $.ui.status(WORKING)
      return answer
    }
    const ran = await next(e)
    // A long job gets a change of scenery every few tool calls.
    toolsThisJob += 1
    if (toolsThisJob >= 8 && pose === 'swing') nextEpisode($)
    if (ran.deny === undefined && ran.isError === true) {
      setPose($, 'sense')
      $.ui.status('⚡ Spider-sense tingling: something hit trouble')
    } else if (pose === 'sense') {
      setPose($, 'swing')
      $.ui.status(WORKING)
    }
    return ran
  })

  on('turn.complete', ($, e, next) => {
    if (e.agentId === undefined) {
      $.ui.status(undefined)
      if (e.reason === 'answer') {
        setPose($, 'done')
        $.ui.toast(pick(LANDINGS))
      } else if (e.reason === 'aborted') {
        setPose($, 'idle')
      } else {
        setPose($, 'idle')
        $.ui.toast('SNAP! The web line broke. Try again?')
      }
    }
    return next(e)
  })
}
