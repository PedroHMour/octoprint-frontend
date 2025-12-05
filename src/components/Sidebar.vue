<template>
  <nav class="sidebar">
    
    <router-link to="/" class="nav-icon" title="Início">
      <i class="fas fa-home"></i> 
      <span>Home</span>
    </router-link>
    
    <router-link to="/files" class="nav-icon" title="Arquivos">
      <i class="fas fa-folder"></i> 
      <span>Files</span>
    </router-link>
    
    <router-link to="/adjust" class="nav-icon" title="Ajustes">
      <i class="fas fa-sliders-h"></i> 
      <span>Ajustes</span>
    </router-link>

    <router-link to="/settings" class="nav-icon" title="Configurações">
      <i class="fas fa-cog"></i> 
      <span>Settings</span>
    </router-link>
    
  </nav>
</template>

<script setup lang="ts">
  // O Vue Router adiciona automaticamente a classe 'active' ao link atual
</script>

<style scoped>
.sidebar {
  background-color: #333a40; /* Fundo escuro fixo para a sidebar */
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  height: 100%;
}

.nav-icon {
  color: #ced4da; /* Cor dos ícones inativos */
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  width: 100%;
  font-size: 12px;
  transition: background-color 0.2s, color 0.2s;
  border-left: 4px solid transparent; /* Indicador lateral */
}

.nav-icon i {
  font-size: 24px;
  margin-bottom: 5px;
}

.nav-icon:hover {
  background-color: #495057;
  color: #fff;
}

/* Classe automática do Vue Router quando o link está ativo */
.nav-icon.active {
  color: var(--icon-active); /* Azul do tema */
  background-color: #2a2f34;
  border-left-color: var(--icon-active);
}

/* Responsividade (Mobile) */
@media (max-width: 900px) {
  .sidebar {
    padding-top: 0;
    flex-direction: row;
    justify-content: space-around;
    height: auto;
    width: 100%;
    background-color: var(--main-bg); /* No mobile, funde com o fundo */
    border-top: 1px solid var(--border-color);
  }

  .nav-icon {
    color: var(--text-color);
    padding: 15px;
    border-left: none;
    border-bottom: 4px solid transparent; /* Indicador passa para baixo */
  }

  .nav-icon span {
    display: none; /* Esconde texto no mobile para economizar espaço */
  }

  .nav-icon.active {
    background-color: transparent;
    border-bottom-color: var(--icon-active);
  }
}
</style>