import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './Dashboard.css';

export default function AdminDashboard() {
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
            <h1 className="dashboard-title">Admin Dashboard</h1>
            <p className="dashboard-subtitle">{user?.email || 'Admin User'}</p>
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
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">12</span>
              <span className="stat-label">Nhân viên</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">248</span>
              <span className="stat-label">Dự án</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">1,842</span>
              <span className="stat-label">Nhãn đã gắn</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">98%</span>
              <span className="stat-label">Độ chính xác</span>
            </div>
          </div>
        </div>

        <div className="mock-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Chế độ Mock - Dữ liệu mẫu
        </div>
      </div>
    </main>
  );
}
