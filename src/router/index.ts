import { createRouter, createWebHashHistory } from 'vue-router'

// Importa as páginas
import HomePage from '../views/HomePage.vue'
import FilesPage from '../views/FilesPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import MixingPage from '../views/MixingPage.vue' // <--- NOVO

const router = createRouter({
  history: createWebHashHistory(),
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
      path: '/mixing',  // <--- NOVO
      name: 'Mixing',
      component: MixingPage 
    },
    
    { 
      path: '/settings', 
      name: 'Settings',
      component: SettingsPage 
    },
  ]
})

export default router