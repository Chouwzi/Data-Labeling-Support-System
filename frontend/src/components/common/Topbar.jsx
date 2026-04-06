import { useState, useRef, useEffect } from 'react';
import { Search, Bell, HelpCircle, User, LogOut, Menu, ChevronDown } from 'lucide-react';
import '@/styles/Topbar.css';

export default function Topbar({
  userName = 'Julian Casablancas',
  userRole = 'Senior Administrator',
  userAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  onMenuClick,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    onLogout?.();
  };

  const handleProfile = () => {
    setMenuOpen(false);
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar__inner">
        <div className="topbar__left">
          <button
            type="button"
            className="topbar__menu-btn"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </button>
          <div className="topbar__search">
            <Search size={18} className="topbar__search-icon" />
            <input
              type="text"
              className="topbar__search-input"
              placeholder="Search system configuration..."
              aria-label="Search system configuration"
            />
          </div>
        </div>

        <div className="topbar__right">
          <div className="topbar__actions">
            <button
              type="button"
              className="topbar__icon-btn"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="topbar__notification-dot" aria-hidden="true" />
            </button>
            <button type="button" className="topbar__icon-btn" aria-label="Help">
              <HelpCircle size={20} />
            </button>
          </div>

          <div className="topbar__divider" aria-hidden="true" />

          <div className="topbar__user" ref={menuRef}>
            <div className="topbar__user-info">
              <p className="topbar__user-name">{userName}</p>
              <p className="topbar__user-role">{userRole}</p>
            </div>
            <button
              type="button"
              className="topbar__avatar-btn"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Account menu"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <img alt="" className="topbar__avatar" src={userAvatar} />
              <ChevronDown size={14} className="topbar__chevron" />
            </button>

            {menuOpen && (
              <div className="topbar__dropdown" role="menu">
                <button
                  type="button"
                  className="topbar__dropdown-item"
                  role="menuitem"
                  onClick={handleProfile}
                >
                  <User size={18} />
                  Profile
                </button>
                <button
                  type="button"
                  className="topbar__dropdown-item topbar__dropdown-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
