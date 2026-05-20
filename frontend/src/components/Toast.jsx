import { useEffect, useState } from 'react';
import { CheckCircle2, User, RotateCcw, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import './Toast.css';

export default function Toast({
  message,
  type = 'success', // 'success' | 'error' | 'warning'
  annotatorName,
  annotatorAvatar,
  imageCount,
  onUndo,
  duration = 4000,
  onClose,
}) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (exiting) return;
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        setExiting(false);
        onClose?.();
      }, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, exiting, onClose]);

  const handleClose = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onClose?.();
    }, 300);
  };

  if (!visible && !exiting) return null;

  const Icon = type === 'error' ? AlertCircle : (type === 'warning' ? AlertTriangle : CheckCircle2);
  const iconClass = `toast-icon--${type}`;

  return (
    <div
      className={[
        'toast-container',
        `toast--${type}`,
        exiting ? 'toast-exit' : 'toast-enter',
      ].filter(Boolean).join(' ')}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-left">
        <Icon size={24} strokeWidth={2} className={`toast-main-icon ${iconClass}`} aria-hidden="true" />
      </div>

      <div className="toast-middle">
        <p className="toast-message">{message}</p>
        {annotatorName && (
          <div className="toast-annotator">
            {annotatorAvatar ? (
              <img src={annotatorAvatar} alt="" className="toast-annotator-avatar" />
            ) : (
              <User size={10} className="toast-annotator-icon" aria-hidden="true" />
            )}
            <span className="toast-annotator-name">{annotatorName}</span>
            {imageCount !== undefined && (
              <span className="toast-image-count">
                {imageCount} images
              </span>
            )}
          </div>
        )}
      </div>

      <div className="toast-right">
        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            className="toast-undo-btn"
            aria-label="Undo action"
          >
            <RotateCcw size={13} strokeWidth={2.5} aria-hidden="true" />
            <span>Undo</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notification"
          className="toast-close-btn"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
