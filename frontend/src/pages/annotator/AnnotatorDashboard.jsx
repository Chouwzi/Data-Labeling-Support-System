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
        let data = res.data?.result?.data || res.data?.result || res.data || [];
        
        // Mock data for testing if no projects are returned
        if (!Array.isArray(data) || data.length === 0) {
          data = [
            {
              id: 'mock-1',
              name: 'Urban Infrastructure Mapping',
              description: 'Identifying building footprints and road networks from high-resolution satellite imagery.',
              guidelineUrl: 'https://example.com/guideline1.pdf'
            },
            {
              id: 'mock-2',
              name: 'Agricultural Crop Classification',
              description: 'Classifying different types of crops (corn, wheat, soy) based on spectral signatures.',
              guidelineUrl: null
            },
            {
              id: 'mock-3',
              name: 'Traffic Sign Recognition',
              description: 'Labeling standard traffic signs and signal states for autonomous vehicle training.',
              guidelineUrl: 'https://example.com/guideline3.pdf'
            }
          ];
        }
        
        setProjects(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        // Fallback mock data on error
        setProjects([
          { id: 'err-1', name: 'Sample Project (API Error)', description: 'This is mock data shown because the API failed.', guidelineUrl: '#' }
        ]);
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
          Logout
        </button>
      </div>

      <div className="dashboard-content fade-in-up">
        <div className="welcome-card">
          <h2 className="welcome-title">
            Welcome, {user?.fullName || 'Annotator'}!
          </h2>
          <p className="welcome-text">Current role: {user?.role || 'ANNOTATOR'}</p>
          <p className="welcome-text">Continue your labeling tasks with precision.</p>
          <div className="dashboard-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button className="logout-btn" type="button" onClick={handleLoginAgain}>
              Login Again
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
                  
                  <div className="guideline-card__actions">
                    {project.guidelineUrl ? (
                      <>
                        <button 
                          className="guideline-btn guideline-btn--view"
                          onClick={() => window.open(project.guidelineUrl, '_blank')}
                          title="View Online"
                        >
                          <ExternalLink size={16} />
                          <span>View</span>
                        </button>
                        <a 
                          href={project.guidelineUrl} 
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
  );
}
