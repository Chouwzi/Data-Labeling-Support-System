import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api/v1';

export const getSystemConfig = async (token) => {
  return axios.get(`${API_URL}/system-config`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateSystemConfig = async (data, token) => {
  return axios.put(`${API_URL}/system-config`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
