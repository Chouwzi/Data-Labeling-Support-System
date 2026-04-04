import { LayoutDashboard, Folder, Database, Users, Settings } from 'lucide-react';
import BrandLogo from './BrandLogo';
import './Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { id: 'projects', label: 'Projects', icon: Folder, active: false },
  { id: 'datasets', label: 'Datasets', icon: Database, active: false },
  { id: 'users', label: 'Users', icon: Users, active: false },
  { id: 'settings', label: 'Settings', icon: Settings, active: false },
];

export default function Sidebar({ isOpen = false, onNavigate }) {
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
              return (
                <a
                  key={item.id}
                  href="#"
                  className={`sidebar__nav-item ${item.active ? 'sidebar__nav-item--active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick();
                  }}
                >
                  <Icon size={20} className={item.active ? 'active-icon' : ''} />
                  <span className="sidebar__nav-label">{item.label}</span>
                </a>
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