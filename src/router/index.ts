// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'

// Importe as vistas que acabámos de criar
import HomePage from '../views/HomePage.vue'
import FilesPage from '../views/FilesPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import AdjustPage from '../views/AdjustPage.vue'

// 1. Defina as rotas (URLs)
const routes = [
  {
    path: '/', // A URL raiz (ex: localhost:5173/)
    name: 'Home',
    component: HomePage, // Mostra este componente
  },
  {
    path: '/files', // ex: localhost:5173/#/files
    name: 'Files',
    component: FilesPage,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
  },
  {
    path: '/adjust',
    name: 'Adjust',
    component: AdjustPage,
  },
]

// 2. Crie a instância do router
const router = createRouter({
  // Usamos 'createWebHashHistory' (URLs com #/).
  // É a forma mais simples de funcionar no Raspberry Pi
  // sem precisar de configurar o servidor web.
  history: createWebHashHistory(),
  routes, // routes: routes

  // DIZ AO ROUTER PARA USAR A NOSSA CLASSE 'active'
  // Isto é importante para o estilo do ícone funcionar!
  linkActiveClass: 'active',
})

// 3. Exporte o router
export default router