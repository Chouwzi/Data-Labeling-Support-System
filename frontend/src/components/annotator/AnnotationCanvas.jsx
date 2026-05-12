import { useState, useRef, useCallback, useEffect } from 'react';
import BoundingBoxLayer from './BoundingBoxLayer';
import '@/styles/AnnotationWorkspace.css';

export default function AnnotationCanvas({
  imageSrc,
  annotations = [],
  selectedId = null,
  activeLabel = null,
  activeTool = 'draw',
  zoom = 100,
  isLocked = false,
  onAnnotationCreate,
  onAnnotationSelect,
  onAnnotationDelete,
}) {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [previewBox, setPreviewBox] = useState(null);

  // Track natural (original) image dimensions for relative % calculation
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  const handleImageLoad = useCallback((e) => {
    const img = e.target;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setImageSize({ width: img.clientWidth, height: img.clientHeight });
  }, []);

  // Re-measure on zoom change
  useEffect(() => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.clientWidth,
        height: imageRef.current.clientHeight,
      });
    }
  }, [zoom]);

  // Re-measure on window resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setImageSize({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getRelativePos = useCallback((e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (isLocked || activeTool !== 'draw' || !activeLabel) return;
    e.preventDefault();

    const pos = getRelativePos(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setPreviewBox(null);
  }, [isLocked, activeTool, activeLabel, getRelativePos]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing || !drawStart) return;

    const pos = getRelativePos(e);
    const x = Math.min(drawStart.x, pos.x);
    const y = Math.min(drawStart.y, pos.y);
    const width = Math.abs(pos.x - drawStart.x);
    const height = Math.abs(pos.y - drawStart.y);

    setPreviewBox({ x, y, width, height, color: activeLabel?.color || '#ffffff' });
  }, [isDrawing, drawStart, activeLabel, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !previewBox) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewBox(null);
      return;
    }

    // Minimum box size threshold (5px)
    if (previewBox.width < 5 || previewBox.height < 5) {
      setIsDrawing(false);
      setDrawStart(null);
      setPreviewBox(null);
      return;
    }

    // Convert pixel coords to relative % of image
    const relX = (previewBox.x / imageSize.width) * 100;
    const relY = (previewBox.y / imageSize.height) * 100;
    const relW = (previewBox.width / imageSize.width) * 100;
    const relH = (previewBox.height / imageSize.height) * 100;

    onAnnotationCreate?.({
      x: parseFloat(relX.toFixed(4)),
      y: parseFloat(relY.toFixed(4)),
      width: parseFloat(relW.toFixed(4)),
      height: parseFloat(relH.toFixed(4)),
      labelId: activeLabel.id,
      labelName: activeLabel.name,
      color: activeLabel.color,
    });

    setIsDrawing(false);
    setDrawStart(null);
    setPreviewBox(null);
  }, [isDrawing, drawStart, previewBox, imageSize, activeLabel, onAnnotationCreate]);

  const handleCanvasClick = useCallback((e) => {
    if (activeTool === 'select') {
      // Deselect when clicking empty area
      onAnnotationSelect?.(null);
    }
  }, [activeTool, onAnnotationSelect]);

  const zoomScale = zoom / 100;

  return (
    <div
      className={`workspace-canvas ${isLocked ? 'workspace-canvas--locked' : ''}`}
      onClick={handleCanvasClick}
    >
      <div
        ref={containerRef}
        className="workspace-canvas__container"
        style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {imageSrc ? (
          <>
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Annotation target"
              className="workspace-canvas__image"
              onLoad={handleImageLoad}
              draggable={false}
            />
            <BoundingBoxLayer
              annotations={annotations}
              selectedId={selectedId}
              previewBox={previewBox}
              containerWidth={imageSize.width}
              containerHeight={imageSize.height}
              isLocked={isLocked}
              onSelect={onAnnotationSelect}
              onDelete={onAnnotationDelete}
            />
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '600px',
            height: '400px',
            color: 'rgba(255,255,255,0.2)',
            fontSize: '1rem',
            fontWeight: 600,
          }}>
            Loading image...
          </div>
        )}
      </div>
    </div>
  );
}
