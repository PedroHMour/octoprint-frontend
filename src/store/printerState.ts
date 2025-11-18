// src/store/printerState.ts

import { reactive } from 'vue';
import { getStatus } from '../services/api';

// --- A ESTRUTURA DOS DADOS ---
interface ITemperatureState {
  current: number;
  target: number;
}

// NOVA interface para o progresso
interface IProgressState {
  completion: number;  // Percentagem (0-100)
  printTimeLeft: number; // Em segundos
}

interface IPrinterState {
  nozzle: ITemperatureState;
  bed: ITemperatureState;
  status: 'Offline' | 'Operacional' | 'Printing' | 'Paused';
  isLightOn: boolean;
  progress: IProgressState; // <-- ADICIONADO
}

// --- O STORE ---
export const printerState = reactive<IPrinterState>({
  nozzle: {
    current: 0.0,
    target: 0,
  },
  bed: {
    current: 0.0,
    target: 0,
  },
  status: 'Offline',
  isLightOn: false,
  // ADICIONADO (valores iniciais)
  progress: {
    completion: 0,
    printTimeLeft: 0,
  },
});

// --- O "POLLER" ---
async function fetchStatusLoop() {
  try {
    // A nossa API '/api/status' agora envia tudo de uma vez
    const data = await getStatus();
    
    // Atualiza todos os dados
    printerState.nozzle = data.nozzle;
    printerState.bed = data.bed;
    printerState.status = data.status;
    printerState.progress = data.progress; // <-- ADICIONADO
    
  } catch (error) {
    console.error('Erro ao buscar status do backend:', error);
    // Zera tudo se falhar
    printerState.status = 'Offline';
    printerState.nozzle.current = 0;
    printerState.bed.current = 0;
    printerState.isLightOn = false;
    printerState.progress.completion = 0;
    printerState.progress.printTimeLeft = 0;
  }
  
  setTimeout(fetchStatusLoop, 2000);
}

export function startStatusPolling() {
  fetchStatusLoop();
}