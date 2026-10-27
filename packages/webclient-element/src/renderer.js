/**
 * Placeholder renderer.
 *
 * This is what the element shows until the real client UI is migrated in.
 * The renderer contract is intentionally tiny so that the React app (or any
 * other implementation) can be dropped in later without touching the element:
 *
 *   renderer(ctx) -> { update?(options), destroy?() }
 *
 * `ctx` = { host, root, options, emit }
 */

export const RENDER_SLOT = Symbol.for('highorder.renderer')

const TRACKED_KEYS = ['endpoint', 'locale', 'theme']

export function createPlaceholder(ctx) {
  const title = document.createElement('h2')
  title.className = 'ho-placeholder__title'
  title.textContent = 'HighOrder'

  const note = document.createElement('p')
  note.className = 'ho-placeholder__note'
  note.textContent = 'Client UI is being migrated. This shell is ready for embedding.'

  const rows = document.createElement('dl')
  rows.className = 'ho-placeholder__rows'

  const values = new Map()
  for (const key of TRACKED_KEYS) {
    const dt = document.createElement('dt')
    dt.textContent = key
    const dd = document.createElement('dd')
    values.set(key, dd)
    rows.append(dt, dd)
  }

  const wrapper = document.createElement('div')
  wrapper.className = 'ho-placeholder'
  wrapper.setAttribute('part', 'placeholder')
  wrapper.append(title, note, rows)

  const paint = (options) => {
    for (const key of TRACKED_KEYS) {
      const value = options[key]
      values.get(key).textContent = value === '' ? '—' : String(value)
    }
  }

  paint(ctx.options)
  ctx.root.append(wrapper)

  return {
    update(options) {
      paint(options)
    },
    destroy() {
      wrapper.remove()
    },
  }
}
