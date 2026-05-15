import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { getProjects } from '@/services/api';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const res = await getProjects();
        const mockData = [
          {
            id: 'mock-1',
            name: 'Urban Infrastructure Mapping',
            description: 'Identifying building footprints and road networks from high-resolution satellite imagery.',
            guidelineUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            labels: [
              { name: 'Building', color: '#3b82f6' },
              { name: 'Road', color: '#64748b' },
              { name: 'Vegetation', color: '#22c55e' },
              { name: 'Water', color: '#0ea5e9' }
            ]
          },
          {
            id: 'mock-2',
            name: 'Agricultural Crop Classification',
            description: 'Classifying different types of crops (corn, wheat, soy) based on spectral signatures.',
            guidelineUrl: null,
            labels: [
              { name: 'Corn', color: '#eab308' },
              { name: 'Wheat', color: '#f59e0b' },
              { name: 'Soybean', color: '#84cc16' }
            ]
          },
          {
            id: 'mock-3',
            name: 'Traffic Sign Recognition',
            description: 'Labeling standard traffic signs and signal states for autonomous vehicle training.',
            guidelineUrl: 'https://raw.githubusercontent.com/mdn/learning-area/master/html/forms/file-examples/test.txt',
            labels: [
              { name: 'Prohibitory', color: '#ef4444' },
              { name: 'Warning', color: '#f97316' },
              { name: 'Mandatory', color: '#2563eb' }
            ]
          }
        ];

        let data = res.data?.result?.data || res.data?.result || res.data || [];
        
        // Use mock if no projects are returned
        if (!Array.isArray(data) || data.length === 0) {
          data = mockData;
        }
        
        setProjects(data);
      } catch (error) {
        console.error('Failed to fetch projects (showing mock instead):', error);
        // Fallback to full mock list on error (like 403)
        setProjects([
          {
            id: 'mock-1',
            name: 'Urban Infrastructure Mapping',
            description: 'Identifying building footprints and road networks from high-resolution satellite imagery.',
            guidelineUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
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
            guidelineUrl: 'https://raw.githubusercontent.com/mdn/learning-area/master/html/forms/file-examples/test.txt'
          }
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
                            style={{ backgroundColor: label.color }} 
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
                    <button 
                      className="guideline-btn guideline-btn--view"
                      onClick={() => navigate(`/annotator/projects/${project.id}/tasks`)}
                      title="View Image List"
                    >
                      <ExternalLink size={16} />
                      <span>View Tasks</span>
                    </button>

                    {project.guidelineUrl ? (
                      <a 
                        href={project.guidelineUrl} 
                        download 
                        className="guideline-btn guideline-btn--download"
                        title="Download File"
                      >
                        <Download size={16} />
                        <span>Download</span>
                      </a>
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
