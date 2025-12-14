<template>
  <section class="page-container">
    <div class="header">
      <h2>🎨 Estúdio de Cores</h2>
      
      <div class="header-actions">
        <button class="btn-clear" @click="clearAllConfig" title="Zerar todas as configurações">
          <i class="fas fa-trash-alt"></i> LIMPAR TUDO
        </button>

        <button class="btn-save" @click="requestSave" :disabled="!hasChanges">
          <i class="fas fa-save"></i> SALVAR MAPA
        </button>
      </div>
    </div>

    <div class="studio-layout">
      
      <div class="extruders-area">
        <div class="area-header">
          <h3>Selecione o Extrusor</h3>
          <div class="selection-tools">
            <span class="hint" v-if="selectedIndex === null">Clique em um quadrado para editar</span>
            <button v-else class="btn-text" @click="deselectAll">Cancelar Seleção</button>
          </div>
        </div>

        <div class="extruders-grid">
          <div 
            v-for="(ext, index) in extruders" 
            :key="index"
            class="extruder-card"
            :class="{ 'is-selected': selectedIndex === index, 'has-color': ext.isConfigured }"
            @click="selectExtruder(index)"
            :style="{ backgroundColor: ext.isConfigured ? getCssColor(ext) : '' }"
          >
            <div class="card-content">
              <span class="tool-number">{{ index + 1 }}</span>
              
              <div class="mini-values" v-if="ext.isConfigured">
                A{{ext.a}} B{{ext.b}} C{{ext.c}}
              </div>
              
              <div class="selection-ring" v-if="selectedIndex === index">
                <i class="fas fa-pen"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-column">
        
        <div class="controls-area" :class="{ 'active': selectedIndex !== null }">
          
          <div class="controls-content" v-if="selectedIndex !== null">
            <div class="controls-header">
              <h3>Editando: <span class="highlight">{{ getSelectionText() }}</span></h3>
            </div>

            <div class="section-label">Cores Rápidas</div>
            <div class="presets-grid">
              <div 
                v-for="(p, i) in presets" :key="i"
                class="preset-item"
                :style="{ background: p.hex }"
                :title="p.name"
                @click="applyPreset(p)"
              >
                </div>
            </div>
            
            <div class="color-name-display" v-if="currentMix.name">
              Cor: <strong>{{ currentMix.name }}</strong>
            </div>

            <hr class="separator">

            <div class="section-label">Mistura Manual (0-100%)</div>
            <div class="sliders-wrapper">
              <div class="slider-row">
                <label style="color: #00BFFF">Azul (A)</label>
                <input type="range" v-model.number="currentMix.a" min="0" max="100" @input="updateManual">
                <input type="number" v-model.number="currentMix.a" min="0" max="100" class="input-val" @input="updateManual">
              </div>
              <div class="slider-row">
                <label style="color: #FF00FF">Vermelho (B)</label>
                <input type="range" v-model.number="currentMix.b" min="0" max="100" @input="updateManual">
                <input type="number" v-model.number="currentMix.b" min="0" max="100" class="input-val" @input="updateManual">
              </div>
              <div class="slider-row">
                <label style="color: #FFD700">Amarelo (C)</label>
                <input type="range" v-model.number="currentMix.c" min="0" max="100" @input="updateManual">
                <input type="number" v-model.number="currentMix.c" min="0" max="100" class="input-val" @input="updateManual">
              </div>
            </div>

            <div class="preview-bar">
              <div class="color-sample" :style="{ background: previewColor }"></div>
              <span>Pré-visualização (Aproximada)</span>
            </div>

          </div>

          <div class="empty-state" v-else>
            <div class="empty-icon"><i class="fas fa-mouse-pointer"></i></div>
            <p>Selecione um extrusor ao lado para definir sua cor.</p>
          </div>

        </div>

        <div class="panel led-panel">
          <div class="led-header">💡 Iluminação LED</div>
          <div class="led-controls">
            <input type="range" v-model.number="ledR" min="0" max="255" class="range-red">
            <input type="range" v-model.number="ledU" min="0" max="255" class="range-green">
            <input type="range" v-model.number="ledB" min="0" max="255" class="range-blue">
            <button class="btn-led" @click="sendLed">OK</button>
          </div>
          <div class="led-preview" :style="{ backgroundColor: `rgb(${ledR}, ${ledU}, ${ledB})` }"></div>
        </div>

      </div>

    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>Salvar Mapa de Cores?</h3>
        <p>Isso definirá as cores de todos os extrusores configurados.</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Cancelar</button>
          <button class="btn-confirm" @click="executeSave">
            <i class="fas fa-check"></i> CONFIRMAR
          </button>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { sendGcode } from '../services/api';

