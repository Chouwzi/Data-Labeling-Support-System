import { useState } from 'react';
import { X } from 'lucide-react';
import '@/styles/ReviewerDashboard.css'; // Use centralized styles

const ERROR_CATEGORIES = [
  'Wrong Label',
  'Inaccurate Bounding Box',
  'Bounding Box Too Large',
  'Missing Object',
  'Duplicate Annotation',
  'Incorrect Polygon',
  'Low Image Quality',
];

export default function RejectModal({ onClose, onConfirm }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleToggleCategory = (category) => {
    setError('');
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // No logic needed for this task, just close the modal
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <div className="modal-header">
          <h2 className="modal-title">Reject Annotation</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Error Categories (Select at least 1):</label>
              <div className="category-grid">
                {ERROR_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-chip ${selectedCategories.includes(category) ? 'category-chip--active' : ''}`}
                    onClick={() => handleToggleCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label className="form-label" htmlFor="reject-note">Detailed Notes:</label>
              <textarea
                id="reject-note"
                className="form-textarea"
                placeholder="Enter detailed reason here..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
              />
              <div className="textarea-footer">
                <span className="char-counter">{note.length}/500</span>
              </div>
            </div>

            {error && <p className="form-error" style={{ color: '#ef4444', marginTop: '8px', fontSize: '14px' }}>{error}</p>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--danger">
              Confirm Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
