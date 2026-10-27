/**
 * Composition root of the framework-free client.
 *
 * createApp() wires protocol + machine + store + storage + i18n into one
 * instance. Nothing here touches the DOM, so the same instance can drive the
 * React client, the custom element, or a test.
 */

import { createI18n } from './i18n.js'
import { APP_MACHINE } from './machine.js'
import { createClient, createTransport } from './protocol.js'
import { createMachine, createStore } from './state.js'
import { createStorage } from './storage.js'
import { DICTIONARY, DEFAULT_LOCALE } from './locales/index.js'

export function createApp({
  endpoint = '',
  locale = DEFAULT_LOCALE,
  dictionary = DICTIONARY,
  namespace = 'highorder',
  storage,
  transport,
  fetchImpl,
  machineDefinition = APP_MACHINE,
  onEvent,
} = {}) {
  const store = createStore({
    status: machineDefinition.initial,
    info: null,
    error: null,
  })

  const machine = createMachine(machineDefinition, {
    onTransition: (transition) => {
      store.set((previous) => {
        const next = { ...previous, status: transition.to }
        if (transition.event === 'READY') {
          next.info = transition.payload ?? null
        }
        if (transition.event === 'FAIL') {
          next.error = transition.payload ?? null
        }
        if (transition.event === 'RESET') {
          next.error = null
          next.info = null
        }
        return next
      })
      onEvent?.('transition', transition)
    },
  })

  const i18n = createI18n({ locale, dictionary })

  const keyValue = storage ?? createStorage({ namespace })
  // endpoint is optional so the UI can mount (and be themed) before a server
  // exists — connect() simply reports that it is not configured yet.
  const activeTransport = transport ?? (endpoint ? createTransport({ endpoint, fetchImpl }) : null)
  const client = activeTransport ? createClient({ transport: activeTransport }) : null

  const app = {
    machine,
    store,
    i18n,
    storage: keyValue,
    client,
    endpoint,
    namespace,

    get status() {
      return machine.state
    },

    get state() {
      return store.state
    },

    subscribe(listener) {
      return store.subscribe(listener)
    },

    get t() {
      return i18n.t
    },

    setLocale(next) {
      i18n.setLocale(next)
      keyValue.set('locale', next)
      onEvent?.('locale', { locale: next })
      return i18n.locale
    },

    /** Connects to the server and drives the machine to ready/error. */
    async connect() {
      if (!client) {
        throw new Error('createApp: endpoint is not configured')
      }
      if (!machine.can('CONNECT')) {
        return machine.state
      }

      machine.send('CONNECT')
      try {
        const info = await client.hello()
        machine.send('READY', info)
        return machine.state
      } catch (error) {
        machine.send('FAIL', error)
        onEvent?.('error', { error })
        throw error
      }
    },

    dispose() {
      machine.dispose()
      store.dispose()
      i18n.dispose()
    },
  }

  const remembered = keyValue.get('locale')
  if (typeof remembered === 'string' && !i18n.locales.includes(remembered)) {
    // stale value from an older build: drop it instead of trusting it
    keyValue.remove('locale')
  } else if (typeof remembered === 'string' && remembered !== i18n.locale) {
    i18n.setLocale(remembered)
  }

  return app
}
