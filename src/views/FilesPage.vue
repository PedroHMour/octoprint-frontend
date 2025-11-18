<template>
  <section class="page">
    
    <div class="main-header">
      <h3>Ficheiros G-Code</h3>
    </div>

    <div class="file-upload-container">
      
      <div 
        class="drop-zone"
        :class="{ dragging: isDragging }"
        @click="triggerFileInput"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <i class="fas fa-upload icon-large"></i>
        <p>Arraste e largue os seus ficheiros .gcode aqui</p>
        <p class="small-text">ou</p>
        <button class="select-button">Selecionar Ficheiros</button>
      </div>

      <input 
        type="file"
        ref="fileInput" 
        @change="handleFileSelect"
        multiple 
        accept=".gcode,.gco"
        style="display: none;"
      >

      <div class="file-list" v-if="selectedFiles.length > 0">
        <h4>Ficheiros a carregar:</h4>
        
        <div 
          class="file-item" 
          v-for="(file, index) in selectedFiles" 
          :key="file.name"
        >
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
          <button class="remove-button" @click="removeFile(index)">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <button 
          class="upload-button" 
          @click="uploadFiles" 
          :disabled="selectedFiles.length === 0 || isUploading"
        >
          <span v-if="isUploading">A carregar...</span>
          <span v-else>Carregar e Imprimir {{ selectedFiles.length }} Ficheiro(s)</span>
        </button>
      </div>
    </div>

    <div class="server-files">
      <h4>Ficheiros na Impressora</h4>
      
      <div v-if="isLoadingFiles" class="loading-placeholder">
        <i class="fas fa-spinner fa-spin"></i> A carregar ficheiros...
      </div>
      
      <div v-else-if="fileError" class="error-placeholder">
        <i class="fas fa-exclamation-triangle"></i> {{ fileError }}
      </div>
      
      <div v-else-if="serverFiles.length === 0" class="loading-placeholder">
        <i class="fas fa-folder-open"></i> Nenhum ficheiro .gcode encontrado no Pi.
      </div>
      
      <div v-else class="server-file-list">
        <div 
          class="server-file-item" 
          v-for="file in serverFiles" 
          :key="file.path"
        >
          <div class="file-info">
            <span class="file-name"><i class="fas fa-file-code"></i> {{ file.name }}</span>
            <span class="file-size">{{ formatFileSize(file.size) }}</span>
          </div>
          <div class="file-actions">
            <button 
              class="btn-action btn-print" 
              @click="handlePrintFile(file.path)"
            >
              <i class="fas fa-play"></i> Imprimir
            </button>
            <button 
              class="btn-action btn-delete" 
              @click="handleDeleteFile(file.path)"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>

    </div>

  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'; // Importar 'onMounted'
import { 
  uploadFile, 
  getFiles,     // <-- Nova importação
  deleteFile,   // <-- Nova importação
  printFile     // <-- Nova importação
} from '../services/api';

// --- Estado da Secção de Upload (Existente) ---
const fileInput = ref<HTMLInputElement | null>(null);
const selectedFiles = ref<File[]>([]);
const isDragging = ref(false);
const isUploading = ref(false);

// --- NOVO ESTADO DA SECÇÃO DE FICHEIROS DO SERVIDOR ---
interface ServerFile {
  name: string;
  path: string; // 'path' é o nome completo que o OctoPrint usa (ex: "pasta/meu.gcode")
  size: number;
}
const serverFiles = ref<ServerFile[]>([]);
const isLoadingFiles = ref(false);
const fileError = ref<string | null>(null);


// --- Ciclo de Vida: Buscar Ficheiros ao Carregar a Página ---
onMounted(() => {
  fetchFiles();
});

// --- NOVAS FUNÇÕES DE GESTÃO DE FICHEIROS ---

async function fetchFiles() {
  isLoadingFiles.value = true;
  fileError.value = null;
  try {
    serverFiles.value = await getFiles();
  } catch (error: any) {
    console.error("Falha ao buscar ficheiros:", error);
    fileError.value = "Não foi possível carregar a lista de ficheiros.";
  } finally {
    isLoadingFiles.value = false;
  }
}

async function handleDeleteFile(filePath: string) {
  // Pede confirmação
  const fileName = filePath.split('/').pop(); // Apenas para a mensagem
  if (!window.confirm(`Tem a certeza que quer apagar o ficheiro "${fileName}"?`)) {
    return;
  }
  
  try {
    await deleteFile(filePath);
    alert(`Ficheiro "${fileName}" apagado com sucesso.`);
    await fetchFiles(); // Atualiza a lista!
  } catch (error: any) {
    console.error("Falha ao apagar ficheiro:", error);
    alert(`Erro ao apagar o ficheiro: ${error.message}`);
  }
}

