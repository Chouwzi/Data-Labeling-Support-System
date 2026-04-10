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
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('role');
      localStorage.removeItem('email');
      localStorage.removeItem('userId');
      localStorage.removeItem('fullName');

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
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

export const updateUserRole = (user, newRole) => {
  const payload = {
    email: user.email,
    full_name: user.fullName,
    role: newRole,
  };
  console.log('Sending payload (updateUserRole):', payload);
  return api.put(`/users/${user.id}`, payload);
};

export const toggleUserStatus = (user, newActive) => {
  const payload = {
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    active: newActive,
  };
  console.log('Sending payload (toggleUserStatus):', payload);
  return api.put(`/users/${user.id}`, payload);
};

// =====================
// System Config
// =====================
export const getSystemConfig = () => api.get('/system-config');

export const updateSystemConfig = (data) => api.put('/system-config', data);

export default api;
