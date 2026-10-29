import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // TF.js is large by nature; it's lazy-loaded so this only silences the warning.
    chunkSizeWarningLimit: 2500,
  },
})
