import { useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'

import { HighOrderProvider, useHighOrder } from './AppContext.jsx'
import { PortalHost, usePortalContainer } from './PortalHost.jsx'

/**
 * The React client. Two ways to consume it:
 *   - as a component (apps/webapp, own pages)
 *   - through createElementRenderer() which mounts it inside the
 *     <highorder-app> custom element for third-party embedding
 */
export function HighOrderApp({ endpoint = '', locale = 'en', theme = 'light', onEvent }) {
  return (
    <HighOrderProvider endpoint={endpoint} locale={locale} onEvent={onEvent}>
      <div className="ho-app" data-theme={theme} data-testid="highorder-app">
        <PortalHost>
          <Shell />
        </PortalHost>
      </div>
    </HighOrderProvider>
  )
}

function Shell() {
  const { app, snapshot } = useHighOrder()
  const t = app.t

  const connect = useCallback(() => {
    app.connect().catch(() => {
      // the failure is already reflected in the state snapshot
    })
  }, [app])

  return (
    <div className="ho-card ho-max-w-md">
      <div className="ho-flex ho-items-baseline ho-justify-between ho-gap-3">
        <h2 className="ho-text-base ho-font-semibold">{t('app.title')}</h2>
        <span className="ho-muted ho-text-xs">{snapshot.locale}</span>
      </div>

      <p className="ho-muted ho-text-xs">{t('app.tagline')}</p>

      <div className="ho-flex ho-items-center ho-gap-2 ho-text-sm">
        <strong>{t(`status.${snapshot.status}`)}</strong>
        {snapshot.endpoint || app.endpoint ? (
          <code className="ho-muted ho-text-xs">{app.endpoint}</code>
        ) : (
          <span className="ho-muted ho-text-xs">—</span>
        )}
      </div>

      {snapshot.error ? (
        <p className="ho-text-xs ho-text-red-600">{String(snapshot.error.message ?? snapshot.error)}</p>
      ) : null}

      <div className="ho-flex ho-flex-wrap ho-items-center ho-gap-2">
        <button type="button" className="ho-btn" onClick={connect}>
          {snapshot.status === 'error' ? t('action.retry') : t('action.connect')}
        </button>
        <LocaleSwitch />
      </div>

      <p className="ho-muted ho-text-xs">{t('placeholder.note')}</p>

      <DialogDemo />
    </div>
  )
}

function LocaleSwitch() {
  const { app } = useHighOrder()
  return (
    <div className="ho-flex ho-gap-1">
      {app.i18n.locales.map((code) => (
        <button
          key={code}
          type="button"
          className="ho-btn ho-text-xs"
          onClick={() => app.setLocale(code)}
        >
          {code}
        </button>
      ))}
    </div>
  )
}

/** Shows the portal containment rule: the dialog stays inside our root. */
function DialogDemo() {
  const { app } = useHighOrder()
  const container = usePortalContainer()
  const t = app.t

  return (
    <Dialog.Root>
      <Dialog.Trigger className="ho-btn ho-self-start">{t('dialog.open')}</Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Overlay className="ho-overlay" />
        <Dialog.Content className="ho-dialog">
          <Dialog.Title className="ho-text-sm ho-font-semibold">{t('dialog.title')}</Dialog.Title>
          <Dialog.Description className="ho-muted ho-text-xs">
            {t('dialog.body')}
          </Dialog.Description>
          <Dialog.Close className="ho-btn ho-self-start">{t('dialog.close')}</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
