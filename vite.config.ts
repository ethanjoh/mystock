import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/mystock/',
  server: {
    proxy: {
      '/api/finance': {
        target: 'https://query1.finance.yahoo.com/v8/finance',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/finance/, ''),
      }
    }
  }
})
