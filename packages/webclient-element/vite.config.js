import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    lib: {
      name: 'HighOrderElement',
      fileName: 'highorder-app',
      entry: path.resolve(__dirname, 'src/index.js'),
      formats: ['es', 'iife'],
    },
    // Styles are imported with ?inline and adopted into the shadow root,
    // so nothing is emitted as a global stylesheet on purpose.
    cssCodeSplit: false,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
})
