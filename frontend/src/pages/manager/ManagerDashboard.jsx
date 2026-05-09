import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import KpiCard from '@/components/dashboard/KpiCard';
import ActivityItem from '@/components/dashboard/ActivityItem';
import BrandLogo from '@/components/common/BrandLogo';
import ProjectTable from '@/pages/manager/ProjectTable';
import ManagerRightPanel from '@/pages/manager/ManagerRightPanel';
import ProjectCard from '@/components/manager/ProjectCard';
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
  const [recentActivities, setRecentActivities] = useState(ACTIVITIES);
  const [projectsList, setProjectsList] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { getProjects, getLogs, getUsers } = await import('@/services/api');
        const [projectsRes, logsRes, usersRes] = await Promise.all([
          getProjects().catch(() => ({ data: { result: { content: [] } } })),
          getLogs(0, 4).catch(() => ({ data: { result: { content: [] } } })),
          getUsers().catch(() => ({ data: { result: [] } }))
        ]);

        const pList = projectsRes.data?.result?.content || projectsRes.data?.result || [];
        const totalProjects = Array.isArray(pList) ? pList.length : 0;
        
        let totalImages = 0;
        if (Array.isArray(pList)) {
          totalImages = pList.reduce((sum, p) => sum + (p.imageCount || p.images || 0), 0);
        }

        const usersList = usersRes.data?.result || [];
        const activeAnnotators = usersList.filter(u => u.role === 'ANNOTATOR').length;

        const logsList = logsRes.data?.result?.content || [];
        const mappedActivities = logsList.map((log, index) => {
          let icon = 'check_circle';
          let bgClass = 'activity-item__icon--primary-container';
          let colorClass = 'activity-item__icon--text-primary-container';
          
          if (log.action?.includes('PROJECT')) {
            icon = 'folder_managed';
            bgClass = 'activity-item__icon--secondary-container';
            colorClass = 'activity-item__icon--text-secondary-container';
          }

          return {
            id: log.id || `log-${index}`,
            icon,
            iconBgClass: bgClass,
            iconColorClass: colorClass,
            message: (
              <>
                <strong>{log.createdBy}</strong> performed {log.action}
              </>
            ),
            timestamp: new Date(log.timestamp).toLocaleString(),
            category: 'PROJECT ACTIVITY',
          };
        });

        setProjectsList(Array.isArray(pList) ? pList : []);
        setDashboardData(prev => ({
          ...prev,
          totalProjects: totalProjects.toString(),
          imagesUploaded: totalImages.toLocaleString(),
          activeAnnotators: activeAnnotators.toString()
        }));
        
        if (mappedActivities.length > 0) {
          setRecentActivities(mappedActivities);
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
              />
              <KpiCard
                title="Images Uploaded"
                value={dashboardData.imagesUploaded}
                icon="storage"
                trend="Real-time"
              />
              <KpiCard
                title="Active Annotators"
                value={dashboardData.activeAnnotators}
                icon="group"
              />
              <KpiCard
                title="Pending Assignments"
                value={dashboardData.pendingAssignments}
                icon="assignment_turned_in"
              />
            </section>

            {/* Row 3 — main span 9: stacked white card (table + activity) */}
            <div className="manager-dashboard-grid__main">
              <div className="manager-stack-card">
                <ProjectTable projects={projectsList} totalProjects={projectsList.length} embedded />
                <section
                  className="activity-section activity-section--in-stack"
                  aria-labelledby="recent-activity-heading"
                >
                  <div className="activity-section__header">
                    <h2 className="activity-section__title" id="recent-activity-heading">
                      Recent Activity
                    </h2>
                    <button
                      type="button"
                      className="activity-section__view-all"
                      onClick={() => navigate('/admin/logs')}
                    >
                      VIEW ALL
                    </button>
                  </div>
                  <div className="activity-section__list">
                    {recentActivities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        icon={activity.icon}
                        iconBgClass={activity.iconBgClass}
                        iconColorClass={activity.iconColorClass}
                        message={activity.message}
                        timestamp={activity.timestamp}
                        category={activity.category}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Row 3 — aside span 3: right panel (tips + annotators) */}
            <aside className="manager-dashboard-grid__aside" aria-label="Insights">
              <ManagerRightPanel />
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