// --- Tipos ---
interface ExtruderData {
  a: number; b: number; c: number;
  isConfigured: boolean; colorName: string;
  hex?: string; // Opcional, para manter a cor visual correta no card
}
interface Preset {
  name: string; hex: string; a: number; b: number; c: number;
}

// --- Estado ---
const extruders = reactive<ExtruderData[]>([]);
const selectedIndex = ref<number | null>(null);
const hasChanges = ref(false);
const showModal = ref(false);
const currentMix = reactive({ a: 0, b: 0, c: 0, name: '', hex: '' });

// LED
const ledR = ref(255);
const ledU = ref(255);
const ledB = ref(255);

// --- 19 CORES DEFINIDAS (Visual HEX correto + Comando M182 correto) ---
const presets: Preset[] = [
  { name: 'Amarelo Puro', hex: '#FFD700', a: 0, b: 0, c: 100 },
  { name: 'Azul Puro', hex: '#0000FF', a: 100, b: 0, c: 0 },
  { name: 'Vermelho Puro', hex: '#FF0000', a: 0, b: 100, c: 0 },
  { name: 'Azul Marinho', hex: '#000080', a: 80, b: 0, c: 20 },
  { name: 'Azul Oceano', hex: '#0077BE', a: 90, b: 0, c: 10 },
  { name: 'Verde Fiô', hex: '#6B8E23', a: 40, b: 0, c: 60 },
  { name: 'Verde Vida', hex: '#7CFC00', a: 15, b: 0, c: 85 },
  { name: 'Verde Acinzentado', hex: '#8FBC8F', a: 20, b: 10, c: 70 },
  { name: 'Alaranjado Extremo', hex: '#FF4500', a: 0, b: 40, c: 60 },
  { name: 'Laranjada Forte', hex: '#FFA500', a: 0, b: 25, c: 75 },
  { name: 'Alaranjado Fraco', hex: '#F4A460', a: 10, b: 80, c: 10 },
  { name: 'Vinho', hex: '#800000', a: 50, b: 50, c: 0 },
  { name: 'Lilás Escuro', hex: '#9400D3', a: 70, b: 20, c: 10 },
  { name: 'Marrom', hex: '#8B4513', a: 33, b: 33, c: 34 },
  { name: 'Vermelho Fraco', hex: '#CD5C5C', a: 85, b: 0, c: 15 },
  { name: 'Verde', hex: '#008000', a: 20, b: 0, c: 80 },
  { name: 'Verde Escuro', hex: '#006400', a: 70, b: 10, c: 20 },
  { name: 'Vinho Escuro', hex: '#5E2129', a: 33, b: 33, c: 34 },
  { name: 'Violeta', hex: '#EE82EE', a: 20, b: 10, c: 70 }
];

// --- Preview Computado (Para ajustes manuais) ---
// Nota: Usamos matemática simples aqui apenas para feedback do slider
const previewColor = computed(() => {
  if (currentMix.hex) return currentMix.hex; // Se tem hex definido (preset), usa ele
  
  // Se é manual, tenta aproximar
  const max = Math.max(currentMix.a + currentMix.b + currentMix.c, 100); 
  const r = Math.round(255 * (1 - currentMix.a / max));
  const g = Math.round(255 * (1 - currentMix.b / max));
  const b = Math.round(255 * (1 - currentMix.c / max));
  return `rgb(${r}, ${g}, ${b})`;
});

// --- Inicialização ---
onMounted(() => {
  for (let i = 0; i < 19; i++) {
    const saved = localStorage.getItem(`extruder_data_${i}`);
    if (saved) {
      extruders.push(JSON.parse(saved));
    } else {
      extruders.push({ a: 0, b: 0, c: 0, isConfigured: false, colorName: '', hex: '' });
    }
  }
});

// --- Lógica de Seleção ---
function selectExtruder(index: number) {
  if (selectedIndex.value === index) {
    selectedIndex.value = null;
    return;
  }
  selectedIndex.value = index;
  
  const target = extruders[index];
  if (target) {
    if (target.isConfigured) {
      currentMix.a = target.a;
      currentMix.b = target.b;
      currentMix.c = target.c;
      currentMix.name = target.colorName;
      currentMix.hex = target.hex || '';
    } else {
      resetCurrentMix();
    }
  }
}

