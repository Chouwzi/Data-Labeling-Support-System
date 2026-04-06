import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './Login';
import LandingPage from './LandingPage';
import AdminDashboard from './AdminDashboard';
import ManagerDashboard from './ManagerDashboard';
import AnnotatorDashboard from './AnnotatorDashboard';
import ReviewerDashboard from './ReviewerDashboard';
import Unauthorized from './Unauthorized';
import ProtectedRoute from './components/ProtectedRoute';

const ROLE_ROUTES = {
  ADMIN: '/admin',
  MANAGER: '/manager',
  ANNOTATOR: '/annotator',
  REVIEWER: '/reviewer',
};

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    const target = ROLE_ROUTES[user?.role];
    if (target) {
      return <Navigate to={target} replace />;
    }
  }

  return children;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
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
      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* Role-specific dashboard routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/annotator"
        element={
          <ProtectedRoute allowedRoles={['ANNOTATOR']}>
            <AnnotatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Legacy admin routes (for backwards compat) */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
