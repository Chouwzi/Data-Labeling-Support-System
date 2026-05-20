import { useState, useEffect, useRef } from 'react';
import { X, FolderPlus } from 'lucide-react';
import './CreateGroupModal.css';

export default function CreateGroupModal({ isOpen, onClose, onSave }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    if (groupName.trim().length < 2) {
      setError('Group name must be at least 2 characters');
      return;
    }

    onSave({ name: groupName.trim(), description: description.trim() });
    setGroupName('');
    setDescription('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setGroupName('');
    setDescription('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon">
            <FolderPlus size={20} />
          </div>
          <div className="modal-titles">
            <h2 className="modal-title">Create New Group</h2>
            <p className="modal-subtitle">Add a new team group for user assignment</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-field">
            <label className="modal-field__label" htmlFor="groupName">
              Group Name
            </label>
            <input
              ref={inputRef}
              type="text"
              id="groupName"
              className={`modal-field__input ${error ? 'modal-field__input--error' : ''}`}
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (error) setError('');
              }}
              autoComplete="off"
            />
            {error && (
              <p className="modal-field__error" role="alert">{error}</p>
            )}
          </div>

          <div className="modal-field">
            <label className="modal-field__label" htmlFor="groupDescription">
              Description
            </label>
            <textarea
              id="groupDescription"
              className="modal-field__input"
              placeholder="Purpose, team scope, or project ownership"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn modal-btn--secondary"
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn--primary"
              disabled={!groupName.trim()}
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
