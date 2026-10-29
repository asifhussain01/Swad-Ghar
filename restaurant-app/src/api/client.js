import axios from 'axios';
import { Platform } from 'react-native';

const LIVE_RENDER_API = 'https://swad-ghar.onrender.com/api';
const LIVE_RENDER_SOCKET = 'https://swad-ghar.onrender.com';

const cleanUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  return raw.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
};

// Connects to live Render backend by default; supports local override when needed
const getBaseURL = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    const custom = cleanUrl(process.env.EXPO_PUBLIC_API_URL);
    return custom.endsWith('/api') ? custom : `${custom}/api`;
  }
  if (process.env.EXPO_PUBLIC_USE_LOCAL === 'true') {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:5000/api`;
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  return LIVE_RENDER_API;
};

export const getSocketURL = () => {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return cleanUrl(process.env.EXPO_PUBLIC_SOCKET_URL);
  }
  if (process.env.EXPO_PUBLIC_API_URL) {
    return cleanUrl(process.env.EXPO_PUBLIC_API_URL).replace(/\/api$/, '');
  }
  if (process.env.EXPO_PUBLIC_USE_LOCAL === 'true') {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:5000`;
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
  }
  return LIVE_RENDER_SOCKET;
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 25000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Non-blocking warm-up ping for Render cold start
setTimeout(() => {
  api.get('/health').catch(() => {});
}, 200);

export const setAuthHeader = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export default api;
