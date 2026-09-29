import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Stamps each production build with its build time. The updater compares this
// with the Microsoft Store listing's last-update time to know when a newer
// version is actually live in the Store.
const buildInfo = () => ({
  name: 'build-info',
  apply: 'build',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'build-info.json',
      source: JSON.stringify({ builtAt: new Date().toISOString() })
    })
  }
})

export default defineConfig({
  plugins: [react(), buildInfo()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'build_dist'
  },
  base: './' // Use relative paths for Electron
})
