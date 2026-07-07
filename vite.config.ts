import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Skip TypeScript type checking during build (handled separately)
    rollupOptions: {},
  },
  esbuild: {
    // Ignore type errors - use tsc separately for type checking
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
})
