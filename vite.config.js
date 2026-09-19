import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execFile } from 'node:child_process'

// The village designer renders straight into public/village/buildings while
// the dev server runs. Re-fold its JSON into src/data/villageSprites.json when
// a render lands, so new sizes and anchors reach the map without a restart.
function villageSprites() {
  let timer
  return {
    name: 'village-sprites',
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (!/public\/village\/buildings\/[^/]+\.json$/.test(file)) return
        // one render writes dozens of files: fold once, after the last of them
        clearTimeout(timer)
        timer = setTimeout(() => execFile('node', ['scripts/villageSprites.mjs']), 300)
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), villageSprites()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Off the Vite default (5173), which other apps on this machine already use.
  // strictPort makes a collision fail loudly instead of hopping to a random port.
  // host: true listens on every interface, so a phone or tablet on the same
  // wifi can open the app; Vite prints the Network URL on start.
  server: { host: true, port: 5190, strictPort: true },
  preview: { host: true, port: 4190, strictPort: true },
})
