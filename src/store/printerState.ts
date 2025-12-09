// src/store/printerState.ts
import { reactive } from 'vue';
import { getStatus } from '../services/api';

// --- Tipos ---
export type PrinterStatus = 
  | 'Offline' 
  | 'Operational' | 'Operacional' 
  | 'Printing' 
  | 'Paused' | 'Pausing'
  | 'Closed' | 'Error'
  | 'Detecting baudrate'
  | string; 

interface IPrinterState {
  nozzle: { current: number; target: number };
  bed: { current: number; target: number };
  status: PrinterStatus;
  isLightOn: boolean;
  
  // ADICIONADO: Suporte para as informações do Job que o backend manda
  job: {
    filename: string | null;
    estimatedTime: number | null;
  };
  
  progress: {
    completion: number | null;
    printTime: number | null;
    printTimeLeft: number | null;
  };
}

// --- Estado Reativo Inicial ---
export const printerState = reactive<IPrinterState>({
  nozzle: { current: 0, target: 0 },
  bed: { current: 0, target: 0 },
  status: 'Offline',
  isLightOn: false,
  
  job: {
    filename: null,
    estimatedTime: null
  },
  
  progress: {
    completion: 0,
    printTime: 0,
    printTimeLeft: 0
  }
});

// --- Loop de Atualização ---
async function fetchStatusLoop() {
  try {
    const data = await getStatus();

    // 1. Atualiza Printer (Status e Temperaturas)
    if (data.printer) {
      if (data.printer.status) {
        printerState.status = data.printer.status;
      }
      
      // Verifica se existe o objeto nozzle antes de tentar ler
      if (data.printer.nozzle) {
        printerState.nozzle.current = data.printer.nozzle.actual || 0;
        printerState.nozzle.target = data.printer.nozzle.target || 0;
      }
      
      // Verifica se existe o objeto bed
      if (data.printer.bed) {
        printerState.bed.current = data.printer.bed.actual || 0;
        printerState.bed.target = data.printer.bed.target || 0;
      }
    }

    // 2. Atualiza Job (Nome do arquivo)
    if (data.job) {
      // O backend envia { job: { file: { name: "..." } } }
      const fileData = data.job.file || {};
      printerState.job.filename = fileData.name || null;
      printerState.job.estimatedTime = data.job.estimatedPrintTime || null;
    }

    // 3. Atualiza Progresso
    if (data.progress) {
      printerState.progress.completion = data.progress.completion || 0;
      printerState.progress.printTime = data.progress.printTime || 0;
      printerState.progress.printTimeLeft = data.progress.printTimeLeft || 0;
    }

  } catch (error) {
    // Se der erro de rede, não faz nada para não piscar a tela, 
    // ou pode setar status = 'Offline' se preferir.
    // console.error(error); 
  }
  
  // Chama novamente em 2 segundos
  setTimeout(fetchStatusLoop, 2000);
}

// Inicia o processo
export function startStatusPolling() {
  fetchStatusLoop();
}