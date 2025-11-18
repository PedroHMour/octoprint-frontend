<template>
  <section class="page">
    
    <div class="main-header">
      <h3>Definições</h3>
    </div>

    <div class="settings-container">

      <div class="settings-card">
        <h4>Ajustes da Impressão (Em Tempo Real)</h4>
        
        <div class="adjust-control">
          <label for="feedRate">Velocidade (Feed Rate)</label>
          <div class="control-inputs">
            <input type="range" id="feedRate" min="50" max="200" v-model.number="feedRate">
            <input type="number" min="50" max="200" v-model.number="feedRate">
            <span>%</span>
          </div>
        </div>

        <div class="adjust-control">
          <label for="flowRate">Fluxo (Flow Rate)</label>
          <div class="control-inputs">
            <input type="range" id="flowRate" min="80" max="120" v-model.number="flowRate">
            <input type="number" min="80" max="120" v-model.number="flowRate">
            <span>%</span>
          </div>
        </div>

        <div class="adjust-control">
          <label for="fanSpeed">Ventoinha da Peça</label>
          <div class="control-inputs">
            <input type="range" id="fanSpeed" min="0" max="100" v-model.number="fanSpeed">
            <input type="number" min="0" max="100" v-model.number="fanSpeed">
            <span>%</span>
          </div>
        </div>
        
        <button class="apply-button" @click="aplicarAjustes" :disabled="isAdjustLoading">
          <span v-if="isAdjustLoading">A aplicar...</span>
          <span v-else>Aplicar Ajustes</span>
        </button>
      </div>

      <div class="settings-card">
        <h4>Geral</h4>
        <div class="setting-item">
          <label for="printerName">Nome da Impressora</label>
          <input type="text" id="printerName" v-model="printerName">
        </div>
      </div>

      <div class="settings-card">
        <h4>Funcionalidades</h4>
        <div class="setting-item toggle">
          <label for="autoLight">Ligar luzes ao imprimir</label>
          <label class="switch">
            <input type="checkbox" id="autoLight" v-model="autoLightOnPrint">
            <span class="slider round"></span>
          </label>
        </div>
        <div class="setting-item toggle">
          <label for="autoFan">Ligar ventoinha ao imprimir</label>
          <label class="switch">
            <input type="checkbox" id="autoFan" v-model="autoFanOnPrint" disabled>
            <span class="slider round"></span>
          </label>
        </div>
      </div>

      <div class="settings-card">
        <h4>Conexão (Debug)</h4>
        <div class="setting-item">
          <label>Porta Serial</label>
          <input type="text" value="/dev/ttyACM0" readonly>
        </div>
        <div class="setting-item">
          <label>Baudrate</label>
          <input type="text" value="115200" readonly>
        </div>
      </div>

      <div class="settings-card">
        <h4>Sistema</h4>
        <div class="setting-item actions">
          <button class="btn btn-warning">Reiniciar Servidor</button>
          <button class="btn btn-danger">Desligar Raspberry Pi</button>
        </div>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
// Importar as APIs que vamos usar
import { 
  setFeedRate,
  setFlowRate,
  setFanSpeed
} from '../services/api'; 

// --- LÓGICA DOS AJUSTES (MOVIDA PARA AQUI) ---
const feedRate = ref(100);
const flowRate = ref(100);
const fanSpeed = ref(100);
const isAdjustLoading = ref(false);

async function aplicarAjustes() {
  isAdjustLoading.value = true;
  console.log('Aplicando Ajustes:', {
    feed: feedRate.value,
    flow: flowRate.value,
    fan: fanSpeed.value
  });
  
  try {
    // Envia os comandos para o backend, um de cada vez
    await Promise.all([
      setFeedRate(feedRate.value),
      setFlowRate(flowRate.value),
      setFanSpeed(fanSpeed.value)
    ]);
    
    alert('Ajustes aplicados com sucesso!');

  } catch (error) {
    console.error("Erro ao aplicar ajustes:", error);
    alert("Erro ao aplicar um ou mais ajustes.");
  } finally {
    isAdjustLoading.value = false;
  }
}

// --- Lógica das Definições (Existente) ---
const printerName = ref('Chromatech v1.0');
const autoLightOnPrint = ref(true);
const autoFanOnPrint = ref(true);

</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background-color: var(--main-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
}

.settings-card h4 {
  font-size: 18px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 10px;
}

/* --- Estilos dos Itens de Definição (Existentes) --- */
.setting-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}
.setting-item label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #6c757d; /* Cinza fixo, fica bem em ambos os temas */
}
.setting-item input[type="text"] {
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--widget-bg); /* Fundo de widget */
  color: var(--text-color); /* Cor do texto do tema */
}
.setting-item input[readonly] {
  cursor: not-allowed;
}
.setting-item.actions {
  flex-direction: row;
  gap: 10px;
}
.btn {
  padding: 10px 15px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: #fff;
}
.btn-warning { background-color: var(--color-yellow); color: #212529; }
.btn-danger { background-color: var(--color-red); }


/* --- ESTILOS MOVIDOS DO 'AdjustPage' --- */
.adjust-control label {
  font-weight: bold;
  margin-bottom: 8px;
  color: #6c757d;
}
.control-inputs {
  display: flex;
  align-items: center;
  gap: 15px;
}
.control-inputs input[type="range"] {
  flex-grow: 1;
  cursor: pointer;
  height: 8px;
  border-radius: 4px;
  accent-color: var(--icon-active); /* Usa a cor de acento principal */
}
.control-inputs input[type="number"] {
  width: 70px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: var(--widget-bg);
  color: var(--text-color);
  font-size: 16px;
  text-align: center;
}
.control-inputs span {
  font-weight: bold;
}
.apply-button {
  width: 100%;
  padding: 12px 25px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background-color: var(--icon-active);
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 10px;
}
.apply-button:hover {
  background-color: #0056b3;
}
.apply-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}
input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}


/* --- Estilos do Toggle Switch (Existentes) --- */
.setting-item.toggle {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}
.setting-item.toggle label {
  margin-bottom: 0;
}
.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}
.switch input { 
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}
input:checked + .slider {
  background-color: var(--icon-active);
}
input:focus + .slider {
  box-shadow: 0 0 1px var(--icon-active);
}
input:checked + .slider:before {
  transform: translateX(26px);
}
input:disabled + .slider {
  background-color: #e9ecef;
  cursor: not-allowed;
}
.slider.round { border-radius: 34px; }
.slider.round:before { border-radius: 50%; }
</style>