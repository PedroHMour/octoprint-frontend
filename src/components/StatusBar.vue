<template>
  <aside class="status-bar">
    <div class="logo-container">
      <img src="/logo.png" alt="Logo" class="logo-image">
    </div>

    <div class="status-widget">
      <label>Temperatura Bico</label>
      <div class="temp-display">
        <i class="fas fa-thermometer-half temp-icon hot"></i>
        <span>
          {{ printerState.nozzle.current?.toFixed(1) ?? '0.0' }}°C 
          <small>/ {{ printerState.nozzle.target ?? '0' }}°C</small>
        </span>
      </div>
    </div>
    
    <div class="status-widget">
      <label>Temperatura Mesa</label>
      <div class="temp-display">
        <i class="fas fa-layer-group temp-icon"></i>
        <span>
          {{ printerState.bed.current?.toFixed(1) ?? '0.0' }}°C 
          <small>/ {{ printerState.bed.target ?? '0' }}°C</small>
        </span>
      </div>
    </div>

    <div class="status-controls">
      <div 
        class="control-icon"
        :class="{ 'active': printerState.isLightOn }"
        @click="toggleLight"
        title="Luz"
      >
        <i class="fas fa-lightbulb"></i>
      </div>
      
      <div 
        class="control-icon"
        :class="{ 'spinning': printerState.status === 'Printing' }"
        title="Status Ventoinha"
      >
        <i class="fas fa-fan"></i>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { printerState } from '../store/printerState';
  import { setLight } from '../services/api';

  async function toggleLight() {
    // Inverte o estado atual localmente para feedback instantâneo
    const newState = !printerState.isLightOn;
    printerState.isLightOn = newState; 
    
    try {
      await setLight(newState);
    } catch (error) {
      console.error("Erro ao mudar luz:", error);
      // Reverte se der erro
      printerState.isLightOn = !newState;
    }
  }
</script>

<style scoped>
/* Estilos omitidos por brevidade */
.status-bar {
  background-color: var(--bg-color); /* Fundo igual ao corpo para separar visualmente */
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  height: 100%;
  border-left: 1px solid var(--border-color);
}

.logo-container {
  text-align: center;
  padding-bottom: 20px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.logo-image {
  max-width: 100%;
  height: auto;
  max-height: 60px;
}

.status-widget {
  background-color: var(--main-bg);
  border-radius: 12px;
  padding: 15px;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.status-widget label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
}

.temp-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.temp-display span {
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
}

.temp-display small {
  font-size: 14px;
  color: #6c757d;
  font-weight: normal;
}

.temp-icon {
  font-size: 24px;
  color: #6c757d;
  width: 30px;
  text-align: center;
}
.temp-icon.hot { color: #dc3545; }

.status-controls {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background-color: var(--main-bg);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  margin-top: auto; /* Empurra para o final */
}

.control-icon {
  font-size: 20px;
  color: var(--text-color);
  cursor: pointer;
  width: 45px;
  height: 45px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background-color: var(--widget-bg);
  transition: all 0.2s;
}

.control-icon:hover {
  transform: scale(1.1);
  background-color: #3a3f44;
}

/* Luz Ligada */
.control-icon.active {
  color: #fff;
  background-color: #ffc107; /* Amarelo */
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

/* Ventoinha Girando */
.control-icon.spinning {
  color: var(--icon-active);
}
.control-icon.spinning .fa-fan {
  animation: spin 1s linear infinite;
}

@keyframes spin { 100% { transform: rotate(360deg); } }

/* Responsividade Mobile */
@media (max-width: 900px) {
  .status-bar {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    border-top: 1px solid var(--border-color);
    border-left: none;
    height: auto;
    padding: 10px;
    background-color: var(--main-bg);
  }
  .logo-container { display: none; }
  .status-widget { 
    flex: 1; 
    margin: 5px; 
    padding: 10px;
    min-width: 140px;
  }
  .status-controls {
    display: none; /* Esconde controles extras no mobile para economizar espaço */
  }
}
</style>