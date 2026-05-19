import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle,
  Database,
  Download,
  FolderOpen,
  Image as ImageIcon,
  Loader,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import Sidebar from '@/components/common/Sidebar';
import AuthenticatedImage from '@/components/common/AuthenticatedImage';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import Toast from '@/components/Toast';
import AnnotatorSelect from '@/components/AnnotatorSelect';
import {
  assignTasks,
  createDataset,
  createLabel,
  deleteLabel,
  deleteDatasetSample,
  exportProjectCoco,
  generateTasks,
  getAnnotators,
  getDatasetSamples,
  getLabelsByProject,
  getProject,
  getSystemConfig,
  getTasks,
  updateProject,
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
import '@/styles/UploadImages.css';
import '@/styles/AnnotatorsImageGrid.css';
import '@/styles/LabelTaxonomy.css';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'dataset', label: 'Dataset', icon: Database },
  { id: 'labels', label: 'Labels', icon: Tag },
  { id: 'tasks', label: 'Tasks', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const SAMPLE_PAGE_SIZE = 24;

function getResultData(response) {
  return response?.data?.result ?? response?.data ?? null;
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.content)) return value.content;
  return [];
}

function normalizeProject(raw) {
  return {
    id: raw?.id,
    name: raw?.name || raw?.projectName || 'Untitled project',
    description: raw?.description || 'No description provided.',
    status: raw?.status || 'DRAFT',
    datasetId: raw?.dataset_id || raw?.datasetId || null,
    createdAt: raw?.created_at || raw?.createdAt,
  };
}

function normalizeTask(task) {
  const rawUrl = task.image_url || task.imageUrl || '';
  return {
    id: task.id,
    fileName: rawUrl ? rawUrl.replace(/\\/g, '/').split('/').pop() : 'image.jpg',
    imageUrl: fixImageUrl(rawUrl),
    status: task.status || 'PENDING',
    annotatorName: task.annotatorName || task.annotator_name || null,
  };
}

function getSampleFileName(sample) {
  const rawUrl = sample.imageUrl || sample.image_url || '';
  return sample.fileName
    || sample.filename
    || sample.metadata?.fileName
    || sample.metadata?.filename
    || rawUrl.replace(/\\/g, '/').split('/').pop()
    || 'image.jpg';
}

