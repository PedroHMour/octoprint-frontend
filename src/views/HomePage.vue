<template>
  <section class="page">
    <div class="main-header">
      <h3>Visão Geral</h3>
      <div class="status-indicator">
        <span class="status-dot" :class="normalizedStatus" :title="printerState.status"></span>
        {{ printerState.status }}
        
        <div class="sensor-badge" :class="{ 'error': !hasFilament, 'ok': hasFilament }" title="Sensor de Filamento">
          <i class="fas" :class="hasFilament ? 'fa-check-circle' : 'fa-exclamation-triangle'"></i>
          <span class="sensor-text">{{ hasFilament ? 'Filamento OK' : 'SEM FILAMENTO' }}</span>
        </div>
      </div>
    </div>
    
    <div class="home-layout">
      <div class="temp-values">
        
        <div class="control-panel">
          
          <div class="control-group">
            <div class="label-row">
              <label><i class="fas fa-thermometer-half"></i> Bico</label>
              <span class="current-val">{{ printerState.nozzle.current?.toFixed(0) }}°C</span>
            </div>
            <div class="input-row">
              <input type="number" v-model.number="targetNozzle" placeholder="0">
              <button class="btn-mini btn-set" @click="applyNozzle">OK</button>
              <button class="btn-mini btn-off" @click="setNozzleTemp(0); targetNozzle=0">OFF</button>
            </div>
          </div>

          <div class="control-group">
            <div class="label-row">
              <label><i class="fas fa-layer-group"></i> Mesa</label>
              <span class="current-val">{{ printerState.bed.current?.toFixed(0) }}°C</span>
            </div>
            <div class="input-row">
              <input type="number" v-model.number="targetBed" placeholder="0">
              <button class="btn-mini btn-set" @click="applyBed">OK</button>
              <button class="btn-mini btn-off" @click="setBedTemp(0); targetBed=0">OFF</button>
            </div>
          </div>

          <div class="control-group">
            <div class="label-row">
              <label><i class="fas fa-fan"></i> Cooler</label>
              <span class="current-val">{{ fanPercent }}%</span>
            </div>
            <input type="range" v-model.number="fanPercent" min="0" max="100" @change="applyFan" class="slider">
          </div>

          <button class="btn-action btn-move" @click="showMoveControls = true" :disabled="!canControlPrinter">
            <i class="fas fa-arrows-alt"></i> Mover & Extrusor
          </button>

        </div>

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

    <div v-if="showMoveControls" class="modal-overlay" @click.self="showMoveControls = false">
      <div class="modal-content move-modal">
        <h3>Controle Manual</h3>
        
        <div class="jog-layout">
          <div class="xy-pad">
            <div class="pad-row">
              <div class="btn-jog spacer"></div>
              <button class="btn-jog" @click="move('Y', 10)"><i class="fas fa-chevron-up"></i> Y+</button>
              <div class="btn-jog spacer"></div>
            </div>
            <div class="pad-row">
              <button class="btn-jog" @click="move('X', -10)"><i class="fas fa-chevron-left"></i> X-</button>
              <button class="btn-jog btn-center" @click="doHomeXY" title="Home XY"><i class="fas fa-home"></i></button>
              <button class="btn-jog" @click="move('X', 10)">X+ <i class="fas fa-chevron-right"></i></button>
            </div>
            <div class="pad-row">
              <div class="btn-jog spacer"></div>
              <button class="btn-jog" @click="move('Y', -10)"><i class="fas fa-chevron-down"></i> Y-</button>
              <div class="btn-jog spacer"></div>
            </div>
          </div>

          <div class="z-e-pad">
            <div class="control-col">
              <label>Eixo Z</label>
              <button class="btn-jog" @click="move('Z', 10)"><i class="fas fa-arrow-up"></i> Subir</button>
              <button class="btn-jog btn-center" @click="doHomeZ">Home Z</button>
              <button class="btn-jog" @click="move('Z', -10)"><i class="fas fa-arrow-down"></i> Descer</button>
            </div>
            <div class="control-col">
              <label>Extrusor</label>
              <button class="btn-jog" @click="extrude(10)"><i class="fas fa-angle-double-down"></i> Extrusão</button>
              <button class="btn-jog btn-retract" @click="extrude(-10)"><i class="fas fa-angle-double-up"></i> Retrair</button>
            </div>
          </div>
        </div>

        <button class="btn-close" @click="showMoveControls = false">Fechar</button>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { printerState } from '../store/printerState';
