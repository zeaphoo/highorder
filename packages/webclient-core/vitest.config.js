/**
 * Plain object (no `vite` import): the core must stay dependency-free, and
 * vitest accepts a plain config just as well.
 */
export default {
  test: {
    // The core is deliberately DOM-free; nothing here should need jsdom.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
}
