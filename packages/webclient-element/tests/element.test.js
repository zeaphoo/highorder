import { afterEach, describe, expect, it, vi } from 'vitest'
import { HighOrderAppElement, RENDER_SLOT, TAG_NAME, defineElement, EVENTS } from '../src/index.js'

function mount(attrs = {}) {
  const el = document.createElement(TAG_NAME)
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value)
  }
  document.body.append(el)
  return el
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('<highorder-app> shell', () => {
  it('registers the custom element', () => {
    expect(customElements.get(TAG_NAME)).toBe(HighOrderAppElement)
  })

  it('creates a shadow root and renders the placeholder', () => {
    const el = mount()
    expect(el.shadowRoot).not.toBeNull()
    expect(el.shadowRoot.querySelector('.ho-app')).not.toBeNull()
    expect(el.shadowRoot.querySelector('.ho-placeholder')).not.toBeNull()
  })

  it('keeps shell styles inside the shadow root (nothing global)', () => {
    const el = mount()
    const hasAdoptedSheet = (el.shadowRoot.adoptedStyleSheets ?? []).length > 0
    const hasStyleTag = el.shadowRoot.querySelector('style') !== null
    expect(hasAdoptedSheet || hasStyleTag).toBe(true)
    expect(document.querySelector('style[data-ho-global]')).toBeNull()
  })

  it('reads attributes into options', () => {
    const el = mount({ locale: 'zh', theme: 'dark', endpoint: 'http://localhost:8080' })
    expect(el.options).toEqual({
      locale: 'zh',
      theme: 'dark',
      endpoint: 'http://localhost:8080',
    })
  })

  it('emits a composed ready event once assigned', () => {
    const el = document.createElement(TAG_NAME)
    const onReady = vi.fn()
    document.addEventListener(EVENTS.ready, onReady)
    document.body.append(el)
    el.remove()
    el.remove()
    document.body.append(el)

    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onReady.mock.calls[0][0].detail.options.locale).toBe('en')
  })

  it('configure() reflects to attributes and emits change', () => {
    const el = mount()
    const onChange = vi.fn()
    el.addEventListener(EVENTS.change, onChange)

    el.configure({ locale: 'zh', unknown: 'ignored' })

    expect(el.options.locale).toBe('zh')
    expect(el.getAttribute('locale')).toBe('zh')
    expect(el.options.unknown).toBeUndefined()
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('attribute changes update options without re-emitting in a loop', () => {
    const el = mount()
    const onChange = vi.fn()
    el.addEventListener(EVENTS.change, onChange)

    el.setAttribute('theme', 'dark')

    expect(el.options.theme).toBe('dark')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('two instances keep independent state', () => {
    const a = mount({ locale: 'en' })
    const b = mount({ locale: 'zh' })

    a.configure({ theme: 'dark' })

    expect(a.options.theme).toBe('dark')
    expect(b.options.theme).toBe('auto')
    expect(a.instanceId).not.toBe(b.instanceId)
    expect(b.shadowRoot.querySelector('.ho-placeholder').textContent).toContain('zh')
  })

  it('hosts a custom renderer through RENDER_SLOT and tears it down on disconnect', () => {
    const el = document.createElement(TAG_NAME)
    const destroy = vi.fn()
    const factory = vi.fn((ctx) => {
      const node = document.createElement('div')
      node.className = 'custom-ui'
      node.textContent = ctx.options.locale
      ctx.root.append(node)
      return {
        update: (options) => {
          node.textContent = options.locale
        },
        destroy,
      }
    })

    el[RENDER_SLOT] = factory
    document.body.append(el)

    expect(factory).toHaveBeenCalledTimes(1)
    const custom = el.shadowRoot.querySelector('.custom-ui')
    expect(custom.textContent).toBe('en')
    expect(el.shadowRoot.querySelector('.ho-placeholder')).toBeNull()

    el.configure({ locale: 'ja' })
    expect(custom.textContent).toBe('ja')
    expect(factory).toHaveBeenCalledTimes(1)

    el.remove()
    expect(destroy).toHaveBeenCalledTimes(1)
  })

  it('survives a broken renderer and reports an error event', () => {
    const el = document.createElement(TAG_NAME)
    const onError = vi.fn()
    document.addEventListener(EVENTS.error, onError)
    el[RENDER_SLOT] = () => {
      throw new Error('boom')
    }

    document.body.append(el)

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError.mock.calls[0][0].detail.error.message).toBe('boom')
    expect(el.shadowRoot.querySelector('.ho-app').textContent).toBe('')
  })

  it('defineElement is idempotent', () => {
    // The custom element registry rejects a constructor registered twice, so
    // the shell always owns exactly one tag name.
    expect(() => defineElement()).not.toThrow()
    expect(defineElement()).toBe(TAG_NAME)
    expect(customElements.get(TAG_NAME)).toBe(HighOrderAppElement)
  })
})
