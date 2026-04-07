import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080') + '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn token vào mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý lỗi 401 → clear token và redirect login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('userId');
      localStorage.removeItem('fullName');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================
// Auth
// =====================
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// =====================
// Users
// =====================
export const getUsers = () => api.get('/users');

export const createUser = (data) => api.post('/users', data);

export const updateUser = (userId, data) => api.put(`/users/${userId}`, data);

export const deleteUser = (userId) => api.delete(`/users/${userId}`);

// =====================
// System Config
// =====================
export const getSystemConfig = () => api.get('/system-config');

export const updateSystemConfig = (data) => api.put('/system-config', data);

export default api;
