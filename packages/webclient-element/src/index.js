/**
 * Public entry point for @highorder/webclient-element.
 *
 * Importing this module registers <highorder-app> (or call defineElement()
 * with your own tag name). Everything else — the client UI — is plugged in
 * through the RENDER_SLOT hook while the core is migrated step by step.
 */

import { HighOrderAppElement, OBSERVED_ATTRIBUTES, TAG_NAME } from './element.js'

export { HighOrderAppElement, OBSERVED_ATTRIBUTES, TAG_NAME }
export { RENDER_SLOT } from './renderer.js'

/** Events emitted by the element (all composed, so they cross the shadow boundary). */
export const EVENTS = Object.freeze({
  ready: 'highorder:ready',
  change: 'highorder:change',
  error: 'highorder:error',
})

/** Registers <highorder-app> (idempotent). */
export function defineElement() {
  if (!customElements.get(TAG_NAME)) {
    customElements.define(TAG_NAME, HighOrderAppElement)
  }
  return TAG_NAME
}

defineElement()
