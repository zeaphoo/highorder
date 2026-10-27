import { describe, expect, it, vi } from 'vitest'

import {
  APP_MACHINE,
  RENDER_PROTOCOL_VERSION,
  PROTOCOL_VERSION,
  TransportError,
  createApp,
  createClient,
  createI18n,
  createMachine,
  createMemoryStorage,
  createStorage,
  createStore,
  createTransport,
  defineMachine,
  el,
  fromJSON,
  interpolate,
  toJSON,
  tx,
  validateTree,
} from '../src/index.js'

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

const okEnvelope = (data) => jsonResponse({ v: PROTOCOL_VERSION, ok: true, data })

describe('protocol', () => {
  it('posts a versioned envelope and unwraps the data', async () => {
    const fetchImpl = vi.fn(async () => okEnvelope({ server: 'highorder' }))
    const transport = createTransport({ endpoint: 'http://localhost:8080/', fetchImpl })

    const data = await transport.send('hello')

    expect(data).toEqual({ server: 'highorder' })
    expect(transport.url).toBe('http://localhost:8080/api/v1/call')
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('http://localhost:8080/api/v1/call')
    expect(JSON.parse(init.body)).toEqual({ v: PROTOCOL_VERSION, operation: 'hello', payload: null })
  })

  it('raises TransportError on http errors, carrying code and status', async () => {
    const fetchImpl = async () =>
      jsonResponse({ v: PROTOCOL_VERSION, ok: false, error: { code: 'not_found', message: 'nope' } }, 404)

    await expect(
      createTransport({ endpoint: 'http://x', fetchImpl }).send('hello'),
    ).rejects.toMatchObject({ name: 'TransportError', code: 'not_found', status: 404 })
  })

  it('rejects an envelope from another protocol version', async () => {
    const fetchImpl = async () => jsonResponse({ v: 99, ok: true, data: null })
    await expect(
      createTransport({ endpoint: 'http://x', fetchImpl }).send('hello'),
    ).rejects.toMatchObject({ code: 'protocol_mismatch' })
  })

  it('wraps network failures and requires an endpoint', async () => {
    const failing = async () => {
      throw new Error('offline')
    }
    await expect(
      createTransport({ endpoint: 'http://x', fetchImpl: failing }).send('hello'),
    ).rejects.toBeInstanceOf(TransportError)

    expect(() => createTransport({ endpoint: '   ' })).toThrow(TypeError)
  })

  it('exposes a typed client facade', async () => {
    const fetchImpl = async () => okEnvelope({ ok: true })
    const client = createClient({ transport: createTransport({ endpoint: 'http://x', fetchImpl }) })

    await expect(client.hello()).resolves.toEqual({ ok: true })
    expect(() => createClient({})).toThrow(TypeError)
  })
})

describe('store and machine', () => {
  it('notifies subscribers only on real changes', () => {
    const store = createStore(0)
    const seen = []
    const unsubscribe = store.subscribe((state) => seen.push(state))

    store.set(0)
    store.set((previous) => previous + 1)
    unsubscribe()
    store.set(5)

    expect(seen).toEqual([1])
    expect(store.state).toBe(5)
  })

  it('runs transitions with enter/exit hooks and guards', () => {
    const log = []
    const machine = createMachine(
      defineMachine({
        initial: 'idle',
        states: {
          idle: { on: { START: 'running' } },
          running: {
            onExit: () => log.push('exit'),
            onEnter: () => log.push('enter'),
            on: {
              STOP: { target: 'idle', guard: (payload) => payload?.confirmed === true },
            },
          },
        },
      }),
    )

    expect(machine.send('STOP')).toBe(false)
    expect(machine.send('START')).toBe(true)
    expect(machine.state).toBe('running')
    expect(machine.send('STOP', { confirmed: false })).toBe(false)
    expect(machine.send('STOP', { confirmed: true })).toBe(true)
    expect(log).toEqual(['enter', 'exit'])
    expect(machine.state).toBe('idle')
  })

  it('rejects invalid machine definitions', () => {
    expect(() => defineMachine({ initial: 'a', states: {} })).toThrow(TypeError)
    expect(() => defineMachine({ initial: 'x', states: { a: {} } })).toThrow(TypeError)
    expect(() =>
      defineMachine({ initial: 'a', states: { a: { on: { GO: 'missing' } } } }),
    ).toThrow(TypeError)
  })
})

