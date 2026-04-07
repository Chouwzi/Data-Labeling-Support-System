import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import '@/styles/Dashboard.css';

export default function ManagerDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="dashboard-wrapper">
      <div className="dashboard-header fade-in-up">
        <div className="dashboard-logo">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="40" height="40" rx="10" fill="#006c51" fillOpacity="0.1" stroke="#006c51" strokeWidth="1.5"/>
            <circle cx="16" cy="16" r="5" fill="#006c51"/>
            <circle cx="32" cy="16" r="5" fill="#00a67e"/>
            <circle cx="16" cy="32" r="5" fill="#00a67e"/>
            <circle cx="32" cy="32" r="5" fill="#006c51"/>
          </svg>
          <div className="dashboard-title-group">
            <h1 className="dashboard-title">MANAGER DASHBOARD</h1>
            <p className="dashboard-subtitle">{user?.fullName || user?.email || 'Manager'}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Đăng xuất
        </button>
      </div>

      <div className="dashboard-content fade-in-up">
        <div className="welcome-card">
          <h2 className="welcome-title">
            Chào mừng, {user?.fullName || 'Manager'}!
          </h2>
          <p className="welcome-text">Quản lý đội ngũ và theo dõi tiến độ dự án.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">24</span>
              <span className="stat-label">Người dùng</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">12</span>
              <span className="stat-label">Dự án đang hoạt động</span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
