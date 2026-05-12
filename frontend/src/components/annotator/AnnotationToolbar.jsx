import { ArrowLeft, ZoomIn, ZoomOut, Undo2, MousePointer2, Square, CheckCircle } from 'lucide-react';
import '@/styles/AnnotationWorkspace.css';

export default function AnnotationToolbar({
  filename = 'image.jpg',
  zoom = 100,
  annotationCount = 0,
  isLocked = false,
  activeTool = 'draw',
  onBack,
  onZoomIn,
  onZoomOut,
  onUndo,
  onToolChange,
  onSubmit,
}) {
  return (
    <div className="workspace-toolbar">
      <div className="workspace-toolbar__left">
        <button
          type="button"
          className="workspace-toolbar__back"
          onClick={onBack}
          aria-label="Back to images"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="workspace-toolbar__filename">{filename}</span>
      </div>

      <div className="workspace-toolbar__center">
        {/* Tool buttons */}
        <button
          type="button"
          className={`workspace-toolbar__btn ${activeTool === 'select' ? 'workspace-toolbar__btn--active' : ''}`}
          onClick={() => onToolChange?.('select')}
          title="Select (V)"
          disabled={isLocked}
        >
          <MousePointer2 size={16} />
        </button>
        <button
          type="button"
          className={`workspace-toolbar__btn ${activeTool === 'draw' ? 'workspace-toolbar__btn--active' : ''}`}
          onClick={() => onToolChange?.('draw')}
          title="Draw Box (B)"
          disabled={isLocked}
        >
          <Square size={16} />
        </button>

        <div style={{ width: '1px', height: '1.25rem', background: 'rgba(255,255,255,0.1)', margin: '0 0.25rem' }} />

        {/* Zoom */}
        <button
          type="button"
          className="workspace-toolbar__btn"
          onClick={onZoomOut}
          title="Zoom Out (-)"
        >
          <ZoomOut size={16} />
        </button>
        <span className="workspace-toolbar__zoom-text">{zoom}%</span>
        <button
          type="button"
          className="workspace-toolbar__btn"
          onClick={onZoomIn}
          title="Zoom In (+)"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      <div className="workspace-toolbar__right">
        <button
          type="button"
          className="workspace-toolbar__undo"
          onClick={onUndo}
          disabled={isLocked || annotationCount === 0}
          title="Undo last box"
        >
          <Undo2 size={14} />
          Undo
        </button>

        <button
          type="button"
          className="workspace-toolbar__submit"
          disabled={isLocked || annotationCount === 0}
          onClick={onSubmit}
        >
          <CheckCircle size={16} />
          Complete Annotation
        </button>
      </div>
    </div>
  );
}