function normalizeLabel(label) {
  return {
    ...label,
    color: label.color_hex || label.colorHex || label.color || label.hex || '#059669',
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

function taskBucket(status) {
  if (status === 'PENDING') return 'unassigned';
  if (status === 'COMPLETED' || status === 'APPROVED') return 'completed';
  return 'assigned';
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

export default function ProjectDetail() {
  const { user, logout } = useAuth();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const basePath = isAdmin ? '/admin' : '/manager';
  const SidebarComponent = isAdmin ? Sidebar : ManagerSidebar;
  const activeTab = searchParams.get('tab') || 'overview';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [labels, setLabels] = useState([]);
  const [samples, setSamples] = useState([]);
  const [annotators, setAnnotators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [taskTab, setTaskTab] = useState('unassigned');

  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#059669');
  const [labelError, setLabelError] = useState('');
  const [labelSubmitting, setLabelSubmitting] = useState(false);

  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadPolicy, setUploadPolicy] = useState(DEFAULT_UPLOAD_POLICY);
  const [datasetSearch, setDatasetSearch] = useState('');
  const [selectedSampleIds, setSelectedSampleIds] = useState([]);
  const [samplePage, setSamplePage] = useState(1);
  const [previewSample, setPreviewSample] = useState(null);
  const fileInputRef = useRef(null);

  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [selectedAnnotatorId, setSelectedAnnotatorId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProject(projectId);
      setProject(normalizeProject(getResultData(res)));
    } catch (error) {
      console.error('Failed to load project detail:', error);
      setToast({ type: 'error', message: 'Failed to load project detail' });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await getTasks(projectId);
      setTasks(normalizeArray(getResultData(res)).map(normalizeTask));
    } catch (error) {
      console.error('Failed to load project tasks:', error);
      setTasks([]);
    }
  }, [projectId]);

  const loadLabels = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await getLabelsByProject(projectId);
      setLabels(normalizeArray(getResultData(res)).map(normalizeLabel));
    } catch (error) {
      console.error('Failed to load labels:', error);
      setLabels([]);
    }
  }, [projectId]);

  const loadSamples = useCallback(async (datasetId = project?.datasetId) => {
    if (!datasetId) {
      setSamples([]);
      return;
    }
    try {
      const res = await getDatasetSamples(datasetId);
      setSamples(normalizeArray(getResultData(res)).map((sample) => ({
        id: sample.id,
        imageUrl: fixImageUrl(sample.imageUrl || sample.image_url),
        fileName: getSampleFileName(sample),
        fileSize: sample.fileSize || sample.file_size || sample.metadata?.sizeBytes || 0,
        format: sample.metadata?.format || sample.format || '',
        width: sample.metadata?.width || sample.width || null,
        height: sample.metadata?.height || sample.height || null,
        createdAt: sample.createdAt || sample.created_at || null,
        metadata: sample.metadata || {},
      })));
    } catch (error) {
      console.error('Failed to load dataset samples:', error);
      setSamples([]);
    }
  }, [project?.datasetId]);

  useEffect(() => {
    loadProject();
    loadTasks();
    loadLabels();
    getAnnotators()
      .then((res) => setAnnotators(normalizeArray(getResultData(res)).map((item) => ({
        id: item.id,
        name: item.fullName || item.full_name || item.email,
        email: item.email,
      }))))
      .catch(() => setAnnotators([]));
    getSystemConfig()
      .then((res) => setUploadPolicy(normalizeUploadPolicy(res)))
      .catch(() => setUploadPolicy(DEFAULT_UPLOAD_POLICY));
  }, [loadProject, loadTasks, loadLabels]);

  useEffect(() => {
    if (project?.datasetId) loadSamples(project.datasetId);
  }, [project?.datasetId, loadSamples]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => taskBucket(task.status) === 'completed').length;
    const assigned = tasks.filter((task) => taskBucket(task.status) === 'assigned').length;
    const unassigned = tasks.filter((task) => taskBucket(task.status) === 'unassigned').length;
    return {
      total,
      completed,
      assigned,
      unassigned,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [tasks]);

  const setupChecklist = useMemo(() => ([
    {
      id: 'dataset',
      label: 'Dataset',
      ready: Boolean(project?.datasetId) || samples.length > 0,
      detail: samples.length > 0 ? `${samples.length} image${samples.length === 1 ? '' : 's'} in catalog` : 'Upload images to start task generation',
      tab: 'dataset',
      icon: Database,
    },
    {
      id: 'labels',
      label: 'Labels',
      ready: labels.length > 0,
      detail: labels.length > 0 ? `${labels.length} label class${labels.length === 1 ? '' : 'es'} defined` : 'Define the taxonomy annotators will use',
      tab: 'labels',
      icon: Tag,
    },
    {
      id: 'tasks',
      label: 'Tasks',
      ready: tasks.length > 0,
      detail: tasks.length > 0 ? `${tasks.length} generated task${tasks.length === 1 ? '' : 's'}` : 'Generate tasks after dataset images exist',
      tab: 'tasks',
      icon: Users,
    },
    {
      id: 'assignment',
      label: 'Assignment',
      ready: stats.assigned + stats.completed > 0,
      detail: stats.assigned + stats.completed > 0 ? `${stats.assigned + stats.completed} task${stats.assigned + stats.completed === 1 ? '' : 's'} assigned or done` : 'Assign unassigned work to annotators',
      tab: 'tasks',
      icon: CheckCircle,
    },
  ]), [labels.length, project?.datasetId, samples.length, stats.assigned, stats.completed, tasks.length]);

  const nextSetupAction = setupChecklist.find((item) => !item.ready) || {
    label: 'Analytics',
    detail: 'Review progress and operational distribution',
    tab: 'analytics',
    icon: BarChart3,
  };

  const visibleTasks = tasks.filter((task) => taskBucket(task.status) === taskTab);
  const filteredSamples = samples.filter((sample) => (
    sample.fileName.toLowerCase().includes(datasetSearch.trim().toLowerCase())
  ));
  const selectedSamples = samples.filter((sample) => selectedSampleIds.includes(sample.id));
  const totalSamplePages = Math.max(1, Math.ceil(filteredSamples.length / SAMPLE_PAGE_SIZE));
  const pagedSamples = filteredSamples.slice((samplePage - 1) * SAMPLE_PAGE_SIZE, samplePage * SAMPLE_PAGE_SIZE);

  useEffect(() => {
    setSamplePage(1);
  }, [datasetSearch, samples.length]);

  const setActiveTab = (tabId) => {
    setSearchParams(tabId === 'overview' ? {} : { tab: tabId });
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const ensureDataset = async () => {
    if (project?.datasetId) return project.datasetId;
    const datasetRes = await createDataset(project.name);
    const datasetId = getResultData(datasetRes)?.id;
    await updateProject(project.id, { dataset_id: datasetId });
    setProject((prev) => ({ ...prev, datasetId }));
    return datasetId;
  };

  const processUploadFiles = (rawFiles) => {
    const entries = Array.from(rawFiles).map((file) => {
      const validation = validateImageFile(file, uploadPolicy);
      return {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: validation.valid ? URL.createObjectURL(file) : null,
        status: validation.valid ? 'ready' : 'invalid',
        progress: 0,
        error: validation.error,
      };
    });
    setUploadFiles((prev) => [...prev, ...entries]);
  };

  const removeUploadFile = (id) => {
    setUploadFiles((prev) => {
      const target = prev.find((entry) => entry.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const uploadReadyFiles = async () => {
    const ready = uploadFiles.filter((entry) => entry.status === 'ready');
    if (ready.length === 0) return;
    setUploading(true);
    try {
      const datasetId = await ensureDataset();
      for (const entry of ready) {
        setUploadFiles((prev) => prev.map((item) => (
          item.id === entry.id ? { ...item, status: 'uploading', progress: 1 } : item
        )));
        await uploadSamples(datasetId, entry.file, (event) => {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 50;
          setUploadFiles((prev) => prev.map((item) => (
            item.id === entry.id ? { ...item, progress } : item
          )));
        });
        setUploadFiles((prev) => prev.map((item) => (
          item.id === entry.id ? { ...item, status: 'uploaded', progress: 100 } : item
        )));
      }
      setToast({ type: 'success', message: `${ready.length} image${ready.length === 1 ? '' : 's'} uploaded` });
      setUploadFiles([]);
      await loadSamples(datasetId);
    } catch (error) {
      console.error('Upload failed:', error);
      setToast({ type: 'error', message: apiErrorMessage(error, 'Upload failed. Please try again.') });
    } finally {
      setUploading(false);
    }
  };

  const buildDatasetManifest = (items = samples) => ({
    project: {
      id: project.id,
      name: project.name,
      datasetId: project.datasetId,
    },
    summary: {
      images: items.length,
      labels: labels.length,
      tasks: tasks.length,
      exportedAt: new Date().toISOString(),
    },
    samples: items.map((sample) => ({
      id: sample.id,
      fileName: sample.fileName,
      imageUrl: sample.imageUrl,
      fileSize: sample.fileSize,
      format: sample.format,
      width: sample.width,
      height: sample.height,
      createdAt: sample.createdAt,
    })),
  });

  const handleDownloadDatasetManifest = () => {
    downloadJson(`project-${projectId}-dataset-manifest.json`, buildDatasetManifest(samples));
    setToast({ type: 'success', message: 'Dataset manifest downloaded' });
  };

  const handleDownloadSelectedManifest = () => {
    if (selectedSamples.length === 0) return;
    downloadJson(`project-${projectId}-selected-images.json`, buildDatasetManifest(selectedSamples));
    setToast({ type: 'success', message: `${selectedSamples.length} selected image${selectedSamples.length === 1 ? '' : 's'} exported` });
  };

  const handleDeleteSelectedSamples = async () => {
    if (!project?.datasetId || selectedSampleIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedSampleIds.length} selected images?`)) return;
    
    setLoading(true);
    try {
      for (const sampleId of selectedSampleIds) {
        await deleteDatasetSample(project.datasetId, sampleId);
      }
      setToast({ type: 'success', message: `Deleted ${selectedSampleIds.length} images` });
      setSelectedSampleIds([]);
      await loadSamples();
    } catch (error) {
      console.error('Failed to delete images:', error);
      setToast({ type: 'error', message: apiErrorMessage(error, 'Failed to delete some images') });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSample = async (sampleId) => {
    if (!project?.datasetId) return;
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    setLoading(true);
    try {
      await deleteDatasetSample(project.datasetId, sampleId);
      setToast({ type: 'success', message: `Deleted image` });
      setSelectedSampleIds(prev => prev.filter(id => id !== sampleId));
      await loadSamples();
    } catch (error) {
      console.error('Failed to delete image:', error);
      setToast({ type: 'error', message: apiErrorMessage(error, 'Failed to delete image') });
    } finally {
      setLoading(false);
    }
  };

  const toggleSample = (sampleId) => {
    setSelectedSampleIds((prev) => (
      prev.includes(sampleId) ? prev.filter((id) => id !== sampleId) : [...prev, sampleId]
    ));
  };

  const selectAllFilteredSamples = () => {
    const filteredIds = filteredSamples.map((sample) => sample.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedSampleIds.includes(id));
    setSelectedSampleIds(allSelected ? [] : filteredIds);
  };

  const handleCreateLabel = async (event) => {
    event.preventDefault();
    const trimmed = labelName.trim();
    if (!trimmed) {
      setLabelError('Label name is required');
      return;
    }
    if (labels.some((label) => label.name.toLowerCase() === trimmed.toLowerCase())) {
      setLabelError('This label already exists');
      return;
    }
    setLabelSubmitting(true);
    setLabelError('');
    try {
      await createLabel(projectId, { name: trimmed, color_hex: labelColor });
      setLabelName('');
      setToast({ type: 'success', message: `"${trimmed}" added to project labels` });
      await loadLabels();
    } catch (error) {
      console.error('Failed to create label:', error);
      setLabelError(error.response?.data?.message || 'Failed to create label');
    } finally {
      setLabelSubmitting(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    try {
      await deleteLabel(projectId, labelId);
      setToast({ type: 'success', message: 'Label removed' });
      await loadLabels();
    } catch (error) {
      console.error('Failed to delete label:', error);
      setToast({ type: 'error', message: 'Failed to delete label' });
    }
  };

  const toggleTask = (taskId) => {
    if (taskTab !== 'unassigned') return;
    setSelectedTaskIds((prev) => (
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    ));
  };

  const handleGenerateTasks = async () => {
    setGenerating(true);
    try {
      const datasetId = await ensureDataset();
      await generateTasks(projectId, datasetId);
      setToast({ type: 'success', message: 'Tasks generated from dataset' });
      await loadTasks();
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      setToast({ type: 'error', message: 'Failed to generate tasks. Upload images first.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignTasks = async () => {
    if (selectedTaskIds.length === 0 || !selectedAnnotatorId) return;
    setAssigning(true);
    try {
      await assignTasks(projectId, {
        task_ids: selectedTaskIds,
        annotator_id: selectedAnnotatorId,
      });
      setToast({ type: 'success', message: `${selectedTaskIds.length} task${selectedTaskIds.length === 1 ? '' : 's'} assigned` });
      setSelectedTaskIds([]);
      setSelectedAnnotatorId('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to assign tasks:', error);
      setToast({ type: 'error', message: 'Failed to assign tasks' });
    } finally {
      setAssigning(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportProjectCoco(projectId);
      const data = getResultData(res) || res.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project-${projectId}-coco.json`;
      link.click();
      URL.revokeObjectURL(url);
      setToast({ type: 'success', message: 'COCO export downloaded' });
    } catch (error) {
      console.error('Export failed:', error);
      setToast({ type: 'error', message: 'COCO export failed' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={isAdmin ? 'admin-layout' : 'manager-layout'}>
        <SidebarComponent isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className={isAdmin ? 'admin-main' : 'manager-main'}>
          <Topbar userName={user?.fullName || user?.email || 'User'} userRole={user?.role || ''} onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />
          <main className="manager-content project-detail-loading"><Loader size={28} className="project-detail-spin" /> Loading project...</main>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={isAdmin ? 'admin-layout' : 'manager-layout'}>
        <SidebarComponent isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
        <div className={isAdmin ? 'admin-main' : 'manager-main'}>
          <Topbar userName={user?.fullName || user?.email || 'User'} userRole={user?.role || ''} onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} />
          <main className="manager-content project-detail-empty">
            <h1>Project not found</h1>
            <button type="button" className="project-detail-primary-btn" onClick={() => navigate(`${basePath}/projects`)}>
              Back to Projects
            </button>
          </main>
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
          searchPlaceholder="Search within project..."
          showCenterLinks
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="project-detail-shell">
            <button type="button" className="project-detail-back" onClick={() => navigate(`${basePath}/projects`)}>
              <ArrowLeft size={16} /> Projects
            </button>

            <header className="project-detail-header">
              <div className="project-detail-title-block">
                <div className="project-detail-icon"><FolderOpen size={24} /></div>
                <div>
                  <h1 className="project-detail-title">{project.name}</h1>
                  <p className="project-detail-subtitle">{project.description}</p>
                </div>
              </div>
              <div className="project-detail-actions">
                <button type="button" className="project-detail-secondary-btn" onClick={handleExport} disabled={exporting}>
                  <Download size={16} /> {exporting ? 'Exporting...' : 'Export COCO'}
                </button>
                <button type="button" className="project-detail-primary-btn" onClick={() => setActiveTab('dataset')}>
                  <Upload size={16} /> Upload Images
                </button>
              </div>
            </header>

            <section className="project-detail-metrics" aria-label="Project metrics">
              <div className="project-detail-metric"><span>Total tasks</span><strong>{stats.total}</strong></div>
              <div className="project-detail-metric"><span>Dataset images</span><strong>{samples.length}</strong></div>
              <div className="project-detail-metric"><span>Labels</span><strong>{labels.length}</strong></div>
              <div className="project-detail-metric"><span>Progress</span><strong>{stats.progress}%</strong></div>
            </section>

            <nav className="project-detail-tabs" role="tablist" aria-label="Project workflow tabs">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    className={`project-detail-tab ${selected ? 'project-detail-tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={16} /> {tab.label}
                  </button>
                );
              })}
            </nav>

            <section className="project-detail-panel" role="tabpanel">
              {activeTab === 'overview' && (
                <div className="project-detail-overview">
                  <div className="project-detail-section">
                    <h2>Setup checklist</h2>
                    <p>Track whether this project is ready for labeling before work is assigned.</p>
                    <div className="project-detail-progress">
                      <div style={{ width: `${stats.progress}%` }} />
                    </div>
                    <div className="project-detail-checklist">
                      {setupChecklist.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`project-detail-check-item ${item.ready ? 'project-detail-check-item--ready' : ''}`}
                            onClick={() => setActiveTab(item.tab)}
                          >
                            <span className="project-detail-check-icon">
                              {item.ready ? <Check size={15} /> : <Icon size={15} />}
                            </span>
                            <span>
                              <strong>{item.label}</strong>
                              <small>{item.detail}</small>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="project-detail-section">
                    <h2>Recommended next step</h2>
                    <div className="project-detail-next-card">
                      <strong>{nextSetupAction.label}</strong>
                      <span>{nextSetupAction.detail}</span>
                      <button type="button" className="project-detail-primary-btn" onClick={() => setActiveTab(nextSetupAction.tab)}>
                        Continue setup
                      </button>
                    </div>
                    <div className="project-detail-action-list">
                      <button type="button" onClick={() => setActiveTab('dataset')}><Upload size={15} /> Open Dataset</button>
                      <button type="button" onClick={() => setActiveTab('labels')}><Tag size={15} /> Open Labels</button>
                      <button type="button" onClick={() => setActiveTab('tasks')}><Users size={15} /> Open Tasks</button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dataset' && (
                <>
                  <div className="project-detail-tab-heading">
                    <div>
                      <h2>Dataset workspace</h2>
                      <p>Upload, validate, and inspect the image catalog tied to this project.</p>
                    </div>
                    <div className="project-detail-toolbar">
                      <button type="button" className="project-detail-secondary-btn" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> Add images
                      </button>
                      <button type="button" className="project-detail-secondary-btn" onClick={handleDownloadDatasetManifest} disabled={samples.length === 0}>
                        <Download size={16} /> Download manifest
                      </button>
                      <button type="button" className="project-detail-primary-btn" onClick={handleGenerateTasks} disabled={generating || samples.length === 0}>
                        <CheckCircle size={16} /> {generating ? 'Generating...' : 'Generate tasks'}
                      </button>
                    </div>
                  </div>
                  <div className="project-detail-tab-kpis" aria-label="Dataset status">
                    <div className="project-detail-mini-metric"><span>Dataset status</span><strong>{project.datasetId ? 'Linked' : 'Not linked'}</strong></div>
                    <div className="project-detail-mini-metric"><span>Upload queue</span><strong>{uploadFiles.length}</strong></div>
                    <div className="project-detail-mini-metric"><span>Catalog images</span><strong>{samples.length}</strong></div>
                  </div>
                  <div className="project-detail-grid">
                  <div className="project-detail-section">
                    <h2>Upload queue</h2>
                    <p>{project.datasetId ? 'Images uploaded here are bound to this project dataset.' : 'No dataset is linked yet. The first upload will create one automatically.'}</p>
                    <div
                      className={`project-detail-dropzone ${dragActive ? 'project-detail-dropzone--active' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => { event.preventDefault(); setDragActive(true); }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragActive(false);
                        processUploadFiles(event.dataTransfer.files);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={getAcceptedImageExtensions(uploadPolicy)}
                        className="visually-hidden"
                        onChange={(event) => {
                          processUploadFiles(event.target.files);
                          event.target.value = '';
                        }}
                      />
                      <Upload size={32} />
                      <strong>Drag and drop images here</strong>
                      <span>{describeUploadPolicy(uploadPolicy)} per file</span>
                    </div>

                    {uploadFiles.length > 0 && (
                      <div className="project-detail-upload-list">
                        {uploadFiles.map((entry) => (
                          <div key={entry.id} className={`project-detail-upload-item ${entry.status === 'invalid' ? 'project-detail-upload-item--invalid' : ''}`}>
                            {entry.previewUrl ? <img src={entry.previewUrl} alt={entry.name} /> : <ImageIcon size={22} />}
                            <div>
                              <strong>{entry.name}</strong>
                              <span>{entry.error || `${formatFileSize(entry.size)} · ${entry.status}`}</span>
                              {entry.status === 'uploading' && (
                                <div className="project-detail-upload-progress"><i style={{ width: `${entry.progress}%` }} /></div>
                              )}
                            </div>
                            <button type="button" onClick={() => removeUploadFile(entry.id)} aria-label={`Remove ${entry.name}`}><X size={14} /></button>
                          </div>
                        ))}
                        <button type="button" className="project-detail-primary-btn" onClick={uploadReadyFiles} disabled={uploading}>
                          <Upload size={16} /> {uploading ? 'Uploading...' : 'Start upload'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="project-detail-section">
                    <div className="project-detail-section-header">
                      <div>
                        <h2>Image catalog ({filteredSamples.length})</h2>
                        <p>{selectedSamples.length} selected</p>
                      </div>
                      <button type="button" className="project-detail-secondary-btn" onClick={selectAllFilteredSamples} disabled={filteredSamples.length === 0}>
                        Select all
                      </button>
                    </div>
                    <div className="project-detail-catalog-toolbar">
                      <label className="project-detail-search">
                        <Search size={15} />
                        <input
                          value={datasetSearch}
                          onChange={(event) => setDatasetSearch(event.target.value)}
                          placeholder="Search images..."
                        />
                      </label>
                      <button type="button" className="project-detail-secondary-btn" onClick={handleDownloadSelectedManifest} disabled={selectedSamples.length === 0}>
                        <Download size={16} /> Export selected
                      </button>
                      <button type="button" className="project-detail-secondary-btn" onClick={handleDeleteSelectedSamples} disabled={selectedSamples.length === 0} style={{ color: '#ef4444', borderColor: '#fee2e2', backgroundColor: '#fef2f2' }}>
                        <Trash2 size={16} /> Delete selected
                      </button>
                    </div>
                    {samples.length === 0 ? (
                      <div className="project-detail-empty-state">
                        <ImageIcon size={28} />
                        <strong>No images uploaded yet.</strong>
                        <span>Add images ({describeUploadPolicy(uploadPolicy)}) before generating annotation tasks.</span>
                        <button type="button" className="project-detail-primary-btn" onClick={() => fileInputRef.current?.click()}>
                          <Upload size={16} /> Add images
                        </button>
                      </div>
                    ) : filteredSamples.length === 0 ? (
                      <div className="project-detail-empty-state"><ImageIcon size={28} /> No images match this search.</div>
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
                              <span>{sample.width && sample.height ? `${sample.width}x${sample.height}` : sample.format || 'Image sample'}</span>
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
                  </div>
                </div>
                </>
              )}

              {activeTab === 'labels' && (
                <>
                  <div className="project-detail-tab-heading">
                    <div>
                      <h2>Taxonomy workspace</h2>
                      <p>Build the label set before annotators start drawing or classifying objects.</p>
                    </div>
                  </div>
                  <div className="project-detail-tab-kpis" aria-label="Label classes">
                    <div className="project-detail-mini-metric"><span>Label classes</span><strong>{labels.length}</strong></div>
                    <div className="project-detail-mini-metric"><span>Selected color</span><strong>{labelColor}</strong></div>
                    <div className="project-detail-mini-metric"><span>Task dependency</span><strong>{labels.length > 0 ? 'Ready' : 'Needed'}</strong></div>
                  </div>
                  <div className="project-detail-grid">
                  <form className="project-detail-section" onSubmit={handleCreateLabel}>
                    <h2>Create class</h2>
                    <label className="form-field">
                      <span className="form-field__label">Label name</span>
                      <input className="form-field__input" value={labelName} onChange={(event) => setLabelName(event.target.value)} placeholder="e.g. Road, Car, Defect" />
                    </label>
                    <label className="form-field">
                      <span className="form-field__label">Label color</span>
                      <input className="form-field__input project-detail-color-input" type="color" value={labelColor} onChange={(event) => setLabelColor(event.target.value)} />
                    </label>
                    {labelError && <p className="form-field__error">{labelError}</p>}
                    <button type="submit" className="project-detail-primary-btn" disabled={labelSubmitting}>
                      <Plus size={16} /> {labelSubmitting ? 'Adding...' : 'Add label'}
                    </button>
                  </form>

                  <div className="project-detail-section">
                    <h2>Label catalog ({labels.length})</h2>
                    {labels.length === 0 ? (
                      <div className="project-detail-empty-state"><Tag size={28} /> No labels defined for this project.</div>
                    ) : (
                      <div className="project-detail-label-list">
                        {labels.map((label) => (
                          <div key={label.id} className="project-detail-label-row">
                            <span className="project-detail-label-swatch" style={{ backgroundColor: label.color }} />
                            <strong>{label.name}</strong>
                            <code>{label.color}</code>
                            <button type="button" onClick={() => handleDeleteLabel(label.id)} aria-label={`Delete ${label.name}`}><Trash2 size={15} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                </>
              )}

              {activeTab === 'tasks' && (
                <>
                  <div className="project-detail-tab-heading">
                    <div>
                      <h2>Task workspace</h2>
                      <p>Generate work from the dataset, monitor queues, and assign unclaimed items.</p>
                    </div>
                  </div>
                  <div className="project-detail-tab-kpis" aria-label="Task queue status">
                    <div className="project-detail-mini-metric"><span>Unassigned</span><strong>{stats.unassigned}</strong></div>
                    <div className="project-detail-mini-metric"><span>Assigned</span><strong>{stats.assigned}</strong></div>
                    <div className="project-detail-mini-metric"><span>Completed</span><strong>{stats.completed}</strong></div>
                  </div>
                  <div className="project-detail-section">
                  <div className="project-detail-section-header">
                    <div>
                      <h2>Task assignment</h2>
                      <p>Generate tasks from uploaded samples, then assign unassigned work to annotators.</p>
                    </div>
                    <button type="button" className="project-detail-secondary-btn" onClick={handleGenerateTasks} disabled={generating}>
                      <CheckCircle size={16} /> {generating ? 'Generating...' : 'Generate tasks'}
                    </button>
                  </div>

                  <div className="project-detail-task-tabs">
                    {['unassigned', 'assigned', 'completed'].map((bucket) => (
                      <button
                        key={bucket}
                        type="button"
                        className={taskTab === bucket ? 'project-detail-task-tab--active' : ''}
                        onClick={() => { setTaskTab(bucket); setSelectedTaskIds([]); }}
                      >
                        {bucket} ({tasks.filter((task) => taskBucket(task.status) === bucket).length})
                      </button>
                    ))}
                  </div>

                  {visibleTasks.length === 0 ? (
                    <div className="project-detail-empty-state"><ImageIcon size={28} /> No {taskTab} tasks in this project.</div>
                  ) : (
                    <div className="project-detail-task-grid">
                      {visibleTasks.map((task) => {
                        const selected = selectedTaskIds.includes(task.id);
                        return (
                          <article
                            key={task.id}
                            className={`project-detail-task-card ${selected ? 'project-detail-task-card--selected' : ''}`}
                            onClick={() => toggleTask(task.id)}
                            aria-selected={selected}
                          >
                            <AuthenticatedImage
                              src={task.imageUrl}
                              alt={task.fileName}
                              loadProtected
                              fallback={<div className="project-detail-image-placeholder"><ImageIcon size={24} /></div>}
                            />
                            <strong title={task.fileName}>{task.fileName}</strong>
                            <span>{task.annotatorName || task.status}</span>
                            {selected && <Check size={18} />}
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {taskTab === 'unassigned' && (
                    <div className="project-detail-assign-bar">
                      <span>{selectedTaskIds.length} selected</span>
                      <AnnotatorSelect annotators={annotators} selectedId={selectedAnnotatorId} onChange={setSelectedAnnotatorId} placeholder="Choose annotator..." disabled={selectedTaskIds.length === 0} />
                      <button type="button" className="project-detail-primary-btn" onClick={handleAssignTasks} disabled={selectedTaskIds.length === 0 || !selectedAnnotatorId || assigning}>
                        <Users size={16} /> {assigning ? 'Assigning...' : 'Assign tasks'}
                      </button>
                    </div>
                  )}
                </div>
                </>
              )}

              {activeTab === 'analytics' && (
                <>
                  <div className="project-detail-tab-heading">
                    <div>
                      <h2>Project analytics</h2>
                      <p>Review readiness and throughput after dataset, labels, and tasks are in place.</p>
                    </div>
                  </div>
                  <div className="project-detail-grid">
                  <div className="project-detail-section">
                    <h2>Task distribution</h2>
                    {[
                      ['Unassigned', stats.unassigned, '#f59e0b'],
                      ['Assigned / Review', stats.assigned, '#2563eb'],
                      ['Completed', stats.completed, '#059669'],
                    ].map(([label, count, color]) => {
                      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      return (
                        <div key={label} className="project-detail-analytics-row">
                          <span>{label}</span>
                          <strong>{count} ({pct}%)</strong>
                          <div><i style={{ width: `${pct}%`, backgroundColor: color }} /></div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="project-detail-section">
                    <h2>Operational readout</h2>
                    <p>Project setup is healthiest when images, labels, and generated tasks are all present before assignment begins.</p>
                    <ul className="project-detail-readout">
                      <li><CheckCircle size={15} /> Dataset samples: {samples.length}</li>
                      <li><CheckCircle size={15} /> Label classes: {labels.length}</li>
                      <li><CheckCircle size={15} /> Generated tasks: {tasks.length}</li>
                    </ul>
                  </div>
                </div>
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      {toast && <Toast type={toast.type || 'success'} message={toast.message} onClose={() => setToast(null)} />}
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
    </div>
  );
}
