import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Database,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Loader,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import Sidebar from '@/components/common/Sidebar';
import AuthenticatedImage from '@/components/common/AuthenticatedImage';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import Toast from '@/components/Toast';
import {
  createDataset,
  getDataset,
  getDatasets,
  getDatasetSamples,
  getProjects,
  getSystemConfig,
  deleteDataset,
  deleteDatasetSample,
  updateDataset,
  uploadSamples,
} from '@/services/api';
import {
  apiErrorMessage,
  DEFAULT_UPLOAD_POLICY,
  describeUploadPolicy,
  formatFileSize,
  getAcceptedImageExtensions,
  normalizeUploadPolicy,
  validateImageFile,
} from '@/utils/uploadPolicy';
import '@/styles/ManagerDashboard.css';

const SAMPLE_PAGE_SIZE = 24;

function resultData(response) {
  return response?.data?.result ?? response?.data ?? null;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  return [];
}

function normalizeDataset(raw) {
  return {
    id: raw?.id,
    name: raw?.name || 'Untitled dataset',
    description: raw?.description || '',
    creatorId: raw?.creatorId || raw?.creator_id || null,
    createdAt: raw?.createdAt || raw?.created_at || null,
    updatedAt: raw?.updatedAt || raw?.updated_at || null,
    imageCount: raw?.imageCount || 0,
  };
}

function normalizeProject(raw) {
  return {
    id: raw?.id,
    name: raw?.name || raw?.projectName || 'Untitled project',
    datasetId: raw?.datasetId || raw?.dataset_id || null,
  };
}

function fixImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const normalizedUrl = url.replace(/\\/g, '/');
  const uploadsIndex = normalizedUrl.toLowerCase().indexOf('uploads/');
  if (uploadsIndex !== -1) {
    return `/api/v1/uploads/${normalizedUrl.substring(uploadsIndex + 8)}`;
  }
  return `/api/v1/uploads/${normalizedUrl.split('/').pop()}`;
}

function sampleFileName(sample) {
  const rawUrl = sample.imageUrl || sample.image_url || '';
  return sample.fileName
    || sample.filename
    || sample.metadata?.fileName
    || sample.metadata?.filename
    || rawUrl.replace(/\\/g, '/').split('/').pop()
    || 'image.jpg';
}

function normalizeSample(raw) {
  return {
    id: raw?.id,
    datasetId: raw?.datasetId || raw?.dataset_id,
    imageUrl: fixImageUrl(raw?.imageUrl || raw?.image_url),
    fileName: sampleFileName(raw),
    fileSize: raw?.fileSize || raw?.file_size || raw?.metadata?.sizeBytes || 0,
    format: raw?.metadata?.format || raw?.format || '',
    width: raw?.metadata?.width || raw?.width || null,
    height: raw?.metadata?.height || raw?.height || null,
    createdAt: raw?.createdAt || raw?.created_at || null,
  };
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] || 0, value[4] || 0)
    : new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toLocaleDateString('vi-VN');
}

function downloadJson(fileName, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function useRoleShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  return {
    user,
    isAdmin,
    basePath: isAdmin ? '/admin' : '/manager',
    SidebarComponent: isAdmin ? Sidebar : ManagerSidebar,
    handleLogout: () => {
      logout();
      navigate('/login', { replace: true });
    },
  };
}

export default function Datasets() {
  const params = useParams();
  return params.datasetId ? <DatasetDetail /> : <DatasetLibrary />;
}

