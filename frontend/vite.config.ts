import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Разрешаем запросы с любых доменов (для тестов через туннель)
    // В продакшене лучше указать конкретный домен: allowedHosts: ['.trycloudflare.com']
    allowedHosts: true, 
  },
})