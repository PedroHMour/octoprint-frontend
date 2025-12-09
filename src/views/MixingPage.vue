<template>
  <section class="page-container">
    <div class="header">
      <h2>🎨 Estúdio de Cores & Extrusores</h2>
    </div>

    <div class="content-grid">
      
      <div class="panel extruders-panel">
        <div class="panel-header">
          <h3>1. Selecionar Extrusores</h3>
          <div class="actions">
            <button class="btn-small" @click="selectAll">Todos</button>
            <button class="btn-small outline" @click="clearSelection">Limpar</button>
          </div>
        </div>
        
        <div class="extruders-grid">
          <div 
            v-for="i in 19" 
            :key="i"
            class="extruder-item"
            :class="{ active: selectedTools.includes(i-1) }"
            @click="toggleExtruder(i-1)"
          >
            <div class="icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                 <path fill="currentColor" d="M12,2L8,6V12L6,14V20L8,22H16L18,20V14L16,12V6L12,2M12,22C11.45,22 11,21.55 11,21C11,20.45 11.45,20 12,20C12.55,20 13,20.45 13,21C13,21.55 12.55,22 12,22Z" />
              </svg>
            </div>
            <span>{{ i }}</span>
          </div>
        </div>
        <div class="status-msg">
          {{ selectedTools.length }} extrusores selecionados
        </div>
      </div>

      <div class="panel mixer-panel">
        <h3>2. Configurar Cor (Mistura)</h3>
        
        <div class="balls-grid">
          <div 
            v-for="(ball, index) in mixPresets" 
            :key="index"
            class="mix-ball"
            :style="{ background: ball.bg }"
            @click="loadPreset(ball)"
            :title="`Carregar Mistura ${index + 1}`"
          >
            <span>{{ index + 1 }}</span>
          </div>
        </div>

        <hr class="separator">

        <div class="sliders-container">
          <div class="slider-group">
            <label style="color: #00BFFF">A (Azul): {{ mixA }}%</label>
            <input type="range" v-model.number="mixA" min="0" max="100">
          </div>
          <div class="slider-group">
            <label style="color: #FF00FF">B (Vermelho): {{ mixB }}%</label>
            <input type="range" v-model.number="mixB" min="0" max="100">
          </div>
          <div class="slider-group">
            <label style="color: #FFD700">C (Amarelo): {{ mixC }}%</label>
            <input type="range" v-model.number="mixC" min="0" max="100">
          </div>
        </div>

        <div class="result-container">
          <div class="color-preview" :style="{ backgroundColor: calculatedColor }">
            <span class="preview-text">Cor Atual</span>
          </div>
          
          <div class="total-badge" :class="{ error: totalMix !== 100 }">
            Total: {{ totalMix }}%
          </div>

          <button 
            class="apply-btn" 
            :disabled="totalMix !== 100 || selectedTools.length === 0"
            @click="applyToSelected"
          >
            <i class="fas fa-check-circle"></i> 
            Aplicar em {{ selectedTools.length }} Extrusores
          </button>
        </div>
      </div>

      <div class="panel led-panel">
        <h3>3. Iluminação LED (M150)</h3>
        <p class="hint">R (Vermelho), U (Verde), B (Azul)</p>
        
        <div class="led-controls">
          <div class="slider-group">
            <label style="color: #FF4444">R: {{ ledR }}</label>
            <input type="range" v-model.number="ledR" min="0" max="255">
          </div>
          <div class="slider-group">
            <label style="color: #44FF44">U: {{ ledU }}</label>
            <input type="range" v-model.number="ledU" min="0" max="255">
          </div>
          <div class="slider-group">
            <label style="color: #4444FF">B: {{ ledB }}</label>
            <input type="range" v-model.number="ledB" min="0" max="255">
          </div>
        </div>

        <div class="led-preview" :style="{ backgroundColor: `rgb(${ledR}, ${ledU}, ${ledB})` }"></div>

        <button class="btn-led" @click="sendLed">
          <i class="fas fa-lightbulb"></i> Enviar Cor LED
        </button>
      </div>

    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { sendGcode } from '../services/api';

// --- Estado da Seleção ---
const selectedTools = ref<number[]>([]);

// --- Estado da Mistura ---
const mixA = ref(33);
const mixB = ref(33);
const mixC = ref(34);

// --- Estado do LED ---
const ledR = ref(255);
const ledU = ref(255);
const ledB = ref(255);

