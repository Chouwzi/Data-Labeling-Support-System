import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import BrandLogo from '@/components/common/BrandLogo';
import { getProjects, uploadSamples, createDataset, updateProject } from '@/services/api';
import {
  Upload, X, CheckCircle, AlertCircle, Image, Loader2, Lightbulb,
  Trash2, ChevronRight, Info, Sparkles, Shield
} from 'lucide-react';
import '@/styles/UploadImages.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const SIMULATED_DURATION_MS = 3000;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function generatePreviewUrl(file) {
  return URL.createObjectURL(file);
}

export default function UploadImages() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const [projectId, setProjectId] = useState('');
  const [projectsList, setProjectsList] = useState([]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await getProjects();
        const projectData = res.data?.result?.data || res.data?.result || [];
        setProjectsList(Array.isArray(projectData) ? projectData : []);
      } catch (err) {
        console.error("Could not load projects", err);
      }
    }
    fetchProjects();
  }, []);

  // Metadata panel toggles
  const [autoDetect, setAutoDetect] = useState(false);
  const [applyPadding, setApplyPadding] = useState(true);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Validate a single file
  const validateFile = useCallback((file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'Only JPEG and PNG formats are accepted' };
    }
    if (file.size > MAX_SIZE_BYTES) {
      return { valid: false, error: `Exceeds ${MAX_SIZE_MB}MB limit` };
    }
    return { valid: true, error: null };
  }, []);

  // Process dropped/selected files
  const processFiles = useCallback((rawFiles) => {
    const newEntries = Array.from(rawFiles).map((file) => {
      const { valid, error } = validateFile(file);
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: valid ? generatePreviewUrl(file) : null,
        status: valid ? 'ready' : 'invalid',
        progress: 0,
        error,
      };
    });

    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const filtered = newEntries.filter((e) => !existingNames.has(e.name));
      return [...prev, ...filtered];
    });
  }, [validateFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInputChange = useCallback((e) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  }, [processFiles]);

  const handleRemoveFile = useCallback((id) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    files.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFiles([]);
    setIsUploading(false);
  }, [files]);

  const handleUpload = useCallback(async () => {
    if (!projectId) {
      alert('Please select a project before uploading images.');
      return;
    }

    const selectedProject = projectsList.find(p => p.id === projectId);
    let datasetId = selectedProject?.dataset_id || selectedProject?.datasetId;
    
    if (!datasetId) {
      setIsUploading(true);
      try {
        // 1. Create dataset
        const datasetRes = await createDataset(selectedProject.name);
        datasetId = datasetRes.data.result.id;
        
        // 2. Update project with datasetId
        await updateProject(projectId, { dataset_id: datasetId });
        
        // Update local state
        setProjectsList(prev => prev.map(p => p.id === projectId ? { ...p, datasetId } : p));
      } catch (error) {
        console.error('Failed to create dataset for project:', error);
        alert('Failed to initialize dataset for this project.');
        setIsUploading(false);
        return;
      }
    }

    const readyFiles = files.filter((f) => f.status === 'ready');
    if (readyFiles.length === 0) {
      setIsUploading(false);
      return;
    }

    setFiles((prev) =>
      prev.map((f) => ({
        ...f,
        status: f.status === 'ready' ? 'uploading' : f.status,
        progress: f.status === 'ready' ? 0 : f.progress,
      }))
    );
    setIsUploading(true);

    Promise.allSettled(
      readyFiles.map(async (fileObj) => {
        try {
          await uploadSamples(datasetId, fileObj.file, (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setFiles((prev) => prev.map(f => 
              f.id === fileObj.id ? { ...f, progress: percentCompleted } : f
            ));
          });
          // On success, mark as done
          setFiles((prev) => prev.map(f => f.id === fileObj.id ? { ...f, status: 'done', progress: 100 } : f));
        } catch (error) {
          // On failure, mark as invalid and show error
          setFiles((prev) => prev.map(f => f.id === fileObj.id ? { ...f, status: 'invalid', error: error.message || 'Upload failed' } : f));
        }
      })
    ).finally(() => {
      setIsUploading(false);
    });
  }, [files, projectId]);

  const readyCount = files.filter((f) => f.status === 'ready').length;
  const doneCount = files.filter((f) => f.status === 'done').length;
  const invalidCount = files.filter((f) => f.status === 'invalid').length;
  const uploadingCount = files.filter((f) => f.status === 'uploading').length;

  const canUpload = readyCount > 0 && !isUploading;
  const isFullyDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'invalid');

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
          <div className="upload-page-grid">
            {/* Page Header */}
            <header className="upload-page-header">
              <div className="manager-page-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="manager-header-row">
                <div>
                  <h1 className="manager-page-title">Upload Images</h1>
                  <p className="manager-page-subtitle">
                    Batch-upload image data to prepare raw materials for processing.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <select 
                    className="form-field__input" 
                    value={projectId} 
                    onChange={(e) => setProjectId(e.target.value)}
                    style={{ minWidth: '250px', margin: 0, padding: '8px 12px' }}
                    aria-label="Select Project"
                  >
                    <option value="">-- Select a project to upload --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </header>

            {/* Left Column: Upload Zone + File Grid */}
            <section className="upload-left-col" aria-label="Image upload">
              {/* Drop Zone */}
              <div
                className={`upload-dropzone ${dragActive ? 'upload-dropzone--active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                aria-label="Upload images by drag and drop or click"
              >
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  className="visually-hidden"
                  onChange={handleFileInputChange}
                  ref={fileInputRef}
                  aria-hidden="true"
                />

                <div className="upload-dropzone__inner">
                  <div className="upload-dropzone__icon-wrap">
                    <Upload size={36} className="upload-dropzone__icon" />
                  </div>
                  <h2 className="upload-dropzone__title">
                    {dragActive ? 'Release to add images' : 'Drag & drop images here'}
                  </h2>
                  <p className="upload-dropzone__sub">
                    or <span className="upload-dropzone__link">browse files</span> to select manually
                  </p>
                  <div className="upload-dropzone__badges">
                    <span className="upload-badge upload-badge--type">
                      <Image size={12} /> JPEG
                    </span>
                    <span className="upload-badge upload-badge--type">
                      <Image size={12} /> PNG
                    </span>
                    <span className="upload-badge upload-badge--size">
                      Max {MAX_SIZE_MB}MB per file
                    </span>
                  </div>
                </div>
              </div>

              {/* File Grid */}
              {files.length > 0 && (
                <div className="file-grid" role="list" aria-label="Uploaded files">
                  {files.map((entry) => (
                    <div
                      key={entry.id}
                      className={`file-card ${entry.status === 'invalid' ? 'file-card--invalid' : ''} ${entry.status === 'done' ? 'file-card--done' : ''}`}
                      role="listitem"
                    >
                      {/* Preview */}
                      <div className="file-card__preview">
                        {entry.previewUrl ? (
                          <img
                            src={entry.previewUrl}
                            alt={entry.name}
                            className="file-card__img"
                          />
                        ) : (
                          <div className="file-card__img-placeholder">
                            <Image size={24} />
                          </div>
                        )}

                        {/* Status overlay */}
                        {entry.status === 'uploading' && (
                          <div className="file-card__status-overlay file-card__status-overlay--uploading">
                            <Loader2 size={20} className="file-card__spinner" />
                          </div>
                        )}
                        {entry.status === 'done' && (
                          <div className="file-card__status-overlay file-card__status-overlay--done">
                            <CheckCircle size={22} />
                          </div>
                        )}
                        {entry.status === 'invalid' && (
                          <div className="file-card__status-overlay file-card__status-overlay--invalid">
                            <AlertCircle size={22} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="file-card__body">
                        <p className="file-card__name" title={entry.name}>
                          {entry.name}
                        </p>
                        <p className="file-card__meta">
                          {formatFileSize(entry.size)}
                          {entry.status === 'invalid' && entry.error && (
                            <span className="file-card__error"> &bull; {entry.error}</span>
                          )}
                        </p>

                        {/* Progress bar (only for uploading state) */}
                        {entry.status === 'uploading' && (
                          <div className="file-card__progress-wrap" role="progressbar" aria-valuenow={Math.round(entry.progress)} aria-valuemin={0} aria-valuemax={100}>
                            <div className="file-card__progress-bar">
                              <div
                                className="file-card__progress-fill"
                                style={{ width: `${entry.progress}%` }}
                              />
                            </div>
                            <span className="file-card__progress-pct">
                              {Math.round(entry.progress)}%
                            </span>
                          </div>
                        )}

                        {/* Done indicator */}
                        {entry.status === 'done' && (
                          <div className="file-card__done-label">
                            <CheckCircle size={12} /> Uploaded
                          </div>
                        )}

                        {/* Invalid indicator */}
                        {entry.status === 'invalid' && (
                          <div className="file-card__invalid-label">
                            <AlertCircle size={12} /> Invalid
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      {!isUploading && (
                        <button
                          type="button"
                          className="file-card__remove"
                          onClick={() => handleRemoveFile(entry.id)}
                          aria-label={`Remove ${entry.name}`}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              {files.length > 0 && (
                <div className="upload-actions">
                  <button
                    type="button"
                    className="upload-btn-primary"
                    onClick={handleUpload}
                    disabled={!canUpload}
                    aria-busy={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 size={18} className="upload-btn-primary__spinner" />
                        Uploading {uploadingCount > 0 ? `${uploadingCount} ` : ''}...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Upload {readyCount > 0 ? `${readyCount} ` : ''}Images
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="upload-btn-secondary"
                    onClick={handleClearAll}
                    disabled={isUploading}
                  >
                    <Trash2 size={16} />
                    Clear All
                  </button>

                  {isFullyDone && !isUploading && (
                    <div className="upload-success-banner" role="status">
                      <CheckCircle size={18} />
                      All {doneCount} image{doneCount !== 1 ? 's' : ''} uploaded successfully!
                      {invalidCount > 0 && (
                        <span className="upload-success-banner__warn">
                          &bull; {invalidCount} file{invalidCount !== 1 ? 's' : ''} invalid
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Right Column: Metadata + Info */}
            <aside className="upload-right-col" aria-label="Upload settings and guidance">
              {/* Summary Card */}
              <div className="upload-summary-card">
                <div className="upload-summary-card__header">
                  <Info size={16} className="upload-summary-card__icon" />
                  <h3 className="upload-summary-card__title">Upload Summary</h3>
                </div>
                <div className="upload-summary-card__stats">
                  <div className="upload-stat-row">
                    <span className="upload-stat-row__label">Ready</span>
                    <span className="upload-stat-row__value upload-stat-row__value--ready">{readyCount}</span>
                  </div>
                  <div className="upload-stat-row">
                    <span className="upload-stat-row__label">Uploading</span>
                    <span className="upload-stat-row__value upload-stat-row__value--uploading">{uploadingCount}</span>
                  </div>
                  <div className="upload-stat-row">
                    <span className="upload-stat-row__label">Done</span>
                    <span className="upload-stat-row__value upload-stat-row__value--done">{doneCount}</span>
                  </div>
                  <div className="upload-stat-row">
                    <span className="upload-stat-row__label">Invalid</span>
                    <span className="upload-stat-row__value upload-stat-row__value--invalid">{invalidCount}</span>
                  </div>
                </div>
              </div>

              {/* Metadata Suggestions */}
              <div className="upload-meta-panel">
                <div className="upload-meta-panel__header">
                  <Sparkles size={16} className="upload-meta-panel__icon" />
                  <h3 className="upload-meta-panel__title">Metadata Suggestions</h3>
                </div>

                <div className="upload-meta-panel__options">
                  <label className="upload-toggle">
                    <span className="upload-toggle__text">
                      <span className="upload-toggle__label">Auto-detect categories</span>
                      <span className="upload-toggle__desc">Automatically infer label categories from image content</span>
                    </span>
                    <div
                      className={`toggle-switch ${autoDetect ? 'toggle-switch--on' : ''}`}
                      role="switch"
                      aria-checked={autoDetect}
                      tabIndex={0}
                      onClick={() => setAutoDetect((v) => !v)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAutoDetect((v) => !v)}
                    >
                      <div className="toggle-switch__thumb" />
                    </div>
                  </label>

                  <label className="upload-toggle">
                    <span className="upload-toggle__text">
                      <span className="upload-toggle__label">Apply project standard padding</span>
                      <span className="upload-toggle__desc">Add consistent border padding across all images</span>
                    </span>
                    <div
                      className={`toggle-switch ${applyPadding ? 'toggle-switch--on' : ''}`}
                      role="switch"
                      aria-checked={applyPadding}
                      tabIndex={0}
                      onClick={() => setApplyPadding((v) => !v)}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setApplyPadding((v) => !v)}
                    >
                      <div className="toggle-switch__thumb" />
                    </div>
                  </label>
                </div>
              </div>

              {/* Optimization Tip */}
              <div className="upload-tip-card">
                <div className="upload-tip-card__icon-wrap">
                  <Lightbulb size={20} />
                </div>
                <div className="upload-tip-card__body">
                  <h4 className="upload-tip-card__title">Optimization Tip</h4>
                  <p className="upload-tip-card__text">
                    For best labeling throughput, batch images of similar resolution together. High-resolution images (above 4K) are automatically down-sampled to 2048px for faster annotation.
                  </p>
                  <button type="button" className="upload-tip-card__action">
                    Learn more <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Format Info */}
              <div className="upload-format-info">
                <div className="upload-format-info__header">
                  <Shield size={15} />
                  <span>Format Constraints</span>
                </div>
                <ul className="upload-format-info__list">
                  <li>
                    <span className="upload-format-info__dot upload-format-info__dot--emerald" />
                    JPEG (.jpg, .jpeg) &mdash; Lossy compression, smaller size
                  </li>
                  <li>
                    <span className="upload-format-info__dot upload-format-info__dot--emerald" />
                    PNG (.png) &mdash; Lossless, supports transparency
                  </li>
                  <li>
                    <span className="upload-format-info__dot upload-format-info__dot--amber" />
                    Max file size: {MAX_SIZE_MB}MB (admin-configured limit)
                  </li>
                  <li>
                    <span className="upload-format-info__dot upload-format-info__dot--emerald" />
                    No limit on total batch size
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
