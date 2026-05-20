import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, FolderPlus, X } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import BrandLogo from '@/components/common/BrandLogo';
import Modal from '@/components/Modal';
import {
  AttentionQueue,
  DonutMetric,
  MiniBarList,
  PipelineStackedBar,
} from '@/components/dashboard/DashboardCharts';
import { createProject, getManagerDashboard } from '@/services/api';
import '@/styles/ManagerDashboard.css';
import '@/styles/KpiCard.css';

const emptyManagerDashboard = {
  summary: {},
  taskPipeline: [],
  projectHealth: [],
  qualitySnapshot: {},
  topAnnotators: [],
  attentionQueue: [],
};

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboard, setDashboard] = useState(emptyManagerDashboard);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await getManagerDashboard();
      setDashboard(response.data?.result || emptyManagerDashboard);
    } catch (error) {
      console.error('Failed to fetch manager dashboard:', error);
      setLoadError(error.response?.data?.message || 'Unable to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const summary = dashboard.summary || {};
  const dashboardUnavailable = Boolean(loadError);
  const projectHealth = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (dashboard.projectHealth || []).filter((project) => (
      !query || project.name?.toLowerCase().includes(query)
    ));
  }, [dashboard.projectHealth, searchQuery]);

  const qualityItems = [
    { key: 'COMPLETED', label: 'Approved', count: summary.completed || 0, color: '#10b981' },
    { key: 'REJECTED', label: 'Rejected', count: summary.rejected || 0, color: '#ef4444' },
    { key: 'PENDING_REVIEW', label: 'Review', count: summary.pendingReview || 0, color: '#14b8a6' },
  ];

  const closeCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setProjectName('');
    setDescription('');
    setErrors({});
    setSubmitSuccess(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (projectName.trim().length < 3) {
      setErrors({ projectName: 'Project name must be at least 3 characters' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    try {
      await createProject({ name: projectName.trim(), description: description.trim() });
      setSubmitSuccess(true);
      await loadDashboard();
      setTimeout(closeCreateModal, 900);
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Create project failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search projects..."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="manager-dashboard-grid">
            <header className="manager-dashboard-grid__header">
              <div className="manager-page-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="manager-header-row">
                <div>
                  <h1 className="manager-page-title">Manager Workbench</h1>
                  <p className="manager-page-subtitle">
                    Operational view of setup gaps, review bottlenecks, rework, and export readiness.
                  </p>
                </div>
                <button type="button" className="create-project-btn" onClick={() => setIsCreateModalOpen(true)}>
                  <FolderPlus size={18} />
                  Create New Project
                </button>
              </div>
              {loadError && <div className="dashboard-alert">{loadError}</div>}
            </header>

            <section className="manager-stat-row" aria-label="Key metrics">
              <KpiCard title="Projects" value={formatNumber(summary.totalProjects, loading, dashboardUnavailable)} icon="folder_managed" variant="primary" />
              <KpiCard title="Dataset Images" value={formatNumber(summary.datasetImages, loading, dashboardUnavailable)} icon="storage" variant="info" />
              <KpiCard title="Pending Review" value={formatNumber(summary.pendingReview, loading, dashboardUnavailable)} icon="assignment_turned_in" variant="success" />
              <KpiCard title="Rework / Rejected" value={formatNumber(summary.rejected, loading, dashboardUnavailable)} icon="warning" variant="warning" />
            </section>

            <div className="manager-dashboard-grid__main manager-dashboard-grid__main--v2">
              <ProjectHealthTable projects={projectHealth} loading={loading} />
              <PipelineStackedBar
                title="Task Pipeline"
                subtitle="Current task stage distribution across your projects."
                items={dashboard.taskPipeline}
              />
              <div className="manager-lower-grid">
                <DonutMetric
                  title="Quality Snapshot"
                  subtitle={loading ? 'Loading approval rate' : dashboardUnavailable ? 'Approval unavailable' : `Approval ${Number(dashboard.qualitySnapshot?.approvalRate || 0).toFixed(1)}%`}
                  items={qualityItems}
                  centerLabel="Tasks"
                />
                <MiniBarList
                  title="Export Readiness Blockers"
                  subtitle="Projects that need setup or rework before clean export."
                  items={dashboard.projectHealth || []}
                  valueKey="totalTasks"
                  labelKey="name"
                  metaKey="nextAction"
                />
              </div>
            </div>

            <aside className="manager-dashboard-grid__aside manager-dashboard-grid__aside--v2" aria-label="Insights">
              <AttentionQueue
                title="Attention Queue"
                subtitle="Actionable work ordered by operational risk."
                items={dashboard.attentionQueue}
                onNavigate={navigate}
              />
              <MiniBarList
                title="Top Annotators"
                subtitle="Real workload and outcome metrics only."
                items={dashboard.topAnnotators}
                valueKey="total"
                labelKey="name"
                metaKey="email"
              />
            </aside>
          </div>
        </main>

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Create New Project">
          <form onSubmit={handleSubmit} noValidate className="create-project-form">
            {submitSuccess && (
              <div className="success-banner" role="status" aria-live="polite">
                <CheckCircle size={18} />
                <span>Project created successfully.</span>
              </div>
            )}
            <div className="form-field">
              <label className="form-field__label" htmlFor="modal-projectName">
                <FolderPlus size={15} />
                Project Name <span className="form-field__required">*</span>
              </label>
              <input
                type="text"
                id="modal-projectName"
                className={`form-field__input ${errors.projectName ? 'form-field__input--error' : ''}`}
                placeholder="e.g. Road Sign Quality Batch"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              {errors.projectName && <p className="form-field__error" role="alert">{errors.projectName}</p>}
            </div>
            <div className="form-field">
              <label className="form-field__label" htmlFor="modal-description">Description</label>
              <textarea
                id="modal-description"
                className="form-field__textarea"
                placeholder="Describe the labeling goal and scope..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isSubmitting}
                rows={4}
              />
            </div>
            {errors.submit && <p className="form-field__error" role="alert">{errors.submit}</p>}
            <div className="form-actions">
              <button type="submit" className="create-project-submit-btn" disabled={projectName.trim().length < 3 || isSubmitting}>
                <FolderPlus size={16} />
                {isSubmitting ? 'Creating...' : 'Create Project'}
              </button>
              <button type="button" className="cancel-btn" onClick={closeCreateModal} disabled={isSubmitting}>
                <X size={16} />
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}

function ProjectHealthTable({ projects, loading }) {
  return (
    <section className="dash-card project-health-card" aria-label="Project health">
      <div className="dash-card__header">
        <div>
          <h2>Project Health</h2>
          <p>Urgent projects, readiness state, and next action.</p>
        </div>
      </div>
      <div className="project-health-table-wrap">
        <table className="project-health-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Images</th>
              <th>Labels</th>
              <th>Pending Review</th>
              <th>Rework</th>
              <th>Completion</th>
              <th>Next Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7">Loading project health...</td></tr>
            ) : projects.length > 0 ? projects.map((project) => (
              <tr key={project.id}>
                <td>
                  <strong>{project.name}</strong>
                  <span className={`readiness-chip readiness-chip--${String(project.readinessState).toLowerCase()}`}>
                    {formatReadiness(project.readinessState)}
                  </span>
                </td>
                <td>{Number(project.imageCount || 0).toLocaleString()}</td>
                <td>{Number(project.labelCount || 0).toLocaleString()}</td>
                <td>{Number(project.pendingReview || 0).toLocaleString()}</td>
                <td>{Number(project.rejected || 0).toLocaleString()}</td>
                <td>{Number(project.completionRate || 0).toFixed(1)}%</td>
                <td>{project.nextAction}</td>
              </tr>
            )) : (
              <tr><td colSpan="7">No projects match the current search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatNumber(value, loading, unavailable = false) {
  if (loading) return '...';
  if (unavailable) return '--';
  return Number(value || 0).toLocaleString();
}

function formatReadiness(value) {
  return String(value || 'READY').replace(/_/g, ' ').toLowerCase();
}
