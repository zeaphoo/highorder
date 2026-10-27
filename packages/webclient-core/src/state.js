/**
 * Observable store and a tiny explicit state machine.
 *
 * Both are plain functions: no signals, no proxies, no framework runtime.
 * Subscribers receive the new state and are called synchronously.
 */

export function createStore(initialState, { equals = Object.is } = {}) {
  let state = initialState
  const listeners = new Set()

  return {
    get state() {
      return state
    },

    set(next) {
      const value = typeof next === 'function' ? next(state) : next
      if (equals(value, state)) {
        return state
      }
      state = value
      for (const listener of [...listeners]) {
        listener(state)
      }
      return state
    },

    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('store.subscribe: listener must be a function')
      }
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    dispose() {
      listeners.clear()
    },
  }
}

/**
 * Declarative machine definition.
 *
 * states: {
 *   idle:     { on: { START: 'running' } },
 *   running:  { onEnter: (payload) => {}, on: { STOP: { target: 'idle', guard } } },
 * }
 */
export function defineMachine({ id = 'machine', initial, states }) {
  if (!states || typeof states !== 'object' || Object.keys(states).length === 0) {
    throw new TypeError(`defineMachine(${id}): states must not be empty`)
  }
  if (!states[initial]) {
    throw new TypeError(`defineMachine(${id}): initial state "${initial}" is not defined`)
  }

  for (const [state, spec] of Object.entries(states)) {
    for (const [event, transition] of Object.entries(spec.on ?? {})) {
      const target = typeof transition === 'string' ? transition : transition?.target
      if (!states[target]) {
        throw new TypeError(
          `defineMachine(${id}): ${state} -> ${event} targets unknown state "${target}"`,
        )
      }
    }
  }

  return Object.freeze({ id, initial, states })
}

export function createMachine(definition, { onTransition } = {}) {
  let current = definition.initial
  const listeners = new Set()

  const notify = (from, event, payload) => {
    for (const listener of [...listeners]) {
      listener(current, { from, event, payload })
    }
  }

  return {
    get state() {
      return current
    },

    /** True when `event` is handled in the current state. */
    can(event) {
      return Boolean(definition.states[current]?.on?.[event])
    },

    /** Applies the transition; returns false when the event is not handled. */
    send(event, payload) {
      const spec = definition.states[current]
      const transition = spec?.on?.[event]
      if (!transition) {
        return false
      }

      const target = typeof transition === 'string' ? transition : transition.target
      if (typeof transition === 'object' && typeof transition.guard === 'function') {
        if (!transition.guard(payload)) {
          return false
        }
      }

      const from = current
      current = target
      spec.onExit?.(payload)
      definition.states[target].onEnter?.(payload)
      onTransition?.({ from, event, to: target, payload })
      notify(from, event, payload)
      return true
    },

    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('machine.subscribe: listener must be a function')
      }
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    dispose() {
      listeners.clear()
    },
  }
}
