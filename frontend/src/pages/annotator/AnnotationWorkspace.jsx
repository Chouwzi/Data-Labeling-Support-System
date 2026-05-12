import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AnnotationToolbar from '@/components/annotator/AnnotationToolbar';
import AnnotationCanvas from '@/components/annotator/AnnotationCanvas';
import { Trash2, CheckCircle, ArrowLeft } from 'lucide-react';
import '@/styles/AnnotationWorkspace.css';

// Mock labels — in production, fetch from API based on project
const MOCK_LABELS = [
  { id: 1, name: 'Red Blood Cell', color: '#ef4444' },
  { id: 2, name: 'White Blood Cell', color: '#3b82f6' },
  { id: 3, name: 'Platelet', color: '#10b981' },
  { id: 4, name: 'Nucleus', color: '#f59e0b' },
  { id: 5, name: 'Artifact', color: '#8b5cf6' },
];

// Mock image — in production, fetch from API based on imageId
const MOCK_IMAGE = 'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=800&h=600&fit=crop';

let nextAnnotationId = 1;

export default function AnnotationWorkspace() {
  const { imageId } = useParams();
  const navigate = useNavigate();

  const [labels] = useState(MOCK_LABELS);
  const [activeLabel, setActiveLabel] = useState(MOCK_LABELS[0]);
  const [activeTool, setActiveTool] = useState('draw');
  const [zoom, setZoom] = useState(100);
  const [annotations, setAnnotations] = useState([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [imageName] = useState(`cell_${String(imageId).padStart(3, '0')}.jpg`);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLocked) return;

      switch (e.key) {
        case 'v':
        case 'V':
          setActiveTool('select');
          break;
        case 'b':
        case 'B':
          setActiveTool('draw');
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(z + 10, 200));
          break;
        case '-':
          setZoom((z) => Math.max(z - 10, 30));
          break;
        case 'Delete':
        case 'Backspace':
          if (selectedAnnotationId) {
            handleDeleteAnnotation(selectedAnnotationId);
          }
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            handleUndo();
          }
          break;
        default:
          // Number keys 1-9 for quick label selection
          const num = parseInt(e.key);
          if (num >= 1 && num <= labels.length) {
            setActiveLabel(labels[num - 1]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, selectedAnnotationId, labels]);

  const handleAnnotationCreate = useCallback((boxData) => {
    const newAnnotation = {
      ...boxData,
      id: nextAnnotationId++,
    };
    setAnnotations((prev) => [...prev, newAnnotation]);
    setSelectedAnnotationId(newAnnotation.id);
  }, []);

  const handleAnnotationSelect = useCallback((id) => {
    setSelectedAnnotationId(id);
  }, []);

  const handleDeleteAnnotation = useCallback((id) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
  }, [selectedAnnotationId]);

  const handleUndo = useCallback(() => {
    setAnnotations((prev) => {
      if (prev.length === 0) return prev;
      const removed = prev[prev.length - 1];
      if (selectedAnnotationId === removed.id) {
        setSelectedAnnotationId(null);
      }
      return prev.slice(0, -1);
    });
  }, [selectedAnnotationId]);

  const handleSubmit = useCallback(() => {
    if (annotations.length === 0) return;
    setIsLocked(true);
    setShowSuccess(true);
    setSelectedAnnotationId(null);
    // In production: call API to submit annotations and update task status
    console.log('Submitted annotations:', annotations.map(a => ({
      labelId: a.labelId,
      labelName: a.labelName,
      x: a.x,
      y: a.y,
      width: a.width,
      height: a.height,
    })));
  }, [annotations]);

  const handleBack = useCallback(() => {
    navigate('/annotator/images');
  }, [navigate]);

  return (
    <div className="workspace">
      {/* Toolbar */}
      <AnnotationToolbar
        filename={imageName}
        zoom={zoom}
        annotationCount={annotations.length}
        isLocked={isLocked}
        activeTool={activeTool}
        onBack={handleBack}
        onZoomIn={() => setZoom((z) => Math.min(z + 10, 200))}
        onZoomOut={() => setZoom((z) => Math.max(z - 10, 30))}
        onUndo={handleUndo}
        onToolChange={setActiveTool}
        onSubmit={handleSubmit}
      />

      {/* Body: labels panel + canvas + annotations panel */}
      <div className="workspace-body">
        {/* Left: Label Selector */}
        <div className="workspace-labels">
          <div className="workspace-labels__header">
            <p className="workspace-labels__title">Labels</p>
          </div>
          <div className="workspace-labels__list">
            {labels.map((label, index) => (
              <button
                key={label.id}
                className={`workspace-labels__item ${activeLabel?.id === label.id ? 'workspace-labels__item--active' : ''}`}
                onClick={() => { setActiveLabel(label); setActiveTool('draw'); }}
                disabled={isLocked}
              >
                <span
                  className="workspace-labels__swatch"
                  style={{ backgroundColor: label.color }}
                />
                <span className="workspace-labels__name">{label.name}</span>
                <span className="workspace-labels__shortcut">{index + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <AnnotationCanvas
          imageSrc={MOCK_IMAGE}
          annotations={annotations}
          selectedId={selectedAnnotationId}
          activeLabel={activeLabel}
          activeTool={activeTool}
          zoom={zoom}
          isLocked={isLocked}
          onAnnotationCreate={handleAnnotationCreate}
          onAnnotationSelect={handleAnnotationSelect}
          onAnnotationDelete={handleDeleteAnnotation}
        />

        {/* Right: Annotations List */}
        <div className="workspace-annotations">
          <div className="workspace-annotations__header">
            <p className="workspace-annotations__title">Annotations</p>
            <span className="workspace-annotations__count">{annotations.length}</span>
          </div>
          <div className="workspace-annotations__list">
            {annotations.length === 0 ? (
              <div className="workspace-annotations__empty">
                <p>No annotations yet.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  Select a label, then click and drag on the image to draw a bounding box.
                </p>
              </div>
            ) : (
              annotations.map((ann) => (
                <div
                  key={ann.id}
                  className={`workspace-annotations__item ${ann.id === selectedAnnotationId ? 'workspace-annotations__item--selected' : ''}`}
                  onClick={() => handleAnnotationSelect(ann.id)}
                >
                  <span
                    className="workspace-annotations__item-swatch"
                    style={{ backgroundColor: ann.color }}
                  />
                  <div className="workspace-annotations__item-info">
                    <p className="workspace-annotations__item-label">{ann.labelName}</p>
                    <p className="workspace-annotations__item-coords">
                      {ann.x.toFixed(1)}%, {ann.y.toFixed(1)}% — {ann.width.toFixed(1)}×{ann.height.toFixed(1)}%
                    </p>
                  </div>
                  {!isLocked && (
                    <button
                      className="workspace-annotations__item-delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteAnnotation(ann.id); }}
                      title="Delete annotation"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Success Overlay */}
      {showSuccess && (
        <div className="workspace-success-overlay">
          <div className="workspace-success-card">
            <div className="workspace-success-card__icon">
              <CheckCircle size={28} />
            </div>
            <h2 className="workspace-success-card__title">Annotation Submitted!</h2>
            <p className="workspace-success-card__text">
              Your {annotations.length} annotation{annotations.length !== 1 ? 's have' : ' has'} been
              submitted for review. The image status is now &ldquo;Pending Review&rdquo;.
            </p>
            <button
              className="workspace-success-card__btn"
              onClick={handleBack}
            >
              <ArrowLeft size={16} />
              Back to Images
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
