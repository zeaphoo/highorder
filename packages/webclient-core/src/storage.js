/**
 * Namespaced, versioned key/value storage.
 *
 * - every key is prefixed, so an embedded instance cannot collide with the
 *   host page (or with a second instance using another namespace)
 * - the backend is injectable (localStorage, sessionStorage, memory, a host
 *   provided KV) and falls back to memory when storage is blocked, which is
 *   common in third-party iframes
 * - values are JSON with a version tag, and unreadable/old values are dropped
 *   instead of throwing at the call site
 */

export const STORAGE_VERSION = 1

export function createMemoryStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, String(value)),
    removeItem: (key) => void map.delete(key),
    key: (index) => [...map.keys()][index] ?? null,
    clear: () => map.clear(),
    get length() {
      return map.size
    },
  }
}

function resolveBackend(backend) {
  if (backend) {
    return backend
  }
  try {
    const candidate = globalThis.localStorage
    const probe = '__highorder_probe__'
    candidate.setItem(probe, '1')
    candidate.removeItem(probe)
    return candidate
  } catch {
    return createMemoryStorage()
  }
}

export function createStorage({ namespace = 'highorder', backend, version = STORAGE_VERSION } = {}) {
  if (typeof namespace !== 'string' || namespace.trim() === '') {
    throw new TypeError('createStorage: namespace must be a non-empty string')
  }

  const target = resolveBackend(backend)
  const prefix = `${namespace}:`
  const physicalKey = (name) => `${prefix}${name}`

  return {
    namespace,
    version,

    get backend() {
      return target
    },

    get(name, fallback = null) {
      let raw
      try {
        raw = target.getItem(physicalKey(name))
      } catch {
        return fallback
      }
      if (raw === null || raw === undefined) {
        return fallback
      }
      try {
        const record = JSON.parse(raw)
        if (record?.v !== version || !('value' in record)) {
          target.removeItem?.(physicalKey(name))
          return fallback
        }
        return record.value
      } catch {
        return fallback
      }
    },

    set(name, value) {
      try {
        target.setItem(physicalKey(name), JSON.stringify({ v: version, value }))
        return true
      } catch {
        return false
      }
    },

    remove(name) {
      try {
        target.removeItem(physicalKey(name))
      } catch {
        // ignore: nothing to clean up
      }
    },

    /** Names of the keys owned by this namespace (prefix stripped). */
    keys() {
      const out = []
      let length = 0
      try {
        length = target.length ?? 0
      } catch {
        return out
      }
      for (let index = 0; index < length; index += 1) {
        const key = target.key(index)
        if (typeof key === 'string' && key.startsWith(prefix)) {
          out.push(key.slice(prefix.length))
        }
      }
      return out
    },

    clear() {
      for (const name of this.keys()) {
        this.remove(name)
      }
    },
  }
}
