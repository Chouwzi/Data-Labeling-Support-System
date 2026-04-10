import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Tag,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import BrandLogo from '@/components/common/BrandLogo';
import AdvancedColorPicker from '@/components/manager/AdvancedColorPicker';
import '@/styles/ManagerDashboard.css';
import '@/styles/LabelTaxonomy.css';

const INITIAL_LABELS = [
  { id: 1, name: 'Building', hex: '#006C51' },
  { id: 2, name: 'Road', hex: '#A03F37' },
  { id: 3, name: 'Vegetation', hex: '#466558' },
];

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? result : null;
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';
  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#111827' : '#ffffff';
}

function isValidHex(hex) {
  return /^#[0-9A-Fa-f]{6}$/.test(hex);
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };
  return { toasts, addToast };
}

export default function LabelTaxonomy() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [formName, setFormName] = useState('');
  const [formHex, setFormHex] = useState('#006C51');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editHex, setEditHex] = useState('');
  const [editNameError, setEditNameError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const nameInputRef = useRef(null);
  const { toasts, addToast } = useToast();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const isDuplicateName = (name, excludeId = null) =>
    labels.some(
      (l) => l.name.toLowerCase() === name.toLowerCase() && l.id !== excludeId
    );

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = formName.trim();
    if (!trimmed) { setNameError('Label name is required'); return; }
    if (trimmed.length < 2) { setNameError('Must be at least 2 characters'); return; }
    if (isDuplicateName(trimmed)) { setNameError('This label name already exists'); return; }
    if (!isValidHex(formHex)) { setNameError('Invalid hex color format'); return; }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const newLabel = { id: Date.now(), name: trimmed, hex: formHex.toUpperCase() };
    setLabels((prev) => [newLabel, ...prev]);
    setFormName('');
    setFormHex('#006C51');
    setNameError('');
    setIsSubmitting(false);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 2500);
    addToast(`"${trimmed}" added to taxonomy`, 'success');
    nameInputRef.current?.focus();
  };

  const handleDelete = (id) => {
    const label = labels.find((l) => l.id === id);
    setLabels((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
    addToast(`"${label?.name}" removed`, 'info');
  };

  const startEdit = (label) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditHex(label.hex);
    setEditNameError('');
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditHex('');
    setEditNameError('');
  };

  const handleEditSave = (id) => {
    const trimmed = editName.trim();
    if (!trimmed) { setEditNameError('Name cannot be empty'); return; }
    if (isDuplicateName(trimmed, id)) { setEditNameError('This name is already taken'); return; }
    if (!isValidHex(editHex)) { setEditNameError('Invalid hex color'); return; }

    setLabels((prev) =>
      prev.map((l) => l.id === id ? { ...l, name: trimmed, hex: editHex.toUpperCase() } : l)
    );
    addToast(`Label updated to "${trimmed}"`, 'success');
    cancelEdit();
  };

  const totalUsage = 0;
  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : user?.role || 'MANAGER';

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search projects..."
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="label-taxonomy-page">

            {/* Brand strip */}
            <div className="label-taxonomy-page__shell" aria-hidden="true">
              <div className="manager-page-header__brand">
                <BrandLogo size={32} />
                <span className="manager-page-header__brand-name">DataLabel Pro</span>
              </div>
            </div>

            {/* Back button */}
            <button type="button" className="label-taxonomy-back" onClick={() => navigate('/manager/projects')}>
              <ArrowLeft size={18} aria-hidden="true" />
              <span>Back to Project</span>
            </button>

            {/* Page header */}
            <header className="label-taxonomy-page__intro">
              <h1 className="manager-page-title">Label Taxonomy</h1>
              <p className="manager-page-subtitle">
                Define classification colors and names for your project datasets.
              </p>
            </header>

            {/* Asymmetric grid */}
            <div className="label-taxonomy-grid">

              {/* ── Creation Studio (left) ── */}
              <aside
                className="label-taxonomy-grid__studio manager-stack-card"
                aria-label="Add new label"
              >
                <div className="label-taxonomy-studio__header">
                  <div className="label-taxonomy-studio__icon-wrap">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h2 className="project-table-card__title label-taxonomy-studio__title">
                      Creation Studio
                    </h2>
                    <p className="project-table-card__subtitle label-taxonomy-studio__subtitle">
                      Define a new taxonomy entry
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreate} noValidate className="create-project-form">
                  {submitSuccess && (
                    <div className="success-banner" role="status" aria-live="polite">
                      <Check size={18} />
                      <span>Label added successfully</span>
                    </div>
                  )}

                  <div className="form-field">
                    <label className="form-field__label" htmlFor="label-name">
                      <Tag size={15} />
                      Label Name
                    </label>
                    <input
                      id="label-name"
                      ref={nameInputRef}
                      type="text"
                      className={`form-field__input ${nameError ? 'form-field__input--error' : ''}`}
                      placeholder="e.g. Building, Road, Water"
                      value={formName}
                      onChange={(e) => { setFormName(e.target.value); if (nameError) setNameError(''); }}
                      autoComplete="off"
                    />
                    {nameError && (
                      <p className="form-field__error" role="alert">
                        <AlertCircle size={14} />
                        {nameError}
                      </p>
                    )}
                  </div>

                  <div className="form-field">
                    <span className="form-field__label" id="label-hex-label">
                      <Tag size={15} />
                      Label color
                    </span>
                    <AdvancedColorPicker
                      id="label-hex"
                      value={formHex}
                      onChange={(h) => { setFormHex(h); if (nameError) setNameError(''); }}
                      aria-label="Label fill color"
                    />
                  </div>

                  <div className="label-taxonomy-preview">
                    <p className="label-taxonomy-preview__label">Live preview</p>
                    <div className="label-taxonomy-preview__card">
                      <div
                        className="label-taxonomy-preview__swatch"
                        style={{ backgroundColor: isValidHex(formHex) ? formHex : '#e5e7eb' }}
                      >
                        <Tag
                          size={12}
                          color={isValidHex(formHex) ? getContrastColor(formHex) : '#9ca3af'}
                        />
                      </div>
                      <span className="label-taxonomy-preview__name">
                        {formName.trim() || 'Label name'}
                      </span>
                      <span
                        className="label-taxonomy-preview__hex"
                        style={{ color: isValidHex(formHex) ? formHex : '#9ca3af' }}
                      >
                        {isValidHex(formHex) ? formHex.toUpperCase() : 'Invalid'}
                      </span>
                    </div>
                  </div>

                  <button type="submit" className="create-project-submit-btn" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <span className="create-project-submit-btn__spinner" aria-hidden="true" />
                        Adding…
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add to Taxonomy
                      </>
                    )}
                  </button>
                </form>

                <div className="label-taxonomy-tip">
                  <p className="label-taxonomy-tip__text">
                    Use high-contrast colors so annotators can distinguish overlapping regions clearly.
                  </p>
                </div>
              </aside>

              {/* ── Label Catalog (right) ── */}
              <section
                className="label-taxonomy-grid__catalog"
                aria-label="Label taxonomy list"
              >
                <div className="project-table-card label-taxonomy-catalog-card">
                  <div className="project-table-card__header">
                    <div>
                      <h2 className="project-table-card__title">Label catalog</h2>
                      <p className="project-table-card__subtitle">
                        Manage classification categories for this project
                      </p>
                    </div>
                    <div className="label-taxonomy-catalog__stats">
                      <div className="label-taxonomy-stat-pill">
                        <span className="label-taxonomy-stat-pill__num">{labels.length}</span>
                        <span className="label-taxonomy-stat-pill__text">Labels</span>
                      </div>
                    </div>
                  </div>

                  {labels.length === 0 ? (
                    <div className="label-taxonomy-empty">
                      <div className="label-taxonomy-empty__icon" aria-hidden="true">
                        <Tag size={40} strokeWidth={1.25} className="label-taxonomy-empty__svg" />
                      </div>
                      <h3 className="label-taxonomy-empty__title">No labels defined yet</h3>
                      <p className="label-taxonomy-empty__desc">
                        Add your first label using Creation Studio on the left.
                      </p>
                    </div>
                  ) : (
                    <div className="label-taxonomy-table-wrap label-taxonomy-table-container">
                      <table className="project-table" role="table">
                        <thead>
                          <tr>
                            <th scope="col">Label</th>
                            <th scope="col">Color</th>
                            <th scope="col">Usage</th>
                            <th scope="col" className="text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labels.map((label) =>
                            editingId === label.id ? (
                              <tr key={label.id} className="label-taxonomy-table__edit">
                                <td colSpan={4}>
                                  <div className="label-taxonomy-edit">
                                    <div className="label-taxonomy-edit__row">
                                      <AdvancedColorPicker
                                        value={editHex}
                                        onChange={(h) => { setEditHex(h); setEditNameError(''); }}
                                        aria-label={`Color for ${label.name}`}
                                      />
                                    </div>
                                    <div className="label-taxonomy-edit__row">
                                      <input
                                        type="text"
                                        className={`form-field__input label-taxonomy-edit__name ${editNameError ? 'form-field__input--error' : ''}`}
                                        value={editName}
                                        onChange={(e) => { setEditName(e.target.value); setEditNameError(''); }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleEditSave(label.id);
                                          if (e.key === 'Escape') cancelEdit();
                                        }}
                                        autoFocus
                                        aria-label="Edit label name"
                                      />
                                    </div>
                                    {editNameError && (
                                      <p className="form-field__error" role="alert">
                                        <AlertCircle size={14} />
                                        {editNameError}
                                      </p>
                                    )}
                                    <div className="label-taxonomy-edit__actions">
                                      <button
                                        type="button"
                                        className="create-project-submit-btn label-taxonomy-edit__save"
                                        onClick={() => handleEditSave(label.id)}
                                      >
                                        <Check size={16} />
                                        Save
                                      </button>
                                      <button type="button" className="cancel-btn" onClick={cancelEdit}>
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr key={label.id}>
                                <td>
                                  <div className="project-table__name">
                                    <div
                                      className="label-taxonomy-table__swatch"
                                      style={{ backgroundColor: label.hex }}
                                      aria-hidden="true"
                                    >
                                      <Tag size={14} color={getContrastColor(label.hex)} />
                                    </div>
                                    <div>
                                      <p className="project-table__name-text">{label.name}</p>
                                      <p className="project-table__name-meta">Taxonomy label</p>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <code className="label-taxonomy-table__hex">{label.hex}</code>
                                </td>
                                <td>
                                  <span className="label-taxonomy-table__usage">—</span>
                                </td>
                                <td className="text-right">
                                  <div className="project-table__actions label-taxonomy-table__actions">
                                    {deletingId === label.id ? (
                                      <>
                                        <button
                                          type="button"
                                          className="cancel-btn label-taxonomy-table__inline-btn"
                                          onClick={() => setDeletingId(null)}
                                        >
                                          <X size={14} />
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          className="create-project-submit-btn label-taxonomy-table__inline-btn label-taxonomy-table__inline-btn--danger"
                                          onClick={() => handleDelete(label.id)}
                                        >
                                          <Trash2 size={14} />
                                          Delete
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          className="project-table__action-btn"
                                          onClick={() => startEdit(label)}
                                          aria-label={`Edit ${label.name}`}
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        <button
                                          type="button"
                                          className="project-table__action-btn"
                                          onClick={() => setDeletingId(label.id)}
                                          aria-label={`Delete ${label.name}`}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {labels.length > 0 && (
                    <div className="label-taxonomy-catalog__footer">
                      <ChevronRight size={14} aria-hidden="true" />
                      <span>Labels are scoped to the current project and can be edited at any time</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Toasts */}
          <div className="label-taxonomy-toasts" aria-live="polite">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`label-taxonomy-toast label-taxonomy-toast--${toast.type}`}
              >
                {toast.type === 'success' ? <Check size={15} /> : <AlertCircle size={15} />}
                {toast.message}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
