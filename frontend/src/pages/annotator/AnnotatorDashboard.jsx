import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { getProjects, getProject, getMyAssignedImages } from '@/services/api';
import { FileText, Download, ExternalLink, Info, BookOpen, Search, Loader } from 'lucide-react';
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
        let projectList = [];

        if (user?.role === 'ANNOTATOR') {
          // Annotators cannot access GET /projects (403), 
          // so we fetch projects they are assigned to via their images
          const assignedRes = await getMyAssignedImages({ size: 100 });
          const images = assignedRes.data?.result?.data || [];
          
          // Extract unique project IDs (backend uses SNAKE_CASE)
          const projectIds = [...new Set(images.map(img => img.project_id || img.projectId))].filter(Boolean);
          
          // Fetch details for each project (guidelines, labels)
          const projectPromises = projectIds.map(id => getProject(id));
          const projectResponses = await Promise.all(projectPromises);
          
          projectList = projectResponses.map(res => res.data?.result).filter(Boolean);
        } else {
          // Managers/Admins can use the main list
          const res = await getProjects();
          projectList = res.data?.result?.data || res.data?.result || res.data || [];
          if (!Array.isArray(projectList)) projectList = projectList.data || [];
        }

        // Map backend snake_case to frontend expectations
        const mappedData = projectList.map(project => ({
          ...project,
          guidelineUrl: project.guideline_url || project.guidelineUrl,
          labels: (project.labels || []).map(label => ({
            ...label,
            color: label.color_hex || label.color
          }))
        }));

        setProjects(mappedData);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-wrapper">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
      
      <div className="dashboard-main-content">
        <Topbar 
          onMenuClick={toggleSidebar}
          userName={user?.fullName || 'Annotator'}
          userRole="Annotator"
          onLogout={handleLogout}
          showCenterLinks
        />

        <main className="dashboard-content">
          <div className="dashboard-content-inner fade-in-up">
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
                  <BookOpen size={24} />
                </div>
                <div className="stat-info">
                  <span className="stat-value">24</span>
                  <span className="stat-label">Working Hours</span>
                </div>
              </div>
            </div>

            <section className="guideline-section">
              <div className="section-header">
                <BookOpen size={20} className="section-icon" />
                <h2 className="section-title">PROJECT GUIDELINES</h2>
              </div>

              {isLoading ? (
                <div className="loading-state">
                  <Loader className="spinner" size={32} />
                  <p>Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="empty-guideline">
                  <Info size={48} />
                  <p>You are not assigned to any projects yet.</p>
                </div>
              ) : (
                <div className="guideline-grid">
                  {projects.map(project => (
                    <ProjectGuidelineCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// Sub-component for individual project card to manage its own search state
function ProjectGuidelineCard({ project }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLabels = (project.labels || []).filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="guideline-card">
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

      {/* Task 83: Enhanced Label Taxonomy / Legend with scroll */}
      <div className="label-taxonomy">
        <div className="taxonomy-header">
          <h5 className="taxonomy-title">LABEL LEGEND</h5>
          <div className="taxonomy-search">
            <Search size={12} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search labels..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="taxonomy-grid scrollable-taxonomy">
          {filteredLabels.map((label, idx) => (
            <div key={idx} className="taxonomy-item" title={label.rule || `Rules for ${label.name}`}>
              <span 
                className="taxonomy-color" 
                style={{ backgroundColor: label.color }} 
              />
              <div className="taxonomy-info">
                <span className="taxonomy-name">{label.name}</span>
                <span className="taxonomy-rule">{label.rule || 'Standard labeling rules apply.'}</span>
              </div>
            </div>
          ))}
          {filteredLabels.length === 0 && (
            <span className="taxonomy-empty">
              {searchTerm ? 'No matching labels' : 'No labels defined'}
            </span>
          )}
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
  );
}
