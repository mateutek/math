import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Off the Vite default (5173), which other apps on this machine already use.
  // strictPort makes a collision fail loudly instead of hopping to a random port.
  server: { port: 5190, strictPort: true },
  preview: { port: 4190, strictPort: true },
})