function DatasetLibrary() {
  const { user, isAdmin, basePath, SidebarComponent, handleLogout } = useRoleShell();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');
  const [toast, setToast] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [datasetsRes, projectsRes] = await Promise.all([getDatasets(), getProjects()]);
      const nextDatasets = normalizeArray(resultData(datasetsRes)).map(normalizeDataset);
      const nextProjects = normalizeArray(resultData(projectsRes)).map(normalizeProject);
      setDatasets(nextDatasets);
      setProjects(nextProjects);
    } catch (error) {
      console.error('Failed to load datasets:', error);
      setToast({ type: 'error', message: 'Failed to load datasets' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const linkedProjectByDataset = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (!project.datasetId) return;
      const linked = map.get(project.datasetId) || [];
      linked.push(project);
      map.set(project.datasetId, linked);
    });
    return map;
  }, [projects]);

  const enrichedDatasets = useMemo(() => datasets.map((dataset) => ({
    ...dataset,
    imageCount: dataset.imageCount || 0,
    linkedProjects: linkedProjectByDataset.get(dataset.id) || [],
  })), [datasets, linkedProjectByDataset]);

  const filteredDatasets = enrichedDatasets.filter((dataset) => {
    const matchesSearch = !searchQuery.trim()
      || dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
      || dataset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all'
      || (statusFilter === 'linked' && dataset.linkedProjects.length > 0)
      || (statusFilter === 'unlinked' && dataset.linkedProjects.length === 0)
      || (statusFilter === 'empty' && dataset.imageCount === 0)
      || (statusFilter === 'with_images' && dataset.imageCount > 0);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: datasets.length,
    images: enrichedDatasets.reduce((sum, dataset) => sum + dataset.imageCount, 0),
    linked: enrichedDatasets.filter((dataset) => dataset.linkedProjects.length > 0).length,
    empty: enrichedDatasets.filter((dataset) => dataset.imageCount === 0).length,
  };

  const handleCreateDataset = async (event) => {
    event.preventDefault();
    const name = datasetName.trim();
    if (!name) return;
    try {
      await createDataset({ name, description: datasetDescription.trim() });
      setToast({ type: 'success', message: 'Dataset created' });
      setDatasetName('');
      setDatasetDescription('');
      setCreateOpen(false);
      await loadData();
    } catch (error) {
      console.error('Failed to create dataset:', error);
      setToast({ type: 'error', message: 'Failed to create dataset' });
    }
  };

  const handleUpdateDataset = async (event) => {
    event.preventDefault();
    if (!editingDataset?.name?.trim()) return;
    try {
      await updateDataset(editingDataset.id, {
        name: editingDataset.name.trim(),
        description: editingDataset.description.trim(),
      });
      setToast({ type: 'success', message: 'Dataset updated' });
      setEditingDataset(null);
      await loadData();
    } catch (error) {
      setToast({ type: 'error', message: apiErrorMessage(error, 'Failed to update dataset') });
    }
  };

  const handleDeleteDataset = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDataset(deleteTarget.id);
      setToast({ type: 'success', message: 'Dataset deleted' });
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      setToast({ type: 'error', message: apiErrorMessage(error, 'Failed to delete dataset') });
    }
  };

  return (
    <div className={isAdmin ? 'admin-layout' : 'manager-layout'}>
      <SidebarComponent isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className={isAdmin ? 'admin-main' : 'manager-main'}>
        <Topbar
          userName={user?.fullName || user?.email || (isAdmin ? 'Administrator' : 'Manager')}
          userRole={isAdmin ? 'ADMIN' : 'Lead Curator'}
          searchPlaceholder="Search datasets..."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          showCenterLinks
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="dataset-library-shell">
            <header className="dataset-library-header">
              <div>
                <h1>Datasets</h1>
                <p>Manage reusable image datasets before linking them to project workflows.</p>
              </div>
              <button type="button" className="project-detail-primary-btn" onClick={() => setCreateOpen(true)}>
                <Plus size={16} /> Create dataset
              </button>
            </header>

            <section className="dataset-kpi-grid" aria-label="Dataset statistics">
              <div className="dataset-kpi"><span>Total datasets</span><strong>{stats.total}</strong></div>
              <div className="dataset-kpi"><span>Total images</span><strong>{stats.images}</strong></div>
              <div className="dataset-kpi"><span>Linked datasets</span><strong>{stats.linked}</strong></div>
              <div className="dataset-kpi"><span>Empty datasets</span><strong>{stats.empty}</strong></div>
            </section>

            <section className="dataset-library-toolbar" aria-label="Dataset filters">
              <label className="project-detail-search">
                <Search size={15} />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search datasets..." />
              </label>
              <div className="dataset-filter-chips">
                {[
                  ['all', 'All'],
                  ['linked', 'Linked'],
                  ['unlinked', 'Unlinked'],
                  ['with_images', 'Has images'],
                  ['empty', 'Empty'],
                ].map(([id, label]) => (
                  <button key={id} type="button" className={statusFilter === id ? 'dataset-filter-chip--active' : ''} onClick={() => setStatusFilter(id)}>
                    {label}
                  </button>
                ))}
              </div>
            </section>

            <section className="dataset-table-card">
              {loading ? (
                <div className="project-detail-loading"><Loader className="project-detail-spin" /> Loading datasets...</div>
              ) : filteredDatasets.length === 0 ? (
                <div className="project-detail-empty-state">
                  <Database size={30} />
                  <strong>No datasets found.</strong>
                  <span>Create a dataset or adjust filters to find existing data.</span>
                  <button type="button" className="project-detail-primary-btn" onClick={() => setCreateOpen(true)}>
                    <Plus size={16} /> Create dataset
                  </button>
                </div>
              ) : (
                <div className="dataset-table-scroll">
                  <table className="dataset-table">
                    <thead>
                      <tr>
                        <th>Dataset</th>
                        <th>Images</th>
                        <th>Linked project</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDatasets.map((dataset) => (
                        <tr key={dataset.id}>
                          <td>
                            <strong>{dataset.name}</strong>
                            <span>{dataset.description || dataset.id}</span>
                          </td>
                          <td>{dataset.imageCount}</td>
                          <td>
                            {dataset.linkedProjects.length > 0
                              ? dataset.linkedProjects.map((project) => project.name).join(', ')
                              : 'Not linked'}
                          </td>
                          <td>{formatDate(dataset.createdAt)}</td>
                          <td><span className={dataset.linkedProjects.length > 0 ? 'dataset-status dataset-status--linked' : 'dataset-status'}>{dataset.linkedProjects.length > 0 ? `${dataset.linkedProjects.length} project${dataset.linkedProjects.length === 1 ? '' : 's'}` : 'Available'}</span></td>
                          <td>
                            <Link className="dataset-open-link" to={`${basePath}/datasets/${dataset.id}`}>
                              Open
                            </Link>
                            <button type="button" className="dataset-inline-action" onClick={() => setEditingDataset(dataset)}>
                              Edit
                            </button>
                            <button type="button" className="dataset-inline-action dataset-inline-action--danger" onClick={() => setDeleteTarget(dataset)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {createOpen && (
        <div className="dataset-modal-backdrop" role="presentation">
          <form className="dataset-modal" onSubmit={handleCreateDataset}>
            <div className="dataset-modal__header">
              <h2>Create dataset</h2>
              <button type="button" onClick={() => setCreateOpen(false)} aria-label="Close create dataset">
                <X size={16} />
              </button>
            </div>
            <label className="form-field">
              <span className="form-field__label">Dataset name</span>
              <input className="form-field__input" value={datasetName} onChange={(event) => setDatasetName(event.target.value)} placeholder="e.g. Vehicle damage batch" />
            </label>
            <label className="form-field">
              <span className="form-field__label">Description</span>
              <textarea className="form-field__textarea" value={datasetDescription} onChange={(event) => setDatasetDescription(event.target.value)} placeholder="Purpose, source, or collection notes" />
            </label>
            <button type="submit" className="project-detail-primary-btn" disabled={!datasetName.trim()}>
              <Plus size={16} /> Create dataset
            </button>
          </form>
        </div>
      )}

      {editingDataset && (
        <div className="dataset-modal-backdrop" role="presentation">
          <form className="dataset-modal" onSubmit={handleUpdateDataset}>
            <div className="dataset-modal__header">
              <h2>Edit dataset</h2>
              <button type="button" onClick={() => setEditingDataset(null)} aria-label="Close edit dataset">
                <X size={16} />
              </button>
            </div>
            <label className="form-field">
              <span className="form-field__label">Dataset name</span>
              <input className="form-field__input" value={editingDataset.name} onChange={(event) => setEditingDataset((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label className="form-field">
              <span className="form-field__label">Description</span>
              <textarea className="form-field__textarea" value={editingDataset.description} onChange={(event) => setEditingDataset((prev) => ({ ...prev, description: event.target.value }))} />
            </label>
            <button type="submit" className="project-detail-primary-btn" disabled={!editingDataset.name.trim()}>
              Save changes
            </button>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="dataset-modal-backdrop" role="presentation">
          <div className="dataset-modal">
            <div className="dataset-modal__header">
              <h2>Delete dataset</h2>
              <button type="button" onClick={() => setDeleteTarget(null)} aria-label="Close delete dataset">
                <X size={16} />
              </button>
            </div>
            <p>Delete <strong>{deleteTarget.name}</strong>? It will be removed from active dataset lists.</p>
            <div className="form-actions">
              <button type="button" className="danger-btn" onClick={handleDeleteDataset}>Delete dataset</button>
              <button type="button" className="cancel-btn" onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast type={toast.type || 'success'} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}

function DatasetDetail() {
  const { datasetId } = useParams();
  const { user, isAdmin, basePath, SidebarComponent, handleLogout } = useRoleShell();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataset, setDataset] = useState(null);
  const [samples, setSamples] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSampleIds, setSelectedSampleIds] = useState([]);
  const [uploadPolicy, setUploadPolicy] = useState(DEFAULT_UPLOAD_POLICY);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [samplePage, setSamplePage] = useState(1);
  const [previewSample, setPreviewSample] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const [datasetRes, samplesRes, projectsRes, configRes] = await Promise.all([
        getDataset(datasetId),
        getDatasetSamples(datasetId),
        getProjects(),
        getSystemConfig(),
      ]);
      setDataset(normalizeDataset(resultData(datasetRes)));
      setSamples(normalizeArray(resultData(samplesRes)).map(normalizeSample));
      setProjects(normalizeArray(resultData(projectsRes)).map(normalizeProject));
      setUploadPolicy(normalizeUploadPolicy(configRes));
    } catch (error) {
      console.error('Failed to load dataset detail:', error);
      setToast({ type: 'error', message: 'Failed to load dataset detail' });
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const linkedProjects = projects.filter((project) => project.datasetId === datasetId);
  const filteredSamples = samples.filter((sample) => sample.fileName.toLowerCase().includes(searchQuery.toLowerCase()));
  const selectedSamples = samples.filter((sample) => selectedSampleIds.includes(sample.id));
  const totalSamplePages = Math.max(1, Math.ceil(filteredSamples.length / SAMPLE_PAGE_SIZE));
  const pagedSamples = filteredSamples.slice((samplePage - 1) * SAMPLE_PAGE_SIZE, samplePage * SAMPLE_PAGE_SIZE);

  useEffect(() => {
    setSamplePage(1);
  }, [searchQuery, samples.length]);

  const manifest = (items = samples) => ({
    dataset: {
      id: dataset?.id,
      name: dataset?.name,
      description: dataset?.description,
    },
    summary: {
      images: items.length,
      linkedProjects: linkedProjects.map((project) => ({ id: project.id, name: project.name })),
      exportedAt: new Date().toISOString(),
    },
    samples: items,
  });

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    const invalidFiles = files
      .map((file) => ({ file, validation: validateImageFile(file, uploadPolicy) }))
      .filter((entry) => !entry.validation.valid);
    const validFiles = files.filter((file) => validateImageFile(file, uploadPolicy).valid);
    if (validFiles.length === 0) {
      setToast({
        type: 'error',
        message: invalidFiles[0]?.validation.error || `Choose images: ${describeUploadPolicy(uploadPolicy)}`,
      });
      return;
    }
    if (invalidFiles.length > 0) {
      setToast({ type: 'error', message: `${invalidFiles.length} invalid file(s) skipped. ${invalidFiles[0].validation.error}` });
    }
    setUploading(true);
    try {
      for (const file of validFiles) {
        await uploadSamples(datasetId, file);
      }
      setToast({ type: 'success', message: `${validFiles.length} image${validFiles.length === 1 ? '' : 's'} uploaded` });
      await loadDetail();
    } catch (error) {
      console.error('Dataset upload failed:', error);
      setToast({ type: 'error', message: apiErrorMessage(error, 'Upload failed') });
    } finally {
      setUploading(false);
    }
  };

  const toggleSample = (sampleId) => {
    setSelectedSampleIds((prev) => (
      prev.includes(sampleId) ? prev.filter((id) => id !== sampleId) : [...prev, sampleId]
    ));
  };

  const handleDeleteSelectedSamples = async () => {
    if (selectedSampleIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSampleIds.length} selected images?`)) return;
    
    setLoading(true);
    try {
      for (const sampleId of selectedSampleIds) {
        await deleteDatasetSample(datasetId, sampleId);
      }
      setToast({ type: 'success', message: `Deleted ${selectedSampleIds.length} images` });
      setSelectedSampleIds([]);
      await loadDetail();
    } catch (error) {
      console.error('Failed to delete images:', error);
      setToast({ type: 'error', message: apiErrorMessage(error, 'Failed to delete some images') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSample = async (sampleId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    setLoading(true);
    try {
      await deleteDatasetSample(datasetId, sampleId);
      setToast({ type: 'success', message: `Deleted image` });
      setSelectedSampleIds(prev => prev.filter(id => id !== sampleId));
      await loadDetail();
    } catch (error) {
      console.error('Failed to delete image:', error);
      setToast({ type: 'error', message: apiErrorMessage(error, 'Failed to delete image') });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={isAdmin ? 'admin-layout' : 'manager-layout'}>
        <SidebarComponent isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className={isAdmin ? 'admin-main' : 'manager-main'}>
          <Topbar userName={user?.fullName || user?.email || 'User'} userRole={isAdmin ? 'ADMIN' : 'Lead Curator'} onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />
          <main className="manager-content project-detail-loading"><Loader className="project-detail-spin" /> Loading dataset...</main>
        </div>
      </div>
    );
  }

  return (
    <div className={isAdmin ? 'admin-layout' : 'manager-layout'}>
      <SidebarComponent isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className={isAdmin ? 'admin-main' : 'manager-main'}>
        <Topbar
          userName={user?.fullName || user?.email || (isAdmin ? 'Administrator' : 'Manager')}
          userRole={isAdmin ? 'ADMIN' : 'Lead Curator'}
          searchPlaceholder="Search images..."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          showCenterLinks
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="dataset-library-shell">
            <Link className="project-detail-back" to={`${basePath}/datasets`}>
              <ArrowLeft size={16} /> Datasets
            </Link>

            <header className="dataset-detail-header">
              <div className="project-detail-title-block">
                <div className="project-detail-icon"><Database size={24} /></div>
                <div>
                  <h1 className="project-detail-title">{dataset?.name || 'Dataset'}</h1>
                  <p className="project-detail-subtitle">{dataset?.description || datasetId}</p>
                </div>
              </div>
              <div className="project-detail-actions">
                <input ref={fileInputRef} type="file" multiple accept={getAcceptedImageExtensions(uploadPolicy)} className="visually-hidden" onChange={handleUpload} />
                <button type="button" className="project-detail-secondary-btn" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload size={16} /> {uploading ? 'Uploading...' : 'Add images'}
                </button>
                <button type="button" className="project-detail-secondary-btn" onClick={() => downloadJson(`dataset-${datasetId}-manifest.json`, manifest(samples))} disabled={samples.length === 0}>
                  <Download size={16} /> Download manifest
                </button>
              </div>
            </header>

            <section className="dataset-kpi-grid" aria-label="Dataset detail statistics">
              <div className="dataset-kpi"><span>Images</span><strong>{samples.length}</strong></div>
              <div className="dataset-kpi"><span>Selected</span><strong>{selectedSamples.length}</strong></div>
              <div className="dataset-kpi"><span>Linked projects</span><strong>{linkedProjects.length}</strong></div>
              <div className="dataset-kpi"><span>Created</span><strong>{formatDate(dataset?.createdAt)}</strong></div>
            </section>

            <section className="dataset-link-panel">
              <div>
                <h2>Project usage</h2>
                <p>Datasets are linked from each project so the same dataset can safely be reused by multiple workflows.</p>
              </div>
              <div className="dataset-linked-projects">
                {linkedProjects.length === 0 ? (
                  <span className="dataset-status">Available</span>
                ) : linkedProjects.map((project) => (
                  <Link key={project.id} className="dataset-open-link" to={`${basePath}/projects/${project.id}?tab=dataset`}>
                    {project.name}
                  </Link>
                ))}
              </div>
            </section>

            <section className="dataset-samples-card">
              <div className="project-detail-section-header">
                <div>
                  <h2>Dataset samples</h2>
                  <p>{filteredSamples.length} visible, {selectedSamples.length} selected</p>
                </div>
                <button type="button" className="project-detail-secondary-btn" onClick={() => downloadJson(`dataset-${datasetId}-selected.json`, manifest(selectedSamples))} disabled={selectedSamples.length === 0}>
                  <Download size={16} /> Export selected
                </button>
                <button type="button" className="project-detail-secondary-btn" onClick={handleDeleteSelectedSamples} disabled={selectedSamples.length === 0} style={{ color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>
                  <Trash2 size={16} /> Delete selected
                </button>
              </div>
              <div className="project-detail-catalog-toolbar">
                <label className="project-detail-search">
                  <Search size={15} />
                  <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search images..." />
                </label>
                <button
                  type="button"
                  className="project-detail-secondary-btn"
                  onClick={() => setSelectedSampleIds(filteredSamples.map((sample) => sample.id))}
                  disabled={filteredSamples.length === 0}
                >
                  Select all
                </button>
              </div>

              {samples.length === 0 ? (
                <div className="project-detail-empty-state">
                  <ImageIcon size={30} />
                  <strong>No images uploaded yet.</strong>
                  <span>Upload images ({describeUploadPolicy(uploadPolicy)}) to make this dataset usable in projects.</span>
                  <button type="button" className="project-detail-primary-btn" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Add images
                  </button>
                </div>
              ) : filteredSamples.length === 0 ? (
                <div className="project-detail-empty-state"><Search size={30} /> No images match this search.</div>
              ) : (
                <div className="project-detail-sample-grid">
                  {pagedSamples.map((sample) => (
                    <article key={sample.id} className={`project-detail-sample-card ${selectedSampleIds.includes(sample.id) ? 'project-detail-sample-card--selected' : ''}`}>
                      <button type="button" className="project-detail-sample-select" onClick={() => toggleSample(sample.id)} aria-label={`Select ${sample.fileName}`}>
                        {selectedSampleIds.includes(sample.id) && <Check size={14} />}
                      </button>
                      <button type="button" className="project-detail-sample-preview" onClick={() => setPreviewSample(sample)} aria-label={`Preview ${sample.fileName}`}>
                        <AuthenticatedImage
                          src={sample.imageUrl}
                          alt={sample.fileName}
                          loadProtected
                          fallback={<div className="project-detail-image-placeholder"><ImageIcon size={24} /></div>}
                        />
                      </button>
                      <div>
                        <strong title={sample.fileName}>{sample.fileName}</strong>
                        <span>{sample.width && sample.height ? `${sample.width}x${sample.height}` : formatFileSize(sample.fileSize)}</span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                          {sample.imageUrl && <a href={sample.imageUrl} download style={{ flex: 1 }}>Download</a>}
                          <button type="button" onClick={() => handleDeleteSample(sample.id)} aria-label="Delete image" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 4px' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {filteredSamples.length > SAMPLE_PAGE_SIZE && (
                <div className="dataset-pagination">
                  <span>Page {samplePage} of {totalSamplePages}</span>
                  <button type="button" onClick={() => setSamplePage((page) => Math.max(1, page - 1))} disabled={samplePage === 1}>Previous</button>
                  <button type="button" onClick={() => setSamplePage((page) => Math.min(totalSamplePages, page + 1))} disabled={samplePage === totalSamplePages}>Next</button>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      {previewSample && (
        <div className="dataset-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview ${previewSample.fileName}`}>
          <div className="dataset-preview-modal__content">
            <button type="button" className="dataset-preview-modal__close" onClick={() => setPreviewSample(null)} aria-label="Close preview">
              <X size={18} />
            </button>
            <AuthenticatedImage
              src={previewSample.imageUrl}
              alt={previewSample.fileName}
              loadProtected
              fallback={<div className="project-detail-image-placeholder"><ImageIcon size={36} /></div>}
            />
            <div className="dataset-preview-modal__meta">
              <strong>{previewSample.fileName}</strong>
              <span>{previewSample.width && previewSample.height ? `${previewSample.width}x${previewSample.height}` : formatFileSize(previewSample.fileSize)}</span>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast type={toast.type || 'success'} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}
