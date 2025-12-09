<template>
  <section class="page">
    <div class="main-header">
      <h3>Visão Geral</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="normalizedStatus" :title="printerState.status"></span>
        {{ printerState.status }}
        
        <div class="sensor-badge" :class="{ 'error': !hasFilament, 'ok': hasFilament }" title="Sensor de Filamento">
          <i class="fas fa-life-ring"></i>
          <span class="sensor-text">{{ hasFilament ? 'Filamento OK' : 'SEM FILAMENTO' }}</span>
        </div>
      </div>
    </div>
    
    <div class="home-layout">
      <div class="temp-values">
        
        <div class="connection-widget">
          <button
            class="btn-connect"
            :class="connectionButtonClass"
            @click="toggleConnection"
            :disabled="isConnecting"
          >
            <span v-if="isConnecting">Aguarde...</span>
            <span v-else-if="isOffline">
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
            :disabled="!canControlPrinter || isHoming"
          >
            <span v-if="isHoming"><i class="fas fa-spinner fa-spin"></i></span>
            <span v-else><i class="fas fa-home"></i> Home</span>
          </button>
          
          <button
            class="btn-action btn-level"
            @click="handleLevel"
            :disabled="!canControlPrinter || isLeveling"
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
        
        <div class="progress-widget" v-if="isPrintingOrPaused">
          <h4>Progresso</h4>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill"
              :style="{ width: (printerState.progress.completion || 0) + '%' }"
            ></div>
          </div>
          <span class="progress-percent">
            {{ printerState.progress.completion?.toFixed(1) || 0 }}%
          </span>
          <div class="time-left">
             <i class="fas fa-clock"></i> 
             {{ formatTime(printerState.progress.printTimeLeft) }}
          </div>
        </div>

      </div>
      
      <div class="video-container">
        <template v-if="!streamError">
          <img 
            :src="streamUrl" 
            alt="Camera" 
            class="video-feed"
            @error="onStreamError"
          >
        </template>
        <div v-else class="stream-error">
          <i class="fas fa-video-slash"></i>
          <span>Sem sinal de vídeo</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { printerState } from '../store/printerState';
import { setConnection, controlJob, sendHomeCommand, sendLevelCommand } from '../services/api';

// --- Estado Camera ---
const streamUrl = ref('/webcam/?action=stream');
const streamError = ref(false);
function onStreamError() { streamError.value = true; }

// --- Computed Helpers ---
const normalizedStatus = computed(() => {
  return printerState.status || 'Offline';
});

const isOffline = computed(() => {
  const s = String(printerState.status || '').toLowerCase();
  return s === 'offline' || s === 'closed' || s === 'error' || s === 'detecting baudrate';
});

const canControlPrinter = computed(() => {
  if (isOffline.value) return false;
  const s = String(printerState.status || '').toLowerCase();
  // Bloqueia se estiver imprimindo (exceto se Pausado, onde às vezes queremos mover)
  return s !== 'printing'; 
});

const isPrintingOrPaused = computed(() => {
  const s = String(printerState.status || '').toLowerCase();
  return s === 'printing' || s === 'paused' || s === 'pausing';
});

// Acessa o sensor do printerState (assumindo que o store foi atualizado para receber o JSON do app.py)
// Se o TypeScript reclamar, use (printerState as any).sensor
const hasFilament = computed(() => {
  // Use optional chaining caso o store ainda não tenha o dado
  return (printerState as any).sensor?.filament !== false; 
});

// --- Conexão ---
const isConnecting = ref(false);
const connectionButtonClass = computed(() => isOffline.value ? 'btn-green' : 'btn-red');

async function toggleConnection() {
  isConnecting.value = true;
  const action = isOffline.value ? 'connect' : 'disconnect';
  try { await setConnection(action); } 
  catch (e) { alert('Erro na conexão: ' + e); }
  finally { setTimeout(() => isConnecting.value = false, 2000); }
}

// --- Home & Level ---
const isHoming = ref(false);
const isLeveling = ref(false);

async function handleHome() {
  if (!confirm("Fazer Home (G28)?")) return;
  isHoming.value = true;
  try { await sendHomeCommand(); } catch(e) { alert(e); }
  finally { isHoming.value = false; }
}

async function handleLevel() {
  if (!confirm("Nivelar Mesa (G29)?")) return;
  isLeveling.value = true;
  try { await sendLevelCommand(); } catch(e) { alert(e); }
  finally { isLeveling.value = false; }
}

// --- Jobs ---
const isJobLoading = ref(false);
async function handlePauseResume() {
  const action = printerState.status === 'Paused' ? 'resume' : 'pause';
  doJobAction(action);
}
async function handleCancel() {
  if (confirm("Cancelar impressão?")) doJobAction('cancel');
}
async function doJobAction(action: 'pause'|'resume'|'cancel') {
  isJobLoading.value = true;
  try { await controlJob(action); } catch(e) { alert(e); }
  finally { setTimeout(() => isJobLoading.value = false, 1000); }
}

function formatTime(s: number | null) {
  if (!s) return '--:--';
  const m = Math.floor(s / 60);
  return `${m} min`;
}
</script>

<style scoped>
.page { padding: 10px; }
.main-header { display: flex; justify-content: space-between; border-bottom: 1px solid #444; margin-bottom: 15px; padding-bottom: 10px; flex-wrap: wrap; gap: 10px; }
.home-layout { display: grid; grid-template-columns: 280px 1fr; gap: 20px; }
.temp-values { display: flex; flex-direction: column; gap: 10px; }

/* Botões */
button { border: none; border-radius: 5px; padding: 12px; cursor: pointer; color: white; font-weight: bold; width: 100%; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
button:disabled { opacity: 0.5; cursor: not-allowed; background-color: #555 !important; }

.btn-green { background: #28a745; }
.btn-red { background: #dc3545; }
.btn-action { background: #007bff; }
.btn-pause { background: #ffc107; color: black; }
.btn-cancel { background: #dc3545; }

.action-controls-widget, .job-controls-widget { display: flex; gap: 10px; }

/* Status Indicators */
.status-indicator { display: flex; align-items: center; gap: 15px; font-weight: bold; }
.status-dot { width: 12px; height: 12px; border-radius: 50%; background: gray; display: inline-block; margin-right: 5px; }
.status-dot.Offline { background: #dc3545; }
.status-dot.Operacional, .status-dot.Operational { background: #28a745; box-shadow: 0 0 8px #28a745; }
.status-dot.Printing { background: #007bff; animation: blink 1s infinite; }

.sensor-badge { 
  display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; 
  background: #333; transition: 0.3s;
}
.sensor-badge.ok { color: #28a745; border: 1px solid #28a745; }
.sensor-badge.error { color: #fff; background: #dc3545; animation: blink 1s infinite; }

@keyframes blink { 50% { opacity: 0.5; } }

/* Progresso */
.progress-widget { background: #333; padding: 15px; border-radius: 8px; color: white; }
.progress-bar-container { background: #555; height: 10px; border-radius: 5px; overflow: hidden; margin: 10px 0; }
.progress-bar-fill { background: #007bff; height: 100%; }

/* Video */
.video-container { background: black; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; min-height: 300px; border: 1px solid #444; }
.video-feed { width: 100%; height: 100%; object-fit: contain; }
.stream-error { color: #777; display: flex; flex-direction: column; align-items: center; }

@media (max-width: 900px) { 
  .home-layout { grid-template-columns: 1fr; } 
  .main-header { flex-direction: column; align-items: flex-start; }
}
</style>