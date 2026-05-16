import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import Topbar from '@/components/common/Topbar';
import { 
  getLabelsByProject, 
  getMyAssignedImages, 
  getProject 
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
        const [projectRes, labelsRes, imagesRes] = await Promise.all([
          getProject(projectId),
          getLabelsByProject(projectId),
          getMyAssignedImages({ projectId, size: 100 })
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
    if (activeTool !== 'draw' || !imageLoaded) return;
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
      alert('Please draw at least one bounding box before completing the task!');
      return;
    }
    
    if (window.confirm(`Are you sure you want to complete this task with ${annotations.length} annotations?`)) {
      alert('Task submitted successfully!');
      navigate(`/annotator/projects/${projectId}/tasks`);
    }
  };

  return (
    <div className="dashboard-layout">
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
                  <button className="btn btn--success" onClick={() => alert('Saved!')}>
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
                    <button className="btn btn--primary btn--full" onClick={handleComplete}>Complete Task</button>
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
