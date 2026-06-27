import axios from 'axios';

// In production (Vercel), VITE_API_URL is set to the Render backend URL.
// In local dev, requests go through the Vite proxy which rewrites /api → backend.
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s to account for Render free-tier cold starts
});


// ── Request Interceptor: attach JWT token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('healthcareToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('healthcareToken');
      localStorage.removeItem('healthcareUser');
      // Redirect to login only if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── Assessment API ──
export const assessmentAPI = {
  analyze: (data) => api.post('/assessments/analyze', data),
  getHistory: () => api.get('/assessments/history'),
  getAssessment: (id) => api.get(`/assessments/${id}`),
  deleteAssessment: (id) => api.delete(`/assessments/${id}`),
};

// ── Health / Utility API ──
export const healthAPI = {
  getSymptoms: () => api.get('/symptoms'),
  getHealth: () => api.get('/health'),
  getDiseases: () => api.get('/diseases'),
};

export default api;
