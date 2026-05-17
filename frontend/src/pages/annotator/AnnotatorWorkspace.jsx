import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import Topbar from '@/components/common/Topbar';
import { 
  getLabelsByProject, 
  getMyAssignedImages, 
  getProject,
  getAnnotations,
  saveAnnotations,
  saveTaskAnnotations
} from '@/services/api';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Trash2, 
  MousePointer2, 
  Square, 
  Save, 
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import '@/styles/Dashboard.css';
import '@/styles/AnnotatorWorkspace.css';

export default function AnnotatorWorkspace() {
  const { projectId, taskId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTool, setActiveTool] = useState('draw');
  const [annotations, setAnnotations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState(null);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  const [isCelebrated, setIsCelebrated] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [taskData, setTaskData] = useState({
    id: taskId,
    imageUrl: '',
    fileName: 'Loading...',
    projectName: 'Loading...',
    labels: [],
    status: 'PENDING'
  });

  const isLocked = taskData.status && !['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(taskData.status.toUpperCase());

  const [selectedLabelId, setSelectedLabelId] = useState(null);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent shortcut interference when typing inside input/select elements
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' || 
        e.target.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'v') setActiveTool('select');
      if (e.key.toLowerCase() === 'b') setActiveTool('draw');
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const label = taskData.labels[num - 1];
        if (label) {
          setSelectedLabelId(label.id);
          // If a box is selected, update its label too
          if (selectedBoxId) {
            setAnnotations(prev => prev.map(ann => 
              ann.id === selectedBoxId ? { ...ann, labelId: label.id } : ann
            ));
          }
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) setAnnotations(prev => prev.filter(ann => ann.id !== selectedBoxId));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, taskData.labels]);

  const [rawAnnotations, setRawAnnotations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [projectRes, labelsRes, imagesRes, annotationsRes] = await Promise.all([
          getProject(projectId),
          getLabelsByProject(projectId),
          getMyAssignedImages({ projectId, size: 100 }),
          getAnnotations(taskId)
        ]);

        const project = projectRes.data?.result || {};
        const labelsData = labelsRes.data?.result || [];
        const mappedLabels = labelsData.map(l => ({
          id: l.id,
          name: l.name,
          color: l.color_hex || l.color || l.colorCode || l.hexColor || '#3b82f6'
        }));

        const resultData = imagesRes.data?.result?.data || imagesRes.data?.result || [];
        const rawImages = Array.isArray(resultData) ? resultData : [];
        const currentImg = rawImages.find(img => (img.task_id || img.taskId || img.id) === taskId);

        if (currentImg) {
          setTaskData({
            id: taskId,
            imageUrl: fixImageUrl(currentImg.image_url || currentImg.imageUrl),
            fileName: currentImg.file_name || currentImg.fileName || 'Image',
            projectName: project.name || 'Project',
            labels: mappedLabels,
            status: currentImg.status || 'PENDING'
          });
          if (mappedLabels.length > 0) setSelectedLabelId(mappedLabels[0].id);
        }

        const rawAnns = annotationsRes.data?.result || [];
        setRawAnnotations(rawAnns);
      } catch (err) {
        console.error('Failed to fetch workspace data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId, taskId]);

  useEffect(() => {
    if (imageLoaded && imageSize.width > 0 && rawAnnotations.length > 0 && annotations.length === 0) {
      const scaled = rawAnnotations.map(ann => {
        const geom = ann.geometry || {};
        return {
          id: ann.id || Date.now() + Math.random(),
          labelId: ann.label_id || ann.labelId,
          x: (geom.x || 0) * imageSize.width,
          y: (geom.y || 0) * imageSize.height,
          width: (geom.width || 0) * imageSize.width,
          height: (geom.height || 0) * imageSize.height
        };
      });
      setAnnotations(scaled);
    }
  }, [imageLoaded, imageSize, rawAnnotations]);

  const handleImageLoad = (e) => {
    setImageSize({ width: e.target.naturalWidth, height: e.target.naturalHeight });
    setImageLoaded(true);
  };

  const getRelativeCoords = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoomLevel,
      y: (e.clientY - rect.top) / zoomLevel
    };
  };

  const handleMouseDown = (e) => {
    if (activeTool !== 'draw' || !imageLoaded || isLocked) {
      // Clear selection when clicking empty area or image in select mode or when locked
      if (
        e.target === imageRef.current || 
        e.target.tagName === 'svg' || 
        e.target.classList.contains('annotation-svg')
      ) {
        setSelectedBoxId(null);
      }
      return;
    }
    const { x, y } = getRelativeCoords(e);
    setIsDrawing(true);
    setCurrentBox({ x, y, width: 0, height: 0, labelId: selectedLabelId });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentBox) return;
    const { x, y } = getRelativeCoords(e);
    setCurrentBox(prev => ({ ...prev, width: x - prev.x, height: y - prev.y }));
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return;
    if (Math.abs(currentBox.width) > 5 && Math.abs(currentBox.height) > 5) {
      const newBox = {
        ...currentBox,
        id: Date.now(),
        x: currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x,
        y: currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y,
        width: Math.abs(currentBox.width),
        height: Math.abs(currentBox.height)
      };
      setAnnotations([...annotations, newBox]);
      setSelectedBoxId(newBox.id);
    }
    setIsDrawing(false);
    setCurrentBox(null);
  };

  const getLabelColor = (id) => taskData.labels.find(l => l.id === id)?.color || '#3b82f6';
  const getLabelName = (id) => taskData.labels.find(l => l.id === id)?.name || 'Unknown';

  const handleSave = async (submit = false) => {
    try {
      if (!imageSize.width || !imageSize.height) {
        showToast('Image not fully loaded yet.', 'error');
        return;
      }

      if (submit && annotations.length === 0) {
        showToast('Please draw at least one bounding box before completing the task!', 'error');
        return;
      }
      
      const mappedAnnotations = annotations.map(ann => {
        const xRatio = Math.max(0, Math.min(1, ann.x / imageSize.width));
        const yRatio = Math.max(0, Math.min(1, ann.y / imageSize.height));
        const wRatio = Math.max(0.0001, Math.min(1 - xRatio, ann.width / imageSize.width));
        const hRatio = Math.max(0.0001, Math.min(1 - yRatio, ann.height / imageSize.height));
        
        return {
          shape_type: 'BOUNDING_BOX',
          label_id: ann.labelId,
          geometry: {
            x: xRatio,
            y: yRatio,
            width: wRatio,
            height: hRatio
          },
          is_ai_generated: false
        };
      });

      await saveTaskAnnotations(taskId, mappedAnnotations, submit);
      if (submit) {
        setIsCelebrated(true);
      } else {
        showToast('Progress saved successfully!', 'success');
      }
    } catch (err) {
      console.error('Failed to save annotations:', err);
      showToast(err.response?.data?.message || 'Failed to save annotations. Please try again.', 'error');
    }
  };
  return (
    <div className="dashboard-layout">
      {toast && (
        <div className={`toast-notification ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === 'success' ? <Check size={14} /> : <X size={14} />}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}
      {isCelebrated && (
        <div className="celebration-overlay">
          <div className="celebration-card">
            <div className="sparkle-ring">
              <div className="sparkle-dot s1"></div>
              <div className="sparkle-dot s2"></div>
              <div className="sparkle-dot s3"></div>
              <div className="sparkle-dot s4"></div>
              <div className="success-icon-wrapper">
                <Check size={36} />
              </div>
            </div>
            <h2 className="celebration-title">Task Completed!</h2>
            <p className="celebration-subtitle">Image annotations submitted successfully!</p>
            
            <div className="celebration-stats">
              <div className="stat-item">
                <span className="stat-label">Bounding Boxes</span>
                <span className="stat-value">{annotations.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Status</span>
                <span className="stat-value status-done">Submitted</span>
              </div>
            </div>

            <button 
              className="btn btn--primary celebration-btn" 
              onClick={() => navigate(`/annotator/projects/${projectId}/tasks`)}
            >
              Back to Tasks List
            </button>
          </div>
        </div>
      )}
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Topbar
          userName={user?.fullName || 'Annotator'}
          userRole="Data Annotator"
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={logout}
        />
        <main className="dashboard-content workspace-main">
          {isLoading ? (
            <div className="workspace-loading">
              <div className="spinner"></div>
              <p>Loading workspace...</p>
            </div>
          ) : (
            <React.Fragment>
              <div className="workspace-toolbar">
                <div className="toolbar-group">
                  <button className="btn-back" onClick={() => navigate(`/annotator/projects/${projectId}/tasks`)}>
                    <ArrowLeft size={16} /> <span>Exit</span>
                  </button>
                </div>
                {isLocked && (
                  <div className="workspace-locked-badge">
                    <span className="locked-dot"></span>
                    <span>Completed (Read-Only)</span>
                  </div>
                )}
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <button 
                    className={`tool-btn ${activeTool === 'draw' ? 'active' : ''}`} 
                    onClick={() => {
                      setActiveTool('draw');
                      setSelectedBoxId(null);
                    }}
                    title="Draw Box (B)"
                  >
                    <Square size={20} />
                  </button>
                </div>
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <button className="tool-btn" onClick={() => setZoomLevel(z => Math.min(z + 0.1, 3))} title="Zoom In">
                    <ZoomIn size={20} />
                  </button>
                  <button className="tool-btn" onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))} title="Zoom Out">
                    <ZoomOut size={20} />
                  </button>
                  <button className="tool-btn" onClick={() => setZoomLevel(1)} title="Reset Zoom">
                    <Maximize size={20} />
                  </button>
                </div>
                <div className="toolbar-spacer" />
                <div className="toolbar-group">
                  <button 
                    className="btn btn--secondary" 
                    onClick={() => setAnnotations([])}
                    disabled={isLocked}
                  >
                    <RotateCcw size={16} style={{ marginRight: '8px' }} /> Reset
                  </button>
                  <button 
                    className="btn btn--success" 
                    onClick={() => handleSave(false)}
                    disabled={isLocked}
                  >
                    <Save size={16} style={{ marginRight: '8px' }} /> Save Progress
                  </button>
                </div>
              </div>

              <div className="workspace-container">
                <div className="canvas-wrapper">
                  <div 
                    className={`canvas-container ${activeTool === 'draw' ? 'crosshair' : ''}`}
                    ref={containerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    style={{
                      width: imageSize.width > 0 ? `${imageSize.width * zoomLevel}px` : '100%',
                      height: imageSize.height > 0 ? `${imageSize.height * zoomLevel}px` : '100%',
                      flexShrink: 0
                    }}
                  >
                    <img 
                      ref={imageRef}
                      src={taskData.imageUrl} 
                      alt={taskData.fileName} 
                      onLoad={handleImageLoad}
                      className="workspace-image"
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%'
                      }}
                    />
                    <svg 
                      className="annotation-svg" 
                      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                      onClick={() => setSelectedBoxId(null)} // Clear selection when clicking empty area
                      style={{
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {annotations.map((ann) => (
                        <g 
                          key={ann.id} 
                          className={`annotation-group ${selectedBoxId === ann.id ? 'selected' : ''}`} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedBoxId(ann.id); 
                            setSelectedLabelId(ann.labelId); 
                            setActiveTool('select'); 
                          }}
                        >
                          <rect 
                            x={ann.x} 
                            y={ann.y} 
                            width={ann.width} 
                            height={ann.height} 
                            fill={selectedBoxId === ann.id ? `${getLabelColor(ann.labelId)}40` : `${getLabelColor(ann.labelId)}20`}
                            stroke={getLabelColor(ann.labelId)} 
                            strokeWidth={2 / zoomLevel} 
                            className="bbox-rect" 
                            style={{ pointerEvents: 'all', cursor: 'pointer' }}
                          />
                          <g className="bbox-label" style={{ pointerEvents: 'none' }}>
                            <rect x={ann.x} y={ann.y - 20 / zoomLevel} width={80 / zoomLevel} height={20 / zoomLevel} fill={getLabelColor(ann.labelId)} />
                            <text x={ann.x + 4 / zoomLevel} y={ann.y - 5 / zoomLevel} fill="white" fontSize={12 / zoomLevel} fontWeight="bold">{getLabelName(ann.labelId)}</text>
                          </g>
                        </g>
                      ))}
                      {isDrawing && currentBox && (
                        <rect
                          x={currentBox.width < 0 ? currentBox.x + currentBox.width : currentBox.x}
                          y={currentBox.height < 0 ? currentBox.y + currentBox.height : currentBox.y}
                          width={Math.abs(currentBox.width)}
                          height={Math.abs(currentBox.height)}
                          fill={`${getLabelColor(selectedLabelId)}20`}
                          stroke={getLabelColor(selectedLabelId)}
                          strokeWidth={2 / zoomLevel}
                          strokeDasharray={`${5/zoomLevel},${5/zoomLevel}`}
                        />
                      )}
                    </svg>
                    {/* Floating label editor removed */}
                  </div>
                </div>

                <div className="workspace-sidebar">
                  <div className="sidebar-section">
                    <h3 className="section-title">Project Info</h3>
                    <div className="info-card">
                      <p className="info-label">File:</p> <p className="info-value">{taskData.fileName}</p>
                      <p className="info-label">Project:</p> <p className="info-value">{taskData.projectName}</p>
                    </div>
                  </div>
                  <div className="sidebar-section">
                    <h3 className="section-title">Labels</h3>
                    <div className="label-selector">
                      {taskData.labels.map((label, index) => (
                        <button 
                          key={label.id} 
                          className={`label-option ${selectedLabelId === label.id ? 'active' : ''}`} 
                          onClick={() => {
                            setSelectedLabelId(label.id);
                            if (selectedBoxId) {
                              setAnnotations(prev => prev.map(ann => 
                                ann.id === selectedBoxId ? { ...ann, labelId: label.id } : ann
                              ));
                            }
                          }} 
                          style={{ '--label-color': label.color }}
                        >
                          <span className="color-dot" style={{ backgroundColor: label.color }}></span>
                          <span className="label-text">{label.name}</span>
                          <span className="label-hotkey">{index + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sidebar-section">
                    <h3 className="section-title">Annotations ({annotations.length})</h3>
                    <div className="annotations-list">
                      {annotations.length === 0 ? (
                        <div className="empty-annotations"><Square size={32} opacity={0.2} /><p>No annotations yet</p></div>
                      ) : (
                        annotations.map(ann => {
                          const isSelected = selectedBoxId === ann.id;
                          return (
                            <div 
                              key={ann.id} 
                              className={`annotation-item ${isSelected ? 'selected' : ''}`} 
                              onClick={() => {
                                setSelectedBoxId(ann.id);
                                setSelectedLabelId(ann.labelId);
                              }}
                            >
                              <div className="ann-info" onClick={(e) => e.stopPropagation()}>
                                <span className="ann-color" style={{ backgroundColor: getLabelColor(ann.labelId) }}></span>
                                <div className="ann-details">
                                  <span className="ann-name">{getLabelName(ann.labelId)}</span>
                                  <div className="ann-coords-grid">
                                    <span className="coord-badge"><span className="coord-label">X</span>{(ann.x / (imageSize.width || 1)).toFixed(3)}</span>
                                    <span className="coord-badge"><span className="coord-label">Y</span>{(ann.y / (imageSize.height || 1)).toFixed(3)}</span>
                                    <span className="coord-badge"><span className="coord-label">W</span>{(ann.width / (imageSize.width || 1)).toFixed(3)}</span>
                                    <span className="coord-badge"><span className="coord-label">H</span>{(ann.height / (imageSize.height || 1)).toFixed(3)}</span>
                                  </div>
                                </div>
                              </div>
                              {!isLocked && (
                                <button 
                                  className="delete-ann-btn" 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setAnnotations(prev => prev.filter(a => a.id !== ann.id)); 
                                    if (selectedBoxId === ann.id) setSelectedBoxId(null);
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="workspace-actions">
                    <button 
                      className="btn btn--primary btn--full" 
                      onClick={() => handleSave(true)}
                      disabled={isLocked || annotations.length === 0}
                    >
                      Complete Task
                    </button>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )}
        </main>
      </div>
    </div>
  );
}
