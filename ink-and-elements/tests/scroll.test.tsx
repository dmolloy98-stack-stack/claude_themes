import { expect, test } from 'claude-code/testing'

const BACKDROP = { plugin: 'ink-and-elements', component: 'Backdrop', props: { scene: 'ink-and-elements' } } as const

test('the look is set once, and each tool call paints the scroll', async ($, on) => {
  const looks: unknown[] = []
  on('theme.set', (_, e) => {
    looks.push(e)
    return { value: { isDrawn: true } }
  })
  on('command.register', () => ({ value: { command: 'proverb' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  expect(looks.length).toBe(1)

  const ui0 = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const blank = (await ui0.find({ type: 'Svg' }))?.props.source as string
  await ui0.unmount()

  await $.turn.start({ turnId: 't1' } as never)
  for (const tool of ['Read', 'Grep', 'Edit', 'Bash', 'WebFetch', 'Edit', 'Bash'] as const) {
    await $.tool.call({ tool, command: 'ls', file_path: '/a', pattern: 'x', url: 'https://example.com', prompt: 'p', old_string: 'a', new_string: 'b' } as never)
  }

  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })
  const source = svg?.props.source as string
  expect(source.length > blank.length).toBe(true)
  expect(source.length < 131072).toBe(true)
  expect(source.includes('<image')).toBe(false)
  expect(String(svg?.props.alt)).toMatch(/ink-wash/)
  await ui.unmount()
})

test('a long session keeps the scene under the size limit', async ($, on) => {
  on('theme.set', () => ({ value: { isDrawn: true } }))
  on('command.register', () => ({ value: { command: 'proverb' } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }))
  on('ui.status', () => ({ value: undefined }))
  on('ui.invalidate', () => ({ value: undefined }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.turn.start({ turnId: 't1' } as never)
  for (let i = 0; i < 400; i++) {
    const tool = (['Read', 'Edit', 'Bash', 'WebSearch'] as const)[i % 7 % 4]!
    await $.tool.call({ tool, command: 'ls', file_path: '/a', query: 'q', old_string: 'a', new_string: 'b' } as never)
  }
  const ui = await $.ui.mount({ ...BACKDROP, surface: 'desktop' })
  const source = (await ui.find({ type: 'Svg' }))?.props.source as string
  expect(source.length < 131072).toBe(true)
  await ui.unmount()
})
