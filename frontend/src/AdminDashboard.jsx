import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import KpiCard from './components/KpiCard';
import ActivityItem from './components/ActivityItem';
import SystemConfigPanel from './components/SystemConfigPanel';
import BrandLogo from './components/BrandLogo';
import './AdminDashboard.css';

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
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleSaveConfig = (config) => {
    console.log('Configuration saved:', config);
    setToast({
      message: 'Configuration saved successfully',
      type: 'success',
    });
    setTimeout(() => setToast(null), 3000);
  };

  const userName = user?.name || user?.email || 'Julian Casablancas';
  const userRole = 'SENIOR ADMINISTRATOR';

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
                  value="1,284"
                  icon="group"
                  trend="+12%"
                />
                <KpiCard
                  title="Active Projects"
                  value="42"
                  icon="folder_managed"
                />
                <KpiCard
                  title="System Usage"
                  value="76%"
                  subtitle="Storage"
                  variant="wide"
                  progress={76}
                />
                <KpiCard
                  title="Tasks in Progress"
                  value="8,912"
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
                  <button type="button" className="activity-section__view-all">
                    VIEW ALL LOGS
                  </button>
                </div>

                <div className="activity-section__list">
                  {ACTIVITIES.map((activity) => (
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