function deselectAll() { selectedIndex.value = null; }

function resetCurrentMix() {
  currentMix.a = 0; currentMix.b = 0; currentMix.c = 0;
  currentMix.name = ''; currentMix.hex = '';
}

function getSelectionText() {
  if (selectedIndex.value !== null) return `Extrusor ${selectedIndex.value + 1}`;
  return '';
}

// --- Limpar Tudo ---
function clearAllConfig() {
  if (!confirm("Isso apagará todas as configurações de cor. Confirmar?")) return;
  
  extruders.forEach((ext, i) => {
    ext.a = 0; ext.b = 0; ext.c = 0;
    ext.isConfigured = false;
    ext.colorName = ''; ext.hex = '';
    localStorage.removeItem(`extruder_data_${i}`);
    localStorage.removeItem(`extruder_mix_${i}`);
  });
  
  deselectAll();
  hasChanges.value = false;
}

// --- Aplicação de Cores ---
function applyPreset(p: Preset) {
  if (selectedIndex.value === null) return;
  
  currentMix.a = p.a;
  currentMix.b = p.b;
  currentMix.c = p.c;
  currentMix.name = p.name;
  currentMix.hex = p.hex; // Usa a cor visual correta
  
  updateRealTime();
}

function updateManual() {
  currentMix.name = 'Personalizado';
  currentMix.hex = ''; // Remove hex fixo para usar cálculo dinâmico
  updateRealTime();
}

function updateRealTime() {
  if (selectedIndex.value !== null) {
    const idx = selectedIndex.value;
    const ext = extruders[idx];
    
    if (ext) {
      ext.a = currentMix.a;
      ext.b = currentMix.b;
      ext.c = currentMix.c;
      ext.colorName = currentMix.name;
      ext.hex = currentMix.hex; // Salva o hex visual também
      ext.isConfigured = true;
      hasChanges.value = true;
    }
  }
}

// --- Cor do Quadrado do Extrusor ---
function getCssColor(ext: { a: number, b: number, c: number, hex?: string }) {
  // Se tem hex definido (veio de preset), usa ele que é a cor real
  if (ext.hex && ext.hex !== '') return ext.hex;
  
  // Se é manual, usa o cálculo aproximado
  const max = Math.max(ext.a + ext.b + ext.c, 100);
  const r = Math.round(255 * (1 - ext.a / max));
  const g = Math.round(255 * (1 - ext.b / max));
  const b = Math.round(255 * (1 - ext.c / max));
  return `rgb(${r}, ${g}, ${b})`;
}

// --- Salvar ---
function requestSave() {
  if (!hasChanges.value) return;
  showModal.value = true;
}

function executeSave() {
  showModal.value = false;
  
  extruders.forEach((ext, i) => {
    if (ext) {
      // Salva dados visuais
      localStorage.setItem(`extruder_data_${i}`, JSON.stringify(ext));
      
      // Salva comando G-Code
      if (ext.isConfigured) {
        const gcode = `M182 A${ext.a} B${ext.b} C${ext.c}`;
        localStorage.setItem(`extruder_mix_${i}`, gcode);
      } else {
        localStorage.removeItem(`extruder_mix_${i}`);
      }
    }
  });

  alert("✅ Mapa salvo! As cores serão aplicadas na próxima impressão.");
  hasChanges.value = false;
  deselectAll();
}

// --- LED ---
async function sendLed() {
  try { await sendGcode(`M150 R${ledR.value} U${ledU.value} B${ledB.value} P255`); }
  catch(e) { console.error(e); }
}
</script>

