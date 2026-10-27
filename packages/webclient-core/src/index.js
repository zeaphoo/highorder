/**
 * @highorder/webclient-core — framework-free client core.
 *
 * Layers, from the bottom up:
 *   protocol  wire envelope + transport (fetch, no DOM)
 *   state     observable store + explicit state machine
 *   storage   namespaced, versioned, injectable key/value storage
 *   i18n      per-instance dictionaries
 *   render    JSON render-node protocol shared by every renderer
 *   app       composition root (protocol + machine + store + storage + i18n)
 */

export {
  PROTOCOL_VERSION,
  DEFAULT_CALL_PATH,
  TransportError,
  createTransport,
  createClient,
} from './protocol.js'

export { createStore, defineMachine, createMachine } from './state.js'

export { createStorage, createMemoryStorage, STORAGE_VERSION } from './storage.js'

export { createI18n, interpolate } from './i18n.js'

export { RENDER_PROTOCOL_VERSION, el, tx, walk, validateTree, toJSON, fromJSON } from './render.js'

export { APP_MACHINE } from './machine.js'

export { createApp } from './app.js'

export { DICTIONARY, DEFAULT_LOCALE } from './locales/index.js'