describe('storage', () => {
  it('namespaces and versions keys', () => {
    const backend = createMemoryStorage()
    const storage = createStorage({ namespace: 'inst-1', backend })

    storage.set('locale', 'zh')
    expect(backend.getItem('inst-1:locale')).toContain('"zh"')
    expect(storage.get('locale')).toBe('zh')

    const other = createStorage({ namespace: 'inst-2', backend })
    expect(other.get('locale', 'en')).toBe('en')
    expect(storage.keys()).toEqual(['locale'])
  })

  it('drops values written by an older storage version', () => {
    const backend = createMemoryStorage()
    backend.setItem('ns:key', JSON.stringify({ v: 999, value: 'stale' }))
    expect(createStorage({ namespace: 'ns', backend }).get('key', 'fresh')).toBe('fresh')
  })

  it('falls back when a backend throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {},
    }
    const storage = createStorage({ namespace: 'ns', backend: broken })
    expect(storage.get('k', 'default')).toBe('default')
    expect(storage.set('k', 1)).toBe(false)
  })

  it('clears only its own keys', () => {
    const backend = createMemoryStorage()
    const a = createStorage({ namespace: 'a', backend })
    const b = createStorage({ namespace: 'b', backend })
    a.set('x', 1)
    b.set('x', 2)
    a.clear()
    expect(a.keys()).toEqual([])
    expect(b.get('x')).toBe(2)
  })
})

describe('i18n', () => {
  const dictionary = {
    en: { greet: 'Hello {name}', only_en: 'English only' },
    zh: { greet: '你好 {name}' },
  }

  it('interpolates params and falls back to the fallback locale', () => {
    const i18n = createI18n({ locale: 'zh', fallback: 'en', dictionary })
    expect(i18n.t('greet', { name: 'Ada' })).toBe('你好 Ada')
    expect(i18n.t('only_en')).toBe('English only')
    expect(i18n.t('missing.key')).toBe('missing.key')
    expect(interpolate('{a}-{b}', { a: 1 })).toBe('1-{b}')
  })

  it('keeps locale per instance and notifies subscribers', () => {
    const a = createI18n({ locale: 'zh', dictionary })
    const b = createI18n({ locale: 'en', dictionary })
    const seen = []
    a.subscribe((locale) => seen.push(locale))

    a.setLocale('en')

    expect(seen).toEqual(['en'])
    expect(a.locale).toBe('en')
    expect(b.locale).toBe('en')
  })
})

describe('render protocol', () => {
  it('builds frozen, serializable nodes', () => {
    const tree = el('card', { tone: 'info' }, ['hello', el('badge', {}, [tx(3)])])
    expect(Object.isFrozen(tree)).toBe(true)
    expect(tree.children[0]).toEqual({ kind: 'text', text: 'hello' })
    expect(tree.children[1].children[0].text).toBe('3')

    const roundTrip = fromJSON(toJSON(tree))
    expect(roundTrip).toEqual(tree)
    expect(validateTree(tree)).toBe(tree)
    expect(RENDER_PROTOCOL_VERSION).toBe(1)
  })

  it('rejects malformed trees', () => {
    expect(() => validateTree({ kind: 'nope' })).toThrow(TypeError)
    expect(() => validateTree({ kind: 'element', type: '', children: [] })).toThrow(TypeError)
    expect(() => el('', {})).toThrow(TypeError)
  })
})

describe('app composition', () => {
  it('mounts without an endpoint and reports connect() as unconfigured', async () => {
    const app = createApp({ storage: createStorage({ namespace: 'app-test', backend: createMemoryStorage() }) })

    expect(app.status).toBe('idle')
    expect(app.client).toBeNull()
    await expect(app.connect()).rejects.toThrow(/endpoint/)
  })

  it('drives idle -> connecting -> ready and stores the hello payload', async () => {
    const transitions = []
    const app = createApp({
      endpoint: 'http://localhost:8080',
      fetchImpl: async () => okEnvelope({ server: 'highorder', version: '0.1.0' }),
      storage: createStorage({ namespace: 'app-test', backend: createMemoryStorage() }),
      onEvent: (type, detail) => transitions.push([type, detail?.to ?? detail?.locale]),
    })

    await app.connect()

    expect(app.status).toBe('ready')
    expect(app.state.info).toEqual({ server: 'highorder', version: '0.1.0' })
    expect(transitions.map((t) => t[1])).toEqual(['connecting', 'ready'])
  })

  it('drives to error and keeps the failure on state', async () => {
    const app = createApp({
      endpoint: 'http://localhost:8080',
      fetchImpl: async () => {
        throw new Error('offline')
      },
      storage: createStorage({ namespace: 'app-test', backend: createMemoryStorage() }),
    })

    await expect(app.connect()).rejects.toBeInstanceOf(TransportError)
    expect(app.status).toBe('error')
    expect(app.state.error).toBeInstanceOf(Error)
  })

  it('persists the locale and restores it for the next instance', () => {
    const backend = createMemoryStorage()
    const first = createApp({
      namespace: 'persist-test',
      storage: createStorage({ namespace: 'persist-test', backend }),
    })
    first.setLocale('zh')

    const second = createApp({
      namespace: 'persist-test',
      storage: createStorage({ namespace: 'persist-test', backend }),
    })

    expect(second.i18n.locale).toBe('zh')
    expect(second.t('status.idle')).toBe('未连接')
  })

  it('exposes the default machine', () => {
    expect(APP_MACHINE.initial).toBe('idle')
    expect(createMachine(APP_MACHINE).can('CONNECT')).toBe(true)
  })
})
