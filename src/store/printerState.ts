// src/store/printerState.ts

import { reactive } from 'vue';
import { getStatus } from '../services/api';

// Define a estrutura dos dados que esperamos receber
interface IPrinterState {
  // CORREÇÃO: Permite 'null' nas temperaturas
  nozzle: { current: number | null; target: number | null };
  bed: { current: number | null; target: number | null };
  status: 'Offline' | 'Operacional' | 'Printing' | 'Paused';
  isLightOn: boolean;
  progress: { completion: number | null; printTimeLeft: number | null };
}

// Cria o estado reativo que será usado por toda a aplicação
export const printerState = reactive<IPrinterState>({
  nozzle: { current: 0, target: 0 },
  bed: { current: 0, target: 0 },
  status: 'Offline',
  isLightOn: false,
  progress: { completion: 0, printTimeLeft: 0 },
});

// Função que roda em loop infinito para atualizar os dados
async function fetchStatusLoop() {
  try {
    const data = await getStatus();
    
    // Atualiza o estado com os dados novos
    printerState.nozzle = data.nozzle;
    printerState.bed = data.bed;
    printerState.status = data.status;
    
    // Garante que os dados de progresso sejam atualizados
    printerState.progress.completion = data.progress.completion;
    printerState.progress.printTimeLeft = data.progress.printTimeLeft;
    
  } catch (error) {
    // A falha de rede/API é logada, mas o crash do layout é resolvido abaixo.
    console.error('ERRO DE POLLING/RENDERIZAÇÃO:', error); 
  }
  
  // Agenda a próxima atualização para daqui a 2 segundos
  setTimeout(fetchStatusLoop, 2000);
}

// Inicia o ciclo de atualizações (chamado no main.ts)
export function startStatusPolling() {
  fetchStatusLoop();
}