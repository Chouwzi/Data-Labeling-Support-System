import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  FolderOpen,
  Settings,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import BrandLogo from '@/components/common/BrandLogo';
import SystemConfigPanel from '@/components/system/SystemConfigPanel';
import {
  AttentionQueue,
  AuditSparkline,
  DonutMetric,
  MiniBarList,
  PipelineStackedBar,
} from '@/components/dashboard/DashboardCharts';
import { getAdminDashboard, getSystemConfig, updateSystemConfig } from '@/services/api';
import '@/styles/AdminDashboard.css';

const emptyAdminDashboard = {
  summary: {},
  roleBreakdown: [],
  taskPipeline: [],
  projectSetupBreakdown: [],
  auditActivity: [],
  attentionQueue: [],
  recentActivity: [],
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [dashboard, setDashboard] = useState(emptyAdminDashboard);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [systemConfig, setSystemConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [dashboardRes, configRes] = await Promise.all([
          getAdminDashboard(),
          getSystemConfig().catch((error) => {
            setConfigError(error.response?.data?.message || 'Unable to load system configuration');
            return null;
          }),
        ]);
        setDashboard(dashboardRes.data?.result || emptyAdminDashboard);
        if (configRes) {
          const config = configRes.data?.result || {};
          if (config.maxImageSize !== undefined && config.aiEnabled !== undefined) {
            setSystemConfig({
              maxImageSize: config.maxImageSize,
              aiEnabled: config.aiEnabled,
            });
          } else {
            setConfigError('System configuration response is incomplete');
          }
        }
      } catch (error) {
        console.error('Failed to fetch admin dashboard:', error);
        setLoadError(error.response?.data?.message || 'Unable to load dashboard metrics');
      } finally {
        setLoading(false);
        setConfigLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSaveConfig = async (config) => {
    try {
      await updateSystemConfig(config);
      setSystemConfig({
        maxImageSize: config.maxImageSize,
        aiEnabled: config.aiEnabled,
      });
      setToast({ message: 'Configuration saved successfully', type: 'success' });
    } catch (error) {
      setToast({
        message: error.response?.data?.message || 'Failed to save configuration',
        type: 'error',
      });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const summary = dashboard.summary || {};
  const dashboardUnavailable = Boolean(loadError);
  const userName = user?.fullName || user?.email || 'Administrator';
  const userRole = user?.role ? user.role.replace('_', ' ') : 'USER';

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="admin-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="admin-content">
          <header className="admin-page-header">
            <div className="admin-page-header__brand" aria-hidden="true">
              <BrandLogo size={32} />
              <span className="admin-page-header__brand-name">DataLabel Pro</span>
            </div>
            <div className="admin-page-header__row">
              <div>
                <h1 className="admin-page-title">Admin Operations</h1>
                <p className="admin-page-subtitle">
                  Global view of users, setup gaps, audit activity, and task throughput.
                </p>
              </div>
              <div className="admin-quick-actions" aria-label="Admin quick actions">
                <button type="button" className="admin-action-btn admin-action-btn--primary" onClick={() => navigate('/admin/users')}>
                  <UserPlus size={16} />
                  Create User
                </button>
                <button type="button" className="admin-action-btn" onClick={() => navigate('/admin/projects')}>
                  <FolderOpen size={16} />
                  Open Projects
                </button>
                <button type="button" className="admin-action-btn" onClick={() => navigate('/admin/logs')}>
                  <ClipboardList size={16} />
                  View Audit Logs
                </button>
              </div>
            </div>
            {loadError && <div className="dashboard-alert">{loadError}</div>}
          </header>

          <div className="admin-v2-grid">
            <section className="admin-v2-main">
              <div className="kpi-grid admin-kpi-grid">
                <KpiCard title="Users" value={formatNumber(summary.totalUsers, loading, dashboardUnavailable)} icon="group" trend={formatTrend(summary.activeUsers, 'active', loading, dashboardUnavailable)} />
                <KpiCard title="Projects" value={formatNumber(summary.totalProjects, loading, dashboardUnavailable)} icon="folder_managed" trend={formatTrend(summary.datasetImages, 'images', loading, dashboardUnavailable)} />
                <KpiCard title="Setup Gaps" value={formatNumber(summary.setupGaps, loading, dashboardUnavailable)} icon="warning" variant="warning" />
                <KpiCard title="Active Labeling Tasks" value={formatNumber(summary.activeLabelingTasks, loading, dashboardUnavailable)} icon="assignment_turned_in" variant="success" />
              </div>

              <PipelineStackedBar
                title="Global Task Pipeline"
                subtitle="All task stages across active projects."
                items={dashboard.taskPipeline}
              />

              <div className="admin-chart-grid">
                <MiniBarList
                  title="Project Setup Breakdown"
                  subtitle="Ready projects versus setup blockers."
                  items={dashboard.projectSetupBreakdown}
                  valueKey="count"
                  labelKey="label"
                />
                <AuditSparkline
                  title="Audit Activity"
                  subtitle="Last 7 days of administrative and system events."
                  points={dashboard.auditActivity}
                />
              </div>

              <RecentActivity items={dashboard.recentActivity} onViewAll={() => navigate('/admin/logs')} />
            </section>

            <aside className="admin-v2-aside">
              <DonutMetric
                title="Role Breakdown"
                subtitle="Current user composition."
                items={dashboard.roleBreakdown}
                centerLabel="Users"
              />
              <AttentionQueue
                title="Attention Queue"
                subtitle="Operational risks that need admin action."
                items={dashboard.attentionQueue}
                onNavigate={navigate}
              />
              <section className="admin-control-panel" aria-label="Admin control panel">
                <div className="admin-control-panel__header">
                  <Settings size={20} />
                  <div>
                    <h2>Control Panel</h2>
                    <p>Shortcuts and guarded global settings.</p>
                  </div>
                </div>
                <div className="admin-control-links">
                  <button type="button" onClick={() => navigate('/admin/users')}>User Management</button>
                  <button type="button" onClick={() => navigate('/admin/projects')}>Projects</button>
                  <button type="button" onClick={() => navigate('/admin/system-config')}>System Config</button>
                  <button type="button" onClick={() => navigate('/admin/logs')}>Activity Logs</button>
                </div>
                <div className="admin-config-compact">
                  {configLoading ? (
                    <div className="dashboard-empty">Loading system configuration...</div>
                  ) : systemConfig ? (
                    <SystemConfigPanel
                      initialMaxImageSize={systemConfig.maxImageSize}
                      initialAiEnabled={systemConfig.aiEnabled}
                      onSave={handleSaveConfig}
                    />
                  ) : (
                    <div className="dashboard-empty">{configError || 'System configuration is unavailable'}</div>
                  )}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>

      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <span className="toast__icon">{toast.type === 'success' ? 'OK' : '!'}</span>
          <span className="toast__message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function RecentActivity({ items = [], onViewAll }) {
  return (
    <section className="dash-card admin-recent-card" aria-label="Recent activity">
      <div className="dash-card__header">
        <div>
          <h2>Recent Activity</h2>
          <p>Latest audit events from the system log.</p>
        </div>
        <button type="button" className="activity-section__view-all" onClick={onViewAll}>
          VIEW ALL LOGS
        </button>
      </div>
      <div className="admin-recent-list">
        {items.length > 0 ? items.map((item) => (
          <div key={item.id || `${item.action}-${item.createdAt}`} className={`admin-recent-row admin-recent-row--${item.tone || 'neutral'}`}>
            <strong>{formatAction(item.action)}</strong>
            <span>{item.entityType || 'System'} - {formatDate(item.createdAt)}</span>
          </div>
        )) : <div className="dashboard-empty">No recent audit events</div>}
      </div>
    </section>
  );
}

function formatNumber(value, loading, unavailable = false) {
  if (loading) return '...';
  if (unavailable) return '--';
  return Number(value || 0).toLocaleString();
}

function formatTrend(value, label, loading, unavailable = false) {
  if (loading) return 'Loading';
  if (unavailable) return 'Unavailable';
  return `${Number(value || 0).toLocaleString()} ${label}`;
}

function formatAction(action) {
  return String(action || 'Activity').replace(/_/g, ' ').toLowerCase();
}

function formatDate(value) {
  if (!value) return 'No timestamp';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No timestamp';
  return date.toLocaleString();
}
