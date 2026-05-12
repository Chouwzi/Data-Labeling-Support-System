import { Trash2 } from 'lucide-react';
import '@/styles/AnnotationWorkspace.css';

export default function BoundingBoxLayer({
  annotations = [],
  selectedId = null,
  previewBox = null,
  containerWidth = 0,
  containerHeight = 0,
  isLocked = false,
  onSelect,
  onDelete,
}) {
  // Convert relative % coords to absolute pixel positions
  const toPixel = (box) => ({
    x: (box.x / 100) * containerWidth,
    y: (box.y / 100) * containerHeight,
    w: (box.width / 100) * containerWidth,
    h: (box.height / 100) * containerHeight,
  });

  return (
    <svg
      className="workspace-canvas__overlay"
      width={containerWidth}
      height={containerHeight}
      style={{ pointerEvents: isLocked ? 'none' : 'auto' }}
    >
      {/* Rendered annotations */}
      {annotations.map((ann) => {
        const px = toPixel(ann);
        const isSelected = ann.id === selectedId;
        const labelText = ann.labelName || 'Label';
        const textWidth = labelText.length * 7 + 12;

        return (
          <g key={ann.id} onClick={() => !isLocked && onSelect?.(ann.id)}>
            {/* Box rectangle */}
            <rect
              x={px.x}
              y={px.y}
              width={px.w}
              height={px.h}
              className={`bbox-rect ${isSelected ? 'bbox-rect--selected' : ''}`}
              stroke={ann.color}
              fill={isSelected ? `${ann.color}15` : `${ann.color}08`}
            />

            {/* Label badge */}
            <rect
              className="bbox-label-bg"
              x={px.x}
              y={px.y - 20}
              width={textWidth}
              height={18}
              fill={ann.color}
              opacity={0.9}
            />
            <text
              className="bbox-label"
              x={px.x + 6}
              y={px.y - 6}
            >
              {labelText}
            </text>

            {/* Delete button (only shown when selected and not locked) */}
            {isSelected && !isLocked && (
              <g
                onClick={(e) => { e.stopPropagation(); onDelete?.(ann.id); }}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={px.x + px.w - 20}
                  y={px.y - 20}
                  width={20}
                  height={18}
                  fill="#ef4444"
                  rx={3}
                  opacity={0.9}
                />
                <text
                  x={px.x + px.w - 14}
                  y={px.y - 6}
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                >
                  ×
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Drawing preview box */}
      {previewBox && (
        <rect
          className="bbox-preview"
          x={previewBox.x}
          y={previewBox.y}
          width={previewBox.width}
          height={previewBox.height}
          stroke={previewBox.color || '#ffffff'}
        />
      )}
    </svg>
  );
}
