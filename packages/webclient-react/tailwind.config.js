/**
 * Tailwind setup for an embeddable UI:
 *  - preflight is disabled, otherwise we would reset the host page's styles
 *  - every utility is prefixed with `ho-` so classes cannot collide with the
 *    host page or with another copy of Tailwind on it
 */
export default {
  prefix: 'ho-',
  corePlugins: {
    preflight: false,
  },
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        horder: 'var(--ho-color-border)',
        hbg: 'var(--ho-color-bg)',
        hfg: 'var(--ho-color-fg)',
        hmuted: 'var(--ho-color-muted)',
        haccent: 'var(--ho-color-accent)',
      },
      borderRadius: {
        happ: 'var(--ho-radius)',
      },
    },
  },
  plugins: [],
}
