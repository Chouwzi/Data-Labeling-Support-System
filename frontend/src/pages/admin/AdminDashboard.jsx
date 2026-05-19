import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import SystemConfigPanel from '@/components/system/SystemConfigPanel';
import BrandLogo from '@/components/common/BrandLogo';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  FolderOpen,
  Settings,
  UserPlus,
} from 'lucide-react';
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
    activeUsers: '...',
    lockedUsers: '...',
    activeProjects: '...',
    projectsNeedingSetup: '...',
    systemUsage: '76%',
    tasksInProgress: '8,912',
  });
  const [recentActivities, setRecentActivities] = useState(ACTIVITIES);
  const [attentionItems, setAttentionItems] = useState([]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  useEffect(() => {
      const fetchData = async () => {
        try {
          const { getUsers, getProjects, getLogs, getTasks } = await import('@/services/api');
          const [usersRes, projectsRes, logsRes] = await Promise.all([
            getUsers().catch(() => ({ data: { result: [] } })),
            getProjects().catch(() => ({ data: { result: { content: [] } } })),
            getLogs(0, 3).catch(() => ({ data: { result: { content: [] } } }))
          ]);
          
          const usersList = usersRes.data?.result || [];
          const totalUsers = usersList.length;
          const activeUsers = usersList.filter((u) => u.active !== false).length;
          const lockedUsers = Math.max(0, totalUsers - activeUsers);

          const projectsList = projectsRes.data?.result?.data || projectsRes.data?.result?.content || projectsRes.data?.result || [];
          const activeProjects = Array.isArray(projectsList) ? projectsList.length : 0;
          
          let totalTasksInProgress = 0;
          let totalTasks = 0;

          if (Array.isArray(projectsList)) {
            await Promise.all(
              projectsList.map(async (project) => {
                try {
                  const tasksRes = await getTasks(project.id);
                  const tasks = Array.isArray(tasksRes.data?.result) ? tasksRes.data.result : (Array.isArray(tasksRes.data) ? tasksRes.data : []);
                  totalTasks += tasks.length;
                  totalTasksInProgress += tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
                } catch (err) {
                  console.error(`Failed to fetch tasks for project ${project.id}:`, err);
                }
              })
            );
          }

          const projectsNeedingSetup = Array.isArray(projectsList)
            ? projectsList.filter((project) => {
                const labelsCount = Array.isArray(project.labels)
                  ? project.labels.length
                  : Number(project.labels || project.labelCount || 0);
                const imageCount = Number(project.imageCount || project.images || project.sampleCount || 0);
                return labelsCount === 0 || (!project.datasetId && imageCount === 0);
              }).length
            : 0;

          const calculatedUsage = Math.max(8, Math.min(95, Math.round(((totalTasks * 1.2) / 1000) * 100)));

          const userMap = {};
          usersList.forEach(u => {
            userMap[u.id] = u.fullName || u.email || 'System User';
          });

          const logsList = Array.isArray(logsRes.data?.result)
            ? logsRes.data.result
            : Array.isArray(logsRes.data)
            ? logsRes.data
            : [];
            
          const mappedActivities = logsList.slice(0, 3).map((log, index) => {
            let icon = 'check_circle';
            let bgClass = 'activity-item__icon--primary-container';
            let colorClass = 'activity-item__icon--text-primary-container';
            
            if (log.action?.includes('USER') || log.action?.includes('ROLE')) {
              icon = 'person_edit';
              bgClass = 'activity-item__icon--secondary-container';
              colorClass = 'activity-item__icon--text-secondary-container';
            } else if (log.action?.includes('CONFIG') || log.action?.includes('ERROR') || log.action?.includes('DELETE')) {
              icon = 'warning';
              bgClass = 'activity-item__icon--tertiary-container';
              colorClass = 'activity-item__icon--text-tertiary';
            }

            const userName = userMap[log.userId] || 'System User';
            const actionTextMap = {
              CREATE_PROJECT: 'created a new project',
              VIEW_ALL_PROJECTS: 'viewed all projects',
              VIEW_PROJECT: 'viewed project details',
              UPDATE_PROJECT: 'updated a project',
              DELETE_PROJECT: 'deleted a project',
              VIEW_AUDIT_LOGS: 'viewed system audit logs',
              UPDATE_ROLE: 'updated user role',
              TOGGLE_STATUS: 'toggled user status',
            };
            const actionFormatted = actionTextMap[log.action] || `performed ${log.action?.toLowerCase().replace(/_/g, ' ')}`;

            const dateVal = log.createdAt;
            const parseDate = (dVal) => {
              if (!dVal) return new Date();
              try {
                if (Array.isArray(dVal)) {
                  const [y, m, d, h = 0, min = 0, s = 0] = dVal;
                  return new Date(y, m - 1, d, h, min, s);
                }
                return new Date(dVal);
              } catch {
                return new Date();
              }
            };
            const dateObj = parseDate(dateVal);
            
            const formatTimeAgo = (date) => {
              const seconds = Math.floor((new Date() - date) / 1000);
              if (seconds < 60) return 'JUST NOW';
              const minutes = Math.floor(seconds / 60);
              if (minutes < 60) return `${minutes} MINUTES AGO`;
              const hours = Math.floor(minutes / 60);
              if (hours < 24) return `${hours} HOURS AGO`;
              const days = Math.floor(hours / 24);
              return `${days} DAYS AGO`;
            };

            return {
              id: log.id || `log-${index}`,
              icon,
              iconBgClass: bgClass,
              iconColorClass: colorClass,
              message: (
                <>
                  <strong>{userName}</strong> {actionFormatted}
                </>
              ),
              timestamp: formatTimeAgo(dateObj),
              category: log.entityType || 'SYSTEM LOG',
            };
          });

          setDashboardData(prev => ({
            ...prev,
            totalUsers: totalUsers.toString(),
            activeUsers: activeUsers.toString(),
            lockedUsers: lockedUsers.toString(),
            activeProjects: activeProjects.toString(),
            projectsNeedingSetup: projectsNeedingSetup.toString(),
            systemUsage: `${calculatedUsage}%`,
            tasksInProgress: totalTasksInProgress.toLocaleString()
          }));

          const nextAttentionItems = [
            {
              id: 'setup',
              tone: projectsNeedingSetup > 0 ? 'warning' : 'success',
              title: projectsNeedingSetup > 0 ? `${projectsNeedingSetup} projects need setup` : 'Project setup is clear',
              description: projectsNeedingSetup > 0
                ? 'Add labels or upload datasets before task generation.'
                : 'Projects have the required labeling setup.',
              action: 'Review projects',
              path: '/admin/projects',
            },
            {
              id: 'tasks',
              tone: totalTasksInProgress > 0 ? 'info' : 'success',
              title: `${totalTasksInProgress.toLocaleString()} active labeling tasks`,
              description: totalTasksInProgress > 0
                ? 'Monitor assignment progress and reviewer handoff.'
                : 'No active task bottleneck detected.',
              action: 'Open projects',
              path: '/admin/projects',
            },
            {
              id: 'audit',
              tone: mappedActivities.some((activity) => activity.icon === 'warning') ? 'warning' : 'info',
              title: mappedActivities.length > 0 ? 'Audit trail updated recently' : 'No recent audit events',
              description: mappedActivities.length > 0
                ? 'Review recent user and system configuration changes.'
                : 'System activity is quiet right now.',
              action: 'View audit logs',
              path: '/admin/logs',
            },
          ];
          setAttentionItems(nextAttentionItems);
          
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
                  Monitor system health, resolve setup gaps, and jump into the highest-impact admin work.
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
          </header>

          <div className="admin-grid">
            <section className="admin-left-col">
              <div className="kpi-grid">
                <KpiCard
                  title="Total Users"
                  value={dashboardData.totalUsers}
                  icon="group"
                  trend={`${dashboardData.activeUsers} active`}
                />
                <KpiCard
                  title="Active Projects"
                  value={dashboardData.activeProjects}
                  icon="folder_managed"
                  trend={`${dashboardData.projectsNeedingSetup} need setup`}
                />
                <KpiCard
                  title="System Usage"
                  value={dashboardData.systemUsage}
                  subtitle="Storage"
                  variant="wide"
                  progress={parseInt(dashboardData.systemUsage) || 8}
                />
                <KpiCard
                  title="Tasks in Progress"
                  value={dashboardData.tasksInProgress}
                  variant="activity"
                  dotColors={['#10b981', '#34d399', '#6ee7b7']}
                />
              </div>

              <section className="attention-section" aria-labelledby="attention-queue-heading">
                <div className="activity-section__header">
                  <div>
                    <h2 className="activity-section__title" id="attention-queue-heading">
                      Attention Queue
                    </h2>
                    <p className="attention-section__subtitle">Work that may block labeling throughput or system confidence.</p>
                  </div>
                </div>
                <div className="attention-list">
                  {(attentionItems.length > 0 ? attentionItems : [
                    {
                      id: 'loading',
                      tone: 'info',
                      title: 'Checking admin operations',
                      description: 'Loading projects, users, tasks, and audit activity.',
                      action: 'Refresh',
                      path: '/admin',
                    },
                  ]).map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`attention-item attention-item--${item.tone}`}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="attention-item__icon">
                        {item.tone === 'warning' ? <AlertTriangle size={18} /> : <ArrowRight size={18} />}
                      </span>
                      <span className="attention-item__content">
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </span>
                      <span className="attention-item__action">
                        {item.action}
                        <ArrowRight size={14} />
                      </span>
                    </button>
                  ))}
                </div>
              </section>

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
              <section className="admin-control-panel" aria-label="Admin control panel">
                <div className="admin-control-panel__header">
                  <Settings size={20} />
                  <div>
                    <h2>Control Panel</h2>
                    <p>Shortcuts and guarded global settings.</p>
                  </div>
                </div>
                <div className="admin-control-links">
                  <button type="button" onClick={() => navigate('/admin/users')}>User Management <ArrowRight size={14} /></button>
                  <button type="button" onClick={() => navigate('/admin/projects')}>Projects <ArrowRight size={14} /></button>
                  <button type="button" onClick={() => navigate('/admin/system-config')}>System Config <ArrowRight size={14} /></button>
                  <button type="button" onClick={() => navigate('/admin/logs')}>Activity Logs <ArrowRight size={14} /></button>
                </div>
                <div className="admin-config-compact">
                  <SystemConfigPanel onSave={handleSaveConfig} />
                </div>
              </section>
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