// --- Presets (Apenas Valores) ---
const mixPresets = [
  { bg: 'linear-gradient(135deg, #FF0000, #CC0000)', a: 100, b: 0, c: 0 },
  { bg: 'linear-gradient(135deg, #00FF00, #00CC00)', a: 0, b: 100, c: 0 },
  { bg: 'linear-gradient(135deg, #0000FF, #0000CC)', a: 0, b: 0, c: 100 },
  { bg: '#800080', a: 50, b: 0, c: 50 },
  { bg: '#FFA500', a: 0, b: 50, c: 50 },
  { bg: '#00FFFF', a: 50, b: 50, c: 0 },
  { bg: '#555555', a: 33, b: 33, c: 34 }, 
  { bg: '#FFC0CB', a: 80, b: 10, c: 10 },
  { bg: '#FF0000', a: 100, b: 0, c: 0 }, // Repetindo para preencher grid
  { bg: '#00FF00', a: 0, b: 100, c: 0 },
  { bg: '#0000FF', a: 0, b: 0, c: 100 },
  { bg: '#800080', a: 50, b: 0, c: 50 },
  { bg: '#FFA500', a: 0, b: 50, c: 50 },
  { bg: '#00FFFF', a: 50, b: 50, c: 0 },
  { bg: '#555555', a: 33, b: 33, c: 34 }, 
  { bg: '#FFC0CB', a: 80, b: 10, c: 10 },
];

// --- Computed ---
const totalMix = computed(() => mixA.value + mixB.value + mixC.value);

// Conversão visual
const calculatedColor = computed(() => {
  const c = mixA.value / 100;
  const m = mixB.value / 100;
  const y = mixC.value / 100;
  const r = Math.round(255 * (1 - c));
  const g = Math.round(255 * (1 - m));
  const b = Math.round(255 * (1 - y));
  return `rgb(${r}, ${g}, ${b})`;
});

// --- Ações ---
function toggleExtruder(index: number) {
  if (selectedTools.value.includes(index)) {
    selectedTools.value = selectedTools.value.filter(t => t !== index);
  } else {
    selectedTools.value.push(index);
  }
}

function selectAll() {
  selectedTools.value = Array.from({length: 19}, (_, i) => i);
}

function clearSelection() {
  selectedTools.value = [];
}

function loadPreset(preset: any) {
  mixA.value = preset.a;
  mixB.value = preset.b;
  mixC.value = preset.c;
}

async function applyToSelected() {
  if (totalMix.value !== 100) {
    alert("A mistura deve somar 100%!");
    return;
  }
  if (selectedTools.value.length === 0) {
    alert("Selecione pelo menos um extrusor no painel 1.");
    return;
  }

  // Formato para o "Pintor": M163 S0 P.. M163 S1 P.. M163 S2 P.. M164 S0
  const painterConfig = `M163 S0 P${mixA.value}\nM163 S1 P${mixB.value}\nM163 S2 P${mixC.value}\nM164 S0`; 

  for (const tool of selectedTools.value) {
    localStorage.setItem(`extruder_mix_${tool}`, painterConfig);
  }

  alert(`Configuração aplicada a ${selectedTools.value.length} extrusores!`);
  clearSelection();
}

async function sendLed() {
  const cmd = `M150 R${ledR.value} U${ledU.value} B${ledB.value} P255`;
  try {
    await sendGcode(cmd);
  } catch (e) {
    console.error(e);
  }
}
</script>

<style scoped>
/* (O CSS permanece idêntico ao da resposta anterior, mantive o layout limpo) */
.page-container { padding: 20px; color: #fff; padding-bottom: 80px; }
.header { margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px; }

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.panel {
  background: #2c3e50;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #444;
}

.panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #555; padding-bottom: 5px; }
h3 { margin: 0; color: #FFD700; font-size: 1.1rem; }

/* Grid Extrusores */
.extruders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 8px;
}
.extruder-item {
  background: #34495e;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 8px;
  text-align: center;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.extruder-item:hover { background: #445d77; }
.extruder-item.active {
  border-color: #2ecc71;
  background: #27ae60;
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);
}
.status-msg { margin-top: 15px; color: #2ecc71; text-align: center; font-weight: bold; }

.actions .btn-small { padding: 5px 10px; font-size: 0.8rem; background: #3498db; border: none; color: white; border-radius: 4px; cursor: pointer; margin-left: 5px; }
.actions .btn-small.outline { background: transparent; border: 1px solid #aaa; }

/* Bolinhas */
.balls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
  gap: 12px;
}
.mix-ball {
  width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;
  cursor: pointer; transition: transform 0.2s; text-shadow: 0 1px 2px black;
}
.mix-ball:hover { transform: scale(1.1); border-color: white; }
.separator { border: 0; border-top: 1px solid #555; margin: 20px 0; }

/* Sliders */
.slider-group { margin-bottom: 10px; }
.slider-group label { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; font-size: 0.9rem; }
input[type=range] { width: 100%; cursor: pointer; }

/* Resultado */
.result-container { margin-top: 20px; text-align: center; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; }
.color-preview { height: 40px; border-radius: 8px; border: 2px solid white; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; text-shadow: 0 1px 3px black; }
.total-badge { font-weight: bold; color: #2ecc71; margin-bottom: 10px; }
.total-badge.error { color: #e74c3c; }

.apply-btn {
  width: 100%; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
}
.apply-btn:disabled { background: #555; cursor: not-allowed; }

/* LED Panel */
.led-panel .slider-group input[type=range] { margin-bottom: 5px; }
.led-preview { width: 100%; height: 30px; border-radius: 5px; border: 1px solid #fff; margin: 15px 0; }
.btn-led { width: 100%; padding: 10px; background: #8e44ad; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; }
</style>