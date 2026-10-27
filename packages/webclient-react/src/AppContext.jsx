import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createApp } from '@highorder/webclient-core'

const HighOrderContext = createContext(null)

/**
 * Creates one core app per provider and exposes it together with a snapshot
 * of its observable state. React is only a view over the framework-free core.
 */
export function HighOrderProvider({ endpoint = '', locale = 'en', onEvent, children }) {
  const appRef = useRef(null)
  if (appRef.current === null) {
    appRef.current = createApp({ endpoint, locale, onEvent })
  }
  const app = appRef.current

  useEffect(() => () => app.dispose(), [app])

  useEffect(() => {
    if (locale && locale !== app.i18n.locale) {
      app.setLocale(locale)
    }
  }, [app, locale])

  const snapshot = useAppSnapshot(app)
  const value = useMemo(() => ({ app, snapshot }), [app, snapshot])

  return <HighOrderContext.Provider value={value}>{children}</HighOrderContext.Provider>
}

/** Re-renders when the core state or the locale changes. */
function useAppSnapshot(app) {
  const [snapshot, setSnapshot] = useState(() => readSnapshot(app))

  useEffect(() => {
    const update = () => setSnapshot(readSnapshot(app))
    const offStore = app.subscribe(update)
    const offI18n = app.i18n.subscribe(update)
    update()
    return () => {
      offStore()
      offI18n()
    }
  }, [app])

  return snapshot
}

function readSnapshot(app) {
  return { ...app.state, locale: app.i18n.locale }
}

export function useHighOrder() {
  const value = useContext(HighOrderContext)
  if (!value) {
    throw new Error('useHighOrder must be used inside <HighOrderProvider>')
  }
  return value
}