import { 
  setConnection, controlJob, sendHomeCommand, sendLevelCommand,
  setNozzleTemp, setBedTemp, setFanPercent, moveAxis, extrudeFilament, sendGcode 
} from '../services/api';

// --- Estado Camera ---
const streamUrl = ref('/webcam/?action=stream');
const streamError = ref(false);
function onStreamError() { streamError.value = true; }

// --- Estado dos Novos Controles ---
const showMoveControls = ref(false);
const targetNozzle = ref(0);
const targetBed = ref(0);
const fanPercent = ref(0);

// Sincroniza os inputs com o valor real vindo do backend (se mudar lá, muda aqui)
watch(() => printerState.nozzle.target, (val) => { if(val > 0) targetNozzle.value = val; });
watch(() => printerState.bed.target, (val) => { if(val > 0) targetBed.value = val; });

// --- Computed Helpers ---
const normalizedStatus = computed(() => printerState.status || 'Offline');

const isOffline = computed(() => {
  const s = String(printerState.status || '').toLowerCase();
  return s === 'offline' || s === 'closed' || s === 'error' || s === 'detecting baudrate';
});

const canControlPrinter = computed(() => {
  if (isOffline.value) return false;
  const s = String(printerState.status || '').toLowerCase();
  return s !== 'printing'; 
});

const isPrintingOrPaused = computed(() => {
  const s = String(printerState.status || '').toLowerCase();
  return s === 'printing' || s === 'paused' || s === 'pausing';
});

const hasFilament = computed(() => {
  // Agora usamos a tipagem correta do printerState atualizado
  return (printerState as any).sensor?.filament !== false; 
});

// --- Ações de Conexão ---
const isConnecting = ref(false);
const connectionButtonClass = computed(() => isOffline.value ? 'btn-green' : 'btn-red');

async function toggleConnection() {
  isConnecting.value = true;
  const action = isOffline.value ? 'connect' : 'disconnect';
  try { await setConnection(action); } 
  catch (e) { alert('Erro na conexão: ' + e); }
  finally { setTimeout(() => isConnecting.value = false, 2000); }
}

// --- Ações de Controle (Novas) ---
async function applyNozzle() { await setNozzleTemp(targetNozzle.value); }
async function applyBed() { await setBedTemp(targetBed.value); }
async function applyFan() { await setFanPercent(fanPercent.value); }

async function move(axis: 'X'|'Y'|'Z', dist: number) {
  if(!canControlPrinter.value) return;
  try { await moveAxis(axis, dist); } catch(e: any) { alert(e.message); }
}

async function extrude(amount: number) {
  if(!canControlPrinter.value) return;
  // Proteção simples: checa se o bico está quente (>170)
  if(printerState.nozzle.current < 170) {
    alert("Bico muito frio para extrusão! Aqueça primeiro.");
    return;
  }
  try { await extrudeFilament(amount); } catch(e: any) { alert(e.message); }
}

async function doHomeXY() { await sendGcode('G28 X Y'); }
async function doHomeZ() { await sendGcode('G28 Z'); }

// --- Ações Existentes ---
const isHoming = ref(false);
const isLeveling = ref(false);

