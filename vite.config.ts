/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
// Note: @vitejs/plugin-legacy removed — Capacitor runs on modern Chromium/WebKit,
// so legacy transpilation is unnecessary and doubles build memory usage.
export default defineConfig({
  plugins: [
    react(),
  ],
  build: {
    target: 'es2019',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      maxParallelFileOps: 1,
      output: {
      manualChunks(id) {
          if (id.includes('node_modules/@ionic') || id.includes('node_modules/ionicons')) return 'vendor-ionic';
          if (id.includes('node_modules/html5-qrcode') || id.includes('node_modules/qrcode')) return 'vendor-qr';
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) return 'vendor-react';
          if (id.includes('node_modules/react')) return 'vendor-react';
          if (id.includes('node_modules/axios')) return 'vendor-http';
          if (id.includes('node_modules')) return 'vendor-misc';
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
