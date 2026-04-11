import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import BrandLogo from '@/components/common/BrandLogo';
import { FolderPlus, AlignLeft, FileText, Upload, X, CheckCircle, ChevronRight } from 'lucide-react';
import '@/styles/ManagerDashboard.css';
import '@/styles/AdminDashboard.css';

const ALLOWED_TYPES = ['application/pdf', 'text/plain'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function CreateProject() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const fileInputRef = useRef(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const closeSidebar = () => setSidebarOpen(false);

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

    setTimeout(() => {
      setSubmitSuccess(false);
      setProjectName('');
      setDescription('');
      handleRemoveFile();
    }, 3000);
  };

  const isFormValid = projectName.trim().length >= 3;

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
          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <a href="/manager" onClick={(e) => { e.preventDefault(); navigate('/manager'); }} className="breadcrumb__link">
              Dashboard
            </a>
            <ChevronRight size={14} className="breadcrumb__sep" aria-hidden="true" />
            <span className="breadcrumb__current">Create New Project</span>
          </nav>

          {/* Page Header */}
          <header className="admin-page-header">
            <div className="admin-page-header__brand" aria-hidden="true">
              <BrandLogo size={32} />
              <span className="admin-page-header__brand-name">DataLabel Pro</span>
            </div>
            <h1 className="admin-page-title">Create New Project</h1>
            <p className="admin-page-subtitle">
              Set up a new labeling project and define guidelines for annotators.
            </p>
          </header>

          {/* Form Card */}
          <div className="create-project-card">
            {/* Success Banner */}
            {submitSuccess && (
              <div className="success-banner" role="status" aria-live="polite">
                <CheckCircle size={18} />
                <span>Project created successfully! State: <strong>Initialized</strong></span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Project Name */}
              <div className="form-field">
                <label className="form-field__label" htmlFor="projectName">
                  <FolderPlus size={15} />
                  Project Name <span className="form-field__required">*</span>
                </label>
                <input
                  type="text"
                  id="projectName"
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
                <label className="form-field__label" htmlFor="description">
                  <AlignLeft size={15} />
                  Description
                </label>
                <textarea
                  id="description"
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
                  ref={fileInputRef}
                  type="file"
                  className="visually-hidden"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  aria-hidden="true"
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
                  onClick={() => navigate('/manager')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      <style>{`
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.75rem;
          font-size: 0.8125rem;
        }
        .breadcrumb__link {
          color: #6b7280;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }
        .breadcrumb__link:hover { color: #059669; }
        .breadcrumb__sep { color: #d1d5db; }
        .breadcrumb__current { color: #059669; font-weight: 600; }

        .create-project-card {
          background-color: #ffffff;
          border-radius: 0.75rem;
          padding: 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.04);
          max-width: 640px;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1.25rem;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #ffffff;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .form-field {
          margin-bottom: 1.5rem;
        }

        .form-field__label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .form-field__required { color: #dc2626; }

        .form-field__input {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          color: #111827;
          transition: all 0.2s ease;
          outline: none;
          box-sizing: border-box;
        }

        .form-field__input:focus {
          border-color: #059669;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .form-field__input--error {
          border-color: #dc2626;
        }

        .form-field__input--error:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .form-field__input::placeholder { color: #9ca3af; }

        .form-field__input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-field__textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background-color: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          color: #111827;
          transition: all 0.2s ease;
          outline: none;
          resize: vertical;
          min-height: 120px;
          font-family: inherit;
          box-sizing: border-box;
        }

        .form-field__textarea:focus {
          border-color: #059669;
          background-color: #ffffff;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .form-field__textarea::placeholder { color: #9ca3af; }

        .form-field__textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-field__error {
          font-size: 0.75rem;
          color: #dc2626;
          font-weight: 600;
          margin: 0.375rem 0 0 0;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        /* File Upload */
        .file-upload-zone {
          border: 2px dashed #d1d5db;
          border-radius: 0.75rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: #fafafa;
        }

        .file-upload-zone:hover {
          border-color: #059669;
          background-color: #ecfdf5;
        }

        .file-upload-zone--drag-over {
          border-color: #059669;
          background-color: #ecfdf5;
          transform: scale(1.01);
        }

        .file-upload-zone__icon {
          width: 3rem;
          height: 3rem;
          margin: 0 auto 1rem;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
        }

        .file-upload-zone__text {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin: 0 0 0.375rem 0;
        }

        .file-upload-zone__link {
          color: #059669;
          text-decoration: underline;
        }

        .file-upload-zone__hint {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0 0 0.75rem 0;
        }

        .file-upload-zone__tags {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .file-upload-zone__tag {
          padding: 0.25rem 0.75rem;
          background-color: #f3f4f6;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          color: #6b7280;
        }

        /* File Preview */
        .file-preview {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1rem;
          background-color: #ecfdf5;
          border: 1px solid rgba(5, 150, 105, 0.2);
          border-radius: 0.75rem;
        }

        .file-preview__icon {
          width: 2.5rem;
          height: 2.5rem;
          background-color: #ffffff;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #059669;
          flex-shrink: 0;
        }

        .file-preview__info { flex: 1; min-width: 0; }

        .file-preview__name {
          font-size: 0.8125rem;
          font-weight: 700;
          color: #111827;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-preview__size {
          font-size: 0.6875rem;
          color: #6b7280;
          margin: 0.25rem 0 0 0;
        }

        .file-preview__remove {
          padding: 0.375rem;
          background: transparent;
          border: none;
          border-radius: 0.375rem;
          color: #9ca3af;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .file-preview__remove:hover {
          background-color: #fef2f2;
          color: #dc2626;
        }

        /* State Info */
        .state-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background-color: #f3f4f6;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .state-info__badge {
          padding: 0.25rem 0.625rem;
          background-color: #d1fae5;
          color: #065f46;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .state-info__text {
          font-size: 0.75rem;
          color: #6b7280;
          font-weight: 500;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          gap: 0.75rem;
        }

        .create-project-submit-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #ffffff;
          border: none;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'Manrope', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
        }

        .create-project-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(5, 150, 105, 0.4);
        }

        .create-project-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .create-project-submit-btn__spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .cancel-btn {
          padding: 0.75rem 1.5rem;
          background-color: #ffffff;
          color: #6b7280;
          border: 1px solid #e5e7eb;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          font-weight: 700;
          font-family: 'Manrope', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover:not(:disabled) {
          background-color: #f9fafb;
          border-color: #d1d5db;
          color: #111827;
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .cancel-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </div>
  );
}
