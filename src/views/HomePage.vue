<template>
  <section class="page">
    <div class="main-header">
      <h3>Visão Geral</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="printerState.status"></span>
        {{ printerState.status }}
      </div>
    </div>
    
    <div class="home-layout">
      <div class="temp-values">
        
        <div class="connection-widget">
          <button
            v-if="printerState.status === 'Offline' || printerState.status === 'Operacional'"
            class="btn-connect"
            :class="connectionButtonClass"
            @click="toggleConnection"
            :disabled="isConnecting"
          >
            <span v-if="isConnecting">Aguarde...</span>
            <span v-else-if="printerState.status === 'Offline'">
              <i class="fas fa-plug"></i> Ligar à Impressora
            </span>
            <span v-else>
              <i class="fas fa-power-off"></i> Desligar
            </span>
          </button>
        </div>

        <div class="action-controls-widget">
          <button
            class="btn-action btn-home"
            @click="handleHome"
            :disabled="!isOperacional || isHoming"
          >
            <span v-if="isHoming"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else><i class="fas fa-home"></i> Home</span>
          </button>
          <button
            class="btn-action btn-level"
            @click="handleLevel"
            :disabled="!isOperacional || isLeveling"
          >
            <span v-if="isLeveling"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else><i class="fas fa-ruler-combined"></i> Calibração</span>
          </button>
        </div>

        <div class="job-controls-widget">
          <template v-if="isPrintingOrPaused">
            <button
              class="btn-job btn-pause"
              @click="handlePauseResume"
              :disabled="isJobLoading"
            >
              <span v-if="printerState.status === 'Paused'">
                <i class="fas fa-play"></i> Continuar
              </span>
              <span v-else>
                <i class="fas fa-pause"></i> Pausar
              </span>
            </button>
            <button
              class="btn-job btn-cancel"
              @click="handleCancel"
              :disabled="isJobLoading"
            >
              <i class="fas fa-stop"></i> Cancelar
            </button>
          </template>
        </div>
        
        <div class="progress-widget" v-if="isPrintingOrPaused && printerState.progress.completion !== null">
          <h4>Progresso da Impressão</h4>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill"
              :style="{ width: printerState.progress.completion + '%' }"
            ></div>
          </div>
          <span class="progress-percent">
            {{ printerState.progress.completion?.toFixed(1) }}%
          </span>
          <div class="time-left">
            <i class="fas fa-clock"></i>
            <span>Tempo Restante:</span>
            <strong>{{ formatTime(printerState.progress.printTimeLeft) }}</strong>
          </div>
        </div>

      </div>
      
      <div class="video-container">
        <template v-if="!streamError">
          <img 
            :src="streamUrl" 
            alt="Camera Stream" 
            class="video-feed"
            @error="onStreamError"
          >
        </template>
        <template v-else>
          <div class="stream-error">
            <i class="fas fa-video-slash"></i>
            <span>Stream da câmara indisponível.</span>
            <p>Verifique a ligação da câmara no Pi.</p>
          </div>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { printerState } from '../store/printerState';
import { 
  setConnection, 
  controlJob, 
  sendHomeCommand, 
  sendLevelCommand
} from '../services/api';

// --- Lógica da Câmera ---
const streamUrl = ref('/webcam/?action=stream');
const streamError = ref(false);

function onStreamError() {
  console.error("Falha ao carregar o stream da câmara."); 
  streamError.value = true;
}

// --- Lógica de Conexão ---
const isConnecting = ref(false); 
const connectionButtonClass = computed(() => {
  return printerState.status === 'Offline' ? 'btn-red' : 'btn-green';
});

async function toggleConnection() {
  isConnecting.value = true;
  const action = printerState.status === 'Offline' ? 'connect' : 'disconnect';
  try { await setConnection(action); } 
  catch (error) {
    console.error(`Falha ao tentar ${action}:`, error);
    alert(`Erro ao tentar ${action} a impressora.`);
  } finally {
    setTimeout(() => { isConnecting.value = false; }, 1000);
  }
}

// --- Lógica de Job (Impressão) ---
const isJobLoading = ref(false);
const isPrintingOrPaused = computed(() => {
  return printerState.status === 'Printing' || printerState.status === 'Paused';
});
const isOperacional = computed(() => {
  return printerState.status === 'Operacional';
});

async function handlePauseResume() {
  isJobLoading.value = true;
  const action = printerState.status === 'Paused' ? 'resume' : 'pause';
  try { await controlJob(action); } 
  catch (error) { alert("Erro ao enviar comando de pausa/retoma."); } 
  finally { setTimeout(() => { isJobLoading.value = false; }, 1000); }
}

async function handleCancel() {
  if (!window.confirm("Tem a certeza que quer cancelar esta impressão?")) return;
  isJobLoading.value = true;
  try { await controlJob('cancel'); } 
  catch (error) { alert("Erro ao enviar comando de cancelar."); } 
  finally { setTimeout(() => { isJobLoading.value = false; }, 1000); }
}

