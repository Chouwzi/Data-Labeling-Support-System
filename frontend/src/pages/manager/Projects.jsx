import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import BrandLogo from '@/components/common/BrandLogo';
import KpiCard from '@/components/dashboard/KpiCard';
import ProjectTable from '@/pages/manager/ProjectTable';
import ProjectCard from '@/components/manager/ProjectCard';
import Modal from '@/components/Modal';
import {
  FolderPlus, AlignLeft, FileText, Upload, X, CheckCircle,
  Search, LayoutGrid, List, ChevronDown
} from 'lucide-react';
import '@/styles/ManagerDashboard.css';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const ALL_PROJECTS = [
  {
    id: 1,
    name: 'Satellite Analysis Alpha',
    category: 'Geospatial',
    status: 'in_progress',
    progress: 68,
    images: 1240,
    labels: 843,
    annotators: 4,
    created: '2 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop',
    members: [
      { name: 'Maya L.', color: '#059669' },
      { name: 'Jordan S.', color: '#0d9488' },
      { name: 'Alex R.', color: '#7c3aed' },
    ],
  },
  {
    id: 2,
    name: 'Autonomous Driving Beta',
    category: 'CV / Automotive',
    status: 'in_progress',
    progress: 92,
    images: 3800,
    labels: 3496,
    annotators: 6,
    created: '5 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&fit=crop',
    members: [
      { name: 'Sam K.', color: '#0284c7' },
      { name: 'Riley T.', color: '#059669' },
    ],
  },
  {
    id: 3,
    name: 'Medical Imaging V2',
    category: 'Healthcare',
    status: 'initialized',
    progress: 45,
    images: 620,
    labels: 279,
    annotators: 3,
    created: '1 week ago',
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    members: [
      { name: 'Dana W.', color: '#dc2626' },
      { name: 'Chris M.', color: '#0d9488' },
    ],
  },
  {
    id: 4,
    name: 'Invoice OCR Processing',
    category: 'Document AI',
    status: 'completed',
    progress: 100,
    images: 2100,
    labels: 2100,
    annotators: 5,
    created: '3 weeks ago',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    members: [
      { name: 'Emma P.', color: '#059669' },
      { name: 'Liam H.', color: '#7c3aed' },
    ],
  },
  {
    id: 5,
    name: 'Fashion Catalog Tagging',
    category: 'E-Commerce',
    status: 'in_progress',
    progress: 37,
    images: 880,
    labels: 326,
    annotators: 2,
    created: '4 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop',
    members: [
      { name: 'Zoe A.', color: '#f59e0b' },
    ],
  },
  {
    id: 6,
    name: 'Retail Shelf Audit',
    category: 'Retail Analytics',
    status: 'review',
    progress: 81,
    images: 1560,
    labels: 1264,
    annotators: 4,
    created: '6 days ago',
    imageUrl: 'https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=400&h=300&fit=crop',
    members: [
      { name: 'Mia B.', color: '#dc2626' },
      { name: 'Noah C.', color: '#0284c7' },
      { name: 'Olivia D.', color: '#059669' },
    ],
  },
];

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

export default function Projects() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState('table');

  // Filter + Search
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = { current: null };

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
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setIsSubmitting(true);
    setErrors({});
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => closeCreateModal(), 2500);
  };

  const isFormValid = projectName.trim().length >= 3;

  // ─── Derived data ────────────────────────────────────────────────────────

  const filteredProjects = useMemo(() => {
    return ALL_PROJECTS.filter((p) => {
      const matchesFilter = activeFilter === 'all' || p.status === activeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = ALL_PROJECTS.length;
    const active = ALL_PROJECTS.filter((p) => p.status === 'in_progress').length;
    const completed = ALL_PROJECTS.filter((p) => p.status === 'completed').length;
    const pending = ALL_PROJECTS.filter((p) => p.status === 'initialized').length;
    const inReview = ALL_PROJECTS.filter((p) => p.status === 'review').length;
    return { total, active, completed, pending, inReview };
  }, []);

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
                <KpiCard
                  title="Active Projects"
                  value={stats.active}
                  icon="folder_managed"
                  trend="+3"
                  variant="summary"
                />
              </div>
              <div className="projects-kpi-wrap">
                <KpiCard
                  title="Completed This Month"
                  value={stats.completed}
                  icon="assignment_turned_in"
                  trend="+1"
                  variant="summary"
                />
              </div>
              <div className="projects-kpi-wrap">
                <KpiCard
                  title="Labels Pending Review"
                  value="2,847"
                  icon="group"
                  variant="summary"
                />
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
                <div className="projects-search">
                  <Search size={16} className="projects-search__icon" />
                  <input
                    type="text"
                    className="projects-search__input"
                    placeholder="Search by name or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search projects"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="projects-search__clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

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
                  totalProjects={ALL_PROJECTS.length}
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
