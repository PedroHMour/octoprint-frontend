<template>
  <section class="page">
    <h2>📂 Arquivos G-Code</h2>
    
    <div class="actions">
      <button @click="reload" class="btn-refresh" title="Atualizar Lista">
        <i class="fas fa-sync"></i>
      </button>
      
      <input type="file" ref="inp" style="display:none" @change="doUpload" accept=".gcode,.gco,.g">
      
      <button class="btn-up" @click="inp?.click()">
        <i class="fas fa-cloud-upload-alt"></i> Upload Novo
      </button>
    </div>

    <div v-if="loading" class="loading">Carregando lista...</div>
    <div v-else-if="files.length === 0" class="empty">Nenhum arquivo encontrado.</div>
    
    <div class="list">
      <div v-for="f in files" :key="f.path" class="file">
        <div class="info">
          <div class="file-icon"><i class="fas fa-file-code"></i></div>
          
          <div class="file-details">
            <strong>{{ f.name }}</strong>
            <div class="meta">
              <span class="meta-item">
                <i class="fas fa-weight-hanging"></i> {{ formatSize(f.size) }}
              </span>
              <span class="meta-item" v-if="f.date">
                <i class="fas fa-clock"></i> {{ formatDate(f.date) }}
              </span>
            </div>
          </div>

        </div>
        
        <div class="btns">
          <button class="btn-magic" @click="paintPrint(f.name)" title="Aplicar Cores e Imprimir">
            <i class="fas fa-play"></i> IMPRIMIR
          </button>
          
          <button class="btn-del" @click="del(f.name)" title="Apagar">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFiles, uploadFile, deleteFile, paintAndPrint } from '../services/api';

// Adicionado o campo opcional 'date'
interface GcodeFile { name: string; path: string; size: number; date?: number; }

const files = ref<GcodeFile[]>([]);
const loading = ref(false);
const inp = ref<HTMLInputElement | null>(null);

async function reload() {
  loading.value = true;
  try {
    const d = await getFiles();
    const list = Array.isArray(d) ? d : (d.files || []);
    
    // 1. Filtra apenas G-Codes
    const filtered = list.filter((x: any) => 
      x.type === 'machinecode' || x.name.endsWith('.gcode')
    );
    
    // 2. Ordena por Data (Mais recente primeiro)
    // Se a API não mandar data, assume 0 para ir para o fim da lista
    files.value = filtered.sort((a: any, b: any) => {
      const dateA = a.date || 0;
      const dateB = b.date || 0;
      return dateB - dateA; // Ordem decrescente
    });

  } catch(e) { console.error(e); } 
  finally { loading.value = false; }
}

async function doUpload(e: Event) {
  const t = e.target as HTMLInputElement;
  if(t.files && t.files[0]) {
    const file = t.files[0];
    try { 
      const btn = document.querySelector('.btn-up');
      if(btn) btn.textContent = "Enviando...";
      await uploadFile(file); 
      alert("Sucesso!"); reload(); 
    } catch(err: any) { alert("Erro: " + err.message); } 
    finally {
      if(inp.value) inp.value.value = '';
      const btn = document.querySelector('.btn-up');
      if(btn) btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Upload Novo';
    }
  }
}

async function del(n: string) {
  if(confirm(`Apagar ${n}?`)) {
    try { await deleteFile(n); reload(); } catch(e) {}
  }
}

async function paintPrint(n: string) {
  if(!confirm(`Iniciar impressão de ${n}?\n(As cores do estúdio serão aplicadas)`)) return;
  
  const map: Record<number, string> = {};
  for(let i=0; i<19; i++) {
    const c = localStorage.getItem(`extruder_mix_${i}`);
    if(c) map[i] = c;
  }
  
  try {
    const res = await paintAndPrint(n, map);
    alert("✅ " + res.msg);
  } catch(e: any) { alert("Erro: " + e.message); }
}

function formatSize(bytes: number) {
  if(bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Nova função para formatar a data vinda do backend (timestamp unix)
function formatDate(timestamp: number) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000); 
  return date.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

onMounted(reload);
</script>

<style scoped>
.page { padding: 15px; color: white; }
.actions { display: flex; gap: 10px; margin-bottom: 20px; }
.btn-up { background: #007bff; color: white; border: none; padding: 12px; flex: 1; font-weight: bold; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-refresh { background: #444; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; width: 50px; }

.list { display: flex; flex-direction: column; gap: 10px; }
.file { background: #2c3e50; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #444; }

/* Ajustes visuais para os detalhes do arquivo */
.info { display: flex; align-items: center; gap: 15px; flex-grow: 1; overflow: hidden; }
.file-icon { font-size: 1.8rem; color: #FFD700; flex-shrink: 0; }
.file-details { display: flex; flex-direction: column; gap: 4px; overflow: hidden; }

/* Estilo dos metadados (tamanho e data) */
.meta { display: flex; gap: 15px; font-size: 0.85rem; color: #bbb; }
.meta-item { display: flex; align-items: center; gap: 5px; }

.btns { display: flex; gap: 8px; flex-shrink: 0; }
button { border: none; padding: 0 15px; height: 42px; border-radius: 6px; cursor: pointer; color: white; font-size: 1rem; display: flex; align-items: center; gap: 8px; transition: 0.1s; }
button:active { transform: scale(0.95); }

.btn-magic { background: #27ae60; font-weight: bold; flex-grow: 1; } /* Verde principal */
.btn-del { background: #dc3545; width: 42px; padding: 0; justify-content: center; }

.loading, .empty { text-align: center; color: #888; margin-top: 20px; font-style: italic; }

/* Responsividade para ecrãs pequenos */
@media (max-width: 600px) {
  .meta { flex-direction: column; gap: 2px; }
}
</style>