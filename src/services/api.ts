// src/services/api.ts

const BASE_URL = '/api';

export interface WifiNetwork {
  ssid: string;
  signal: number;
  security: string | boolean;
}

// --- Status e Conexão ---
export async function getStatus() {
  const response = await fetch(`${BASE_URL}/status`);
  if (!response.ok) { throw new Error('Falha ao buscar status'); }
  return response.json();
}

export async function getSensorStatus() {
  // Nota: O backend precisa ter a rota /api/sensor/status criada
  const response = await fetch(`${BASE_URL}/sensor/status`);
  // Se der erro (404/500), assume que tem filamento para não bloquear a UI
  if (!response.ok) return { filament: true }; 
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
  formData.append('file', file, file.name); // 'file' é a chave que o Python espera
  
  // ATENÇÃO: Usamos o padrão OctoPrint (/files/local).
  // Se o teu backend for personalizado, tens de criar esta rota lá!
  const response = await fetch(`${BASE_URL}/files/local`, {
    method: 'POST',
    // Não definir Content-Type aqui! O browser define automaticamente para multipart/form-data
    body: formData,
  });
  
  if (!response.ok) { 
    const errText = await response.text().catch(() => 'Erro desconhecido');
    throw new Error(`Erro Backend (${response.status}): ${errText}`); 
  }
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
    headers: { 'Content-Type': 'application/json' }, // Alguns backends exigem JSON mesmo vazio
    body: JSON.stringify({}), 
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
    const err = await response.json().catch(() => ({}));
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

// --- MISTURA ---
export async function applyMix(mix: { ext1: number, ext2: number, ext3: number }) {
  const command = `M163 S0 P${mix.ext1} S1 P${mix.ext2} S2 P${mix.ext3}`;
  return sendGcode(command);
}

// --- SISTEMA E WIFI ---
export async function scanWifi() {
  const response = await fetch(`${BASE_URL}/system/wifi/scan`);
  if (!response.ok) { throw new Error('Erro ao escanear redes'); }
  return response.json();
}

export async function connectWifi(ssid: string, password?: string) {
  const response = await fetch(`${BASE_URL}/system/wifi/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ssid, password }), 
  });
  // Nota: Retornos de rede podem falhar (timeout) mesmo com sucesso, pois o IP muda
  return response.json();
}

export async function shutdownSystem() {
  const response = await fetch(`${BASE_URL}/system/shutdown`, {
    method: 'POST'
  });
  if (!response.ok) { throw new Error('Erro ao desligar sistema'); }
  return response.json();
}

// --- Ajustes (Feed/Flow/Fan) ---
export async function setFeedRate(rate: number) { return sendGcode(`M220 S${rate}`); }
export async function setFlowRate(rate: number) { return sendGcode(`M221 S${rate}`); }
export async function setFanSpeed(speed: number) { return sendGcode(`M106 S${speed}`); }

// ==========================================================
// --- NOVAS FUNÇÕES (Controle Manual) ---
// ==========================================================

// 1. Movimentação (X, Y, Z)
export async function moveAxis(axis: 'X' | 'Y' | 'Z', distance: number, speed: number = 3000) {
  const cmd = `G91\nG0 ${axis}${distance} F${speed}\nG90`;
  return sendGcode(cmd);
}

// 2. Extrusão e Retração
export async function extrudeFilament(amount: number, speed: number = 300) {
  const cmd = `G91\nG1 E${amount} F${speed}\nG90`;
  return sendGcode(cmd);
}

// 3. Temperaturas
export async function setNozzleTemp(temp: number) {
  return sendGcode(`M104 S${temp}`);
}

export async function setBedTemp(temp: number) {
  return sendGcode(`M140 S${temp}`);
}

// 4. Ventoinha (%)
export async function setFanPercent(percent: number) {
  const pwm = Math.floor((percent / 100) * 255);
  return sendGcode(`M106 S${pwm}`);
}