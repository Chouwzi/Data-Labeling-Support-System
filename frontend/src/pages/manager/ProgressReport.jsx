import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import BrandLogo from '@/components/common/BrandLogo';
import { Image, CheckCircle, Clock, AlertCircle, TrendingUp, Users, ChevronDown } from 'lucide-react';
import { getProjects, getTasks } from '@/services/api';
import '@/styles/ProgressReport.css';

const CAMPAIGNS = ['All Campaigns', 'Summer Dataset', 'Medical Imaging', 'Satellite Alpha', 'Urban Street View'];

const STATUSES = ['All Statuses', 'In Progress', 'Completed', 'Pending'];

const MOCK_ANNOTATORS = [
  {
    id: 1,
    name: 'Maya L.',
    initials: 'ML',
    avatarColor: '#ecfdf5',
    avatarBorder: '#d1fae5',
    avatarText: '#059669',
    campaign: 'Medical Imaging',
    assigned: 120,
    completed: 96,
    status: 'In Progress',
  },
  {
    id: 2,
    name: 'Jordan S.',
    initials: 'JS',
    avatarColor: '#f0fdfa',
    avatarBorder: '#ccfbf1',
    avatarText: '#0d9488',
    campaign: 'Summer Dataset',
    assigned: 200,
    completed: 200,
    status: 'Completed',
  },
  {
    id: 3,
    name: 'Alex Chen',
    initials: 'AC',
    avatarColor: '#f0f9ff',
    avatarBorder: '#e0f2fe',
    avatarText: '#0284c7',
    campaign: 'Satellite Alpha',
    assigned: 85,
    completed: 42,
    status: 'In Progress',
  },
  {
    id: 4,
    name: 'Priya K.',
    initials: 'PK',
    avatarColor: '#faf5ff',
    avatarBorder: '#ede9fe',
    avatarText: '#7c3aed',
    campaign: 'Medical Imaging',
    assigned: 150,
    completed: 150,
    status: 'Completed',
  },
  {
    id: 5,
    name: 'Sam R.',
    initials: 'SR',
    avatarColor: '#fff7ed',
    avatarBorder: '#fed7aa',
    avatarText: '#ea580c',
    campaign: 'Urban Street View',
    assigned: 60,
    completed: 15,
    status: 'In Progress',
  },
  {
    id: 6,
    name: 'Emma W.',
    initials: 'EW',
    avatarColor: '#fdf2f8',
    avatarBorder: '#fbcfe8',
    avatarText: '#db2777',
    campaign: 'Summer Dataset',
    assigned: 180,
    completed: 0,
    status: 'Pending',
  },
  {
    id: 7,
    name: 'David K.',
    initials: 'DK',
    avatarColor: '#fef3c7',
    avatarBorder: '#fde68a',
    avatarText: '#d97706',
    campaign: 'Satellite Alpha',
    assigned: 95,
    completed: 89,
    status: 'In Progress',
  },
  {
    id: 8,
    name: 'Lisa M.',
    initials: 'LM',
    avatarColor: '#ecfdf5',
    avatarBorder: '#d1fae5',
    avatarText: '#059669',
    campaign: 'Urban Street View',
    assigned: 110,
    completed: 110,
    status: 'Completed',
  },
];

