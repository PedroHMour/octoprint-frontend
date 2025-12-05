import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

// Importa a função que busca dados do backend periodicamente
import { startStatusPolling } from './store/printerState'

// Inicia o ciclo de vida (busca temperaturas a cada 2s)
startStatusPolling();

const app = createApp(App)

app.use(router)
app.mount('#app')