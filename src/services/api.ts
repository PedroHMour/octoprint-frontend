// src/services/api.ts

const BASE_URL = '/api';

export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string;
}

// --- Status e Conexão ---
export async function getStatus() {
  const response = await fetch(`${BASE_URL}/status`);
  if (!response.ok) { throw new Error('Falha ao buscar status'); }
  return response.json();
}

export async function getSensorStatus() {
  const response = await fetch(`${BASE_URL}/sensor/status`);
  if (!response.ok) return { has_filament: true }; // Fallback
  return response.json();
}

export async function setConnection(action: 'connect' | 'disconnect') {
  const response = await fetch(`${BASE_URL}/connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }), 
  });
  if (!response.ok) { throw new Error('Falha na conexão'); }
  return response.json();
}

// --- Arquivos e Upload ---
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

export async function deleteFile(filename: string) {
  const response = await fetch(`${BASE_URL}/files/${filename}`, {
    method: 'DELETE',
  });
  if (!response.ok) { throw new Error('Erro ao apagar arquivo'); }
  return response.json();
}

// --- Impressão e Job ---
export async function printFile(filename: string) {
  const response = await fetch(`${BASE_URL}/print/${filename}`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Erro ao iniciar impressão'); }
  return response.json();
}

export async function controlJob(action: 'pause' | 'cancel' | 'resume') {
  const response = await fetch(`${BASE_URL}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: action }), 
  });
  if (!response.ok) { throw new Error('Erro no comando de job'); }
  return response.json();
}

// --- Pintar e Imprimir ---
export async function paintAndPrint(filename: string, colorMap: Record<number, string>) {
  const response = await fetch(`${BASE_URL}/paint_print/${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(colorMap), 
  });
  
  if (!response.ok) { 
    const err = await response.json();
    throw new Error(err.error || 'Erro ao processar G-code'); 
  }
  return response.json();
}

// --- Comandos G-Code ---
export async function sendGcode(command: string) {
  const response = await fetch(`${BASE_URL}/printer/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands: [command] }), 
  });
  if (!response.ok) { throw new Error('Erro ao enviar GCode'); }
  return response.json();
}

// --- Atalhos ---
export async function sendHomeCommand() { return sendGcode('G28'); }
export async function sendLevelCommand() { return sendGcode('G29'); }
export async function selectTool(index: number) { return sendGcode(`T${index}`); }

// --- LED Control (M150) ---
export async function sendLedCommand(r: number, u: number, b: number) {
  return sendGcode(`M150 R${r} U${u} B${b} P255`);
}

export async function setLight(state: boolean) {
  const response = await fetch(`${BASE_URL}/light`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }), 
  });
  if (!response.ok) { throw new Error('Erro na luz'); }
  return response.json();
}

// --- MISTURA (Necessário para AdjustPage.vue não quebrar) ---
export async function applyMix(mix: { ext1: number, ext2: number, ext3: number }) {
  // Converte para M163 (Padrão atual) ou M182 (Legado)
  const command = `M163 S0 P${mix.ext1} S1 P${mix.ext2} S2 P${mix.ext3}`;
  return sendGcode(command);
}

// --- Wifi ---
export async function scanWifi() {
  const response = await fetch(`${BASE_URL}/wifi/scan`);
  return response.json();
}
export async function connectWifi(ssid: string, password?: string) {
  const response = await fetch(`${BASE_URL}/wifi/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password }), 
  });
  return response.json();
}

// --- Outros Ajustes (Feed/Flow/Fan) ---
export async function setFeedRate(rate: number) { return sendGcode(`M220 S${rate}`); }
export async function setFlowRate(rate: number) { return sendGcode(`M221 S${rate}`); }
export async function setFanSpeed(speed: number) { return sendGcode(`M106 S${speed}`); }