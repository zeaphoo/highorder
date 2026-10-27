import { createContext, useContext, useEffect, useRef, useState } from 'react'

const PortalContext = createContext(null)

/**
 * Gives overlays a container inside our own root.
 *
 * Radix (and most overlay libraries) default to `document.body`, which escapes
 * the shadow root, fights the host page's z-index/overflow and locks the host's
 * scroll. Everything portalled must render into `usePortalContainer()` instead.
 */
export function PortalHost({ children }) {
  const hostRef = useRef(null)
  const [container, setContainer] = useState(null)

  useEffect(() => {
    setContainer(hostRef.current)
  }, [])

  return (
    <>
      <div ref={hostRef} data-ho-portal-host="" />
      <PortalContext.Provider value={container}>{children}</PortalContext.Provider>
    </>
  )
}

export function usePortalContainer() {
  return useContext(PortalContext)
}
