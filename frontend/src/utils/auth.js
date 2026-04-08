export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  ANNOTATOR: 'ANNOTATOR',
  REVIEWER: 'REVIEWER',
};

export const ROLE_ROUTES = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.MANAGER]: '/manager',
  [ROLES.ANNOTATOR]: '/annotator',
  [ROLES.REVIEWER]: '/reviewer',
};

export const DEFAULT_ROUTE = '/login';

export const getRole = () => localStorage.getItem('role');

export const isAuthenticated = () => Boolean(localStorage.getItem('accessToken'));

export const getDashboardRoute = (role) => ROLE_ROUTES[role] || DEFAULT_ROUTE;

export const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
  localStorage.removeItem('userId');
  localStorage.removeItem('fullName');
};
