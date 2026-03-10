/**
 * api.js  –  ZES-DARMS Frontend API Service
 * All HTTP calls to the backend + Socket.IO connection management.
 */

import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── HTTP Helper ──────────────────────────────────────────────────────────────
async function request(method, path, body) {
  const token = localStorage.getItem('zes_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────
let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(BASE_URL, { transports: ['websocket'] });
  socket.on('connect', () => socket.emit('auth', token));
  return socket;
}

export function getSocket() { return socket; }

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) => request('POST', '/api/auth/login', { email, password }),
  changePassword: (currentPassword, newPassword) =>
    request('POST', '/api/auth/change-password', { currentPassword, newPassword }),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = {
  list: ()           => request('GET',  '/api/users'),
  create: (data)     => request('POST', '/api/users', data),
  update: (id, data) => request('PUT',  `/api/users/${id}`, data),
  setStatus: (id, status) => request('PUT', `/api/users/${id}/status`, { status }),
  resetPassword: (id) => request('POST', `/api/users/${id}/reset-password`),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reports = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/api/reports${qs ? '?' + qs : ''}`);
  },
  submit: (data)       => request('POST', '/api/reports', data),
  update: (id, data)   => request('PUT',  `/api/reports/${id}`, data),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = {
  list: ()    => request('GET', '/api/notifications'),
  read: (id)  => request('PUT', `/api/notifications/${id}/read`),
};

// ─── Health ───────────────────────────────────────────────────────────────────
export const health = {
  scores: () => request('GET', '/api/health'),
};

// ─── Audit ────────────────────────────────────────────────────────────────────
export const audit = {
  list: () => request('GET', '/api/audit'),
};

export default { auth, users, reports, notifications, health, audit };
