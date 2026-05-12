import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');

    if (accessToken && role) {
      setUser({ accessToken, role: role.toUpperCase(), email, userId, fullName });
    }
    setIsLoading(false);
  }, []);

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
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
