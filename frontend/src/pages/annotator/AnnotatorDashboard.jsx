import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { getProjects } from '@/services/api';
import { FileText, Download, ExternalLink, Info, BookOpen } from 'lucide-react';
import '@/styles/Dashboard.css';

export default function AnnotatorDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await getProjects();
        const data = res.data?.result?.data || res.data?.result || res.data || [];
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleLoginAgain = () => {
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
            <h1 className="dashboard-title">ANNOTATOR DASHBOARD</h1>
            <p className="dashboard-subtitle">{user?.fullName || user?.email || 'Annotator'}</p>
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
            Chào mừng, {user?.fullName || 'Annotator'}!
          </h2>
          <p className="welcome-text">Role hiện tại: {user?.role || 'ANNOTATOR'}</p>
          <p className="welcome-text">Tiếp tục công việc gắn nhãn của bạn.</p>
          <div className="dashboard-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button className="logout-btn" type="button" onClick={handleLoginAgain}>
              Đăng nhập lại
            </button>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">156</span>
              <span className="stat-label">Nhãn hoàn thành</span>
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
              <span className="stat-value">24</span>
              <span className="stat-label">Giờ làm việc</span>
            </div>
          </div>
        </div>

        {/* Guideline Section */}
        <div className="guideline-section">
          <div className="section-header">
            <BookOpen size={20} className="section-icon" />
            <h3 className="section-title">HƯỚNG DẪN DỰ ÁN</h3>
          </div>

          {isLoading ? (
            <div className="loading-state">Đang tải danh sách dự án...</div>
          ) : projects.length === 0 ? (
            <div className="empty-guideline">
              <Info size={32} />
              <p>Bạn chưa được gán vào dự án nào.</p>
            </div>
          ) : (
            <div className="guideline-grid">
              {projects.map((project) => (
                <div key={project.id} className="guideline-card">
                  <div className="guideline-card__info">
                    <div className="guideline-card__icon">
                      <FileText size={24} />
                    </div>
                    <div className="guideline-card__details">
                      <h4 className="guideline-card__name">{project.name || 'Dự án không tên'}</h4>
                      <p className="guideline-card__desc">
                        {project.description || 'Không có mô tả dự án.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="guideline-card__actions">
                    {project.guidelineUrl ? (
                      <>
                        <button 
                          className="guideline-btn guideline-btn--view"
                          onClick={() => window.open(project.guidelineUrl, '_blank')}
                          title="Xem trực tiếp"
                        >
                          <ExternalLink size={16} />
                          <span>Xem</span>
                        </button>
                        <a 
                          href={project.guidelineUrl} 
                          download 
                          className="guideline-btn guideline-btn--download"
                          title="Tải về máy"
                        >
                          <Download size={16} />
                          <span>Tải về</span>
                        </a>
                      </>
                    ) : (
                      <span className="guideline-not-available">
                        Chưa có hướng dẫn
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
