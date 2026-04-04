<<<<<<< HEAD
import Login from './Login';

function App() {
  return <Login />;
}

=======
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './Login';
import LandingPage from './LandingPage';
import AdminDashboard from './AdminDashboard';
import StaffDashboard from './StaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/staff/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes - redirect to dashboard if logged in */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/staff/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['STAFF']}>
            <StaffDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Short dashboard route - redirects based on role */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        } 
      />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <Navigate to="/staff/dashboard" replace />;
}

>>>>>>> origin/Feature/LTJ-63-admin-system-settings-ui
export default App;
