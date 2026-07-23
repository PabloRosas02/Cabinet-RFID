import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true, // Importante para que Docker exponga el puerto correctamente
    proxy: {
      '/api': {
        target: 'http://backend:3000', // <-- AQUÍ ESTÁ EL CAMBIO CLAVE
        changeOrigin: true,
      }
    }
  }
})