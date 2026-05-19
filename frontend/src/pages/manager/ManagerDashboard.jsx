import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import BrandLogo from '@/components/common/BrandLogo';
import ProjectTable from '@/pages/manager/ProjectTable';
import ManagerRightPanel from '@/pages/manager/ManagerRightPanel';
import Modal from '@/components/Modal';
import { createProject } from '@/services/api';
import { FolderPlus, AlignLeft, FileText, Upload, X, CheckCircle } from 'lucide-react';
import '@/styles/ManagerDashboard.css';
import '@/styles/KpiCard.css';

const ACTIVITIES = [
  {
    id: 1,
    icon: 'check_circle',
    iconBgClass: 'activity-item__icon--primary-container',
    iconColorClass: 'activity-item__icon--text-primary-container',
    message: (
      <>
        Project <strong>Visual-QA-Alpha</strong> reached 100% completion
      </>
    ),
    timestamp: '10 MIN AGO',
    category: 'PROJECT PIPELINE',
  },
  {
    id: 2,
    icon: 'person_edit',
    iconBgClass: 'activity-item__icon--secondary-container',
    iconColorClass: 'activity-item__icon--text-secondary-container',
    message: (
      <>
        <strong>Maya L.</strong> submitted 48 labels for review
      </>
    ),
    timestamp: '35 MIN AGO',
    category: 'ANNOTATOR WORK',
  },
  {
    id: 3,
    icon: 'warning',
    iconBgClass: 'activity-item__icon--tertiary-container',
    iconColorClass: 'activity-item__icon--text-tertiary',
    message: (
      <>
        <strong>Medical Imaging V2</strong> paused — awaiting validation
      </>
    ),
    timestamp: '1 HOUR AGO',
    category: 'SYSTEM ALERT',
  },
  {
    id: 4,
    icon: 'check_circle',
    iconBgClass: 'activity-item__icon--primary-container',
    iconColorClass: 'activity-item__icon--text-primary-container',
    message: (
      <>
        <strong>Jordan S.</strong> completed batch 7 of Satellite Alpha
      </>
    ),
    timestamp: '2 HOURS AGO',
    category: 'PROJECT PIPELINE',
  },
];

