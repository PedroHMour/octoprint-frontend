// vite.config.ts

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path' // 1. IMPORTAR O 'path' DO NODE

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  
  // 2. ADICIONAR ESTE BLOCO INTEIRO
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})