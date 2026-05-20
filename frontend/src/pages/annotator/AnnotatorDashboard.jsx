import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Search, 
  Info,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Loader
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { getMyProjects, getLabelsByProject, getMyAssignedImages, getMyPerformance } from '@/services/api';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import KpiCard from '@/components/dashboard/KpiCard';
import '@/styles/Dashboard.css';
import '@/styles/ManagerDashboard.css';
import '@/styles/KpiCard.css';

export default function AnnotatorDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isProjectsPage = location.pathname === '/annotator/projects';
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [assignedImages, setAssignedImages] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        let finalProjects = [];
        let allAssignedImages = [];
        try {
          const [assignedImagesRes, performanceRes] = await Promise.all([
            getMyAssignedImages({ page: 0, size: 24 }),
            getMyPerformance().catch(() => ({ data: { result: null } })),
          ]);
          allAssignedImages = assignedImagesRes.data?.result?.data || assignedImagesRes.data?.result || [];
          setPerformance(performanceRes.data?.result || null);
          if (!Array.isArray(allAssignedImages)) allAssignedImages = [];
          setAssignedImages(allAssignedImages);
        } catch (assignedErr) {
          console.warn('Could not fetch assigned images for stats calculation', assignedErr);
          setAssignedImages([]);
        }

        try {
          // Attempt 1: Get projects assigned to the current user
          const res = await getMyProjects({ role: 'ANNOTATOR' });
          finalProjects = res.data?.result?.data || res.data?.result || res.data || [];
          if (!Array.isArray(finalProjects)) finalProjects = [];
        } catch (err) {
          if (err.response?.status === 403 || finalProjects.length === 0) {
            console.warn('Direct project list forbidden or empty. Attempting smart fetch via assigned images...');
            
            // Attempt 2: Smart Fetch (Derive from assigned images)
            const assignedRes = await getMyAssignedImages({ page: 0, size: 24 });
            const assignedData = assignedRes.data?.result?.data || assignedRes.data?.result || assignedRes.data || [];
            
            if (Array.isArray(assignedData) && assignedData.length > 0) {
              const projectMap = new Map();
              
              assignedData.forEach(item => {
                const id = item.project_id || item.projectId;
                if (id && !projectMap.has(id)) {
                  projectMap.set(id, {
                    id: id,
                    name: item.project_name || item.projectName || 'Unnamed Project',
                    description: 'Your assigned labeling project.',
                    labels: []
                  });
                }
              });

              const uniqueProjectIds = Array.from(projectMap.keys());
              const projectPromises = uniqueProjectIds.map(async (id) => {
                try {
                  const basicInfo = projectMap.get(id);
                  try {
                    const labelRes = await getLabelsByProject(id);
                    const rawLabels = labelRes.data?.result?.data || labelRes.data?.result || labelRes.data || [];
                    basicInfo.labels = Array.isArray(rawLabels) ? rawLabels : [];
                  } catch (labelErr) {
                    console.warn(`Could not fetch labels for project ${id}`);
                  }
                  return basicInfo;
                } catch (pErr) {
                  return null;
                }
              });
              
              const enriched = await Promise.all(projectPromises);
              finalProjects = enriched.filter(p => p !== null);
            }
          } else {
            throw err;
          }
        }

        // Final normalization and fetching labels for projects that don't have them
        const detailedProjects = await Promise.all(
          finalProjects.map(async (project) => {
            let labels = project.labels || [];
            if (labels.length === 0 && project.id && !project.id.startsWith('mock')) {
              try {
                const labelRes = await getLabelsByProject(project.id);
                const rawLabels = labelRes.data?.result?.data || labelRes.data?.result || [];
                labels = Array.isArray(rawLabels) ? rawLabels : [];
              } catch (e) {
                console.warn(`Could not fetch labels for project ${project.id}`, e);
              }
            }

            const projectImages = allAssignedImages.filter(img => 
              (img.project_id || img.projectId) === project.id
            );
            const total_images = projectImages.length;
            const completed_images = projectImages.filter(img => 
              ['COMPLETED', 'PENDING_REVIEW', 'APPROVED'].includes(img.status?.toUpperCase())
            ).length;
            const progress = total_images > 0 ? Math.round((completed_images / total_images) * 100) : 0;

            return {
              ...project,
              guidelineUrl: project.guideline_url || project.guidelineUrl,
              total_images,
              completed_images,
              progress,
              labels: labels.map(label => ({
                ...label,
                color: label.color_hex || label.color || '#cccccc',
                rule: label.description || label.rule || 'Standard labeling rules apply.'
              }))
            };
          })
        );

        setProjects(detailedProjects);
      } catch (err) {
        console.error('Project fetch error:', err);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user]);

  const statusCount = (statuses) => assignedImages.filter((image) => statuses.includes(image.status?.toUpperCase())).length;
  const activeImages = statusCount(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REJECTED']);
  const unlabeledImages = statusCount(['PENDING', 'ASSIGNED', 'IN_PROGRESS']);
  const pendingReview = statusCount(['PENDING_REVIEW']);
  const completedImages = statusCount(['COMPLETED', 'APPROVED']);
  const rejectedImages = statusCount(['REJECTED']);
  const nextImage = assignedImages.find((image) => ['REJECTED', 'ASSIGNED', 'PENDING', 'IN_PROGRESS'].includes(image.status?.toUpperCase()));

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
            {!isProjectsPage && <div className="stats-grid stats-grid--compact">
              <KpiCard 
                title="Ready to Label" 
                value={activeImages}
                subtitle={`${projects.length} active project${projects.length === 1 ? '' : 's'}`}
                icon="folder_managed"
                trend={rejectedImages > 0 ? `${rejectedImages} needs work` : 'Queue'}
                compact
              />

              <KpiCard 
                title="Submitted" 
                value={pendingReview}
                subtitle={`${completedImages} approved or completed`}
                icon="assignment_turned_in"
                trend={`${assignedImages.length > 0 ? Math.round((completedImages / Math.max(1, assignedImages.length)) * 100) : 0}% done`}
                compact
              />
              <KpiCard
                title="Approval Rate"
                value={`${Math.round(performance?.approvalRate ?? performance?.approval_rate ?? 0)}%`}
                subtitle={`${rejectedImages} rejected / rework`}
                icon="assignment_turned_in"
                trend={`${unlabeledImages} unlabeled`}
                compact
              />
            </div>}

            <section className="guideline-section">
              <div className="section-header">
                <BookOpen size={20} className="section-icon" />
                <h2 className="section-title">{isProjectsPage ? 'PROJECT CATALOG' : 'WORK QUEUE'}</h2>
              </div>

              {!isProjectsPage && !isLoading && nextImage && (
                <div className="annotator-next-task">
                  <div>
                    <strong>{nextImage.file_name || nextImage.fileName || 'Next image'}</strong>
                    <span>{nextImage.project_name || nextImage.projectName || 'Assigned project'} · {nextImage.status || 'ASSIGNED'}</span>
                  </div>
                  <button
                    type="button"
                    className="project-detail-primary-btn"
                    onClick={() => navigate(`/annotator/projects/${nextImage.project_id || nextImage.projectId}/workspace/${nextImage.task_id || nextImage.taskId || nextImage.id}`)}
                  >
                    Continue labeling
                  </button>
                </div>
              )}

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
                      <ProjectGuidelineCard key={project.id} project={project} compact={!isProjectsPage} />
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

      <style dangerouslySetInnerHTML={{ __html: `
        .spinner { width: 30px; height: 30px; border: 3px solid #f3f3f3; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        .guideline-card--project-catalog {
          border-color: var(--color-border, #d7e0e8);
          background: #ffffff;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.08));
        }
        .project-catalog-progress {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 0.35rem 0.75rem;
          margin-top: 0.75rem;
          color: #64748b;
          font-size: 0.78rem;
        }
        .project-catalog-progress strong { color: #0f766e; }
        .project-catalog-progress div {
          grid-column: 1 / -1;
          height: 7px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .project-catalog-progress i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: #0f766e;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

function ProjectGuidelineCard({ project, compact = false }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLabels = (project.labels || []).filter(label => 
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`guideline-card ${compact ? '' : 'guideline-card--project-catalog'}`}>
      <div className="guideline-card__info">
        <div className="guideline-card__icon">
          <FileText size={24} />
        </div>
        <div className="guideline-card__details">
          <h4 className="guideline-card__name">{project.name || 'Unnamed Project'}</h4>
          <p className="guideline-card__desc">
            {project.description || 'Your assigned labeling project.'}
          </p>
          {!compact && (
            <div className="project-catalog-progress">
              <span>{project.completed_images || 0}/{project.total_images || 0} images complete</span>
              <strong>{project.progress || 0}%</strong>
              <div><i style={{ width: `${project.progress || 0}%` }} /></div>
            </div>
          )}
        </div>
      </div>

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
  );
}
