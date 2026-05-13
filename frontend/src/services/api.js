import axios from 'axios';

const BASE_URL = '/api/v1';

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
  return api.post('/auth/login', { email, password });
};

// =====================
// Users
// =====================
export const getUsers = () => api.get('/users');

export const getAnnotators = () => api.get('/users/annotators');

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
// =====================
// System Config
// =====================
export const getSystemConfig = async () => {
  const res = await api.get('/system-config');
  const data = res.data?.result || res.data;
  // Map snake_case to camelCase for the UI
  return {
    ...res,
    data: {
      ...res.data,
      result: {
        maxImageSize: data.max_image_file_size_mb,
        aiEnabled: data.ai_labeling_enabled,
        defaultPageSize: data.default_page_size,
        allowedExtensions: data.allowed_image_extensions
      }
    }
  };
};

export const updateSystemConfig = (data) => {
  const payload = {
    max_image_file_size_mb: data.maxImageSize,
    ai_labeling_enabled: data.aiEnabled,
    default_page_size: data.defaultPageSize || 25,
    allowed_image_extensions: data.allowedExtensions || ["jpg", "jpeg", "png", "webp"]
  };
  return api.put('/system-config', payload);
};

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
export const getProjects = () => api.get('/projects');

export const getTasks = (projectId, status) =>
  api.get(`/projects/${projectId}/tasks`, { params: { status } });

export const exportProjectCoco = (projectId) =>
  api.get(`/projects/${projectId}/export/coco`);

export const generateTasks = (projectId, datasetId) =>
  api.post(`/projects/${projectId}/tasks/generate`, null, { params: { datasetId } });

export const assignTasks = (projectId, data) =>
  api.put(`/projects/${projectId}/tasks/assign`, data);

export const createProject = ({ name, description }) =>
  api.post('/projects', {
    name,
    description,
    labels: [],
  });

export const createDataset = (name) =>
  api.post('/datasets', { name });

export const updateProject = (projectId, data) =>
  api.put(`/projects/${projectId}`, data);

export const uploadGuidelineFile = (projectId, file) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post(`/projects/${projectId}/files`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Function to upload samples to a dataset
export const uploadSamples = (datasetId, file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file); // Backend expects 'file' key

  return api.post(`/datasets/${datasetId}/samples`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// =====================
// Labels
// =====================
export const getLabelsByProject = (projectId) =>
  api.get(`/projects/${projectId}/labels`);

export const createLabel = (projectId, data) =>
  api.post(`/projects/${projectId}/labels`, data);

export const updateLabel = (projectId, labelId, data) =>
  api.put(`/projects/${projectId}/labels/${labelId}`, data);

export const deleteLabel = (projectId, labelId) =>
  api.delete(`/projects/${projectId}/labels/${labelId}`);

export default api;