// --- Ações de Máquina (Home / Level) ---
const isHoming = ref(false);
const isLeveling = ref(false);

async function handleHome() {
  if (!window.confirm("Fazer 'Home' em todos os eixos (G28)?")) return;
  isHoming.value = true;
  try {
    await sendHomeCommand();
    alert("Comando 'Home' enviado.");
  } catch (error: any) {
    alert(`Erro ao enviar 'Home': ${error.message}`);
  } finally {
    isHoming.value = false;
  }
}

async function handleLevel() {
  if (!window.confirm("Iniciar 'Auto Bed Leveling' (G29)?")) return;
  isLeveling.value = true;
  try {
    await sendLevelCommand();
    alert("Comando 'Calibração' enviado.");
  } catch (error: any) {
    alert(`Erro ao enviar 'Calibração': ${error.message}`);
  } finally {
    isLeveling.value = false;
  }
}

// --- Auxiliar: Formatar Tempo ---
// CORREÇÃO: Aceita 'null' para evitar erro de JS
function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === 0 || seconds === undefined) return 'Calculando...';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
</script>

<style scoped>
/* Estilos omitidos por brevidade */
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
.home-layout { display: grid; grid-template-columns: 250px 1fr; gap: 20px; }
.temp-values { display: flex; flex-direction: column; gap: 15px; }

/* Câmera */
.video-container { flex-grow: 1; height: auto; min-height: 300px; background-color: #000000; border-radius: 8px; border: 1px solid var(--border-color); display: grid; place-items: center; overflow: hidden; }
.video-feed { 
  width: 100%; 
  height: 100%; 
  object-fit: contain; 
}
.stream-error { display: flex; flex-direction: column; align-items: center; gap: 10px; color: #6c757d; }
.stream-error .fas { font-size: 48px; }
.stream-error span { font-size: 18px; font-weight: bold; }
.stream-error p { font-size: 12px; }

@media (max-width: 992px) { .home-layout { grid-template-columns: 1fr; } }

/* Status Dot */
.status-indicator { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: bold; }
.status-dot { width: 12px; height: 12px; border-radius: 50%; background-color: #6c757d; }
.status-dot.Operacional { background-color: var(--color-green); animation: pulse-green 2s infinite; }
.status-dot.Printing { background-color: #007bff; animation: pulse-blue 2s infinite; }
.status-dot.Paused { background-color: var(--color-yellow); animation: pulse-yellow 2s infinite; }

@keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); } 100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); } }
@keyframes pulse-blue { 0% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); } }
@keyframes pulse-yellow { 0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); } }

/* Widgets */
.connection-widget { margin-top: 5px; }
.btn-connect { width: 100%; padding: 12px; font-size: 16px; font-weight: bold; color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s, opacity 0.2s; }
.btn-connect .fas { margin-right: 8px; }
.btn-connect.btn-green { background-color: var(--color-green); }
.btn-connect.btn-green:hover { background-color: #218838; }
.btn-connect.btn-red { background-color: var(--color-red); }
.btn-connect.btn-red:hover { background-color: #c82333; }
.btn-connect:disabled { background-color: #6c757d; opacity: 0.7; cursor: wait; }

.job-controls-widget { display: flex; gap: 10px; }
.btn-job { flex-grow: 1; padding: 12px; font-size: 16px; font-weight: bold; color: #fff; border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
.btn-job .fas { margin-right: 8px; }
.btn-job.btn-pause { background-color: var(--color-yellow); color: #212529; }
.btn-job.btn-pause:hover { background-color: #e0a800; }
.btn-job.btn-cancel { background-color: var(--color-red); }
.btn-job.btn-cancel:hover { background-color: #c82333; }
.btn-job:disabled { background-color: #6c757d; opacity: 0.7; cursor: wait; }

.progress-widget { background-color: var(--widget-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; }
.progress-widget h4 { font-size: 14px; color: #6c757d; font-weight: bold; margin-bottom: 10px; }
.progress-bar-container { width: 100%; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; border: 1px solid #ccc; }
.progress-bar-fill { height: 100%; background-color: var(--icon-active); transition: width 0.5s ease; }
.progress-percent { font-size: 14px; font-weight: bold; display: block; text-align: center; margin-top: 5px; }
.time-left { margin-top: 10px; font-size: 14px; color: #495057; display: flex; align-items: center; gap: 8px; }
.time-left strong { font-size: 16px; color: var(--text-color); }

.action-controls-widget { display: flex; gap: 10px; }
.btn-action { flex-grow: 1; padding: 12px; font-size: 16px; font-weight: bold; color: #fff; background-color: var(--icon-active); border: none; border-radius: 8px; cursor: pointer; transition: background-color 0.2s; }
.btn-action .fas { margin-right: 8px; }
.btn-action:hover { background-color: #0056b3; }
.btn-action:disabled { background-color: #6c757d; opacity: 0.7; cursor: not-allowed; }
</style>