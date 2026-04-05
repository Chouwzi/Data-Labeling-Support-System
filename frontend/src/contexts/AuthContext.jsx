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

    if (token && role) {
      setUser({ token, role, email });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((token, role, email = '') => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    if (email) {
      localStorage.setItem('email', email);
    }
    setUser({ token, role, email });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
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
