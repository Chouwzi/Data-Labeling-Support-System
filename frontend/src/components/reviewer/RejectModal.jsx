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
    if (selectedCategories.length === 0) {
      setError('Vui lòng chọn ít nhất 1 danh mục lỗi');
      return;
    }
    if (!note.trim()) {
      setError('Vui lòng nhập ghi chú chi tiết');
      return;
    }
    onConfirm(note, selectedCategories);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content--wide">
        <div className="modal-header">
          <h2 className="modal-title">Từ chối Annotation (Reject)</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Danh mục lỗi (Chọn ít nhất 1):</label>
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
              <label className="form-label" htmlFor="reject-note">Ghi chú chi tiết:</label>
              <textarea
                id="reject-note"
                className="form-textarea"
                placeholder="Nhập lý do chi tiết tại đây..."
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
              Hủy
            </button>
            <button type="submit" className="btn btn--danger">
              Xác nhận Reject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