async function handleHome() {
  if (!confirm("Fazer Home Geral (G28)?")) return;
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

/* Botões Genéricos */
button { border: none; border-radius: 5px; padding: 12px; cursor: pointer; color: white; font-weight: bold; width: 100%; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
button:disabled { opacity: 0.5; cursor: not-allowed; background-color: #555 !important; }

/* Botões Específicos */
.btn-green { background: #28a745; }
.btn-red { background: #dc3545; }
.btn-action { background: #007bff; }
.btn-pause { background: #ffc107; color: black; }
.btn-cancel { background: #dc3545; }
.btn-move { background: #e67e22; margin-top: 5px; } 

/* Painel de Controles Rápidos (Temp/Fan) */
.control-panel { background: #2c3e50; border: 1px solid #444; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.control-group { display: flex; flex-direction: column; gap: 5px; }
.label-row { display: flex; justify-content: space-between; font-size: 0.9rem; color: #ccc; font-weight: bold; }
.current-val { color: #fff; }

/* --- Correção dos Inputs de Temperatura --- */
.input-row { 
  display: flex; 
  gap: 5px; 
  align-items: stretch;
}
.input-row input { 
  flex: 1; 
  min-width: 0;
  background: #222; 
  border: 1px solid #555; 
  color: white; 
  padding: 8px; 
  border-radius: 4px; 
  text-align: center; 
}
.btn-mini { 
  padding: 0 12px; 
  width: auto !important;
  flex-shrink: 0;
  font-size: 0.8rem;
}

.btn-set { background: #27ae60; }
.btn-off { background: #7f8c8d; }
.slider { width: 100%; cursor: pointer; }

.action-controls-widget, .job-controls-widget { display: flex; gap: 10px; }

/* Status Indicators */
.status-indicator { display: flex; align-items: center; gap: 15px; font-weight: bold; }
.status-dot { width: 12px; height: 12px; border-radius: 50%; background: gray; display: inline-block; margin-right: 5px; }
.status-dot.Offline { background: #dc3545; }
.status-dot.Operacional, .status-dot.Operational { background: #28a745; box-shadow: 0 0 8px #28a745; }
.status-dot.Printing { background: #007bff; animation: blink 1s infinite; }

/* Sensor Badge */
.sensor-badge { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; background: #333; transition: 0.3s; }
.sensor-badge.ok { color: #28a745; border: 1px solid #28a745; background: rgba(40, 167, 69, 0.1); }
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

/* --- Correção do Modal de Movimento (Jog) --- */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 2000; }

.move-modal { 
  background: #34495e; 
  padding: 20px; 
  border-radius: 10px; 
  width: 95%; 
  max-width: 450px; 
  text-align: center; 
  border: 1px solid #7f8c8d;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

.jog-layout { display: flex; flex-direction: column; gap: 20px; margin: 20px 0; }

.xy-pad { 
  display: flex; 
  flex-direction: column; 
  gap: 5px;
  align-items: center; 
  margin-bottom: 20px;
}
.pad-row { display: flex; gap: 5px; }

.z-e-pad { 
  display: grid; 
  grid-template-columns: 1fr 1fr;
  gap: 15px; 
}
.control-col { display: flex; flex-direction: column; gap: 8px; flex: 1; }
.control-col label { color: #ccc; font-size: 0.9rem; font-weight: bold; }

.btn-jog { 
  width: 60px; 
  height: 50px; 
  background: #2c3e50; 
  border: 1px solid #555; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  font-size: 0.85rem; 
  border-radius: 6px; 
  color: #fff;
  padding: 0;
}
.btn-jog:active { background: #3498db; transform: scale(0.95); }

/* Classe Spacer: Invisível mas ocupa espaço */
.spacer {
  visibility: hidden;
  border: none;
  background: transparent;
  pointer-events: none;
}

.btn-center { background: #16a085; }
.btn-retract { background: #c0392b; }
.btn-close { background: #7f8c8d; margin-top: 10px; }

@media (max-width: 900px) { 
  .home-layout { grid-template-columns: 1fr; } 
  .main-header { flex-direction: column; align-items: flex-start; }
  .video-container { order: -1; min-height: 250px; } 
}
</style>