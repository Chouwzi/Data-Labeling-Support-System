import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Modal from './Modal';
import './RoleModal.css';

const ROLES = ['MANAGER', 'ANNOTATOR', 'REVIEWER'];

const ROLE_STYLES = {
  MANAGER:   { bg: '#ecfdf5', color: '#059669', label: 'Manager' },
  ANNOTATOR: { bg: '#eff6ff', color: '#1d4ed8', label: 'Annotator' },
  REVIEWER:  { bg: '#fdf4ff', color: '#7c3aed', label: 'Reviewer' },
};

export default function RoleModal({ isOpen, onClose, user, onSave, loading, allowedRoles = ROLES }) {
  const [selected, setSelected] = useState(user?.role || '');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setSelected(e.target.value);
    setError('');
  };

  const handleSave = () => {
    if (!selected) {
      setError('Please select a role before saving.');
      return;
    }
    if (selected === user?.role) {
      onClose();
      return;
    }
    onSave(user, selected);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Role">
      <div className="role-modal">
        <div className="role-modal__user-info">
          <div className="role-modal__avatar">
            {user?.fullName
              ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
              : 'U'}
          </div>
          <div className="role-modal__user-details">
            <p className="role-modal__user-name">{user?.fullName || '—'}</p>
            <p className="role-modal__user-email">{user?.email || '—'}</p>
          </div>
        </div>

        <div className="role-modal__current">
          <span className="role-modal__current-label">Current Role</span>
          {user?.role ? (
            <span
              className="role-modal__badge"
              style={{
                backgroundColor: ROLE_STYLES[user.role]?.bg,
                color: ROLE_STYLES[user.role]?.color,
              }}
            >
              {ROLE_STYLES[user.role]?.label || user.role}
            </span>
          ) : (
            <span className="role-modal__badge role-modal__badge--none">—</span>
          )}
        </div>

        <div className="form-field">
          <label className="form-field__label">
            <ShieldCheck size={14} />
            Select New Role
          </label>
          <div className="form-field__select-wrapper">
            <select
              className="form-field__select"
              value={selected}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">— Select Role —</option>
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {ROLE_STYLES[role].label}
                </option>
              ))}
            </select>
            <svg className="form-field__select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {selected && selected !== user?.role && (
            <div className="role-modal__preview">
              <span className="role-modal__preview-label">Preview</span>
              <span
                className="role-modal__badge"
                style={{
                  backgroundColor: ROLE_STYLES[selected]?.bg,
                  color: ROLE_STYLES[selected]?.color,
                }}
              >
                {ROLE_STYLES[selected]?.label}
              </span>
            </div>
          )}
          {error && <p className="form-field__error">{error}</p>}
        </div>

        <button
          type="button"
          className="role-modal__submit"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? (
            <span className="create-user-form__spinner" />
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </Modal>
  );
}
