const API_BASE_URL = '/api/v1';

/**
 * Gửi request đến API với Authorization header tự động
 * @param {string} endpoint - Đường dẫn API (ví dụ: '/users')
 * @param {object} options - Tùy chọn fetch (method, body, headers,...)
 * @returns {Promise<Response>}
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Xử lý khi token hết hạn
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    window.location.href = '/login';
    throw new Error('Unauthorized - Token expired');
  }

  return response;
}

/**
 * Lấy danh sách users từ API
 */
export async function getUsers() {
  const response = await apiRequest('/users');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  const data = await response.json();
  return data.result || [];
}

/**
 * Tạo user mới
 */
export async function createUser(userData) {
  const response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create user');
  }
  const data = await response.json();
  return data.result;
}

/**
 * Cập nhật user
 */
export async function updateUser(userId, userData) {
  const response = await apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update user');
  }
  const data = await response.json();
  return data.result;
}

/**
 * Xóa user
 */
export async function deleteUser(userId) {
  const response = await apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return true;
}

export { API_BASE_URL };
