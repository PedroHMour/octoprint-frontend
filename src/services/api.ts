// src/services/api.ts

const BASE_URL = 'http://192.168.1.23:5001/api'; // (Confirme o IP)

// --- Funções de Status, Mistura, Upload, Luz, Conexão, Job (Existentes) ---
export async function getStatus() {
  const response = await fetch(`${BASE_URL}/status`);
  if (!response.ok) { throw new Error('Falha ao buscar status do backend'); }
  return response.json();
}
export async function applyMix(mix: { ext1: number, ext2: number, ext3: number }) {
  const response = await fetch(`${BASE_URL}/mix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mix), 
  }); 
  if (!response.ok) { throw new Error('Falha ao aplicar mistura'); }
  return response.json();
}
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file, file.name);
  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) { throw new Error('Falha ao carregar ficheiro'); }
  return response.json();
}
export async function setLight(state: boolean) {
  const response = await fetch(`${BASE_URL}/light`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: state }), 
  });
  if (!response.ok) { throw new Error('Falha ao definir estado da luz'); }
  return response.json();
}
export async function setConnection(action: 'connect' | 'disconnect') {
  const response = await fetch(`${BASE_URL}/connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: action }), 
  });
  if (!response.ok) { throw new Error('Falha ao enviar comando de conexão'); }
  return response.json();
}
export async function controlJob(action: 'pause' | 'cancel') {
  const response = await fetch(`${BASE_URL}/job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: action }), 
  });
  if (!response.ok) { throw new Error('Falha ao enviar comando de job'); }
  return response.json();
}
export async function setFeedRate(rate: number) {
  const response = await fetch(`${BASE_URL}/adjust/feedrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate: rate }), 
  });
  if (!response.ok) { throw new Error('Falha ao ajustar Feed Rate'); }
  return response.json();
}
export async function setFlowRate(rate: number) {
  const response = await fetch(`${BASE_URL}/adjust/flowrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rate: rate }), 
  });
  if (!response.ok) { throw new Error('Falha ao ajustar Flow Rate'); }
  return response.json();
}
export async function setFanSpeed(speed: number) {
  const response = await fetch(`${BASE_URL}/adjust/fanspeed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speed: speed }), 
  });
  if (!response.ok) { throw new Error('Falha ao ajustar Ventoinha'); }
  return response.json();
}
export async function getFiles() {
  const response = await fetch(`${BASE_URL}/files`);
  if (!response.ok) { throw new Error('Falha ao buscar lista de ficheiros'); }
  return response.json();
}
export async function deleteFile(filename: string) {
  const response = await fetch(`${BASE_URL}/files/${filename}`, {
    method: 'DELETE',
  });
  if (!response.ok) { throw new Error('Falha ao apagar ficheiro'); }
  return response.json();
}
export async function printFile(filename: string) {
  const response = await fetch(`${BASE_URL}/print/${filename}`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Falha ao iniciar impressão'); }
  return response.json();
}

// --- NOVAS FUNÇÕES ADICIONADAS ---

/**
 * Envia o comando G28 (Home)
 */
export async function sendHomeCommand() {
  const response = await fetch(`${BASE_URL}/printer/home`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Falha ao enviar comando Home'); }
  return response.json();
}

/**
 * Envia o comando G29 (Level)
 */
export async function sendLevelCommand() {
  const response = await fetch(`${BASE_URL}/printer/level`, {
    method: 'POST',
  });
  if (!response.ok) { throw new Error('Falha ao enviar comando Level'); }
  return response.json();
}