<style scoped>
.page-container { padding: 20px; color: #fff; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #444; flex-shrink: 0; }
.header-actions { display: flex; gap: 10px; }

/* Botões de Ação */
.btn-clear { background: #c0392b; color: white; border: none; padding: 12px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
.btn-clear:hover { background: #e74c3c; }

.btn-save { background: #27ae60; color: white; border: none; padding: 12px 25px; border-radius: 6px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 1rem; }
.btn-save:disabled { background: #444; color: #888; cursor: not-allowed; }

.studio-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; flex-grow: 1; overflow: hidden; }
.right-column { display: flex; flex-direction: column; gap: 15px; overflow: hidden; }

/* Esquerda (Grid) */
.extruders-area { display: flex; flex-direction: column; background: #2c3e50; border-radius: 12px; border: 1px solid #444; overflow: hidden; }
.area-header { padding: 15px; background: #232d36; border-bottom: 1px solid #444; display: flex; justify-content: space-between; align-items: center; }
.btn-text { background: none; border: none; color: #aaa; cursor: pointer; text-decoration: underline; }
.hint { color: #888; font-style: italic; font-size: 0.9rem; }

.extruders-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 12px; padding: 20px; overflow-y: auto; }

.extruder-card { aspect-ratio: 1; background: #34495e; border-radius: 8px; border: 3px solid #444; cursor: pointer; position: relative; display: flex; align-items: center; justify-content: center; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.2); }
.extruder-card:hover { transform: translateY(-3px); border-color: #777; }
.extruder-card.is-selected { border-color: #fff; box-shadow: 0 0 15px rgba(255,255,255,0.4); z-index: 10; }

.card-content { text-align: center; z-index: 2; text-shadow: 0 1px 4px rgba(0,0,0,0.8); width: 100%; }
.tool-number { font-size: 1.8rem; font-weight: bold; display: block; }
.mini-values { font-size: 0.7rem; font-family: monospace; display: flex; justify-content: center; gap: 3px; margin-top: 5px; opacity: 0.9; }
.selection-ring { position: absolute; top: 5px; right: 5px; background: #27ae60; color: white; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 2px solid white; }

/* Direita (Controles) */
.controls-area { flex: 2; background: #2c3e50; border-radius: 12px; border: 1px solid #444; display: flex; flex-direction: column; transition: opacity 0.3s; min-height: 350px; }
.controls-area:not(.active) { opacity: 0.5; pointer-events: none; filter: grayscale(0.8); }
.controls-header { padding: 15px; background: #232d36; border-bottom: 1px solid #444; text-align: center; }
.highlight { color: #FFD700; font-weight: bold; }
.controls-content { padding: 15px; overflow-y: auto; flex-grow: 1; }
.section-label { text-transform: uppercase; font-size: 0.85rem; color: #aaa; margin-bottom: 10px; font-weight: bold; }

.presets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(35px, 1fr)); gap: 10px; margin-bottom: 15px; }
.preset-item { width: 35px; height: 35px; border-radius: 50%; cursor: pointer; border: 2px solid rgba(255,255,255,0.2); transition: transform 0.2s; }
.preset-item:hover { transform: scale(1.1); border-color: #fff; }

.color-name-display { text-align: center; font-size: 0.9rem; margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px; }

.sliders-wrapper { display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px; }
.slider-row { display: flex; align-items: center; gap: 10px; }
.slider-row label { width: 90px; font-weight: bold; font-size: 0.9rem; }
.slider-row input[type=range] { flex-grow: 1; cursor: pointer; }
.input-val { width: 50px; background: #222; border: 1px solid #555; color: white; padding: 5px; border-radius: 4px; text-align: center; }

.preview-bar { display: flex; align-items: center; gap: 10px; justify-content: center; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; }
.color-sample { width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; text-align: center; padding: 20px; }
.empty-icon { font-size: 3rem; margin-bottom: 15px; opacity: 0.5; }

/* LED */
.panel { background: #222; border: 1px solid #444; border-radius: 12px; padding: 15px; }
.led-header { margin: 0 0 10px 0; color: #aaa; font-size: 0.9rem; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #444; padding-bottom: 5px; }
.led-controls { display: flex; gap: 10px; margin-bottom: 10px; }
.led-preview { height: 15px; border-radius: 4px; border: 1px solid #555; }
.btn-led { padding: 5px 10px; background: #8e44ad; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }

/* Modal */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: #2c3e50; padding: 30px; border-radius: 12px; border: 1px solid #FFD700; width: 400px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
.modal-actions { display: flex; gap: 10px; margin-top: 25px; }
.btn-cancel { flex: 1; padding: 12px; background: transparent; border: 1px solid #aaa; color: #ccc; border-radius: 6px; cursor: pointer; }
.btn-confirm { flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }

@media (max-width: 900px) {
  .studio-layout { grid-template-columns: 1fr; }
  .page-container { height: auto; overflow: auto; }
  .extruders-area { height: 400px; }
}
</style>