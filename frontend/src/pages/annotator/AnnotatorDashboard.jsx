import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { getMyProjects } from '@/services/api';
import { FileText, Download, ExternalLink, Info, BookOpen } from 'lucide-react';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import '@/styles/Dashboard.css';
import '@/styles/ManagerDashboard.css';

export default function AnnotatorDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const res = await getMyProjects();
        let data = res.data?.result?.data || res.data?.result || res.data || [];
        data = Array.isArray(data) ? data : [];
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch assigned projects:', error);
        setProjects([]);
        setLoadError('Unable to load your assigned project guidelines.');
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

  return (
    <div className="manager-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
      
      <div className="manager-main">
        <Topbar 
          onMenuClick={toggleSidebar}
          userName={user?.fullName || 'Annotator'}
          userRole="Annotator"
          onLogout={logout}
          showCenterLinks
        />

        <main className="manager-content">
          <div className="dashboard-content fade-in-up">
            <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">156</span>
              <span className="stat-label">Labels Completed</span>
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
              <span className="stat-label">Working Hours</span>
            </div>
          </div>
        </div>

        {/* Guideline Section */}
        <div className="guideline-section">
          <div className="section-header">
            <BookOpen size={20} className="section-icon" />
            <h3 className="section-title">PROJECT GUIDELINES</h3>
          </div>

          {isLoading ? (
            <div className="loading-state">Loading projects...</div>
          ) : loadError ? (
            <div className="empty-guideline">
              <Info size={32} />
              <p>{loadError}</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-guideline">
              <Info size={32} />
              <p>You are not assigned to any projects yet.</p>
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
                      <h4 className="guideline-card__name">{project.name || 'Unnamed Project'}</h4>
                      <p className="guideline-card__desc">
                        {project.description || 'No project description available.'}
                      </p>
                    </div>
                  </div>

                  {/* Task 83: Label Taxonomy / Legend */}
                  <div className="label-taxonomy">
                    <h5 className="taxonomy-title">LABEL LEGEND</h5>
                    <div className="taxonomy-grid">
                      {(project.labels || []).map((label, idx) => (
                        <div key={idx} className="taxonomy-item">
                          <span 
                            className="taxonomy-color" 
                            style={{ backgroundColor: label.color || label.color_hex || label.colorHex }}
                          />
                          <span className="taxonomy-name">{label.name}</span>
                        </div>
                      ))}
                      {(!project.labels || project.labels.length === 0) && (
                        <span className="taxonomy-empty">No labels defined</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="guideline-card__actions">
                    {(project.guidelineUrl || project.guideline_url) ? (
                      <>
                        <button 
                          className="guideline-btn guideline-btn--view"
                          onClick={() => window.open(project.guidelineUrl || project.guideline_url, '_blank')}
                          title="View Online"
                        >
                          <ExternalLink size={16} />
                          <span>View</span>
                        </button>
                        <a 
                          href={project.guidelineUrl || project.guideline_url}
                          download 
                          className="guideline-btn guideline-btn--download"
                          title="Download File"
                        >
                          <Download size={16} />
                          <span>Download</span>
                        </a>
                      </>
                    ) : (
                      <span className="guideline-not-available">
                        Guideline not available
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
      </div>
    </div>
  );
}
