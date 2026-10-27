/**
 * <highorder-app> — the embedding surface.
 *
 * Rules this shell keeps (they are what make third-party embedding possible):
 *  - no global CSS, no global variables, no global singletons
 *  - one state bag per instance (two elements on a page are independent)
 *  - no history API writes, no service worker, no document.body portals
 *  - host communicates through attributes/properties, methods and events only
 */

import SHELL_STYLES from './style.css?inline'
import { createPlaceholder, RENDER_SLOT } from './renderer.js'

export const TAG_NAME = 'highorder-app'

export const OBSERVED_ATTRIBUTES = Object.freeze(['endpoint', 'locale', 'theme'])

const DEFAULTS = Object.freeze({
  endpoint: '',
  locale: 'en',
  theme: 'auto',
})

const EVENTS = Object.freeze({
  ready: 'highorder:ready',
  change: 'highorder:change',
  error: 'highorder:error',
})

let instanceCounter = 0

export class HighOrderAppElement extends HTMLElement {
  static get observedAttributes() {
    return OBSERVED_ATTRIBUTES
  }

  #options = { ...DEFAULTS }
  #shadow
  #mountPoint
  #renderer = null
  #rendered = null
  #readySent = false
  #reflecting = false
  #instanceId

  constructor() {
    super()
    this.#instanceId = `ho-${++instanceCounter}`
    this.#shadow = this.attachShadow({ mode: 'open' })
    applyShadowStyles(this.#shadow, SHELL_STYLES)

    this.#mountPoint = document.createElement('div')
    this.#mountPoint.className = 'ho-app'
    this.#mountPoint.setAttribute('part', 'app')
    this.#shadow.append(this.#mountPoint)
  }

  /** Stable per-instance id, useful for storage namespacing by embedders. */
  get instanceId() {
    return this.#instanceId
  }

  /** Read-only snapshot of the current options. */
  get options() {
    return { ...this.#options }
  }

  /** Replaces the renderer (used when the real client UI lands). */
  get [RENDER_SLOT]() {
    return this.#renderer
  }

  set [RENDER_SLOT](factory) {
    this.#renderer = typeof factory === 'function' ? factory : null
    if (this.isConnected) {
      this.#render()
    }
  }

  connectedCallback() {
    this.#readAttributes()
    this.#render()
    if (!this.#readySent) {
      this.#readySent = true
      this.#emit(EVENTS.ready, { options: this.options })
    }
  }

  disconnectedCallback() {
    // Tear the UI down so consumers (modals, listeners, timers) do not leak.
    this.#teardown()
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || this.#reflecting) {
      return
    }
    this.#options[name] = newValue === null ? DEFAULTS[name] : newValue
    this.#update()
  }

  /**
   * Merges options and reflects them to attributes, so embedders can drive the
   * element either declaratively (<highorder-app locale="zh">) or imperatively.
   */
  configure(partial = {}) {
    const changed = {}
    for (const [key, value] of Object.entries(partial)) {
      if (!OBSERVED_ATTRIBUTES.includes(key) || value === undefined) {
        continue
      }
      const next = value === null ? DEFAULTS[key] : String(value)
      if (next !== this.#options[key]) {
        changed[key] = next
        this.#options[key] = next
      }
    }

    if (Object.keys(changed).length > 0) {
      this.#reflect(changed)
      this.#update()
    }
    return this.options
  }

  /** Removes the rendered UI and releases per-instance resources. */
  destroy() {
    this.#teardown()
  }

  #readAttributes() {
    for (const key of OBSERVED_ATTRIBUTES) {
      const value = this.getAttribute(key)
      if (value !== null) {
        this.#options[key] = value
      }
    }
  }

  #reflect(changed) {
    this.#reflecting = true
    try {
      for (const [key, value] of Object.entries(changed)) {
        if (value === DEFAULTS[key] && !this.hasAttribute(key)) {
          continue
        }
        this.setAttribute(key, value)
      }
    } finally {
      this.#reflecting = false
    }
  }

  #update() {
    if (!this.isConnected) {
      return
    }
    if (this.#rendered?.update) {
      this.#rendered.update(this.options)
    } else {
      this.#render()
    }
    this.#emit(EVENTS.change, { options: this.options })
  }

  #render() {
    this.#teardown()

    const ctx = {
      host: this,
      root: this.#mountPoint,
      options: this.options,
      emit: (type, detail) => this.#emit(type, detail),
    }

    try {
      const factory = this.#renderer ?? createPlaceholder
      this.#rendered = factory(ctx) ?? null
    } catch (error) {
      this.#rendered = null
      this.#emit(EVENTS.error, { error })
      // A broken renderer must not take the host page down with it.
      this.#mountPoint.textContent = ''
    }
  }

  #teardown() {
    if (this.#rendered?.destroy) {
      try {
        this.#rendered.destroy()
      } catch (error) {
        this.#emit(EVENTS.error, { error })
      }
    }
    this.#rendered = null
    this.#mountPoint.replaceChildren()
  }

  #emit(type, detail) {
    this.dispatchEvent(
      new CustomEvent(type, { detail, bubbles: true, composed: true }),
    )
  }
}

function applyShadowStyles(root, css) {
  try {
    if (
      typeof CSSStyleSheet !== 'undefined' &&
      typeof CSSStyleSheet.prototype.replaceSync === 'function'
    ) {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync(css)
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
      return
    }
  } catch {
    // Fall through to a <style> node (e.g. jsdom).
  }

  const style = document.createElement('style')
  style.textContent = css
  root.append(style)
}
