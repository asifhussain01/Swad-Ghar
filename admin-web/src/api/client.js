import axios from 'axios';

const sanitizeApiUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let url = raw.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (url && !url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const configuredUrl = sanitizeApiUrl(import.meta.env.VITE_API_URL);

export const API_BASE_URL =
  configuredUrl ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://swad-ghar.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('swadghar_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('swadghar_admin_token');
      localStorage.removeItem('swadghar_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default api;
