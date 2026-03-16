/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import legacy from '@vitejs/plugin-legacy'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', // CRITICAL for standard browser routing traversing paths without breaking assets
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11', 'chrome >= 61', 'ios >= 13', 'android >= 7'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    })
  ],
  build: {
    target: 'es2015',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      maxParallelFileOps: 1,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@ionic') || id.includes('node_modules/ionicons')) return 'vendor-ionic';
          if (id.includes('node_modules/html5-qrcode') || id.includes('node_modules/qrcode')) return 'vendor-qr';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})