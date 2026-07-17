import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  // AGREGA ESTA SECCIÓN DEL SERVIDOR (SERVER):
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Cambia el 3000 por el puerto real de tu backend
        changeOrigin: true,
      }
    }
  }
})