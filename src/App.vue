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
  /* Layout Grid Principal */
  .app-container {
    display: grid;
    grid-template-columns: 80px 1fr 250px;
    height: 100vh;
    overflow: hidden;
  }

  /* Área Central (Scrollável) */
  .main-content {
    background-color: var(--main-bg);
    padding: 20px;
    overflow-y: auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
    position: relative;
  }

  /* Responsividade (Mobile) */
  @media (max-width: 900px) {
    .app-container {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr auto auto; /* Conteúdo, Status, Menu */
    }
    .main-content {
      grid-row: 1;
      border: none;
      padding-bottom: 80px; /* Espaço para não esconder conteúdo atrás do menu */
    }
    .status-bar {
      grid-row: 2;
      z-index: 10;
    }
    .sidebar {
      grid-row: 3;
      z-index: 10;
    }
  }
</style>