import { useLocation } from 'react-router-dom';
import { LayoutDashboard, Folder, Database, Users, Settings, Activity } from 'lucide-react';
import BrandLogo from './BrandLogo';
import './Sidebar.css';
import { Link } from 'react-router-dom';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { id: 'logs', label: 'Activity Logs', icon: Activity, path: '/admin/logs' },
  { id: 'users', label: 'User Management', icon: Users, path: '/admin/users' },
  { id: 'projects', label: 'Projects', icon: Folder, active: false },
  { id: 'datasets', label: 'Datasets', icon: Database, active: false },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

export default function Sidebar({ isOpen = false, onNavigate }) {
  const location = useLocation();
  
  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <>
      <button
        type="button"
        className={`sidebar__backdrop ${isOpen ? 'sidebar__backdrop--visible' : ''}`}
        aria-hidden={!isOpen}
        tabIndex={-1}
        onClick={() => onNavigate?.()}
        aria-label="Close menu"
      />
      <aside
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar__content">
          <div className="sidebar__brand">
            <div className="sidebar__logo-mark">
              <BrandLogo size={40} />
            </div>
            <h1 className="sidebar__logo-text">DataLabel Pro</h1>
          </div>

          <nav className="sidebar__nav" aria-label="Dashboard sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path || '#'}
                  className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                  onClick={() => {
                    if (item.path) handleNavClick();
                  }}
                >
                  <Icon size={20} className={isActive ? 'active-icon' : ''} />
                  <span className="sidebar__nav-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="sidebar__footer">
          <div className="sidebar__status">
            <p className="sidebar__status-label">SYSTEM STATUS</p>
            <div className="sidebar__status-row">
              <div className="sidebar__status-dot" aria-hidden="true" />
              <span className="sidebar__status-text">All Nodes Healthy</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}