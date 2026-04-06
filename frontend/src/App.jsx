import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/auth/Login';
import LandingPage from '@/pages/common/LandingPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import AnnotatorDashboard from '@/pages/annotator/AnnotatorDashboard';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import SystemConfig from '@/pages/admin/SystemConfig';
import UsersPage from '@/pages/admin/UsersPage';
import ActivityLog from '@/pages/admin/ActivityLog';
import Unauthorized from '@/pages/common/Unauthorized';
import ProtectedRoute from '@/components/common/ProtectedRoute';

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

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <ActivityLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system-config"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <SystemConfig />
          </ProtectedRoute>
        }
      />

      {/* Other role dashboards */}
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

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
