// src/main.ts
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// 1. IMPORTAR A NOVA FUNÇÃO
import { startStatusPolling } from './store/printerState'

// 2. INICIAR O POLLING (em vez do simulador)
startStatusPolling();

const app = createApp(App)

app.use(router)
app.mount('#app')