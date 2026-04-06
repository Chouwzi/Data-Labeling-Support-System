export const getRole = () => localStorage.getItem('role');
export const isAuthenticated = () => !!localStorage.getItem('accessToken');
export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('role');
};
