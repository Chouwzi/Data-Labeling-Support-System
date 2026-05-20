import axios from 'axios';

const BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn token vào mọi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const isLoginRequest = config.url?.includes('/auth/login');

    if (token && !isLoginRequest) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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

export const getGroups = () => api.get('/groups');

export const createGroup = (data) => api.post('/groups', data);

export const updateGroup = (groupId, data) => api.put(`/groups/${groupId}`, data);

export const deleteGroup = (groupId) => api.delete(`/groups/${groupId}`);

export const getGroupMembers = (groupId) => api.get(`/groups/${groupId}/members`);

export const createUser = (data) => api.post('/users', data);

export const updateUser = (userId, data) => api.put(`/users/${userId}`, data);

export const deleteUser = (userId) => api.delete(`/users/${userId}`);

export const updateUserRole = (user, newRole) => {
  const payload = {
    email: user.email,
    full_name: user.fullName,
    role: newRole,
    active: user.active,
    group_id: user.groupId || user.group_id || null,
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
export const getProjects = (params = {}) => api.get('/projects', { params: { page: 0, size: 24, ...params } });
export const getMyProjects = (params = {}) => api.get('/me/projects', { params: { page: 0, size: 24, ...params } });
export const getProject = (projectId) => api.get(`/projects/${projectId}`);

export const deleteProject = (projectId) => api.delete(`/projects/${projectId}`);

export const getTasks = (projectId, status) =>
  api.get(`/projects/${projectId}/tasks`, { params: { status } });

export const exportProjectCoco = (projectId) =>
  api.get(`/projects/${projectId}/export/coco.zip`, { responseType: 'blob' });

export const generateTasks = (projectId, datasetId) =>
  api.post(`/projects/${projectId}/tasks/generate`, null, { params: { datasetId } });

export const assignTasks = (projectId, data) =>
  api.put(`/projects/${projectId}/tasks/assign`, data);

export const createProject = ({ name, description, managerId, manager_id }) =>
  api.post('/projects', {
    name,
    description,
    manager_id: managerId || manager_id || null,
    labels: [],
  });

export const getDatasets = (params = {}) => api.get('/datasets', { params: { page: 0, size: 24, ...params } });

export const getDataset = (datasetId) => api.get(`/datasets/${datasetId}`);

export const getDatasetSamples = (datasetId, params = {}) => api.get(`/datasets/${datasetId}/samples`, { params: { page: 0, size: 24, ...params } });

export const createDataset = (data) =>
  api.post('/datasets', typeof data === 'string' ? { name: data } : data);

export const updateDataset = (datasetId, data) =>
  api.put(`/datasets/${datasetId}`, data);

export const deleteDataset = (datasetId) => api.delete(`/datasets/${datasetId}`);

export const deleteDatasetSample = (datasetId, sampleId) => api.delete(`/datasets/${datasetId}/samples/${sampleId}`);

export const updateProject = (projectId, data) =>
  api.put(`/projects/${projectId}`, data);

export const updateProjectManager = (projectId, managerId) =>
  api.put(`/projects/${projectId}/manager`, { manager_id: managerId });

export const updateProjectReviewers = (projectId, reviewerIds) =>
  api.put(`/projects/${projectId}/reviewers`, { reviewer_ids: reviewerIds });

export const getProjectWorkload = (projectId) =>
  api.get(`/projects/${projectId}/workload`);

export const splitProjectTasks = (projectId, data) =>
  api.post(`/projects/${projectId}/tasks/split`, data);

export const getProjectPerformance = (projectId) =>
  api.get(`/projects/${projectId}/performance`);

export const getAdminUserPerformance = () =>
  api.get('/admin/users/performance');

export const getMyPerformance = () =>
  api.get('/me/performance');

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

// =====================
// Tasks / Assigned Images
// =====================
export const getMyAssignedImages = (params) =>
  api.get('/me/assigned-images', { params });

export const submitReadyImages = (projectId) =>
  api.post(`/me/projects/${projectId}/tasks/submit-ready`);

export const getAnnotations = (taskId) =>
  api.get(`/tasks/${taskId}/annotations`);

export const saveTaskAnnotations = (taskId, annotations, submit = false) =>
  api.put(`/tasks/${taskId}/annotations`, { annotations, submit });

// =====================
// Reviewer API Services
// =====================
export const getReviewQueueImages = (projectId, page = 0, size = 24) =>
  api.get('/review-queue/images', {
    params: { projectId, page, size }
  });

export const getCompletedReviewImages = (projectId, page = 0, size = 24) =>
  api.get('/review-queue/completed', {
    params: { projectId, page, size }
  });

export const approveReviewImage = (taskId) =>
  api.post(`/review-queue/images/${taskId}/approve`);

export const rejectReviewImage = (taskId, defectCategoryId, comments) =>
  api.post(`/review-queue/images/${taskId}/reject`, {
    defect_category_id: defectCategoryId,
    comments: comments
  });

export const getDefectCategories = () =>
  api.get('/defect-categories');

export const createDefectCategory = (data) =>
  api.post('/defect-categories', data);

export const updateDefectCategory = (categoryId, data) =>
  api.put(`/defect-categories/${categoryId}`, data);

export const deleteDefectCategory = (categoryId) =>
  api.delete(`/defect-categories/${categoryId}`);

export const getReviewStats = (params = {}) =>
  api.get('/review-queue/stats', { params });

export const getReviewHistory = (params = {}) =>
  api.get('/review-queue/completed', { params });

export default api;
