import { afterEach, describe, expect, it } from 'vitest'

// Registers <highorder-app>. The element package stays React-free; React only
// enters through the RENDER_SLOT hook below — this test is the proof that the
// seam works in both directions.
import { RENDER_SLOT } from '@highorder/webclient-element'

import { createElementRenderer } from '../src/index.js'

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

function mountElement(attrs = {}) {
  const el = document.createElement('highorder-app')
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value)
  }
  el[RENDER_SLOT] = createElementRenderer()
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.replaceChildren()
  localStorage.clear()
})

describe('<highorder-app> + React client integration', () => {
  it('renders the React client inside the shadow root', async () => {
    const el = mountElement({ locale: 'en' })
    await flush()

    expect(el.shadowRoot).not.toBeNull()
    // `.ho-app` also matches the shell's own mount point, so target the React
    // root explicitly via its test id.
    expect(el.shadowRoot.querySelector('[data-testid="highorder-app"]')).not.toBeNull()
    expect(el.shadowRoot.textContent).toContain('Not connected')
  })

  it('re-renders when the shell pushes new options', async () => {
    const el = mountElement({ locale: 'en' })
    await flush()

    el.configure({ locale: 'zh', theme: 'dark' })
    await flush()

    expect(el.shadowRoot.textContent).toContain('未连接')
    expect(
      el.shadowRoot.querySelector('[data-testid="highorder-app"]').getAttribute('data-theme'),
    ).toBe('dark')
  })

  it('portals overlays into the element root, never into document.body', async () => {
    const el = mountElement()
    await flush()

    const trigger = [...el.shadowRoot.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Open dialog'),
    )
    trigger.click()
    await flush()

    const dialog = el.shadowRoot.querySelector('.ho-dialog')
    expect(dialog).not.toBeNull()
    expect(dialog.closest('[data-ho-portal-host]')).not.toBeNull()
    expect(document.body.querySelector('.ho-dialog')).toBeNull()
  })

  it('tears the React tree down when the element disconnects', async () => {
    const el = mountElement()
    await flush()
    expect(el.shadowRoot.textContent).not.toBe('')

    el.remove()
    await flush()

    expect(el.shadowRoot.querySelector('[data-testid="highorder-app"]')).toBeNull()
    expect(el.shadowRoot.querySelector('.ho-app').textContent).toBe('')
  })
})
