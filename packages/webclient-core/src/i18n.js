/**
 * Dictionary based i18n. No framework, no global locale state: every app
 * instance owns its own translator, so two embedded instances may show
 * different languages on the same page.
 *
 * dictionary: { en: { key: 'text' }, zh: { key: '文本' } }
 * t('greet', { name: 'Ada' }) with 'greet': 'Hello {name}' -> 'Hello Ada'
 */

export function interpolate(template, params) {
  if (!params) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  )
}

export function createI18n({
  locale = 'en',
  fallback = 'en',
  dictionary = {},
  onMissing,
} = {}) {
  if (!dictionary || typeof dictionary !== 'object') {
    throw new TypeError('createI18n: dictionary must be an object')
  }

  const listeners = new Set()
  let current = locale

  const lookup = (key) => {
    const primary = dictionary[current]?.[key]
    if (primary !== undefined) {
      return { value: primary, usedLocale: current }
    }
    const secondary = dictionary[fallback]?.[key]
    if (secondary !== undefined) {
      return { value: secondary, usedLocale: fallback }
    }
    return { value: undefined, usedLocale: null }
  }

  const api = {
    get locale() {
      return current
    },

    get fallback() {
      return fallback
    },

    get locales() {
      return Object.keys(dictionary)
    },

    has(key) {
      return lookup(key).value !== undefined
    },

    /** Falls back to `fallback`, then to the key itself. */
    t(key, params) {
      const { value, usedLocale } = lookup(key)
      if (value === undefined) {
        onMissing?.(key, { locale: current, params })
        return key
      }
      if (usedLocale !== current) {
        onMissing?.(key, { locale: current, params, fellBackTo: usedLocale })
      }
      return interpolate(String(value), params)
    },

    setLocale(next) {
      if (typeof next !== 'string' || next === '') {
        throw new TypeError('i18n.setLocale: locale must be a non-empty string')
      }
      if (next === current) {
        return current
      }
      current = next
      for (const listener of [...listeners]) {
        listener(current)
      }
      return current
    },

    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('i18n.subscribe: listener must be a function')
      }
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    dispose() {
      listeners.clear()
    },
  }

  return api
}
