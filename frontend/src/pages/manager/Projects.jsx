import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import BrandLogo from '@/components/common/BrandLogo';
import KpiCard from '@/components/dashboard/KpiCard';
import ProjectTable from '@/pages/manager/ProjectTable';
import ProjectCard from '@/components/manager/ProjectCard';
import Modal from '@/components/Modal';
import { createProject, getProjects, getTasks, uploadGuidelineFile } from '@/services/api';
import {
  FolderPlus, AlignLeft, FileText, Upload, X, CheckCircle,
  Search, LayoutGrid, List
} from 'lucide-react';
import '@/styles/ManagerDashboard.css';

const FILTER_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'initialized', label: 'Initialized' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'completed', label: 'Completed' },
];

const STATUS_COLORS = {
  initialized: { bg: '#dcfce7', text: '#15803d', label: 'Initialized' },
  in_progress: { bg: '#bbf7d0', text: '#166534', label: 'In Progress' },
  review: { bg: '#fef9c3', text: '#854d0e', label: 'Review' },
  completed: { bg: '#059669', text: '#ffffff', label: 'Completed' },
};

// ─── Create Project Form ─────────────────────────────────────────────────────

const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Main Component ─────────────────────────────────────────────────────────

function normalizeProject(raw) {
  const statusMap = {
    DRAFT: 'initialized',
    ACTIVE: 'in_progress',
    ARCHIVED: 'completed',
  };
  
  const parseDate = (dateVal) => {
    if (!dateVal) return 'Just now';
    try {
      if (Array.isArray(dateVal)) {
        const [y, m, d, h = 0, min = 0, s = 0] = dateVal;
        return new Date(y, m - 1, d, h, min, s).toLocaleDateString('en-US');
      }
      const d = new Date(dateVal);
      return isNaN(d) ? 'Just now' : d.toLocaleDateString('en-US');
    } catch {
      return 'Just now';
    }
  };

  const rawDate = raw.created_at || raw.createdAt;

  return {
    id: raw.id,
    name: raw.name || raw.projectName || '',
    category: raw.category || raw.type || 'General',
    status: statusMap[raw.status] || 'initialized',
    progress: raw.progress ?? 0,
    images: raw.totalImages ?? raw.images ?? 0,
    labels: raw.totalLabels ?? raw.labels ?? 0,
    annotators: raw.annotatorCount ?? raw.annotators ?? 0,
    createdAt: rawDate,
    created: parseDate(rawDate),
    imageUrl: raw.thumbnailUrl || raw.imageUrl ||
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    members: raw.members || [],
    description: raw.description || '',
  };
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Projects() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Project list state ──
  const [projects, setProjects] = useState([]);
  const [, setIsLoadingProjects] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState('table');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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



  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const res = await getProjects();
      const data = res.data?.result?.data ?? [];

      if (Array.isArray(data)) {
        const normalized = data.map(normalizeProject);
        const withProgress = await Promise.all(
          normalized.map(async (proj) => {
            try {
              const tasksRes = await getTasks(proj.id);
              const tasks = Array.isArray(tasksRes.data?.result)
                ? tasksRes.data.result
                : Array.isArray(tasksRes.data)
                ? tasksRes.data
                : [];
              const total = tasks.length;
              const completed = tasks.filter(
                (t) => t.status === 'DONE' || t.status === 'COMPLETED' || t.status === 'APPROVED'
              ).length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
              
              let status = proj.status;
              if (total > 0) {
                if (completed === total) {
                  status = 'completed';
                } else if (tasks.some(t => t.status === 'PENDING_REVIEW' || t.status === 'REVIEW')) {
                  status = 'review';
                } else if (completed > 0 || tasks.some(t => t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED' || t.status === 'REJECTED')) {
                  status = 'in_progress';
                }
              }
              return { ...proj, progress, status, images: total, imageCount: total };
            } catch (e) {
              console.error('Failed to fetch tasks for project', proj.id, e);
              return { ...proj, progress: 0, images: 0, imageCount: 0 };
            }
          })
        );
        setProjects(withProgress);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = useCallback(() => {
    if (isSubmitting) return;
    setIsCreateModalOpen(false);
    setProjectName('');
    setDescription('');
    setFile(null);
    setFileError('');
    setErrors({});
    setSubmitSuccess(false);
  }, [isSubmitting]);

  const validateForm = () => {
    const newErrors = {};
    if (!projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    } else if (projectName.trim().length < 3) {
      newErrors.projectName = 'Project name must be at least 3 characters';
    }
    return newErrors;
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
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) handleFileSelect(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleRemoveFile = () => {
    setFile(null);
    setFileError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {

      const response = await createProject({
        name: projectName.trim(),
        description: description.trim(),
        labels: [],
      });

      if (response.status === 200 || response.status === 201) {

        const raw = response.data?.result ?? response.data ?? {};


        // Upload guideline file if provided
        if (file && raw.id) {
          try {
            await uploadGuidelineFile(raw.id, file);
            console.log('Guideline file uploaded successfully.');
          } catch (uploadErr) {
            console.error('Failed to upload guideline file:', uploadErr);
          }
        }

        setSubmitSuccess(true);


        fetchProjects();
        setActiveFilter('initialized');

        setTimeout(() => closeCreateModal(), 2000);
      }
    } catch (err) {
      console.error('❌ Error creating project:', err);
      const serverMsg = err.response?.data?.message
        || err.response?.data?.result?.message;
      setErrors({
        submit: serverMsg || `Error ${err.response?.status ?? 'Server'}: Could not create project.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const isFormValid = projectName.trim().length >= 3;

  // ─── Derived data ────────────────────────────────────────────────────────

  const filteredProjects = useMemo(() => {
    const safeList = Array.isArray(projects) ? projects : [];
    return safeList.filter((p) => {
      const matchesFilter = activeFilter === 'all' || p?.status === activeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        p?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery, projects]);

  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'in_progress').length;
    const completed = projects.filter((p) => p.status === 'completed').length;
    const pending = projects.filter((p) => p.status === 'initialized').length;
    const inReview = projects.filter((p) => p.status === 'review').length;

    return { total, active, completed, pending, inReview };
  }, [projects]);

  // ─── Create Form ─────────────────────────────────────────────────────────

  const renderCreateProjectForm = () => (
    <form onSubmit={handleSubmit} noValidate className="create-project-form">
      {submitSuccess && (
        <div className="success-banner" role="status" aria-live="polite">
          <CheckCircle size={18} />
          <span>Project created successfully! State: <strong>Initialized</strong></span>
        </div>
      )}

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

      <div className="state-info">
        <span className="state-info__badge">Initialized</span>
        <span className="state-info__text">Project state after creation</span>
      </div>

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

  const isAdmin = user?.role === 'ADMIN';
  const userName = user?.fullName || user?.email || (isAdmin ? 'Administrator' : 'Manager');
  const userRole = user?.role === 'ADMIN' ? 'ADMIN' : (user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER'));
  const SidebarComponent = isAdmin ? Sidebar : ManagerSidebar;

  return (
    <div className={isAdmin ? "admin-layout" : "manager-layout"}>
      <SidebarComponent isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className={isAdmin ? "admin-main" : "manager-main"}>
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
          <div className="projects-page-grid">
            {/* ── Page Header ── */}
            <header className="projects-page-header">
              <div className="manager-page-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="manager-header-row">
                <div>
                  <h1 className="manager-page-title">Projects</h1>
                  <p className="manager-page-subtitle">
                    Manage your active labeling campaigns.
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

            {/* ── Summary Cards ── */}
            <section className="projects-summary-row" aria-label="Project statistics">
              <div className="projects-kpi-wrap">
                <KpiCard title="All Projects" value={stats.total} icon="folder_managed" variant="summary" />
              </div>
              <div className="projects-kpi-wrap">
                <KpiCard title="Active Projects" value={stats.active} icon="folder_managed" variant="summary" />
              </div>
              <div className="projects-kpi-wrap">
                <KpiCard title="Completed Projects" value={stats.completed} icon="assignment_turned_in" variant="summary" />
              </div>
              <div className="projects-kpi_wrap">
                <KpiCard title="Pending Projects" value={stats.pending} icon="clock" variant="summary" />
              </div>
              <div className="projects-kpi-wrap">
                <KpiCard title="In Review" value={stats.inReview} icon="group" variant="summary" />
              </div>
            </section>

            {/* ── Filter Bar ── */}
            <section className="projects-filter-bar" aria-label="Filter and search projects">
              {/* Filter Chips */}
              <div className="filter-chips" role="group" aria-label="Filter by status">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    className={`filter-chip ${activeFilter === chip.id ? 'filter-chip--active' : ''}`}
                    onClick={() => setActiveFilter(chip.id)}
                    aria-pressed={activeFilter === chip.id}
                  >
                    {chip.label}
                    {chip.id !== 'all' && (
                      <span className="filter-chip__count">
                        {chip.id === 'initialized' && stats.pending}
                        {chip.id === 'in_progress' && stats.active}
                        {chip.id === 'review' && stats.inReview}
                        {chip.id === 'completed' && stats.completed}
                      </span>
                    )}
                    {chip.id === 'all' && (
                      <span className="filter-chip__count">{stats.total}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search + View Toggle */}
              <div className="projects-toolbar">
                <div className="view-toggle" role="group" aria-label="View mode">
                  <button
                    type="button"
                    className={`view-toggle__btn ${viewMode === 'table' ? 'view-toggle__btn--active' : ''}`}
                    onClick={() => setViewMode('table')}
                    aria-pressed={viewMode === 'table'}
                    aria-label="Table view"
                  >
                    <List size={16} />
                  </button>
                  <button
                    type="button"
                    className={`view-toggle__btn ${viewMode === 'card' ? 'view-toggle__btn--active' : ''}`}
                    onClick={() => setViewMode('card')}
                    aria-pressed={viewMode === 'card'}
                    aria-label="Card view"
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            </section>

            {/* ── Project Content ── */}
            <div className="projects-content-area">
              {filteredProjects.length === 0 ? (
                <div className="projects-empty">
                  <div className="projects-empty__icon">
                    <Search size={40} />
                  </div>
                  <h3 className="projects-empty__title">No projects found</h3>
                  <p className="projects-empty__text">
                    Try adjusting your filter or search query.
                  </p>
                </div>
              ) : viewMode === 'table' ? (
                <ProjectTable
                  projects={filteredProjects}
                  statusColors={STATUS_COLORS}
                  totalProjects={filteredProjects.length}
                />
              ) : (
                <div className="project-grid" role="list" aria-label="Projects">
                  {filteredProjects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      statusColors={STATUS_COLORS}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

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
