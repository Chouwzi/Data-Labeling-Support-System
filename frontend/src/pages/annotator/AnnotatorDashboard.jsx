import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { getProjects, getProject, getMyProjects, getLabelsByProject, getMyAssignedImages } from '@/services/api';
import { FileText, Download, ExternalLink, Info, BookOpen, Search, Loader } from 'lucide-react';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import KpiCard from '@/components/dashboard/KpiCard';
import '@/styles/Dashboard.css';
import '@/styles/ManagerDashboard.css';
import '@/styles/KpiCard.css';

export default function AnnotatorDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        
        // Fetch projects assigned to the current user (annotator/manager)
        const res = await getMyProjects();
        let projectList = res.data?.result?.data || res.data?.result || res.data || [];
        if (!Array.isArray(projectList)) projectList = [];
        
        // Enhance projects with labels if they are not included in the main list
        const detailedProjects = await Promise.all(
          projectList.map(async (project) => {
            let labels = project.labels || [];
            
            // If labels are not present, fetch them separately
            if (labels.length === 0) {
              try {
                const labelRes = await getLabelsByProject(project.id);
                labels = labelRes.data?.result?.data || labelRes.data?.result || [];
                if (!Array.isArray(labels)) labels = [];
              } catch (e) {
                console.warn(`Could not fetch labels for project ${project.id}`, e);
              }
            }
            
            return {
              ...project,
              guidelineUrl: project.guideline_url || project.guidelineUrl,
              labels: labels.map(label => ({
                ...label,
                color: label.color_hex || label.color,
                rule: label.description || label.rule || 'Standard labeling rules apply.'
              }))
            };
          })
        );

        setProjects(detailedProjects);
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
          searchValue={dashboardSearchTerm}
          onSearch={setDashboardSearchTerm}
          searchPlaceholder="Search projects and guidelines..."
        />

        <main className="dashboard-content">
          <div className="dashboard-content-inner fade-in-up">
            <div className="stats-grid stats-grid--compact">
              <KpiCard 
                title="Assigned Work" 
                value={`${projects.length} Projects`}
                subtitle={`${projects.reduce((acc, p) => acc + (p.imageCount || p.total_images || 0), 0)} Total Images`}
                icon="folder_managed"
                trend="Assigned"
                compact
              />

              <KpiCard 
                title="Your Progress" 
                value={`${projects.filter(p => p.status === 'COMPLETED' || p.progress === 100).length} Finished`}
                subtitle={`${projects.reduce((acc, p) => acc + (p.completed_images || 0), 0)} Images Labeled`}
                icon="assignment_turned_in"
                trend={`${projects.length > 0 ? Math.round((projects.reduce((acc, p) => acc + (p.completed_images || 0), 0) / (projects.reduce((acc, p) => acc + (p.imageCount || p.total_images || 1), 0))) * 100) : 0}% Done`}
                compact
              />
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
                  {projects
                    .filter(project => 
                      project.name?.toLowerCase().includes(dashboardSearchTerm.toLowerCase()) ||
                      project.description?.toLowerCase().includes(dashboardSearchTerm.toLowerCase())
                    )
                    .map(project => (
                      <ProjectGuidelineCard key={project.id} project={project} />
                    ))}
                  {projects.length > 0 && projects.filter(p => p.name?.toLowerCase().includes(dashboardSearchTerm.toLowerCase()) || p.description?.toLowerCase().includes(dashboardSearchTerm.toLowerCase())).length === 0 && (
                    <div className="empty-guideline">
                      <p>No projects match "{dashboardSearchTerm}"</p>
                    </div>
                  )}
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
        <button 
          className={`guideline-btn guideline-btn--view ${!project.guidelineUrl ? 'guideline-btn--disabled' : ''}`}
          onClick={() => project.guidelineUrl && window.open(project.guidelineUrl, '_blank')}
          title={project.guidelineUrl ? "View Online" : "Guideline not available"}
          disabled={!project.guidelineUrl}
        >
          <ExternalLink size={16} />
          <span>View</span>
        </button>
        <a 
          href={project.guidelineUrl || '#'} 
          download={!!project.guidelineUrl}
          className={`guideline-btn guideline-btn--download ${!project.guidelineUrl ? 'guideline-btn--disabled' : ''}`}
          title={project.guidelineUrl ? "Download File" : "Guideline not available"}
          onClick={(e) => !project.guidelineUrl && e.preventDefault()}
        >
          <Download size={16} />
          <span>Download</span>
        </a>
      </div>
    </div>
  );
}