export default function ProgressReport() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('All Campaigns');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');

  // ── API State ──
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [progressData, setProgressData] = useState(null);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // ── Fetch Projects ──
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        const res = await getProjects();
        const data = res.data?.result || [];
        if (Array.isArray(data)) {
          setProjects(data);
          if (data.length > 0) {
            setSelectedProjectId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    };
    fetchProjects();
  }, []);

  // ── Fetch Stats when project changes ──
  const [annotatorsData, setAnnotatorsData] = useState([]);

  useEffect(() => {
    if (!selectedProjectId) return;

    const fetchStats = async () => {
      try {
        const res = await getTasks(selectedProjectId);
        const tasks = Array.isArray(res.data?.result) ? res.data.result : (Array.isArray(res.data) ? res.data : []);
        
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'DONE').length;
        const pending = tasks.filter(t => t.status === 'PENDING').length;
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length;
        
        setProgressData({
          totalTasks: total,
          completed: completed,
          notStarted: pending,
          inProgress: inProgress
        });

        // Group tasks by annotator
        const annotatorMap = {};
        tasks.forEach(task => {
          if (task.annotatorId) {
            const name = task.annotatorName || 'Unknown';
            if (!annotatorMap[task.annotatorId]) {
              annotatorMap[task.annotatorId] = {
                id: task.annotatorId,
                name: name,
                initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                avatarColor: '#ecfdf5',
                avatarBorder: '#d1fae5',
                avatarText: '#059669',
                campaign: 'Project Tasks',
                assigned: 0,
                completed: 0,
                status: 'Pending'
              };
            }
            annotatorMap[task.annotatorId].assigned += 1;
            if (task.status === 'DONE') {
              annotatorMap[task.annotatorId].completed += 1;
            }
          }
        });

        const annotatorsList = Object.values(annotatorMap).map(a => {
          const progress = a.assigned > 0 ? Math.round((a.completed / a.assigned) * 100) : 0;
          return {
            ...a,
            status: progress === 100 ? 'Completed' : (progress > 0 ? 'In Progress' : 'Pending')
          };
        });

        setAnnotatorsData(annotatorsList);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        // Reserved for future loading state UI.
      }
    };
    fetchStats();
  }, [selectedProjectId]);

  const filteredAnnotators = useMemo(() => {
    return annotatorsData.filter((annotator) => {
      const matchesCampaign =
        selectedCampaign === 'All Campaigns' || annotator.campaign === selectedCampaign;
      const matchesStatus =
        selectedStatus === 'All Statuses' || annotator.status === selectedStatus;
      return matchesCampaign && matchesStatus;
    });
  }, [selectedCampaign, selectedStatus, annotatorsData]);

  const stats = useMemo(() => {
    if (progressData) {
      const { totalTasks, completed, inProgress, notStarted } = progressData;
      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
      return {
        total: totalTasks,
        completed,
        inProgress,
        pending: notStarted,
        completionRate
      };
    }

    // Fallback to mock logic if no API data yet
    const total = filteredAnnotators.reduce((sum, a) => sum + a.assigned, 0);
    const completed = filteredAnnotators.reduce((sum, a) => sum + a.completed, 0);
    const inProgress = filteredAnnotators.filter((a) => a.status === 'In Progress').length;
    const pending = filteredAnnotators.filter((a) => a.status === 'Pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, completionRate };
  }, [filteredAnnotators, progressData]);

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'status-badge--completed';
      case 'In Progress':
        return 'status-badge--in-progress';
      case 'Pending':
        return 'status-badge--pending';
      default:
        return '';
    }
  };

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

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
          <div className="progress-report-page">
            {/* Page Header */}
            <header className="progress-report-header">
              <div className="progress-report-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="progress-report-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="progress-report-header__row">
                <div>
                  <h1 className="progress-report-title">Project Progress Report</h1>
                  <p className="progress-report-subtitle">
                    Overview of current labeling tasks and annotator performance.
                  </p>
                </div>
              </div>
            </header>

            {/* Filter Bar */}
            <section
              className="progress-report-filters border-b border-gray-200 pb-6 mb-6 gap-y-4"
              aria-label="Filter options"
            >
              <div className="progress-report-filter-group">
                <span className="progress-report-filter-label text-slate-700 font-medium text-sm">Select Project:</span>
                <div className="progress-report-project-selector">
                  <select
                    className="project-select-input"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={isLoadingProjects}
                  >
                    {isLoadingProjects ? (
                      <option>Loading projects...</option>
                    ) : (
                      projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown size={16} className="project-select-icon" />
                </div>
              </div>

              <div className="progress-report-filter-group">
                <span className="progress-report-filter-label text-slate-700 font-medium text-sm">Campaign:</span>
                <div className="progress-report-pills">
                  {CAMPAIGNS.map((campaign) => (
                    <button
                      key={campaign}
                      type="button"
                      className={`pill ${selectedCampaign === campaign ? 'pill--active' : ''}`}
                      onClick={() => setSelectedCampaign(campaign)}
                      aria-pressed={selectedCampaign === campaign}
                    >
                      {campaign}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* KPI Cards Row */}
            <section className="progress-report-kpis" aria-label="Key metrics">
              <div className="progress-report-kpi-wrap">
                <KpiCard
                  title="Total Images"
                  value={stats.total.toLocaleString()}
                  icon="storage"
                  subtitle="images"
                />
              </div>
              <div className="progress-report-kpi-wrap">
                <KpiCard
                  title="Completed"
                  value={stats.completed.toLocaleString()}
                  icon="assignment_turned_in"
                  trend={`${stats.completionRate}%`}
                />
              </div>
              <div className="progress-report-kpi-wrap">
                <KpiCard
                  title="In Progress"
                  value={stats.inProgress}
                  icon="group"
                  subtitle="annotators"
                />
              </div>
              <div className="progress-report-kpi-wrap">
                <KpiCard
                  title="Pending"
                  value={stats.pending}
                  icon="storage"
                />
              </div>
            </section>

            {/* Overall Progress Bar */}
            <section className="progress-report-overall" aria-labelledby="overall-progress-heading">
              <div className="progress-report-overall__header">
                <div className="progress-report-overall__title-group">
                  <TrendingUp size={20} className="progress-report-overall__icon" />
                  <h2 id="overall-progress-heading" className="progress-report-overall__title">
                    Overall Completion
                  </h2>
                </div>
                <span className="progress-report-overall__percentage">{stats.completionRate}%</span>
              </div>
              <div className="progress-report-overall__bar">
                <div
                  className="progress-report-overall__fill"
                  style={{ width: `${stats.completionRate}%` }}
                  role="progressbar"
                  aria-valuenow={stats.completionRate}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${stats.completionRate}% complete`}
                />
              </div>
              <p className="progress-report-overall__meta">
                {stats.completed.toLocaleString()} of {stats.total.toLocaleString()} images labeled
              </p>
            </section>

            {/* Annotator Progress List */}
            <section className="progress-report-annotators" aria-labelledby="annotators-heading">
              <div className="progress-report-annotators__header">
                <div className="progress-report-annotators__title-group">
                  <Users size={20} className="progress-report-annotators__icon" />
                  <h2 id="annotators-heading" className="progress-report-annotators__title">
                    Annotator Progress
                  </h2>
                </div>
                <span className="progress-report-annotators__count">
                  {filteredAnnotators.length} annotator{filteredAnnotators.length !== 1 ? 's' : ''}
                </span>
              </div>

              {filteredAnnotators.length === 0 ? (
                <div className="progress-report-annotators__empty">
                  <AlertCircle size={32} className="progress-report-annotators__empty-icon" />
                  <p className="progress-report-annotators__empty-text">
                    No annotators match your current filters.
                  </p>
                  <button
                    type="button"
                    className="progress-report-annotators__empty-btn"
                    onClick={() => {
                      setSelectedCampaign('All Campaigns');
                      setSelectedStatus('All Statuses');
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="progress-report-annotators__list">
                  {filteredAnnotators.map((annotator) => {
                    const progress = annotator.assigned > 0
                      ? Math.round((annotator.completed / annotator.assigned) * 100)
                      : 0;
                    return (
                      <div
                        key={annotator.id}
                        className="annotator-card"
                      >
                        <div className="annotator-card__left">
                          <div
                            className="annotator-card__avatar"
                            style={{
                              backgroundColor: annotator.avatarColor,
                              borderColor: annotator.avatarBorder,
                              color: annotator.avatarText,
                            }}
                          >
                            {annotator.initials}
                          </div>
                          <div className="annotator-card__info">
                            <p className="annotator-card__name">{annotator.name}</p>
                            <p className="annotator-card__campaign">{annotator.campaign}</p>
                          </div>
                        </div>

                        <div className="annotator-card__metrics">
                          <div className="annotator-card__metric">
                            <span className="annotator-card__metric-value">
                              {annotator.assigned}
                            </span>
                            <span className="annotator-card__metric-label">Assigned</span>
                          </div>
                          <div className="annotator-card__metric">
                            <span className="annotator-card__metric-value">
                              {annotator.completed}
                            </span>
                            <span className="annotator-card__metric-label">Completed</span>
                          </div>
                          <div className="annotator-card__metric annotator-card__metric--progress">
                            <span className="annotator-card__progress-text">{progress}%</span>
                            <span className="annotator-card__metric-label">Progress</span>
                          </div>
                        </div>

                        <div className="annotator-card__status">
                          <span className={`status-badge ${getStatusBadgeClass(annotator.status)}`}>
                            <span className="status-badge__dot" />
                            {annotator.status}
                          </span>
                        </div>

                        <div className="annotator-card__progress">
                          <div className="annotator-card__progress-bar">
                            <div
                              className="annotator-card__progress-fill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
