import { useState, useRef, useEffect } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';
import './AnnotatorSelect.css';

const AVATAR_COLORS = [
  { bg: '#d1fae5', color: '#059669' },
  { bg: '#dbeafe', color: '#2563eb' },
  { bg: '#fce7f3', color: '#db2777' },
  { bg: '#fef3c7', color: '#d97706' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#ccfbf1', color: '#0d9488' },
  { bg: '#fee2e2', color: '#dc2626' },
];

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const getWorkloadLevel = (load) => {
  if (load >= 15) return 'high';
  if (load <= 6) return 'low';
  return 'normal';
};

export default function AnnotatorSelect({
  annotators,
  selectedId,
  onChange,
  placeholder = 'Choose annotator...',
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const selectedAnnotator = annotators.find((a) => a.id === selectedId) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (annotatorId) => {
    onChange(annotatorId);
    setOpen(false);
  };

  const avatarStyle = (index) => {
    const c = AVATAR_COLORS[index % AVATAR_COLORS.length];
    return { backgroundColor: c.bg, color: c.color };
  };

  const wrapperClass = [
    'annotator-select',
    open ? 'annotator-select--open' : '',
    disabled ? 'annotator-select--disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass} ref={wrapperRef}>
      {/* Trigger */}
      <button
        type="button"
        className="annotator-select__trigger"
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        {selectedAnnotator ? (
          <>
            <div className="annotator-select__value">
              <div
                className="annotator-select__avatar"
                style={avatarStyle(annotators.indexOf(selectedAnnotator))}
              >
                {getInitials(selectedAnnotator.name)}
              </div>
              <div className="annotator-select__value-text">
                <span className="annotator-select__value-name">{selectedAnnotator.name}</span>
                <span className="annotator-select__value-email">{selectedAnnotator.email}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="annotator-select__placeholder">
            <User size={18} />
            <span>{placeholder}</span>
          </div>
        )}
        <ChevronDown size={18} className="annotator-select__chevron" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="annotator-select__dropdown" role="listbox" aria-label="Select an annotator">
          <div className="annotator-select__dropdown-header">
            <p className="annotator-select__dropdown-title">
              {annotators.length} team member{annotators.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="annotator-select__list">
            {annotators.length === 0 ? (
              <div className="annotator-select__empty">No annotators available</div>
            ) : (
              annotators.map((annotator, index) => {
                const isSelected = selectedId === annotator.id;
                const workloadLevel = getWorkloadLevel(annotator.workload);
                const optionClass = [
                  'annotator-select__option',
                  isSelected ? 'annotator-select__option--selected' : '',
                ].filter(Boolean).join(' ');

                return (
                  <button
                    key={annotator.id}
                    type="button"
                    className={optionClass}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(annotator.id)}
                  >
                    <div className="annotator-select__avatar" style={avatarStyle(index)}>
                      {getInitials(annotator.name)}
                    </div>
                    <div className="annotator-select__option-text">
                      <span className="annotator-select__option-name">{annotator.name}</span>
                      <span className="annotator-select__option-email">{annotator.email}</span>
                    </div>
                    <div className="annotator-select__option-meta">
                      <span
                        className={`annotator-select__option-workload annotator-select__option-workload--${workloadLevel}`}
                      >
                        {annotator.workload} tasks
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={16} className="annotator-select__option-check" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
