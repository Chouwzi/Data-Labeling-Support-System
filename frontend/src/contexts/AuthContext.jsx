import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');

    if (token && role) {
      setUser({ token, role, email, userId, fullName });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token, role, email = '', userId = null, fullName = '') => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (email) {
      localStorage.setItem('email', email);
    }
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    if (fullName) {
      localStorage.setItem('fullName', fullName);
    }
    setUser({ token, role, email, userId, fullName });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user?.token);
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isStaff,
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
