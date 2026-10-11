const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('loom-token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        errorMsg = data.error || data.message || errorMsg;
      } catch {
        if (response.status === 504 || response.status === 502) {
          errorMsg = 'Backend server is unreachable. Please verify "npm run server" is running.';
        } else if (text && text.length < 100) {
          errorMsg = text;
        }
      }
    } catch {
      // no-op
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Auth
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('loom-token', data.token);
    }
    return data;
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Looms
  async getLooms() {
    const res = await fetch(`${API_BASE}/looms`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async getLoomById(id) {
    const res = await fetch(`${API_BASE}/looms/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createLoom(loomData) {
    const res = await fetch(`${API_BASE}/looms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(loomData),
    });
    return handleResponse(res);
  },

  async updateLoom(id, loomData) {
    const res = await fetch(`${API_BASE}/looms/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(loomData),
    });
    return handleResponse(res);
  },

  async deleteLoom(id) {
    const res = await fetch(`${API_BASE}/looms/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async executeLoomAction(id, action) {
    const res = await fetch(`${API_BASE}/looms/${id}/action`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action }),
    });
    return handleResponse(res);
  },

  async testWifi(wifiData) {
    const res = await fetch(`${API_BASE}/looms/wifi/test`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(wifiData),
    });
    return handleResponse(res);
  },

  async triggerTelemetryTick() {
    const res = await fetch(`${API_BASE}/looms/telemetry/tick`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createNotification(type, text) {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ type, text }),
    });
    return handleResponse(res);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Settings & Profile
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, { headers: getHeaders() });
    return handleResponse(res);
  },

  async updateSettings(settingsData) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settingsData),
    });
    return handleResponse(res);
  },

  async updateProfile(profileData) {
    const res = await fetch(`${API_BASE}/settings/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse(res);
  },
};
