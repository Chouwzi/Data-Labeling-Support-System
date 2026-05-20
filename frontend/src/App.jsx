import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Login from '@/pages/auth/Login';
import LandingPage from '@/pages/common/LandingPage';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManagerDashboard from '@/pages/manager/ManagerDashboard';
import ProgressReport from '@/pages/manager/ProgressReport';
import AnnotatorsImageGrid from '@/pages/manager/AnnotatorsImageGrid';
import Projects from '@/pages/manager/Projects';
import ProjectDetail from '@/pages/manager/ProjectDetail';
import Datasets from '@/pages/manager/Datasets';
import UploadImages from '@/pages/manager/UploadImages';
import LabelTaxonomy from '@/pages/manager/LabelTaxonomy';
import AnnotatorDashboard from '@/pages/annotator/AnnotatorDashboard';
import AnnotatorTasks from '@/pages/annotator/AnnotatorTasks';
import AnnotatorSettings from '@/pages/annotator/AnnotatorSettings';
import ReviewerDashboard from '@/pages/reviewer/ReviewerDashboard';
import ReviewWorkspace from '@/pages/reviewer/ReviewWorkspace';
import AnnotatorWorkspace from '@/pages/annotator/AnnotatorWorkspace';
import SystemConfig from '@/pages/admin/SystemConfig';
import UsersPage from '@/pages/admin/UsersPage';
import ActivityLog from '@/pages/admin/ActivityLog';
import Unauthorized from '@/pages/common/Unauthorized';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { getDashboardRoute, DEFAULT_ROUTE } from '@/utils/auth';

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  console.log('PublicRoute', { isAuthenticated, isLoading, user });

  if (isLoading) {
    console.log('PublicRoute is loading, returning null');
    return null;
  }

  if (isAuthenticated) {
    const target = getDashboardRoute(user?.role);
    if (target !== '/login') {
      return <Navigate to={target} replace />;
    }
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
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Projects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects/:projectId"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/datasets"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Datasets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/datasets/:datasetId"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Datasets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/taxonomy"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LabelTaxonomy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/taxonomy/:projectId"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <LabelTaxonomy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/upload-images"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <UploadImages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/annotators"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AnnotatorsImageGrid />
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
        path="/manager/projects/:projectId"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/datasets"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <Datasets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/datasets/:datasetId"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <Datasets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/groups"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/upload-images"
        element={<Navigate to="/manager/projects" replace />}
      />
      <Route
        path="/manager/annotators"
        element={<Navigate to="/manager/projects" replace />}
      />
      <Route
        path="/manager/reports"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ProgressReport />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/progress"
        element={
          <ProtectedRoute allowedRoles={['MANAGER']}>
            <ProgressReport />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manager/taxonomy"
        element={<Navigate to="/manager/projects" replace />}
      />
      <Route
        path="/manager/taxonomy/:projectId"
        element={<Navigate to="/manager/projects" replace />}
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
        path="/annotator/settings"
        element={
          <ProtectedRoute allowedRoles={['ANNOTATOR']}>
            <AnnotatorSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/annotator/projects"
        element={
          <ProtectedRoute allowedRoles={['ANNOTATOR']}>
            <AnnotatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/annotator/projects/:projectId/tasks"
        element={
          <ProtectedRoute allowedRoles={['ANNOTATOR']}>
            <AnnotatorTasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/annotator/projects/:projectId/workspace/:taskId"
        element={
          <ProtectedRoute allowedRoles={['ANNOTATOR']}>
            <AnnotatorWorkspace />
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
      <Route
        path="/reviewer/completed"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/projects"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/tasks"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <ReviewerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviewer/workspace/:id"
        element={
          <ProtectedRoute allowedRoles={['REVIEWER']}>
            <ReviewWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
    </Routes>
  );
}

export default App;
