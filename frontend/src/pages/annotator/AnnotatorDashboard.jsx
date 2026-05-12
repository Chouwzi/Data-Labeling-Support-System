import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import LabelLegend from '@/components/annotator/LabelLegend';
import KpiCard from '@/components/dashboard/KpiCard';
import BrandLogo from '@/components/common/BrandLogo';
import { FileText, Download, Eye, ExternalLink } from 'lucide-react';
import { getProjects, getProjectProgress } from '@/services/api';
import '@/styles/ManagerDashboard.css'; // Reuse layout styles

export default function AnnotatorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState({
    projects: 0,
    assigned: 0,
    completed: 0,
    pending: 0,
  });

  const [currentProject, setCurrentProject] = useState({
    name: 'Loading...',
    description: 'Fetching project details...',
    role: 'Annotator',
  });

  // Mock data for guidelines (since API doesn't return file list directly yet)
  const guidelines = [
    { id: 1, name: 'Cell Labeling Guide.pdf', size: '2.4 MB', url: '#' },
    { id: 2, name: 'Bounding Box Standards.docx', size: '1.1 MB', url: '#' },
  ];

  // Mock data for labels (or we can fetch from API)
  const [labels, setLabels] = useState([
    { id: 1, name: 'Red Blood Cell', color: '#ef4444', description: 'Erythrocytes' },
    { id: 2, name: 'White Blood Cell', color: '#3b82f6', description: 'Leukocytes' },
    { id: 3, name: 'Platelet', color: '#10b981', description: 'Thrombocytes' },
    { id: 4, name: 'Nucleus', color: '#f59e0b', description: 'Cell core' },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await getProjects();
        const projects = projectsRes.data?.result?.data || projectsRes.data?.result?.content || projectsRes.data?.result || [];
        
        if (projects.length > 0) {
          // Fetch progress for all projects concurrently to aggregate data
          const progressResults = await Promise.all(
            projects.map(async (p) => {
              try {
                const res = await getProjectProgress(p.id);
                return res.data || { totalTasks: 0, completed: 0, inProgress: 0, notStarted: 0 };
              } catch (err) {
                return { totalTasks: 0, completed: 0, inProgress: 0, notStarted: 0 };
              }
            })
          );

          // Aggregate stats
          const totalAssigned = progressResults.reduce((sum, data) => sum + (data.totalTasks || 0), 0);
          const totalCompleted = progressResults.reduce((sum, data) => sum + (data.completed || 0), 0);
          const totalPending = totalAssigned - totalCompleted;

          setStats({
            projects: projects.length,
            assigned: totalAssigned,
            completed: totalCompleted,
            pending: totalPending,
          });

          // For the detailed card, show the first project as the primary active one
          const firstProject = projects[0];
          setCurrentProject({
            name: firstProject.name,
            description: firstProject.description || 'No description available.',
            role: 'Annotator',
          });

          // Fetch labels for the primary project
          try {
            const { getLabelsByProject } = await import('@/services/api');
            const labelsRes = await getLabelsByProject(firstProject.id);
            const labelsData = labelsRes.data?.result || [];
            if (labelsData.length > 0) {
              setLabels(labelsData.map(l => ({
                id: l.id,
                name: l.name,
                color: l.color || '#10b981',
                description: l.description
              })));
            }
          } catch (err) {
            console.log('Using mock labels as fallback');
          }
        } else {
          setStats({ projects: 0, assigned: 0, completed: 0, pending: 0 });
          setCurrentProject({
            name: 'No Projects Assigned',
            description: 'You are not assigned to any projects yet.',
            role: 'N/A',
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const userName = user?.fullName || user?.email || 'Annotator';
  const userRole = user?.role || 'ANNOTATOR';

  return (
    <div className="manager-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search projects..."
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="manager-dashboard-grid">
            {/* Page Header */}
            <header className="manager-dashboard-grid__header">
              <div className="manager-page-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="manager-header-row">
                <div>
                  <h1 className="manager-page-title">Annotator Dashboard</h1>
                  <p className="manager-page-subtitle">
                    Real-time overview of your assigned project and tasks.
                  </p>
                </div>
              </div>
            </header>

            {/* Row 2 — four KPI cards */}
            <section className="manager-stat-row" aria-label="Key metrics">
              <KpiCard
                title="Assigned Projects"
                value={stats.projects.toString()}
                icon="folder_managed"
                trend="Real-time"
              />
              <KpiCard
                title="Images Assigned"
                value={stats.assigned.toString()}
                icon="storage"
                trend="Real-time"
              />
              <KpiCard
                title="Images Completed"
                value={stats.completed.toString()}
                icon="assignment_turned_in"
                trend="Real-time"
              />
              <KpiCard
                title="Pending Images"
                value={stats.pending.toString()}
                icon="group"
              />
            </section>

            {/* Main Content (Span 9) */}
            <div className="manager-dashboard-grid__main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Project Info Card */}
              <div className="activity-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <span className="status-badge status-badge--in-progress">
                      Assigned Project
                    </span>
                    <h2 className="project-table__name-text" style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>{currentProject.name}</h2>
                    <p className="project-table__name-meta">{currentProject.description}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="project-progress__label">YOUR ROLE</span>
                    <p className="project-table__name-text">{currentProject.role}</p>
                  </div>
                </div>
              </div>

              {/* Guidelines Card */}
              <div className="activity-section">
                <div className="activity-section__header">
                  <h2 className="activity-section__title">Guidelines & Instructions</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {guidelines.map((file) => (
                    <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: '#059669' }}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="project-table__name-text">{file.name}</p>
                          <p className="project-table__name-meta">{file.size}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="activity-section__view-all">
                          Preview
                        </button>
                        <button className="create-project-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem' }}>
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Labels Legend */}
              <LabelLegend labels={labels} />

              {/* Quick Action to Images */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => navigate('/annotator/images')}
                  className="create-project-btn"
                >
                  Go to Assigned Images
                  <ExternalLink size={16} style={{ marginLeft: '0.5rem' }} />
                </button>
              </div>
            </div>

            {/* Aside (Span 3) */}
            <aside className="manager-dashboard-grid__aside">
              <div className="manager-aside-stack">
                <div className="tip-card">
                  <p className="tip-card__label">TIP</p>
                  <h3 className="tip-card__title">Read Guidelines</h3>
                  <p className="tip-card__description">
                    Make sure to read the guidelines before starting annotation.
                  </p>
                  <button className="tip-card__action">
                    Learn More
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}