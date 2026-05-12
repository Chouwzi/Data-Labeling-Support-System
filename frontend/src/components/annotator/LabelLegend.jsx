import React from 'react';

export default function LabelLegend({ labels = [] }) {
  return (
    <div className="activity-section">
      <div className="activity-section__header">
        <h2 className="activity-section__title">Labels Legend</h2>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        {labels.map((label) => (
          <div
            key={label.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              border: `1px solid ${label.color}`,
              backgroundColor: `${label.color}10`,
              fontSize: '0.8125rem',
              fontWeight: '600',
              color: label.color,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '0.5rem',
                height: '0.5rem',
                borderRadius: '50%',
                backgroundColor: label.color,
                flexShrink: 0,
              }}
            />
            <span>{label.name}</span>
            {label.description && (
              <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.25rem' }}>
                ({label.description})
              </span>
            )}
          </div>
        ))}
        {labels.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No labels available for this project.</p>
        )}
      </div>
    </div>
  );
}
