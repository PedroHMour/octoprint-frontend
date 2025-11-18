<template>
  <aside class="status-bar">
    <div class="logo-container">
      <img src="/logo.png" alt="Logo Impressora" class="logo-image">
    </div>

    <div class="status-widget">
      <label>Temperatura Bico</label>
      <span>
        {{ printerState.nozzle.current.toFixed(1) }}°C / 
        {{ printerState.nozzle.target }}°C
      </span>
    </div>
    
    <div class="status-widget">
      <label>Temperatura Mesa</label>
      <span>
        {{ printerState.bed.current.toFixed(1) }}°C / 
        {{ printerState.bed.target }}°C
      </span>
    </div>

    <div class="status-controls">
      <div 
        class="control-icon"
        :class="{ 'active': printerState.isLightOn }"
        @click="toggleLight"
      >
        <i class="fas fa-lightbulb"></i>
      </div>
      
      <div 
        class="control-icon"
        :class="{ 'spinning': printerState.status === 'Printing' }"
      >
        <i class="fas fa-fan"></i>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
  // Importa o state e a nova função da API
  import { printerState } from '../store/printerState';
  import { setLight } from '../services/api';

  async function toggleLight() {
    // Define o novo estado como o oposto do estado atual
    const newState = !printerState.isLightOn;
    
    try {
      // Envia o comando para o backend
      await setLight(newState);
      // Se o backend confirmar, atualiza o nosso estado local
      printerState.isLightOn = newState;
    } catch (error) {
      console.error("Falha ao ligar/desligar a luz:", error);
      alert("Não foi possível comunicar com a luz da impressora.");
    }
  }
</script>

<style scoped>
.status-bar {
  background-color: var(--bg-color);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.logo-container {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  padding-bottom: 10px;
}

.logo-image {
  max-width: 100%;
  height: auto;
  max-height: 90px;
}

.status-widget {
  background-color: var(--main-bg);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid var(--border-color);
}

.status-widget label {
  font-size: 14px;
  color: #6c757d;
  display: block;
  margin-bottom: 5px;
}

.status-widget span {
  font-size: 19px;
  font-weight: bold;
}

.status-controls {
  display: flex;
  justify-content: space-around;
  padding: 10px;
  margin-top: auto; /* Empurra para o fundo da coluna */
}

.control-icon {
  font-size: 24px;
  color: var(--text-color);
  cursor: pointer;
  padding: 10px;
  width: 50px;
  height: 50px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  transition: background-color 0.2s, color 0.2s;
}

.control-icon:hover {
  background-color: var(--widget-bg);
}

/* --- ESTILOS ADICIONADOS --- */

/* Estilo para a luz "ligada" */
.control-icon.active {
  color: #f0e68c; /* Amarelo-claro (Khaki) */
  background-color: #495057;
}

/* Estilo para a ventoinha "a girar" */
.control-icon.spinning .fa-fan {
  animation: spin 2s linear infinite;
}

/* Animação de rotação */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .status-bar {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    border-top: 1px solid var(--border-color);
  }
  .status-controls {
    margin-top: 0;
  }
  .logo-container {
    display: none;
  }
}
</style>