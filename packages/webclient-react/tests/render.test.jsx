import { afterEach, describe, expect, it } from 'vitest'

import { createElementRenderer } from '../src/index.js'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function createCtx(overrides = {}) {
  const host = document.createElement('div')
  document.body.append(host)
  const events = []
  return {
    host,
    root: host,
    options: { endpoint: '', locale: 'en', theme: 'light', ...overrides },
    emit: (type, detail) => events.push({ type, detail }),
    events,
  }
}

afterEach(() => {
  document.body.replaceChildren()
  localStorage.clear()
})

describe('createElementRenderer (shell -> React adapter)', () => {
  it('mounts the client into the provided root', async () => {
    const ctx = createCtx()
    const rendered = createElementRenderer()(ctx)
    await flush()

    expect(ctx.root.querySelector('.ho-app')).not.toBeNull()
    expect(ctx.root.querySelector('[data-ho-portal-host]')).not.toBeNull()
    expect(ctx.root.textContent).toContain('Not connected')

    rendered.destroy()
  })

  it('re-renders when the shell pushes new options', async () => {
    const ctx = createCtx()
    const rendered = createElementRenderer()(ctx)
    await flush()

    rendered.update({ ...ctx.options, locale: 'zh', theme: 'dark' })
    await flush()

    expect(ctx.root.textContent).toContain('未连接')
    expect(ctx.root.querySelector('.ho-app').getAttribute('data-theme')).toBe('dark')

    rendered.destroy()
  })

  it('unmounts cleanly', async () => {
    const ctx = createCtx()
    const rendered = createElementRenderer()(ctx)
    await flush()

    rendered.destroy()
    await flush()

    expect(ctx.root.textContent).toBe('')
  })

  it('portals overlays inside our own root instead of document.body', async () => {
    const ctx = createCtx()
    const rendered = createElementRenderer()(ctx)
    await flush()

    const trigger = [...ctx.root.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Open dialog'),
    )
    expect(trigger).toBeTruthy()
    trigger.click()
    await flush()

    const dialog = ctx.root.querySelector('.ho-dialog')
    expect(dialog).not.toBeNull()

    // The overlay must live in our own portal host, not in document.body.
    const portalHost = ctx.root.querySelector('[data-ho-portal-host]')
    expect(portalHost.contains(dialog)).toBe(true)
    expect(dialog.closest('[data-ho-portal-host]')).toBe(portalHost)

    rendered.destroy()
  })
})
