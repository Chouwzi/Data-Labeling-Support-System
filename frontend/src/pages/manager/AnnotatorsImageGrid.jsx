import { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, Image as ImageIcon, Loader, LayoutGrid, Download } from 'lucide-react';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import Toast from '@/components/Toast';
import AnnotatorSelect from '@/components/AnnotatorSelect';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { getProjects, getTasks, getAnnotators, generateTasks, assignTasks, exportProjectCoco } from '@/services/api';
import '@/styles/AnnotatorsImageGrid.css';

const fixImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const normalizedUrl = url.replace(/\\/g, '/');
  const uploadsIndex = normalizedUrl.toLowerCase().indexOf('uploads/');
  if (uploadsIndex !== -1) {
    const relativePath = normalizedUrl.substring(uploadsIndex + 8);
    return `/api/v1/uploads/${relativePath}`;
  }
  const fileName = normalizedUrl.split('/').pop();
  return `/api/v1/uploads/${fileName}`; 
};

export default function AnnotatorsImageGrid() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [projects, setProjects] = useState([]);
  
  console.log('Rendering AnnotatorsImageGrid', { projects, sidebarOpen });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [annotators, setAnnotators] = useState([]);
  const [images, setImages] = useState([]);
  const [activeTab, setActiveTab] = useState('unassigned');
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [selectedAnnotatorId, setSelectedAnnotatorId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragSelecting, setIsDragSelecting] = useState(false);
  const [dragMode, setDragMode] = useState(null);

  useEffect(() => {
    // Fetch projects and annotators on mount
    const loadInitialData = async () => {
      try {
        const [projectsRes, annotatorsRes] = await Promise.all([
          getProjects(),
          getAnnotators()
        ]);
        
        const projectsData = Array.isArray(projectsRes.data?.result?.data) 
          ? projectsRes.data.result.data 
          : (Array.isArray(projectsRes.data?.result) ? projectsRes.data.result : (Array.isArray(projectsRes.data) ? projectsRes.data : []));
        
        const annotatorsData = Array.isArray(annotatorsRes.data?.result) ? annotatorsRes.data.result : (Array.isArray(annotatorsRes.data) ? annotatorsRes.data : []);
        
        setProjects(projectsData);
        setAnnotators(annotatorsData.map(a => ({
          id: a.id,
          name: a.fullName || a.email,
          email: a.email,
          workload: 0 // Mock workload if not available in API
        })));
        
        if (projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        setToast({ message: 'Failed to load projects or annotators' });
      }
    };
    
    loadInitialData();
  }, []);

  useEffect(() => {
    // Fetch tasks when project changes
    const loadTasks = async () => {
      if (!selectedProjectId) return;
      
      // Loading handled by hook
      try {
        const res = await getTasks(selectedProjectId);
        const tasksData = Array.isArray(res.data?.result) ? res.data.result : (Array.isArray(res.data) ? res.data : []);
        
        setImages(tasksData.map(task => {
          const rawUrl = task.image_url || task.imageUrl;
          const fixedUrl = fixImageUrl(rawUrl);
          return {
            id: task.id,
            imageUrl: fixedUrl,
            fileName: rawUrl ? rawUrl.replace(/\\/g, '/').split('/').pop() : 'image.jpg',
            project: projects.find(p => p.id === selectedProjectId)?.name || 'Project',
            resolution: 'N/A', // Not available in TaskResponse
            status: task.status === 'PENDING' ? 'unassigned' : (task.status === 'COMPLETED' ? 'completed' : 'assigned'),
            assignee: task.annotatorName || null
          };
        }));
        
        // Clear selection when project changes
        setSelectedImageIds([]);
      } catch (error) {
        console.error('Failed to load tasks:', error);
        setToast({ message: 'Failed to load images for selected project' });
      } finally {
        // Loading handled by hook
      }
    };
    
    loadTasks();
  }, [selectedProjectId, projects]);

  const handleGenerateTasks = async () => {
    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const datasetId = selectedProject?.dataset_id || selectedProject?.datasetId;
    if (!selectedProject || !datasetId) {
      setToast({ message: 'Project has no associated dataset' });
      return;
    }
    
    setIsLoading(true);
    try {
      await generateTasks(selectedProjectId, datasetId);
      setToast({ message: 'Tasks generated successfully!' });
      
      // Reload tasks
      const res = await getTasks(selectedProjectId);
      const tasksData = Array.isArray(res.data?.result?.data) ? res.data.result.data : (Array.isArray(res.data?.result) ? res.data.result : (Array.isArray(res.data) ? res.data : []));
      
      setImages(tasksData.map(task => {
        const rawUrl = task.image_url || task.imageUrl;
        const fixedUrl = fixImageUrl(rawUrl);
        return {
          id: task.id,
          imageUrl: fixedUrl,
          fileName: rawUrl ? rawUrl.replace(/\\/g, '/').split('/').pop() : 'image.jpg',
          project: selectedProject.name,
          resolution: 'N/A',
          status: task.status === 'PENDING' ? 'unassigned' : (task.status === 'COMPLETED' ? 'completed' : 'assigned'),
          assignee: task.annotatorName || null
        };
      }));
    } catch (error) {
      console.error('Failed to generate tasks:', error);
      setToast({ message: 'Failed to generate tasks' });
    } finally {
      setIsLoading(false);
    }
  };

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  /* ── Selection ─────────────────────────────────────────────── */

  // Disable user-select globally when drag selecting
  useEffect(() => {
    if (isDragSelecting) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
    } else {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [isDragSelecting]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragSelecting(false);
      setDragMode(null);
    };
    
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);

  const handleCardMouseDown = (id, isSelected, e) => {
    if (activeTab !== 'unassigned') return;
    if (e.button !== 0) return; // Only left click
    
    setIsDragSelecting(true);
    const nextMode = isSelected ? 'deselect' : 'select';
    setDragMode(nextMode);
    
    setSelectedImageIds(prev => {
      if (nextMode === 'select') {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter(item => item !== id);
      }
    });
  };

  const handleCardMouseEnter = (id) => {
    if (activeTab !== 'unassigned') return;
    if (!isDragSelecting || !dragMode) return;
    
    setSelectedImageIds(prev => {
      if (dragMode === 'select') {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter(item => item !== id);
      }
    });
  };

  const toggleImage = (imageId) => {
    if (activeTab !== 'unassigned') return;
    setSelectedImageIds((prev) =>
      prev.includes(imageId)
        ? prev.filter((id) => id !== imageId)
        : [...prev, imageId]
    );
  };

  const selectAll = () => {
    if (activeTab !== 'unassigned') return;
    setSelectedImageIds(images.filter(img => img.status === 'unassigned').map((img) => img.id));
  };
  const clearSelection = () => setSelectedImageIds([]);

  /* ── Assign ───────────────────────────────────────────────── */

  const handleAssign = useCallback(async () => {
    if (selectedImageIds.length === 0 || !selectedAnnotatorId) return;
    const annotator = annotators.find((a) => a.id === selectedAnnotatorId);
    if (!annotator) return;

    setIsAssigning(true);
    try {
      await assignTasks(selectedProjectId, {
        task_ids: selectedImageIds,
        annotator_id: selectedAnnotatorId
      });

      setImages((prev) => prev.map((img) => 
        selectedImageIds.includes(img.id)
          ? { ...img, status: 'assigned', assignee: annotator.name }
          : img
      ));
      
      setSelectedImageIds([]);
      setSelectedAnnotatorId('');

      const count = selectedImageIds.length;
      setToast({
        message: `Successfully allocated ${count} image${count !== 1 ? 's' : ''} to ${annotator.name}`,
      });
    } catch (error) {
      console.error('Failed to assign tasks:', error);
      setToast({ message: 'Failed to assign tasks' });
    } finally {
      setIsAssigning(false);
    }
  }, [selectedImageIds, selectedAnnotatorId, selectedProjectId, annotators]);

  const closeToast = useCallback(() => setToast(null), []);

  const handleExportCOCO = async () => {
    try {
      setIsLoading(true);
      const res = await exportProjectCoco(selectedProjectId);
      const cocoData = res.data?.result || res.data;

      if (!cocoData) {
        setToast({ message: 'Failed to retrieve export data' });
        return;
      }

      const dataStr = JSON.stringify(cocoData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const exportFileDefaultName = `export_coco_${selectedProjectId}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
      URL.revokeObjectURL(url);
      
      setToast({ message: `Successfully exported project to COCO JSON` });
    } catch (error) {
      console.error('Failed to export COCO JSON:', error);
      setToast({ message: 'Failed to export COCO JSON. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Derived ──────────────────────────────────────────────── */

  const displayedImages = images.filter((img) => img.status === activeTab);
  const selectedCount = selectedImageIds.length;
  const totalCount = displayedImages.length;
  const hasSelection = selectedCount > 0 && activeTab === 'unassigned';
  const canAssign = hasSelection && !!selectedAnnotatorId && !isAssigning;

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : (user?.role || 'MANAGER');

  /* ── Render ───────────────────────────────────────────────── */

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search images..."
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          {/* Page Header */}
          <div className="aig-page-header">
            <button type="button" className="aig-back-btn" onClick={() => navigate('/manager', { replace: true })}>
              <ArrowLeft size={15} />
              <span>Dashboard</span>
            </button>

            <div className="aig-page-header__brand">
              <LayoutGrid size={18} className="aig-page-header__brand-icon" />
              <span className="aig-page-header__brand-name">DataLabel Pro</span>
            </div>

            <h1 className="aig-page-title">Assign Images to Annotators</h1>
            <p className="aig-page-subtitle">
              Select images and choose an annotator to allocate work items to your team.
            </p>

            {/* Project Selector */}
            <div className="aig-project-selector" style={{ marginTop: '15px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label htmlFor="project-select" style={{ fontWeight: '500', fontSize: '14px', color: '#4b5563' }}>Project:</label>
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fff',
                    fontSize: '14px',
                    minWidth: '200px',
                    outline: 'none',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {projects.length === 0 ? (
                    <option value="">No projects available</option>
                  ) : (
                    projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))
                  )}
                </select>
                {isLoading && <Loader size={16} className="aig-assign-btn__spinner" />}
              </div>

              {/* Export Button - Only show when there are completed images */}
              {images.some(img => img.status === 'completed') && (
                <button
                  type="button"
                  className="aig-assign-btn"
                  style={{ marginLeft: 'auto', backgroundColor: '#059669', minWidth: 'auto' }}
                  onClick={handleExportCOCO}
                >
                  <Download size={15} style={{ marginRight: '8px' }} />
                  <span>Export COCO JSON</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="aig-tabs">
            <button
              className={`aig-tab ${activeTab === 'unassigned' ? 'aig-tab--active' : ''}`}
              onClick={() => { setActiveTab('unassigned'); clearSelection(); }}
            >
              Waiting List ({images.filter(img => img.status === 'unassigned').length})
            </button>
            <button
              className={`aig-tab ${activeTab === 'assigned' ? 'aig-tab--active' : ''}`}
              onClick={() => { setActiveTab('assigned'); clearSelection(); }}
            >
              Assigned ({images.filter(img => img.status === 'assigned').length})
            </button>
            <button
              className={`aig-tab ${activeTab === 'completed' ? 'aig-tab--active' : ''}`}
              onClick={() => { setActiveTab('completed'); clearSelection(); }}
            >
              Completed ({images.filter(img => img.status === 'completed').length})
            </button>
          </div>

          {/* Image Grid — dynamic padding for sticky bar */}
          {displayedImages.length > 0 ? (
            <div
              className={`aig-grid ${hasSelection ? 'aig-grid--has-selection' : ''}`}
              role="list"
              aria-label={`${activeTab === 'unassigned' ? 'Unassigned' : 'Assigned'} images`}
            >
              {displayedImages.map((image) => {
                const isSelected = selectedImageIds.includes(image.id);
                return (
                  <article
                    key={image.id}
                    className={`aig-card ${isSelected ? 'aig-card--selected' : ''}`}
                    role="listitem"
                    onMouseDown={(e) => handleCardMouseDown(image.id, isSelected, e)}
                    onMouseEnter={() => handleCardMouseEnter(image.id)}
                    onDragStart={(e) => e.preventDefault()}
                    aria-selected={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleImage(image.id);
                      }
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="aig-card__thumb">
                      {image.imageUrl ? (
                        <img 
                          src={image.imageUrl} 
                          alt={image.fileName} 
                          className="aig-card__img" 
                          loading="lazy" 
                          onDragStart={(e) => e.preventDefault()}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                          <ImageIcon size={24} />
                        </div>
                      )}

                      {/* Selection overlay */}
                      <div className="aig-card__overlay" aria-hidden="true">
                        <div className="aig-card__check-circle">
                          <Check size={18} strokeWidth={3} />
                        </div>
                      </div>

                      {/* Corner check badge */}
                      {isSelected && (
                        <div className="aig-card__corner-badge" aria-hidden="true">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </div>

                    {/* Card body */}
                    <div className="aig-card__body">
                      <p className="aig-card__file-name" title={image.fileName}>{image.fileName}</p>
                      <div className="aig-card__meta">
                        <span className="aig-card__project">{image.project}</span>
                        <span className="aig-card__resolution">{image.resolution}</span>
                      </div>
                      <div className="aig-card__status">
                        {image.status === 'unassigned' ? (
                          <span className="aig-unassigned-badge">
                            <span className="aig-unassigned-badge__dot" />
                            unassigned
                          </span>
                        ) : (
                          <span className="aig-assigned-badge">
                            <Check size={12} strokeWidth={3} style={{ marginRight: '4px' }} />
                            Assigned to {image.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="aig-empty-state">
              <div className="aig-empty-state__icon-wrap">
                <ImageIcon size={32} strokeWidth={1.5} />
              </div>
              <h2 className="aig-empty-state__title">No images found</h2>
              <p className="aig-empty-state__body">
                {activeTab === 'unassigned' 
                  ? 'All images have been allocated to annotators. New uploads will appear here.'
                  : activeTab === 'assigned'
                    ? 'No images have been assigned yet.'
                    : 'No images have been completed yet.'}
              </p>
              {activeTab === 'unassigned' && selectedProjectId && (
                <button
                  type="button"
                  className="aig-assign-btn"
                  style={{ marginTop: '15px' }}
                  onClick={handleGenerateTasks}
                >
                  <LayoutGrid size={15} style={{ marginRight: '8px' }} />
                  <span>Generate Tasks from Dataset</span>
                </button>
              )}
            </div>
          )}

          {/* Bottom info bar */}
          <div className="aig-bottom-bar">
            <div className="aig-bottom-bar__info">
              <ImageIcon size={14} strokeWidth={2} />
              <span>
                Showing <strong>{totalCount}</strong> unassigned image{totalCount !== 1 ? 's' : ''}
                {hasSelection && <> &mdash; <strong>{selectedCount} selected</strong></>}
              </span>
            </div>
            <p className="aig-bottom-bar__hint">
              Click any card to toggle selection. Choose an annotator and click Assign to allocate.
            </p>
          </div>
        </main>
      </div>

      {/* Sticky Bottom Action Bar — fixed at viewport bottom */}
      <div
        className={`aig-sticky-bar-wrapper ${hasSelection ? 'aig-sticky-bar-wrapper--active' : ''}`}
        aria-live="polite"
      >
        <div className="aig-sticky-bar" role="toolbar" aria-label="Image allocation controls">
          {/* Left: selection info */}
          <div className="aig-sticky-bar__left">
            <div className="aig-selection-pill">
              <span className="aig-selection-pill__dot" aria-hidden="true" />
              <span className="aig-selection-pill__count">{selectedCount}</span>
              <span className="aig-selection-pill__label">
                {selectedCount === 1 ? 'image selected' : 'images selected'}
              </span>
            </div>

            <div className="aig-sticky-bar__controls">
              {hasSelection && selectedCount < totalCount && (
                <button type="button" className="aig-link-btn" onClick={selectAll} aria-label="Select all images">
                  Select all ({totalCount})
                </button>
              )}
              {hasSelection && (
                <button type="button" className="aig-link-btn aig-link-btn--muted" onClick={clearSelection} aria-label="Clear selection">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Right: annotator select + assign */}
          <div className="aig-sticky-bar__right">
            <div className="aig-assign-controls">
              <AnnotatorSelect
                annotators={annotators}
                selectedId={selectedAnnotatorId}
                onChange={setSelectedAnnotatorId}
                placeholder="Choose annotator..."
                disabled={!hasSelection}
              />

              <button
                type="button"
                className={`aig-assign-btn ${isAssigning ? 'aig-assign-btn--loading' : ''}`}
                onClick={handleAssign}
                disabled={!canAssign}
                aria-label={`Assign ${selectedCount} image${selectedCount !== 1 ? 's' : ''} to annotator`}
              >
                {isAssigning ? (
                  <>
                    <Loader size={15} className="aig-assign-btn__spinner" aria-hidden="true" />
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <Check size={15} strokeWidth={2.5} aria-hidden="true" />
                    <span>
                      Assign {selectedCount > 0 ? `${selectedCount} ` : ''}Image{selectedCount !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} onClose={closeToast} />
      )}
    </div>
  );
}
