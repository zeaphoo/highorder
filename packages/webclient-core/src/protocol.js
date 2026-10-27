/**
 * Wire protocol between a client and the HighOrder server.
 *
 * Deliberately framework-free and DOM-free: the same module is used by the
 * React client, the embedded custom element and (later) any other host.
 *
 * Envelope (both directions):
 *   { v: 1, operation: "hello", payload?: unknown }
 *   { v: 1, ok: true, data?: unknown }
 *   { v: 1, ok: false, error: { code, message } }
 */

export const PROTOCOL_VERSION = 1

export const DEFAULT_CALL_PATH = '/api/v1/call'

export class TransportError extends Error {
  constructor(message, { status = 0, code = 'transport_error', cause } = {}) {
    super(message, { cause })
    this.name = 'TransportError'
    this.status = status
    this.code = code
  }
}

/**
 * Creates a transport bound to one endpoint.
 *
 * `path` is configurable because the new Rust server contract is still being
 * defined; nothing in the client assumes a specific route.
 */
export function createTransport({
  endpoint,
  path = DEFAULT_CALL_PATH,
  fetchImpl = globalThis.fetch,
  headers = {},
  timeoutMs = 0,
} = {}) {
  if (typeof endpoint !== 'string' || endpoint.trim() === '') {
    throw new TypeError('createTransport: endpoint is required')
  }
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('createTransport: no fetch implementation available')
  }

  const url = `${endpoint.replace(/\/+$/, '')}${path}`
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    throw new TypeError(`createTransport: unsupported endpoint "${endpoint}"`)
  }

  return {
    url,

    async send(operation, payload = null) {
      if (typeof operation !== 'string' || operation === '') {
        throw new TypeError('transport.send: operation must be a non-empty string')
      }

      const controller = timeoutMs > 0 ? new AbortController() : null
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

      let response
      try {
        response = await fetchImpl(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...headers },
          body: JSON.stringify({ v: PROTOCOL_VERSION, operation, payload }),
          signal: controller?.signal,
        })
      } catch (cause) {
        throw new TransportError(`request failed: ${operation}`, { cause })
      } finally {
        if (timer) clearTimeout(timer)
      }

      const envelope = await readEnvelope(response)

      if (!response.ok) {
        throw new TransportError(
          envelope?.error?.message || `HTTP ${response.status} for ${operation}`,
          { status: response.status, code: envelope?.error?.code || 'http_error' },
        )
      }
      if (!envelope || envelope.v !== PROTOCOL_VERSION) {
        throw new TransportError(`unsupported response envelope for ${operation}`, {
          status: response.status,
          code: 'protocol_mismatch',
        })
      }
      if (envelope.ok === false) {
        throw new TransportError(envelope.error?.message || `${operation} failed`, {
          status: response.status,
          code: envelope.error?.code || 'operation_failed',
        })
      }

      return envelope.data ?? null
    },
  }
}

async function readEnvelope(response) {
  let text
  try {
    text = await response.text()
  } catch {
    return null
  }
  if (!text) {
    return null
  }
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/** Typed facade over a transport; keeps call sites free of envelope details. */
export function createClient({ transport }) {
  if (!transport || typeof transport.send !== 'function') {
    throw new TypeError('createClient: a transport is required')
  }

  return {
    hello: () => transport.send('hello'),
    call: (operation, payload) => transport.send(operation, payload),
  }
}
