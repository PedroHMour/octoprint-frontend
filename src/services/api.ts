// src/services/api.ts

// URL relativa: O navegador usa automaticamente o IP atual do Raspberry Pi
const BASE_URL = '/api';

// --- Interface de Rede ---
export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
}

// --- Funções Gerais ---
export async function getStatus() {
  const response = await fetch(`${BASE_URL}/status`);
  if (!response.ok) { throw new Error('Falha ao buscar status'); }
  return response.json();
}

export async function setConnection(action: 'connect' | 'disconnect') {
  const response = await fetch(`${BASE_URL}/connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }), 
  });
  if (!response.ok) { throw new Error('Falha na conexão serial'); }
  return response.json();
}

// --- Funções de Wi-Fi ---
export async function scanWifi(): Promise<WifiNetwork[]> {
  const response = await fetch(`${BASE_URL}/wifi/scan`);
  if (!response.ok) { throw new Error('Falha ao escanear redes'); }
  return response.json();
}

export async function connectWifi(ssid: string, password?: string) {
  const response = await fetch(`${BASE_URL}/wifi/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password }), 
  });
  
  const data = await response.json();
  
  if (!response.ok) { 
    throw new Error(data.error || 'Falha ao conectar'); 
  }
  return data;
}

// --- Funções de Impressão e Arquivos ---
export async function getFiles() {
  const response = await fetch(`${BASE_URL}/files`);
  if (!response.ok) { throw new Error('Erro ao listar arquivos'); }
  return response.json();
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) { throw new Error('Erro ao enviar arquivo'); }
  return response.json();
}

export async function printFile(filename: string) {
  const response = await fetch(`${BASE_URL}/print/${filename}`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Erro ao iniciar impressão'); }
  return response.json();
}

export async function deleteFile(filename: string) {
  const response = await fetch(`${BASE_URL}/files/${filename}`, {
    method: 'DELETE',
  });
  if (!response.ok) { throw new Error('Erro ao apagar arquivo'); }
  return response.json();
}

// CORREÇÃO: Adiciona 'resume' ao tipo e corrige o payload para OctoPrint
export async function controlJob(action: 'pause' | 'cancel' | 'resume') {
  const response = await fetch(`${BASE_URL}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // PAYLOAD CORRETO: OctoPrint espera { "command": "pause" } ou "cancel" / "resume"
    body: JSON.stringify({ command: action }), 
  });
  if (!response.ok) { throw new Error('Erro no comando de job'); }
  return response.json();
}

// --- Comandos de Máquina (G-Code) ---

export async function sendHomeCommand() {
  const response = await fetch(`${BASE_URL}/printer/home`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Erro ao enviar Home'); }
  return response.json();
}

export async function sendLevelCommand() {
  const response = await fetch(`${BASE_URL}/printer/level`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Erro ao enviar Level'); }
  return response.json();
}

export async function applyMix(mix: { ext1: number, ext2: number, ext3: number }) {
  const response = await fetch(`${BASE_URL}/mix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mix), 
  }); 
  if (!response.ok) { throw new Error('Erro ao aplicar mistura'); }
  return response.json();
}

export async function setFeedRate(rate: number) {
  const response = await fetch(`${BASE_URL}/adjust/feedrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate }), 
  });
  if (!response.ok) { throw new Error('Erro ao ajustar Feed Rate'); }
  return response.json();
}

export async function setFlowRate(rate: number) {
  const response = await fetch(`${BASE_URL}/adjust/flowrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate }), 
  });
  if (!response.ok) { throw new Error('Erro ao ajustar Flow Rate'); }
  return response.json();
}

export async function setFanSpeed(speed: number) {
  const response = await fetch(`${BASE_URL}/adjust/fanspeed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed }), 
  });
  if (!response.ok) { throw new Error('Erro ao ajustar Ventoinha'); }
  return response.json();
}

export async function setLight(state: boolean) {
  const response = await fetch(`${BASE_URL}/light`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }), 
  });
  if (!response.ok) { throw new Error('Erro ao definir luz'); }
  return response.json();
}