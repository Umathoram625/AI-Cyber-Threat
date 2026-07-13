import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject JWT token into all outbound request headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Catch 401 Unauthorized errors and force logouts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      // If we are not already on the login page, redirect
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { access_token, role, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  googleLogin: async (credential) => {
    const response = await api.post('/api/auth/google', { credential });
    const { access_token, role, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  register: async (email, password, fullName) => {
    const response = await api.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  updateProfile: async (fullName, password) => {
    const response = await api.put('/api/auth/profile', {
      full_name: fullName,
      password: password || undefined,
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email, token, newPassword) => {
    const response = await api.post('/api/auth/reset-password', {
      email,
      new_password: newPassword,
    });
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  isAdmin: () => {
    return localStorage.getItem('role') === 'admin';
  },
};

export const threatService = {
  getThreats: async (filters = {}) => {
    const response = await api.get('/api/threats', { params: filters });
    return response.data;
  },

  getThreatDetails: async (id) => {
    const response = await api.get(`/api/threats/${id}`);
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/api/threats/summary-stats');
    return response.data;
  },

  createThreat: async (threatData) => {
    const response = await api.post('/api/threats', threatData);
    return response.data;
  },

  updateThreat: async (id, data) => {
    const response = await api.put(`/api/threats/${id}`, data);
    return response.data;
  },

  deleteThreat: async (id) => {
    const response = await api.delete(`/api/threats/${id}`);
    return response.data;
  },
};

export const chatService = {
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/api/chat', {
      message,
      session_id: sessionId,
    });
    return response.data;
  },

  getSessions: async () => {
    const response = await api.get('/api/chat/sessions');
    return response.data;
  },

  getSessionDetails: async (sessionId) => {
    const response = await api.get(`/api/chat/sessions/${sessionId}`);
    return response.data;
  },
};

export const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/api/analytics/overview');
    return response.data;
  },
};

export const reportService = {
  downloadPdfReport: async () => {
    const response = await api.get('/api/reports/download', {
      responseType: 'blob',
    });
    
    // Create browser download link for the blob
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    link.setAttribute('download', `cti_threat_intelligence_${dateStr}.pdf`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const adminService = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },

  getLogs: async () => {
    const response = await api.get('/api/admin/logs');
    return response.data;
  },

  refreshNews: async () => {
    const response = await api.post('/api/admin/news/refresh');
    return response.data;
  },

  getKeys: async () => {
    const response = await api.get('/api/admin/keys');
    return response.data;
  },

  updateKeys: async (keysData) => {
    const response = await api.post('/api/admin/keys', keysData);
    return response.data;
  },
};

export default api;
