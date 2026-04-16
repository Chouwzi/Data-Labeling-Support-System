import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/auth/Login';
import LandingPage from '@/pages/common/LandingPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import ProgressReport from '@/pages/manager/ProgressReport';
import AnnotatorsImageGrid from '@/pages/manager/AnnotatorsImageGrid';
import Projects from '@/pages/manager/Projects';
import UploadImages from '@/pages/manager/UploadImages';
import LabelTaxonomy from '@/pages/manager/LabelTaxonomy';
import AnnotatorDashboard from '@/pages/annotator/AnnotatorDashboard';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import SystemConfig from '@/pages/admin/SystemConfig';
import UsersPage from '@/pages/admin/UsersPage';
import ActivityLog from '@/pages/admin/ActivityLog';
import Unauthorized from '@/pages/common/Unauthorized';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { getDashboardRoute, DEFAULT_ROUTE } from '@/utils/auth';

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardRoute(user?.role)} replace />;
  }

  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDashboardRoute(user?.role)} replace />;
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
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
      {/* Manager projects */}
      <Route
        path="/manager/projects"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/upload-images"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <UploadImages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <AnnotatorsImageGrid />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/taxonomy"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ProgressReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/taxonomy"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <LabelTaxonomy />
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
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
}

export default App;
