import { defineMachine } from './state.js'

/**
 * Connection lifecycle of a client instance.
 *
 *   idle ──CONNECT──▶ connecting ──READY──▶ ready
 *     ▲                   │                  │
 *     └─────RESET─────────┴───────FAIL──────▶ error
 */
export const APP_MACHINE = defineMachine({
  id: 'highorder-app',
  initial: 'idle',
  states: {
    idle: { on: { CONNECT: 'connecting' } },
    connecting: { on: { READY: 'ready', FAIL: 'error', RESET: 'idle' } },
    ready: { on: { FAIL: 'error', RESET: 'idle' } },
    error: { on: { CONNECT: 'connecting', RESET: 'idle' } },
  },
})
