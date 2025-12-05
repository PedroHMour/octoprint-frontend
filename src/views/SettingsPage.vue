<template>
  <section class="page">
    <div class="main-header">
      <h3>Definições</h3>
    </div>

    <div class="settings-container">

      <div class="settings-card">
        <div class="card-header">
          <h4>Rede Wi-Fi</h4>
          <button class="btn-refresh" @click="handleScan" :disabled="isScanning">
            <i class="fas" :class="isScanning ? 'fa-spinner fa-spin' : 'fa-sync'"></i>
          </button>
        </div>

        <div v-if="wifiList.length === 0 && !isScanning" class="no-wifi">
          <p>Nenhuma rede encontrada.</p>
          <p class="small">Clique em atualizar para buscar.</p>
        </div>

        <div class="wifi-list" v-else>
          <div 
            v-for="net in wifiList" 
            :key="net.ssid" 
            class="wifi-item"
            :class="{ 'selected': selectedSsid === net.ssid }"
            @click="selectNetwork(net)"
          >
            <div class="wifi-info">
              <span class="wifi-ssid">{{ net.ssid }}</span>
              <span class="wifi-meta">
                <i class="fas fa-signal"></i> {{ net.signal }}% 
                <i v-if="net.security" class="fas fa-lock lock-icon"></i>
              </span>
            </div>
          </div>
        </div>

        <div class="wifi-connect-form" v-if="selectedSsid">
          <h5>Conectar a: <strong>{{ selectedSsid }}</strong></h5>
          <input type="password" v-model="wifiPassword" placeholder="Senha da Rede" class="wifi-input">
          <div class="form-actions">
            <button class="btn btn-primary" @click="handleConnect" :disabled="isConnecting">
              {{ isConnecting ? 'Enviando...' : 'Conectar' }}
            </button>
            <button class="btn btn-secondary" @click="selectedSsid = null">Cancelar</button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <h4>Geral</h4>
        <div class="setting-item">
          <label>Nome da Impressora</label>
          <input type="text" v-model="printerName">
        </div>
      </div>
      
      <div class="settings-card">
        <h4>Sistema</h4>
        <div class="setting-item actions">
          <button class="btn btn-danger">Desligar Raspberry Pi</button>
        </div>
      </div>
    </div>

    <div v-if="showDisconnectModal" class="modal-overlay">
      <div class="modal-content">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h3>Configuração Enviada!</h3>
        <p>O Raspberry Pi está se conectando à rede <strong>{{ selectedSsid }}</strong>.</p>
        <div class="alert-box">
          <p>⚠️ <strong>Atenção:</strong> O Hotspot irá desligar agora.</p>
          <hr>
          <p>Conecte seu dispositivo na mesma rede Wi-Fi e acesse:</p>
          <h2 class="new-address">chromatech.local</h2>
          <p class="small">ou encontre o novo endereço IP</p>
        </div>
        <button class="btn btn-primary full-width" @click="closeModal">Entendi</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { scanWifi, connectWifi, type WifiNetwork } from '../services/api';

const printerName = ref('Chromatech v1.0');
const wifiList = ref<WifiNetwork[]>([]);
const isScanning = ref(false);
const isConnecting = ref(false);
const selectedSsid = ref<string | null>(null);
const wifiPassword = ref('');
const showDisconnectModal = ref(false);

async function handleScan() {
  isScanning.value = true;
  selectedSsid.value = null;
  try {
    wifiList.value = await scanWifi();
  } catch (error) { console.error(error); } 
  finally { isScanning.value = false; }
}

function selectNetwork(net: WifiNetwork) {
  selectedSsid.value = net.ssid;
  wifiPassword.value = '';
}

async function handleConnect() {
  if (!selectedSsid.value) return;
  isConnecting.value = true;
  
  // Tenta conectar. Se der erro de rede, consideramos sucesso (pois o hotspot caiu)
  connectWifi(selectedSsid.value, wifiPassword.value)
    .then(() => { showDisconnectModal.value = true; })
    .catch((e) => {
      console.log("Rede caiu (Sucesso):", e);
      showDisconnectModal.value = true;
    })
    .finally(() => { isConnecting.value = false; });
}

function closeModal() {
  showDisconnectModal.value = false;
  selectedSsid.value = null;
  wifiPassword.value = '';
}

onMounted(() => { handleScan(); });
</script>

<style scoped>
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
.settings-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.settings-card { background-color: var(--main-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; }
.settings-card h4 { font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.btn-refresh { background: none; border: none; color: var(--icon-active); font-size: 18px; cursor: pointer; }
.no-wifi { padding: 20px; text-align: center; color: #6c757d; font-style: italic; }
.wifi-list { max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 6px; margin-bottom: 15px; }
.wifi-item { padding: 12px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.2s; }
.wifi-item:hover { background-color: var(--widget-bg); }
.wifi-item.selected { background-color: var(--icon-active); color: #fff; }
.wifi-item.selected .wifi-meta { color: #eee; }
.wifi-info { display: flex; justify-content: space-between; align-items: center; }
.wifi-ssid { font-weight: bold; }
.wifi-meta { font-size: 12px; color: #6c757d; display: flex; gap: 8px; align-items: center; }
.wifi-connect-form { background-color: var(--widget-bg); padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid var(--border-color); }
.wifi-input { width: 100%; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; margin-bottom: 10px; background-color: var(--main-bg); color: var(--text-color); }
.form-actions { display: flex; gap: 10px; }
.btn { padding: 10px 15px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; color: white; transition: opacity 0.2s; }
.btn-primary { background-color: #28a745; }
.btn-secondary { background-color: #6c757d; }
.btn-danger { background-color: #dc3545; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.setting-item { margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px; }
.setting-item label { font-weight: bold; color: #6c757d; }
.setting-item input { width: 100%; padding: 10px; background-color: var(--widget-bg); border: 1px solid var(--border-color); color: var(--text-color); border-radius: 4px; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background: var(--main-bg); padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.success-icon { color: #28a745; font-size: 60px; margin-bottom: 20px; }
.alert-box { background: rgba(255, 193, 7, 0.1); border: 1px solid #ffc107; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: left; }
.new-address { text-align: center; color: var(--icon-active); margin: 10px 0; }
.full-width { width: 100%; padding: 15px; font-size: 18px; }
</style>