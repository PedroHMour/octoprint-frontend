// src/store/printerState.ts
import { reactive } from 'vue';
// ADICIONADO: Importamos getSensorStatus para buscar o dado novo
import { getStatus, getSensorStatus } from '../services/api';

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
  
  // ADICIONADO: Estado do Sensor de Filamento
  sensor: {
    filament: boolean; // true = OK, false = SEM FILAMENTO
  };

  // Suporte para as informações do Job
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
  
  // ADICIONADO: Inicializa como true para não mostrar erro no boot
  sensor: {
    filament: true 
  },

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
    // 1. Busca Status Geral
    const data = await getStatus();

    // Atualiza Printer (Status e Temperaturas)
    if (data.printer) {
      if (data.printer.status) {
        printerState.status = data.printer.status;
      }
      
      if (data.printer.nozzle) {
        printerState.nozzle.current = data.printer.nozzle.actual || 0;
        printerState.nozzle.target = data.printer.nozzle.target || 0;
      }
      
      if (data.printer.bed) {
        printerState.bed.current = data.printer.bed.actual || 0;
        printerState.bed.target = data.printer.bed.target || 0;
      }
    }

    // Atualiza Job
    if (data.job) {
      const fileData = data.job.file || {};
      printerState.job.filename = fileData.name || null;
      printerState.job.estimatedTime = data.job.estimatedPrintTime || null;
    }

    // Atualiza Progresso
    if (data.progress) {
      printerState.progress.completion = data.progress.completion || 0;
      printerState.progress.printTime = data.progress.printTime || 0;
      printerState.progress.printTimeLeft = data.progress.printTimeLeft || 0;
    }

    // ADICIONADO: 2. Busca Status do Sensor
    // Chama a função que criamos no api.ts para ler o endpoint /api/sensor/status
    const sensorData = await getSensorStatus();
    if (sensorData && typeof sensorData.filament !== 'undefined') {
      printerState.sensor.filament = sensorData.filament;
    }

  } catch (error) {
    // Erros de rede são ignorados para não travar o loop
  }
  
  // Chama novamente em 2 segundos
  setTimeout(fetchStatusLoop, 2000);
}

// Inicia o processo
export function startStatusPolling() {
  fetchStatusLoop();
}