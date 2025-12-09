// vite.config.ts

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // 1. IMPORTANTE: Define o caminho base como relativo.
  // Isso evita que o app busque scripts em '/assets/' (absoluto) e usa './assets/' (relativo)
  base: './',

  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 2. Configurações extras de Build para garantir integridade
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Garante que a pasta dist seja limpa antes de gerar novos arquivos
    sourcemap: false,  // Desativa source maps em produção para economizar espaço no Pi
  }
})