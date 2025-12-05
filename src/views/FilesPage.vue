<template>
  <section class="page">
    <div class="main-header">
      <h3>Ficheiros G-Code</h3>
    </div>
    
    <div class="content-container">
      <div class="upload-zone" @click="triggerInput">
        <i class="fas fa-cloud-upload-alt"></i>
        <p>Clique aqui para carregar um novo G-Code</p>
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleUpload" 
          hidden 
          accept=".gcode,.gco"
        >
      </div>

      <div class="file-list-container">
        <div v-if="isLoading" class="loading">
          <i class="fas fa-spinner fa-spin"></i> Carregando lista...
        </div>
        
        <div v-else-if="files.length === 0" class="empty">
          Nenhum arquivo encontrado.
        </div>

        <div v-else class="file-list">
          <div v-for="file in files" :key="file.path" class="file-item">
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ formatSize(file.size) }}</span>
            </div>
            
            <div class="file-actions">
              <button 
                class="btn-icon btn-print" 
                @click="handlePrint(file.path)" 
                title="Imprimir"
              >
                <i class="fas fa-play"></i>
              </button>
              
              <button 
                class="btn-icon btn-delete" 
                @click="handleDelete(file.path)" 
                title="Apagar"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getFiles, uploadFile, printFile, deleteFile } from '../services/api';

// Estado
const files = ref<any[]>([]);
const isLoading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

// Carregar arquivos ao iniciar
async function loadFiles() {
  isLoading.value = true;
  try {
    // Busca a lista do backend
    files.value = await getFiles();
  } catch (error) {
    console.error("Erro ao listar arquivos:", error);
  } finally {
    isLoading.value = false;
  }
}

// Abrir seletor de arquivos
function triggerInput() {
  fileInput.value?.click();
}

// Upload
async function handleUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    const file = target.files[0];
    
    // CORREÇÃO: Garante que 'file' existe para o TypeScript parar de reclamar
    if (!file) return;

    // Confirmação simples ou feedback de upload
    if (!confirm(`Carregar o arquivo "${file.name}"?`)) {
      target.value = ''; // Limpa seleção
      return;
    }

    try {
      await uploadFile(file);
      alert('Arquivo enviado com sucesso!');
      loadFiles(); // Recarrega a lista
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      target.value = ''; // Limpa seleção para permitir enviar o mesmo arquivo de novo
    }
  }
}

// Imprimir
async function handlePrint(path: string) {
  if (confirm("Deseja iniciar a impressão deste arquivo agora?")) {
    try {
      await printFile(path);
      alert("Impressão iniciada!");
    } catch (error: any) {
      alert("Erro ao iniciar impressão: " + error.message);
    }
  }
}

// Deletar
async function handleDelete(path: string) {
  if (confirm("Tem certeza que deseja apagar este arquivo?")) {
    try {
      await deleteFile(path);
      loadFiles(); // Recarrega a lista
    } catch (error: any) {
      alert("Erro ao apagar: " + error.message);
    }
  }
}

// Formatação de bytes para KB/MB
function formatSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

onMounted(() => {
  loadFiles();
});
</script>

<style scoped>
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
.content-container { max-width: 800px; margin: 0 auto; }

/* Upload Zone */
.upload-zone { 
  border: 2px dashed var(--border-color); 
  padding: 30px; 
  text-align: center; 
  border-radius: 8px; 
  cursor: pointer; 
  margin-bottom: 25px; 
  color: #6c757d;
  transition: all 0.2s;
  background-color: var(--widget-bg);
}
.upload-zone:hover { 
  border-color: var(--icon-active); 
  color: var(--icon-active); 
  background-color: rgba(0, 123, 255, 0.05);
}
.upload-zone i { font-size: 40px; margin-bottom: 10px; display: block; }

/* Lista */
.loading, .empty { text-align: center; padding: 20px; color: #6c757d; }
.file-list { display: flex; flex-direction: column; gap: 10px; }
.file-item { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  background: var(--main-bg); 
  padding: 15px; 
  border: 1px solid var(--border-color); 
  border-radius: 8px; 
}
.file-info { display: flex; flex-direction  : column; }
.file-name { font-weight: bold; font-size: 16px; color: var(--text-color); }
.file-size { font-size: 12px; color: #6c757d; margin-top: 4px; }

.file-actions { display: flex; gap: 10px; }
.btn-icon { 
  width: 40px; 
  height: 40px; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer; 
  color: #fff; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 16px;
  transition: opacity 0.2s;
}
.btn-icon:hover { opacity: 0.8; }
.btn-print { background-color: #28a745; }
.btn-delete { background-color: #dc3545; }
</style>