const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function ManagerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const [dashboardData, setDashboardData] = useState({
    totalProjects: '...',
    imagesUploaded: '0',
    activeAnnotators: '...',
    pendingAssignments: '0'
  });
  const [topAnnotators, setTopAnnotators] = useState([]);
  const [reviewTip, setReviewTip] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getProjects, getTasks, getAnnotators } = await import('@/services/api');
        const [projectsRes, annotatorsRes] = await Promise.all([
          getProjects().catch(() => ({ data: { result: { data: [] } } })),
          getAnnotators().catch(() => ({ data: { result: [] } }))
        ]);

        const pList = projectsRes.data?.result?.data || projectsRes.data?.result?.content || projectsRes.data?.result || [];
        
        // Fetch tasks for all projects concurrently to calculate progress
        const pListWithProgress = await Promise.all(
          pList.map(async (project) => {
            try {
              const tasksRes = await getTasks(project.id);
              const tasks = Array.isArray(tasksRes.data?.result) ? tasksRes.data.result : (Array.isArray(tasksRes.data) ? tasksRes.data : []);
              
              const total = tasks.length;
              const completed = tasks.filter(t => t.status === 'DONE' || t.status === 'COMPLETED').length;
              const pending = tasks.filter(t => t.status === 'PENDING').length;
              const inProgress = total - completed - pending;
              
              const progData = {
                totalTasks: total,
                completed: completed,
                notStarted: pending,
                inProgress: inProgress > 0 ? inProgress : 0
              };
              
              return {
                ...project,
                progress: total > 0 ? Math.round((completed / total) * 100) : 0,
                status: total > 0 && completed === total ? 'Completed' : (completed > 0 || inProgress > 0 ? 'In Progress' : 'Pending'),
                imageCount: total,
                stats: progData,
                tasksData: tasks
              };
            } catch (err) {
              console.error(`Failed to fetch tasks for project ${project.id}:`, err);
              return { ...project, progress: 0, status: 'Pending', stats: { totalTasks: 0, completed: 0, notStarted: 0, inProgress: 0 }, tasksData: [] };
            }
          })
        );

        const totalProjects = pListWithProgress.length;
        
        const totalImages = pListWithProgress.reduce((sum, p) => sum + (p.stats?.totalTasks || 0), 0);
        const totalPending = pListWithProgress.reduce((sum, p) => sum + (p.stats?.notStarted || 0), 0);

        const annotatorsList = annotatorsRes.data?.result || annotatorsRes.data || [];
        const activeAnnotatorsCount = annotatorsList.filter(a => a.active === true || a.is_active === true || a.status === 'ACTIVE').length || annotatorsList.length;

        // Group tasks by assignee name
        const allTasks = [];
        pListWithProgress.forEach(p => {
          if (p.tasksData) {
            allTasks.push(...p.tasksData);
          }
        });

        const annotatorCounts = {};
        allTasks.forEach(t => {
          const name = t.annotatorName || t.annotator_name;
          if (name) {
            annotatorCounts[name] = (annotatorCounts[name] || 0) + 1;
          }
        });

        let topAnnotatorsMapped = [];
        if (Object.keys(annotatorCounts).length > 0) {
          const sortedNames = Object.keys(annotatorCounts).sort((a, b) => annotatorCounts[b] - annotatorCounts[a]);
          topAnnotatorsMapped = sortedNames.slice(0, 4).map((name, i) => {
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            const colorClasses = ['avatar--emerald', 'avatar--teal', 'avatar--sky', 'avatar--violet'];
            return {
              initials: initials || 'AN',
              name: name,
              tasksPerDay: annotatorCounts[name].toString(),
              colorClass: colorClasses[i % colorClasses.length]
            };
          });
        }

        // Backfill from annotatorsList
        if (topAnnotatorsMapped.length < 4) {
          const currentNames = new Set(topAnnotatorsMapped.map(a => a.name));
          const colorClasses = ['avatar--emerald', 'avatar--teal', 'avatar--sky', 'avatar--violet'];
          annotatorsList.forEach(a => {
            const fullName = a.fullName || a.username || a.email;
            if (fullName && !currentNames.has(fullName) && topAnnotatorsMapped.length < 4) {
              const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              topAnnotatorsMapped.push({
                initials: initials || 'AN',
                name: fullName,
                tasksPerDay: Math.floor(Math.random() * 15 + 5).toString(),
                colorClass: colorClasses[topAnnotatorsMapped.length % colorClasses.length]
              });
            }
          });
        }

        setTopAnnotators(topAnnotatorsMapped);

        // Find a project that has pending or in-progress tasks and is not yet completed
        const projectAwaitingReview = pListWithProgress.find(p => p.progress < 100 && p.progress > 0) || pListWithProgress[0];
        if (projectAwaitingReview) {
          setReviewTip({
            projectName: projectAwaitingReview.name,
            progress: projectAwaitingReview.progress
          });
        }



        setProjectsList(pListWithProgress);
        setDashboardData(prev => ({
          ...prev,
          totalProjects: totalProjects.toString(),
          imagesUploaded: totalImages.toLocaleString(),
          activeAnnotators: activeAnnotatorsCount.toString(),
          pendingAssignments: totalPending.toLocaleString()
        }));
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

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setProjectName('');
    setDescription('');
    setFile(null);
    setFileError('');
    setErrors({});
    setSubmitSuccess(false);
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setFileError('Only PDF and TXT files are allowed');
      return false;
    }
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setFileError(`File size must not exceed ${MAX_SIZE_MB}MB`);
      return false;
    }
    setFileError('');
    return true;
  };

  const handleFileSelect = (selectedFile) => {
    if (validateFile(selectedFile)) setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleRemoveFile = () => { setFile(null); setFileError(''); };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectName.trim()) {
      setErrors({ projectName: 'Project name is required' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setSubmitSuccess(false);

    try {
      const response = await createProject({
        name: projectName.trim(),
        description: description.trim(),
      });

      if (response.status === 201 || response.status === 200) {
        setSubmitSuccess(true);

        setTimeout(() => {
          closeCreateModal();
          navigate('/manager/projects');
        }, 2000);
      }
    } catch (err) {
      console.error("Lỗi API Dashboard:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.code ||
        "Create project failed";

      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = projectName.trim().length >= 3;


  const renderCreateProjectForm = () => (
    <form onSubmit={handleSubmit} noValidate className="create-project-form">

      {submitSuccess && (
        <div className="success-banner" role="status" aria-live="polite">
          <CheckCircle size={18} />
          <span>Project created successfully! State: <strong>Initialized</strong></span>
        </div>
      )}

      {/* Project Name */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="modal-projectName">
          <FolderPlus size={15} />
          Project Name <span className="form-field__required">*</span>
        </label>
        <input
          type="text"
          id="modal-projectName"
          className={`form-field__input ${errors.projectName ? 'form-field__input--error' : ''}`}
          placeholder="e.g. Satellite Analysis Alpha"
          value={projectName}
          onChange={(e) => {
            setProjectName(e.target.value);
            if (errors.projectName && e.target.value.trim()) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.projectName;
                return next;
              });
            }
          }}
          autoFocus
          disabled={isSubmitting}
        />
        {errors.projectName && (
          <p className="form-field__error" role="alert">{errors.projectName}</p>
        )}
      </div>


      {/* Description */}
      <div className="form-field">
        <label className="form-field__label" htmlFor="modal-description">
          <AlignLeft size={15} />
          Description
        </label>
        <textarea
          id="modal-description"
          className="form-field__textarea"
          placeholder="Describe the project goals and scope..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={4}
        />
      </div>

      {/* File Upload */}
      <div className="form-field">
        <label className="form-field__label">
          <FileText size={15} />
          Guideline Document
        </label>

        {!file ? (
          <div
            className={`file-upload-zone ${isDragOver ? 'file-upload-zone--drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            aria-label="Upload guideline file"
          >
            <div className="file-upload-zone__icon">
              <Upload size={24} />
            </div>
            <p className="file-upload-zone__text">
              Drag and drop your file here, or{' '}
              <span className="file-upload-zone__link">browse</span>
            </p>
            <p className="file-upload-zone__hint">PDF or TXT &bull; Max {MAX_SIZE_MB}MB</p>
            <div className="file-upload-zone__tags">
              <span className="file-upload-zone__tag">PDF</span>
              <span className="file-upload-zone__tag">TXT</span>
            </div>
          </div>
        ) : (
          <div className="file-preview">
            <div className="file-preview__icon">
              <FileText size={20} />
            </div>
            <div className="file-preview__info">
              <p className="file-preview__name">{file.name}</p>
              <p className="file-preview__size">{formatFileSize(file.size)}</p>
            </div>
            <button
              type="button"
              className="file-preview__remove"
              onClick={handleRemoveFile}
              aria-label="Remove file"
              disabled={isSubmitting}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {fileError && (
          <p className="form-field__error" role="alert">{fileError}</p>
        )}

        <input
          type="file"
          className="visually-hidden"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={(e) => handleFileSelect(e.target.files?.[0])}
          aria-hidden="true"
          ref={fileInputRef}
        />
      </div>

      {/* State Info */}
      <div className="state-info">
        <span className="state-info__badge">Initialized</span>
        <span className="state-info__text">Project state after creation</span>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="submit"
          className="create-project-submit-btn"
          disabled={!isFormValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="create-project-submit-btn__spinner" aria-hidden="true" />
              Creating...
            </>
          ) : (
            <>
              <FolderPlus size={16} />
              Create Project
            </>
          )}
        </button>
        <button
          type="button"
          className="cancel-btn"
          onClick={closeCreateModal}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search projects..."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          {/* 12-column admin grid (image_1) */}
          <div className="manager-dashboard-grid">
            {/* Row 1 — span 12: page header */}
            <header className="manager-dashboard-grid__header">
              <div className="manager-page-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="manager-header-row">
                <div>
                  <h1 className="manager-page-title">Project Statistics</h1>
                  <p className="manager-page-subtitle">
                    Real-time overview of your editorial pipeline performance.
                  </p>
                </div>
                <button
                  type="button"
                  className="create-project-btn"
                  onClick={openCreateModal}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create New Project
                </button>
              </div>
            </header>

            {/* Row 2 — four stat cards, each span 3 */}
            <section className="manager-stat-row" aria-label="Key metrics">
              <KpiCard
                title="Total Projects"
                value={dashboardData.totalProjects}
                icon="folder_managed"
                trend="Real-time"
                variant="primary"
              />
              <KpiCard
                title="Images Uploaded"
                value={dashboardData.imagesUploaded}
                icon="storage"
                trend="Real-time"
                variant="info"
              />
              <KpiCard
                title="Active Annotators"
                value={dashboardData.activeAnnotators}
                icon="group"
                variant="success"
              />
              <KpiCard
                title="Pending Assignments"
                value={dashboardData.pendingAssignments}
                icon="assignment_turned_in"
                variant="warning"
              />
            </section>

            {/* Row 3 — main span 9: stacked white card (table only) */}
            <div className="manager-dashboard-grid__main">
              <div className="manager-stack-card">
                <ProjectTable
                  projects={projectsList.filter(p => 
                    !searchQuery.trim() || p.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )}
                  totalProjects={projectsList.length}
                  embedded
                />
              </div>
            </div>

            {/* Row 3 — aside span 3: right panel (tips + annotators) */}
            <aside className="manager-dashboard-grid__aside" aria-label="Insights">
              <ManagerRightPanel topAnnotators={topAnnotators} reviewTip={reviewTip} />
            </aside>
          </div>
        </main>

        {/* Create Project Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          title="Create New Project"
        >
          {renderCreateProjectForm()}
        </Modal>
      </div>
    </div>
  );
}
