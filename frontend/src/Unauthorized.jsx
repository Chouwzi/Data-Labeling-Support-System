import { useNavigate } from 'react-router-dom';
import BrandLogo from './components/BrandLogo';
import './Dashboard.css';

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <main className="dashboard-wrapper">
      <div className="dashboard-header fade-in-up">
        <div className="dashboard-logo">
          <BrandLogo size={40} />
          <div className="dashboard-title-group">
            <h1 className="dashboard-title">Access Denied</h1>
            <p className="dashboard-subtitle">You do not have permission to access this page</p>
          </div>
        </div>
        <button className="logout-btn" onClick={() => navigate('/login', { replace: true })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign In
        </button>
      </div>
    </main>
  );
}