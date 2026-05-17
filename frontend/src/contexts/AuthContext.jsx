import { useState, useCallback } from 'react';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const accessToken = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');

    if (accessToken && role) {
      return { accessToken, role: role.toUpperCase(), email, userId, fullName };
    }
    return null;
  });
  const isLoading = false;

  const login = useCallback((userData) => {
    const { accessToken, role, email, userId, fullName } = userData;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('role', role);
    if (email) localStorage.setItem('email', email);
    if (userId) localStorage.setItem('userId', userId);
    if (fullName) localStorage.setItem('fullName', fullName);
    setUser({ accessToken, role: role ? role.toUpperCase() : role, email, userId, fullName });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    setUser(null);
  }, []);

  const updateProfile = useCallback((fullName, email) => {
    if (fullName) localStorage.setItem('fullName', fullName);
    if (email) localStorage.setItem('email', email);
    setUser(prev => prev ? { ...prev, fullName, email } : null);
  }, []);

  const isAuthenticated = Boolean(user?.accessToken);
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isAnnotator = user?.role === 'ANNOTATOR';
  const isReviewer = user?.role === 'REVIEWER';

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isManager,
    isAnnotator,
    isReviewer,
    isLoading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
