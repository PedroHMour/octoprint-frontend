import { createRouter, createWebHashHistory } from 'vue-router'

// Importa as páginas que criamos
import HomePage from '../views/HomePage.vue'
import FilesPage from '../views/FilesPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import AdjustPage from '../views/AdjustPage.vue'

const router = createRouter({
  // Usa o modo Hash (#/) para funcionar fácil sem configurar servidor
  history: createWebHashHistory(),
  
  // Define a classe CSS para o link ativo (usado na Sidebar)
  linkActiveClass: 'active',
  
  routes: [
    { 
      path: '/', 
      name: 'Home',
      component: HomePage 
    },
    { 
      path: '/files', 
      name: 'Files',
      component: FilesPage 
    },
    { 
      path: '/settings', 
      name: 'Settings',
      component: SettingsPage 
    },
    { 
      path: '/adjust', 
      name: 'Adjust',
      component: AdjustPage 
    },
  ]
})

export default router