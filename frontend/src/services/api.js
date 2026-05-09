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
export const login = (email, password) => {
  if (email === 'admin@gmail.com' && password === 'admin123') {
    return Promise.resolve({
      data: {
        result: {
          accessToken: 'mock-jwt-token-admin',
          user: { id: 1, email: 'admin@gmail.com', role: 'MANAGER', full_name: 'Admin Mock' }
        }
      }
    });
  }
  return api.post('/auth/login', { email, password });
};

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

// =====================
// Activity Logs (Audit Logs)
// =====================
export const getLogs = (page = 0, size = 20) =>
  api.get('/audit-logs', {
    params: { page, size }
  });

// =====================
// Projects
// =====================
export const getProjects = () => {
  return new Promise(resolve => setTimeout(() => resolve({
    data: {
      result: [
        { id: 'proj-1', name: 'Summer Dataset' },
        { id: 'proj-2', name: 'Medical Imaging' },
        { id: 'proj-3', name: 'Satellite Alpha' }
      ]
    }
  }), 500));
};
export const createProject = ({ name, description }) =>
  api.post('/projects', {
    name,
    description,
    labels: [],
  });

export const uploadGuidelineFile = (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/projects/${projectId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
// =====================
// Tasks & Progress
// =====================
export const getProjectProgress = (projectId) => {
  const salt = projectId ? String(projectId).charCodeAt(0) + String(projectId).length : 1;
  return new Promise(resolve => setTimeout(() => resolve({
    data: {
      totalTasks: 1000 + salt * 50,
      completed: 400 + salt * 40,
      inProgress: 50 + salt,
      notStarted: 550 + salt * 9
    }
  }), 800));
};


export const uploadImageMock = (projectId, file, onUploadProgress) => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (onUploadProgress) {
        onUploadProgress({ loaded: progress, total: 100 });
      }
      if (progress >= 100) {
        clearInterval(interval);
        resolve({ data: { url: 'mock_url' } });
      }
    }, 200);
  });
};


// =====================
// Label Management 
// =====================

export const getLabelsByProject = (projectId) =>
  api.get(`/projects/${projectId}/labels`);

export const createLabel = (projectId, labelData) =>
  api.post(`/projects/${projectId}/labels`, labelData);

export const updateLabel = (projectId, labelId, labelData) =>
  api.put(`/projects/${projectId}/labels/${labelId}`, labelData);

export const deleteLabel = (projectId, labelId) =>
  api.delete(`/projects/${projectId}/labels/${labelId}`);

export default api;
