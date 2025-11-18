<template>
  <div class="app-container">
    
    <Sidebar />
    
    <main class="main-content">
      
      <router-view />
      
    </main>
    
    <StatusBar />
    
  </div>
</template>

<script setup lang="ts">
  import Sidebar from './components/Sidebar.vue';
  import StatusBar from './components/StatusBar.vue';
</script>

<style>
  /* --- Layout Principal (Desktop) --- */
  .app-container {
    display: grid;
    grid-template-columns: 80px 1fr 250px;
    height: 100vh;
  }

  /* --- Conteúdo Principal (Centro) --- */
  .main-content {
    background-color: var(--main-bg);
    padding: 20px;
    overflow-y: auto; /* Permite scroll só nesta área */
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }

  /* --- Responsividade (Mobile) --- */
  @media (max-width: 768px) {
    .app-container {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto auto; /* Conteúdo, Status, Navegação */
    }
    .main-content {
      grid-row: 1;
      border: none;
    }
    .status-bar {
      grid-row: 2;
    }
    .sidebar {
      grid-row: 3;
    }
  }
</style>