import { createElement } from 'react'
import { createRoot } from 'react-dom/client'

import { HighOrderApp } from './HighOrderApp.jsx'

/**
 * Adapter between the <highorder-app> shell and React.
 *
 * The shell (packages/webclient-element) only knows this contract:
 *
 *   renderer(ctx) -> { update(options), destroy() }
 *   ctx = { host, root, options: { endpoint, locale, theme }, emit }
 *
 * Everything React-specific stays on this side of the boundary, so the shell
 * can keep working (and keep being framework-free) without React at all.
 */
export function createElementRenderer(defaults = {}) {
  return (ctx) => {
    const root = createRoot(ctx.root)

    const render = (options = ctx.options) => {
      root.render(
        createElement(HighOrderApp, {
          endpoint: options.endpoint ?? '',
          locale: options.locale ?? 'en',
          theme: options.theme ?? 'light',
          onEvent: (type, detail) => ctx.emit?.(`highorder:${type}`, detail),
          ...defaults,
        }),
      )
    }

    render(ctx.options)

    return {
      update: render,
      destroy: () => root.unmount(),
    }
  }
}
