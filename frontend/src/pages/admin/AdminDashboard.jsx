import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import SystemConfigPanel from '@/components/system/SystemConfigPanel';
import BrandLogo from '@/components/common/BrandLogo';
import '@/styles/AdminDashboard.css';

const ACTIVITIES = [
  {
    id: 1,
    icon: 'person_edit',
    iconBgClass: 'activity-item__icon--secondary-container',
    iconColorClass: 'activity-item__icon--text-secondary-container',
    message: (
      <>
        <strong>Julian Casablancas</strong> updated role for annotator
      </>
    ),
    timestamp: '2 MINUTES AGO',
    category: 'USER MANAGEMENT',
  },
  {
    id: 2,
    icon: 'check_circle',
    iconBgClass: 'activity-item__icon--primary-container',
    iconColorClass: 'activity-item__icon--text-primary-container',
    message: (
      <>
        Project <strong>Visual-QA-Alpha</strong> completed
      </>
    ),
    timestamp: '45 MINUTES AGO',
    category: 'PROJECT PIPELINE',
  },
  {
    id: 3,
    icon: 'warning',
    iconBgClass: 'activity-item__icon--tertiary-container',
    iconColorClass: 'activity-item__icon--text-tertiary',
    message: (
      <>
        Storage quota exceeded for node <strong>AWS-US-EAST-1</strong>
      </>
    ),
    timestamp: '2 HOURS AGO',
    category: 'SYSTEM ALERT',
  },
];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [dashboardData, setDashboardData] = useState({
    totalUsers: '...',
    activeProjects: '...',
    systemUsage: '76%',
    tasksInProgress: '8,912',
  });
  const [recentActivities, setRecentActivities] = useState(ACTIVITIES);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  useEffect(() => {
      const fetchData = async () => {
        try {
          const { getUsers, getProjects, getLogs } = await import('@/services/api');
          const [usersRes, projectsRes, logsRes] = await Promise.all([
            getUsers().catch(() => ({ data: { result: [] } })),
            getProjects().catch(() => ({ data: { result: { content: [] } } })),
            getLogs(0, 3).catch(() => ({ data: { result: { content: [] } } }))
          ]);
          
          const usersList = usersRes.data?.result || [];
          const totalUsers = usersList.length;

          const projectsList = projectsRes.data?.result?.content || projectsRes.data?.result || [];
          const activeProjects = Array.isArray(projectsList) ? projectsList.length : 0;
          
          const logsList = logsRes.data?.result?.content || [];
          const mappedActivities = logsList.map((log, index) => {
            let icon = 'check_circle';
            let bgClass = 'activity-item__icon--primary-container';
            let colorClass = 'activity-item__icon--text-primary-container';
            
            if (log.action?.includes('USER')) {
              icon = 'person_edit';
              bgClass = 'activity-item__icon--secondary-container';
              colorClass = 'activity-item__icon--text-secondary-container';
            } else if (log.action?.includes('CONFIG') || log.action?.includes('ERROR')) {
              icon = 'warning';
              bgClass = 'activity-item__icon--tertiary-container';
              colorClass = 'activity-item__icon--text-tertiary';
            }

            return {
              id: log.id || `log-${index}`,
              icon,
              iconBgClass: bgClass,
              iconColorClass: colorClass,
              message: (
                <>
                  <strong>{log.createdBy}</strong> performed {log.action}
                </>
              ),
              timestamp: new Date(log.timestamp).toLocaleString(),
              category: 'SYSTEM LOG',
            };
          });

          setDashboardData(prev => ({
            ...prev,
            totalUsers: totalUsers.toString(),
            activeProjects: activeProjects.toString()
          }));
          
          if (mappedActivities.length > 0) {
            setRecentActivities(mappedActivities);
          }
        } catch (error) {
          console.error('Failed to fetch dashboard data:', error);
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
      const { updateSystemConfig } = await import('@/services/api');
      await updateSystemConfig(config);
      setToast({ message: 'Configuration saved successfully', type: 'success' });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save configuration',
        type: 'error',
      });
    }
    setTimeout(() => setToast(null), 3000);
  };

  // Logic điều hướng sang trang Nhật ký (LTJ-58)
  const handleViewAllLogs = () => {
    navigate('/admin/logs');
  };

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
            <h1 className="admin-page-title">Admin Dashboard</h1>
            <p className="admin-page-subtitle">
              Monitor system status and control configuration for the Data Labeling Support System ecosystem.
            </p>
          </header>

          <div className="admin-grid">
            <section className="admin-left-col">
              <div className="kpi-grid">
                <KpiCard
                  title="Total Users"
                  value={dashboardData.totalUsers}
                  icon="group"
                  trend="Real-time"
                />
                <KpiCard
                  title="Active Projects"
                  value={dashboardData.activeProjects}
                  icon="folder_managed"
                />
                <KpiCard
                  title="System Usage"
                  value={dashboardData.systemUsage}
                  subtitle="Storage"
                  variant="wide"
                  progress={76}
                />
                <KpiCard
                  title="Tasks in Progress"
                  value={dashboardData.tasksInProgress}
                  variant="activity"
                  dotColors={['#10b981', '#34d399', '#6ee7b7']}
                />
              </div>

              <section
                className="activity-section"
                aria-labelledby="recent-activity-heading"
              >
                <div className="activity-section__header">
                  <h2 className="activity-section__title" id="recent-activity-heading">
                    Recent Activity
                  </h2>
                  <button
                    type="button"
                    className="activity-section__view-all"
                    onClick={() => navigate('/admin/logs')}
                  >
                    VIEW ALL LOGS
                  </button>
                </div>

                <div className="activity-section__list">
                  {recentActivities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      icon={activity.icon}
                      iconBgClass={activity.iconBgClass}
                      iconColorClass={activity.iconColorClass}
                      message={activity.message}
                      timestamp={activity.timestamp}
                      category={activity.category}
                    />
                  ))}
                </div>
              </section>
            </section>

            <aside className="admin-right-col">
              <SystemConfigPanel onSave={handleSaveConfig} />
            </aside>
          </div>
        </main>
      </div>

      {toast && (
        <div className={`toast toast--${toast.type}`}>
          <span className="toast__icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="toast__message">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
