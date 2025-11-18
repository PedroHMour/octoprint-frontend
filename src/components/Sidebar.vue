<template>
  <nav class="sidebar">
    
    <router-link to="/" class="nav-icon">
      <i class="fas fa-home"></i> 
      <span>Home</span>
    </router-link>
    
    <router-link to="/files" class="nav-icon">
      <i class="fas fa-folder"></i> 
      <span>Files</span>
    </router-link>
    
    <router-link to="/adjust" class="nav-icon">
      <i class="fas fa-sliders-h"></i> 
      <span>Ajustes</span>
    </router-link>

    <router-link to="/settings" class="nav-icon">
      <i class="fas fa-cog"></i> 
      <span>Settings</span>
    </router-link>
    
  </nav>
</template>

<script setup lang="ts">
  // O Vue Router trata da classe 'active' por nós.
</script>

<style scoped>
.sidebar {
  background-color: var(--sidebar-bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}

.nav-icon {
  color: var(--icon-color);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 10px;
  width: 100%;
  font-size: 12px;
  transition: background-color 0.2s, color 0.2s;
}

.nav-icon i {
  font-size: 24px;
  margin-bottom: 5px;
}

.nav-icon:hover {
  background-color: #495057;
}

/* O Vue Router adiciona esta classe automaticamente */
.nav-icon.active {
  color: var(--icon-active);
  background-color: #2a2f34;
}

/* Em ecrãs pequenos (mobile) */
@media (max-width: 768px) {
  .nav-icon span {
    display: none;
  }
  .sidebar {
    padding-top: 0;
    flex-direction: row;
    justify-content: space-around;
    border-top: 1px solid var(--border-color);
    background-color: var(--main-bg);
  }
  .nav-icon {
    color: var(--text-color);
  }
  .nav-icon.active {
    color: var(--icon-active);
    background-color: transparent;
  }
}
</style>