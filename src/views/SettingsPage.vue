<template>
  <section class="page">
    <div class="main-header">
      <h3>Definições</h3>
    </div>

    <div class="settings-container">

      <div class="settings-card">
        <div class="card-header">
          <h4>Rede Wi-Fi (2.4GHz)</h4>
          <button class="btn-refresh" @click="handleScan" :disabled="isScanning" title="Buscar Redes">
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
          <input 
            type="password" 
            v-model="wifiPassword" 
            placeholder="Senha da Rede" 
            class="wifi-input"
            @keyup.enter="handleConnect"
          >
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
          <input type="text" v-model="printerName" disabled title="Fixo no sistema">
        </div>
      </div>
      
      <div class="settings-card">
        <h4>Sistema</h4>
        <div class="setting-item actions">
          <button class="btn btn-danger" @click="handleShutdown">
            <i class="fas fa-power-off"></i> Desligar Raspberry Pi
          </button>
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
// IMPORTANTE: Certifique-se de adicionar shutdownSystem no seu api.ts
import { scanWifi, connectWifi, shutdownSystem, type WifiNetwork } from '../services/api';

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
    // O Backend agora retorna apenas redes 2.4GHz
    wifiList.value = await scanWifi();
  } catch (error) { 
    console.error(error); 
    alert("Erro ao buscar redes Wi-Fi.");
  } 
  finally { isScanning.value = false; }
}

function selectNetwork(net: WifiNetwork) {
  selectedSsid.value = net.ssid;
  wifiPassword.value = '';
}

async function handleConnect() {
  if (!selectedSsid.value) return;
  isConnecting.value = true;
  
  // O backend vai derrubar a conexão atual (Hotspot) ao tentar conectar na nova.
  // Por isso, o erro de "Network Error" muitas vezes significa SUCESSO aqui.
  connectWifi(selectedSsid.value, wifiPassword.value)
    .then(() => { 
      showDisconnectModal.value = true; 
    })
    .catch((e) => {
      console.log("Provável sucesso (Rede caiu):", e);
      showDisconnectModal.value = true;
    })
    .finally(() => { isConnecting.value = false; });
}

async function handleShutdown() {
  if(!confirm("Tem certeza que deseja desligar o sistema?")) return;
  
  try {
    await shutdownSystem();
    alert("O sistema está desligando. Aguarde 30s antes de remover a energia.");
  } catch(e) {
    alert("Erro ao enviar comando: " + e);
  }
}

function closeModal() {
  showDisconnectModal.value = false;
  selectedSsid.value = null;
  wifiPassword.value = '';
}

onMounted(() => { handleScan(); });
</script>

<style scoped>
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #444; padding-bottom: 10px; }
.settings-container { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }
.settings-card { background-color: #2c3e50; border: 1px solid #444; border-radius: 8px; padding: 20px; color: white; }
.settings-card h4 { font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #444; padding-bottom: 10px; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }

.btn-refresh { background: none; border: none; color: #3498db; font-size: 18px; cursor: pointer; transition: 0.3s; }
.btn-refresh:hover { color: white; }
.btn-refresh:disabled { color: #555; }

.no-wifi { padding: 20px; text-align: center; color: #aaa; font-style: italic; }
.wifi-list { max-height: 250px; overflow-y: auto; border: 1px solid #444; border-radius: 6px; margin-bottom: 15px; background: #222; }

.wifi-item { padding: 12px; border-bottom: 1px solid #333; cursor: pointer; transition: background 0.2s; display: flex; justify-content: space-between; align-items: center; }
.wifi-item:hover { background-color: #34495e; }
.wifi-item.selected { background-color: #3498db; color: #fff; }
.wifi-item.selected .wifi-meta { color: #eee; }

.wifi-info { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.wifi-ssid { font-weight: bold; }
.wifi-meta { font-size: 0.8rem; color: #888; display: flex; gap: 10px; align-items: center; }

.wifi-connect-form { background-color: #222; padding: 15px; border-radius: 8px; margin-top: 10px; border: 1px solid #444; }
.wifi-input { width: 100%; padding: 10px; border: 1px solid #555; border-radius: 4px; margin-bottom: 10px; background-color: #333; color: white; }

.form-actions { display: flex; gap: 10px; }
.btn { padding: 10px 15px; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; color: white; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary { background-color: #27ae60; flex: 1; }
.btn-secondary { background-color: #7f8c8d; }
.btn-danger { background-color: #c0392b; width: 100%; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }

.setting-item { margin-bottom: 15px; display: flex; flex-direction: column; gap: 5px; }
.setting-item label { font-weight: bold; color: #aaa; }
.setting-item input { width: 100%; padding: 10px; background-color: #222; border: 1px solid #444; color: #888; border-radius: 4px; }

/* MODAL */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; justify-content: center; align-items: center; z-index: 2000; }
.modal-content { background: #2c3e50; padding: 30px; border-radius: 16px; width: 90%; max-width: 400px; text-align: center; border: 1px solid #3498db; box-shadow: 0 20px 50px rgba(0,0,0,0.5); color: white; }
.success-icon { color: #27ae60; font-size: 60px; margin-bottom: 20px; }
.alert-box { background: rgba(243, 156, 18, 0.1); border: 1px solid #f39c12; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: left; }
.new-address { text-align: center; color: #3498db; margin: 10px 0; }
.full-width { width: 100%; padding: 15px; font-size: 18px; }
</style>