async function handlePrintFile(filePath: string) {
  const fileName = filePath.split('/').pop();
  if (!window.confirm(`Iniciar a impressão de "${fileName}"?`)) {
    return;
  }
  
  try {
    await printFile(filePath);
    alert(`Impressão de "${fileName}" iniciada!`);
    // (Opcional: Mudar para a página Home para ver o progresso)
    // router.push('/');
  } catch (error: any) {
    console.error("Falha ao iniciar impressão:", error);
    alert(`Erro ao iniciar impressão: ${error.message}`);
  }
}


// --- Funções de Upload (Existentes) ---

function triggerFileInput() {
  fileInput.value?.click();
}
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files) addFiles(target.files);
}
function handleDragOver() { isDragging.value = true; }
function handleDragLeave() { isDragging.value = false; }
function handleDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
}
function addFiles(files: FileList) {
  const newFiles = Array.from(files);
  const gcodeFiles = newFiles.filter(file => 
    file.name.endsWith('.gcode') || file.name.endsWith('.gco')
  );
  selectedFiles.value = [...selectedFiles.value, ...gcodeFiles];
  if (fileInput.value) fileInput.value.value = '';
}
function removeFile(index: number) {
  selectedFiles.value.splice(index, 1);
}
async function uploadFiles() {
  if (selectedFiles.value.length === 0) return;
  isUploading.value = true;
  try {
    const uploadPromises = selectedFiles.value.map(file => uploadFile(file));
    await Promise.all(uploadPromises);
    alert('Ficheiros carregados e impressão iniciada!');
    selectedFiles.value = []; // Limpa a lista de upload
    await fetchFiles(); // Atualiza a lista de ficheiros do servidor!
  } catch (error: any) {
    console.error(error);
    alert(`Erro ao carregar ficheiros: ${error.message}`);
  } finally {
    isUploading.value = false;
  }
}

// --- Função Auxiliar ---
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

</script>

<style scoped>
/* ... (Estilos da secção de Upload - sem alterações) ... */
.main-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
.file-upload-container { width: 100%; margin-bottom: 30px; }
.drop-zone { border: 2px dashed var(--border-color); border-radius: 8px; padding: 30px; text-align: center; cursor: pointer; transition: background-color 0.2s, border-color 0.2s; }
.drop-zone:hover { background-color: var(--widget-bg); border-color: var(--icon-active); }
.drop-zone.dragging { background-color: #e0eaff; border-color: var(--icon-active); border-style: solid; }
.drop-zone .icon-large { font-size: 48px; color: var(--icon-active); margin-bottom: 15px; }
.drop-zone p { margin: 5px 0; font-size: 16px; }
.drop-zone .small-text { font-size: 14px; color: #6c757d; }
.select-button { margin-top: 10px; padding: 10px 20px; font-size: 14px; color: #fff; background-color: var(--icon-active); border: none; border-radius: 5px; cursor: pointer; }
.file-list { margin-top: 20px; }
.file-item { display: flex; align-items: center; padding: 10px; background-color: var(--widget-bg); border-radius: 5px; margin-bottom: 8px; }
.file-item .file-name { flex-grow: 1; font-weight: bold; }
.file-item .file-size { margin-left: 15px; font-size: 14px; color: #6c757d; }
.file-item .remove-button { margin-left: 15px; background: none; border: none; color: #dc3545; font-size: 16px; cursor: pointer; padding: 5px; }
.upload-button { margin-top: 15px; width: 100%; padding: 12px; font-size: 16px; font-weight: bold; color: #fff; background-color: #28a745; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.2s; }
.upload-button:hover { background-color: #218838; }
.upload-button:disabled { background-color: #6c757d; cursor: not-allowed; }


/* --- ESTILOS DA NOVA LISTA DE FICHEIROS DO SERVIDOR --- */
.server-files {
  border-top: 1px solid var(--border-color);
  padding-top: 20px;
}
.server-files h4 {
  font-size: 18px;
  margin-bottom: 15px;
}

.loading-placeholder, .error-placeholder {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-size: 16px;
  font-style: italic;
}
.loading-placeholder .fas, .error-placeholder .fas {
  margin-right: 10px;
}
.error-placeholder {
  color: #dc3545;
  font-weight: bold;
}

.server-file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.server-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
  background-color: var(--main-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: box-shadow 0.2s;
}
.server-file-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.file-info .file-name {
  font-weight: bold;
  font-size: 16px;
  color: var(--text-color);
}
.file-info .file-name .fas {
  margin-right: 8px;
  color: var(--icon-active);
}
.file-info .file-size {
  font-size: 12px;
  color: #6c757d;
  margin-left: 24px; /* Alinha com o texto do nome */
}

.file-actions {
  display: flex;
  gap: 10px;
}

.btn-action {
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  color: #fff;
  transition: background-color 0.2s;
}
.btn-action .fas {
  margin-right: 6px;
}

.btn-action.btn-print {
  background-color: #28a745; /* Verde */
}
.btn-action.btn-print:hover {
  background-color: #218838;
}

.btn-action.btn-delete {
  background-color: #dc3545; /* Vermelho */
}
.btn-action.btn-delete:hover {
  background-color: #c82333;
}
</style>