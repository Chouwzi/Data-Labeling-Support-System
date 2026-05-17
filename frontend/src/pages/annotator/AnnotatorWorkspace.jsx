import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import Topbar from '@/components/common/Topbar';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';
import { 
  getLabelsByProject, 
  getMyAssignedImages, 
  getProject,
  saveTaskAnnotations,
  getAnnotations
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
  const [rawAnnotations, setRawAnnotations] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const [taskData, setTaskData] = useState({
    id: taskId,
    imageUrl: '',
    fileName: 'Loading...',
    projectName: 'Loading...',
    labels: []
  });

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
      if (e.key.toLowerCase() === 'v') setActiveTool('select');
      if (e.key.toLowerCase() === 'b') setActiveTool('draw');
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const label = taskData.labels[num - 1];
        if (label) {
          handleLabelSelect(label.id);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) setAnnotations(prev => prev.filter(ann => ann.id !== selectedBoxId));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, taskData.labels]);

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
            labels: mappedLabels
          });
          if (mappedLabels.length > 0) setSelectedLabelId(mappedLabels[0].id);
          
          // Store raw annotations to be converted when image loads
          const existingAnnotations = annotationsRes.data?.result || [];
          if (Array.isArray(existingAnnotations)) {
            setRawAnnotations(existingAnnotations);
          }
        }
      } catch (err) {
        console.error('Failed to fetch workspace data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId, taskId]);

  const handleImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    setImageSize({ width: naturalWidth, height: naturalHeight });

    // Convert raw normalized annotations to pixels
    if (rawAnnotations.length > 0 && annotations.length === 0) {
      const pixelAnnotations = rawAnnotations.map(ann => ({
        id: ann.id || crypto.randomUUID(),
        labelId: ann.label_id || ann.labelId,
        x: ann.geometry.x * naturalWidth,
        y: ann.geometry.y * naturalHeight,
        width: ann.geometry.width * naturalWidth,
        height: ann.geometry.height * naturalHeight
      }));
      setAnnotations(pixelAnnotations);
      setRawAnnotations([]); // Clear after conversion
    }
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
    if (activeTool !== 'draw' || !imageLoaded) return;
    const { x, y } = getRelativeCoords(e);
    setIsDrawing(true);
    setCurrentBox({ x, y, width: 0, height: 0, labelId: selectedLabelId });
  };

  const handleMouseMove = (e) => {
    const { x, y } = getRelativeCoords(e);
    setCrosshairPos({ x, y });
    if (!isDrawing || !currentBox) return;
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

  const handleLabelSelect = (labelId) => {
    setSelectedLabelId(labelId);
    // If a box is selected, update its label immediately
    if (selectedBoxId) {
      setAnnotations(prev => prev.map(ann => 
        ann.id === selectedBoxId ? { ...ann, labelId: labelId } : ann
      ));
    }
  };

  const getLabelColor = (id) => taskData.labels.find(l => l.id === id)?.color || '#3b82f6';
  const getLabelName = (id) => taskData.labels.find(l => l.id === id)?.name || 'Unknown';

  const handleComplete = () => {
    if (annotations.length === 0) {
      setToast({
        message: 'Please draw at least one bounding box before completing the task!',
        type: 'warning'
      });
      return;
    }
    setConfirmModalOpen(true);
  };

  const executeComplete = async () => {
    setConfirmModalOpen(false);
    try {
      const payload = annotations.map(ann => ({
        shape_type: 'BOUNDING_BOX',
        label_id: ann.labelId,
        geometry: {
          x: ann.x / imageSize.width,
          y: ann.y / imageSize.height,
          width: ann.width / imageSize.width,
          height: ann.height / imageSize.height
        }
      }));

      await saveTaskAnnotations(taskId, payload, true);
      setToast({
        message: 'Task completed and submitted successfully!',
        type: 'success'
      });
      setTimeout(() => {
        navigate(`/annotator/projects/${projectId}/tasks`);
      }, 1500);
    } catch (error) {
      console.error('Error completing task:', error);
      setToast({
        message: 'Failed to submit task. Please try again.',
        type: 'error'
      });
    }
  };

  const handleSave = async () => {
    try {
      const payload = annotations.map(ann => ({
        shape_type: 'BOUNDING_BOX',
        label_id: ann.labelId,
        geometry: {
          x: ann.x / imageSize.width,
          y: ann.y / imageSize.height,
          width: ann.width / imageSize.width,
          height: ann.height / imageSize.height
        }
      }));

      await saveTaskAnnotations(taskId, payload, false);
      setToast({
        message: 'Progress saved successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      setToast({
        message: 'Failed to save progress.',
        type: 'error'
      });
    }
  };

  // Helper for opacity hex conversion
  const getHexOpacity = (opacityVal) => {
    switch (opacityVal) {
      case 10: return '1A';
      case 20: return '33';
      case 30: return '4D';
      case 40: return '66';
      case 50: return '80';
      default: return '33';
    }
  };

  const getActiveHexOpacity = (opacityVal) => {
    switch (opacityVal) {
      case 10: return '33';
      case 20: return '4D';
      case 30: return '66';
      case 40: return '80';
      case 50: return '99';
      default: return '4D';
    }
  };

  // Load workspace preferences
  const strokeWidthSetting = Number(localStorage.getItem('annotator_stroke_width')) || 2;
  const boxOpacitySetting = Number(localStorage.getItem('annotator_box_opacity')) || 20;
  const showCrosshairsSetting = localStorage.getItem('annotator_show_crosshairs') !== 'false';
  
  const hexOpacity = getHexOpacity(boxOpacitySetting);
  const activeHexOpacity = getActiveHexOpacity(boxOpacitySetting);

  // Auto-Save Effect
  useEffect(() => {
    const autoSaveSetting = localStorage.getItem('annotator_auto_save') === 'true';
    if (!autoSaveSetting || isLoading || annotations.length === 0 || !imageSize.width) return;

    const interval = setInterval(async () => {
      try {
        const payload = annotations.map(ann => ({
          shape_type: 'BOUNDING_BOX',
          label_id: ann.labelId,
          geometry: {
            x: ann.x / imageSize.width,
            y: ann.y / imageSize.height,
            width: ann.width / imageSize.width,
            height: ann.height / imageSize.height
          }
        }));
        await saveTaskAnnotations(taskId, payload, false);
        setToast({
          message: 'Workspace auto-saved!',
          type: 'success'
        });
      } catch (err) {
        console.warn('Auto-save failed:', err);
      }
    }, 10000); // auto-save draft every 10 seconds

    return () => clearInterval(interval);
  }, [annotations, isLoading, taskId, imageSize]);

  // Read profile Name directly from active user session
  const activeDisplayName = user?.fullName || 'Annotator';

  return (
    <div className="dashboard-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="dashboard-main">
        <Topbar
          userName={activeDisplayName}
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
                <div className="toolbar-divider" />
                <div className="toolbar-group">
                  <button 
                    className={`tool-btn ${activeTool === 'draw' ? 'active' : ''}`} 
                    onClick={() => setActiveTool('draw')}
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
                  <button className="btn btn--secondary" onClick={() => setAnnotations([])}>
                    <RotateCcw size={16} style={{ marginRight: '8px' }} /> Reset
                  </button>
                  <button className="btn btn--success" onClick={handleSave}>
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
                      width: imageSize.width > 0 ? `${imageSize.width}px` : '100%',
                      height: imageSize.height > 0 ? `${imageSize.height}px` : '100%',
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'top left'
                    }}
                  >
                    <img 
                      ref={imageRef}
                      src={taskData.imageUrl} 
                      alt={taskData.fileName} 
                      onLoad={handleImageLoad}
                      className="workspace-image"
                      draggable={false}
                    />
                    <svg 
                      className="annotation-svg" 
                      viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                      onClick={() => setSelectedBoxId(null)}
                    >
                      {annotations.map((ann) => (
                        <g 
                          key={ann.id} 
                          className={`annotation-group ${selectedBoxId === ann.id ? 'selected' : ''}`} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedBoxId(ann.id); 
                            setActiveTool('select'); 
                          }}
                        >
                          <rect 
                            x={ann.x} 
                            y={ann.y} 
                            width={ann.width} 
                            height={ann.height} 
                            fill={selectedBoxId === ann.id ? `${getLabelColor(ann.labelId)}${activeHexOpacity}` : `${getLabelColor(ann.labelId)}${hexOpacity}`}
                            stroke={getLabelColor(ann.labelId)} 
                            strokeWidth={strokeWidthSetting / zoomLevel} 
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
                          fill={`${getLabelColor(selectedLabelId)}${hexOpacity}`}
                          stroke={getLabelColor(selectedLabelId)}
                          strokeWidth={strokeWidthSetting / zoomLevel}
                          strokeDasharray={`${5/zoomLevel},${5/zoomLevel}`}
                        />
                      )}
                      {showCrosshairsSetting && activeTool === 'draw' && imageLoaded && (
                        <g style={{ pointerEvents: 'none' }}>
                          <line 
                            x1={0} 
                            y1={crosshairPos.y} 
                            x2={imageSize.width} 
                            y2={crosshairPos.y} 
                            stroke="#10b981" 
                            strokeWidth={1 / zoomLevel} 
                            strokeDasharray={`${3/zoomLevel},${3/zoomLevel}`}
                            opacity={0.6}
                          />
                          <line 
                            x1={crosshairPos.x} 
                            y1={0} 
                            x2={crosshairPos.x} 
                            y2={imageSize.height} 
                            stroke="#10b981" 
                            strokeWidth={1 / zoomLevel} 
                            strokeDasharray={`${3/zoomLevel},${3/zoomLevel}`}
                            opacity={0.6}
                          />
                        </g>
                      )}
                    </svg>
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
                        <button key={label.id} className={`label-option ${selectedLabelId === label.id ? 'active' : ''}`} onClick={() => handleLabelSelect(label.id)} style={{ '--label-color': label.color }}>
                          <span className="color-dot" style={{ backgroundColor: label.color }}></span>
                          <span className="label-text">{label.name}</span>
                          <span className="label-hotkey">{index + 1}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sidebar-section sidebar-section--grow">
                    <h3 className="section-title">Annotations ({annotations.length})</h3>
                    <div className="annotations-list">
                      {annotations.length === 0 ? (
                        <div className="empty-annotations"><Square size={32} opacity={0.2} /><p>No annotations yet</p></div>
                      ) : (
                        annotations.map(ann => (
                          <div key={ann.id} className={`annotation-item ${selectedBoxId === ann.id ? 'selected' : ''}`} onClick={() => setSelectedBoxId(ann.id)}>
                            <span className="ann-color" style={{ backgroundColor: getLabelColor(ann.labelId) }}></span>
                            <span className="ann-name">{getLabelName(ann.labelId)}</span>
                            <span className="ann-dims">{Math.round(ann.width)}x{Math.round(ann.height)}</span>
                            <button className="ann-delete" onClick={(e) => { e.stopPropagation(); setAnnotations(prev => prev.filter(a => a.id !== ann.id)); }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="sidebar-footer">
                    <button 
                      className="btn btn--primary btn--full" 
                      onClick={handleComplete}
                      disabled={annotations.length === 0}
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

      <Modal 
        isOpen={confirmModalOpen} 
        onClose={() => setConfirmModalOpen(false)} 
        title="Complete Task"
      >
        <div style={{ padding: '0.5rem 0' }}>
          <p style={{ marginBottom: '1.5rem', color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Are you sure you want to complete this task with <strong>{annotations.length}</strong> annotation{annotations.length !== 1 ? 's' : ''}? Once submitted, this task will be forwarded to the reviewer and cannot be modified further.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              type="button"
              className="btn btn--secondary" 
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="btn btn--primary" 
              onClick={executeComplete}
            >
              Submit Task
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
