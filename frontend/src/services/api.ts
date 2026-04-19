/**
 * API Service — Backend Communication Layer
 * Wraps all REST API calls with JWT auth headers
 */

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('fleet_monitor_token');
}

function getHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => request('/auth/me'),
    getUsers: () => request('/auth/users'),
  },

  devices: {
    getAll: () => request('/devices'),
    getById: (id: string) => request(`/devices/${id}`),
    getSummary: () => request('/devices/summary'),
  },

  telemetry: {
    getLatest: () => request('/telemetry/latest'),
    getByDevice: (deviceId: string, limit = 50) =>
      request(`/telemetry/device/${deviceId}?limit=${limit}`),
  },

  alerts: {
    getAll: (limit = 100) => request(`/alerts?limit=${limit}`),
    getByDevice: (deviceId: string) => request(`/alerts/device/${deviceId}`),
    acknowledge: (id: string) =>
      request(`/alerts/${id}/acknowledge`, { method: 'PATCH' }),
    getStats: () => request('/alerts/stats'),
  },

  workOrders: {
    getAll: () => request('/workorders'),
    getById: (id: string) => request(`/workorders/${id}`),
    getTechnicians: () => request('/workorders/technicians'),
    approve: (id: string) =>
      request(`/workorders/${id}/approve`, { method: 'PATCH' }),
    assign: (id: string, technicianId: string) =>
      request(`/workorders/${id}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ technicianId }),
      }),
    start: (id: string) =>
      request(`/workorders/${id}/start`, { method: 'PATCH' }),
    complete: (id: string, resolutionNotes: string) =>
      request(`/workorders/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({ resolutionNotes }),
      }),
  },

  simulation: {
    start: () => request('/simulation/start', { method: 'POST' }),
    stop: () => request('/simulation/stop', { method: 'POST' }),
    getStatus: () => request('/simulation/status'),
    triggerFault: (deviceId: string) =>
      request(`/simulation/trigger-fault/${deviceId}`, { method: 'POST' }),
  },
};
