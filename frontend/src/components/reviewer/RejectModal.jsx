import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getDefectCategories } from '@/services/api';
import '@/styles/ReviewerDashboard.css';

export default function RejectModal({ onClose, onConfirm }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await getDefectCategories();
        const data = res.data?.result || [];
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load defect categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategoryId) {
      setError('Please select an error category.');
      return;
    }
    if (!note.trim()) {
      setError('Please enter a detailed rejection note.');
      return;
    }
    
    onConfirm({
      defectCategoryId: selectedCategoryId,
      note: note.trim()
    });
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
              <label className="form-label">Error Category (Select 1):</label>
              {loading ? (
                <div style={{ padding: '10px 0', color: '#64748b' }}>Loading categories...</div>
              ) : (
                <div className="category-grid">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={`category-chip ${selectedCategoryId === category.id ? 'category-chip--active' : ''}`}
                      onClick={() => {
                        setError('');
                        setSelectedCategoryId(category.id);
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
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
                required
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
