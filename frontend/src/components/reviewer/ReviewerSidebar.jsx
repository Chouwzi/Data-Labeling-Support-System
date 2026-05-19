import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ClipboardCheck, BarChart2 } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import '@/styles/Sidebar.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/reviewer' },
  { id: 'completed', label: 'Review Stats', icon: BarChart2, path: '/reviewer/completed' },
];

export default function ReviewerSidebar({ isOpen = false, onNavigate }) {
  const location = useLocation();

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <>
      <div
        className={`sidebar__backdrop ${isOpen ? 'sidebar__backdrop--visible' : ''}`}
        onClick={() => onNavigate?.()}
        aria-hidden="true"
      />
      <aside
        className={`sidebar sidebar--reviewer ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Reviewer navigation"
      >
        <div className="sidebar__content">
          <div className="sidebar__brand">
            <div className="sidebar__logo-mark">
              <BrandLogo size={40} />
            </div>
            <h1 className="sidebar__logo-text">DataLabel Pro</h1>
          </div>

          <nav className="sidebar__nav" aria-label="Reviewer sections">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/reviewer' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                  onClick={handleNavClick}
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
            <p className="sidebar__status-label">REVIEW STATUS</p>
            <div className="sidebar__status-row">
              <div className="sidebar__status-dot" aria-hidden="true" />
              <span className="sidebar__status-text">Ready for verification</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
