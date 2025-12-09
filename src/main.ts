// src/main.ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { startStatusPolling } from './store/printerState'

// Log de início para debug (aparecerá no console do navegador se o JS carregar)
console.log('Chromatech: Inicializando aplicação...');

try {
  // Inicia o ciclo de vida (busca temperaturas a cada 2s)
  startStatusPolling();

  const app = createApp(App)

  app.use(router)

  // Monta a aplicação
  app.mount('#app')
  
  console.log('Chromatech: Aplicação montada com sucesso.');
} catch (error) {
  console.error('Chromatech: Erro fatal ao montar a aplicação:', error);
}