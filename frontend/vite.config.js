import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        headers: {
            Accept: 'application/json',
        }
      },
      '/sanctum/csrf-cookie': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    }
  }
})

