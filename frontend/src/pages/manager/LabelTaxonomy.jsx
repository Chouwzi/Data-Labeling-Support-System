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
import { useAuth } from '@/contexts/useAuth';
import ManagerSidebar from '@/components/manager/ManagerSidebar';
import Topbar from '@/components/common/Topbar';
import BrandLogo from '@/components/common/BrandLogo';
import AdvancedColorPicker from '@/components/manager/AdvancedColorPicker';
import '@/styles/ManagerDashboard.css';
import '@/styles/LabelTaxonomy.css';
import {
  getLabelsByProject,
  createLabel,
  updateLabel,
  deleteLabel,
  getProjects
} from '@/services/api';
import { useParams } from 'react-router-dom';

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
  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, addToast };
}

export default function LabelTaxonomy() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { projectId } = useParams();
  console.log("Current Project ID:", projectId);
  const [projectsList, setProjectsList] = useState([]);
  const [labels, setLabels] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const fetchLabels = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await getLabelsByProject(projectId);
      const fetchedLabels = res.data?.result || [];
      const mappedLabels = fetchedLabels.map(l => ({
        ...l,
        hex: l.color_hex || l.colorHex || l.hex
      }));
      setLabels(mappedLabels);
    } catch {
      addToast("Could not load labels from server", 'error');
    }
  }, [projectId, addToast]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await getProjects();
        // Handle both paginated PageResponse and flat List for safety
        const projectData = res.data?.result?.data || res.data?.result || [];
        setProjectsList(Array.isArray(projectData) ? projectData : []);
      } catch {
        addToast("Could not load projects", 'error');
      }
    }
    fetchProjects();
  }, [addToast]);

  useEffect(() => {
    if (projectId) {
      fetchLabels();
    } else {
      setLabels([]);
    }
  }, [projectId, fetchLabels]);

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
    setNameError('');
    try {

      const payload = {
        name: trimmed,
        color_hex: formHex
      };

      console.log("🚀 [LTJ-75] Sending Label Payload:", payload);

      const response = await createLabel(projectId, payload);

      if (response.status === 201 || response.status === 200) {
        setSubmitSuccess(true);
        addToast(`"${trimmed}" added to taxonomy`, 'success');

        // Reset form
        setFormName('');
        setFormHex('#006C51');

        if (typeof fetchLabels === 'function') {
          fetchLabels();
        } else {

          const savedLabel = response.data.result;
          setLabels((prev) => [
            {
              ...savedLabel,
              hex: savedLabel.colorHex || savedLabel.color_hex
            },
            ...prev
          ]);
        }

        setTimeout(() => setSubmitSuccess(false), 2500);
        nameInputRef.current?.focus();
      }
    } catch (err) {
      console.error("❌ Lỗi tạo nhãn:", err);

      const serverMessage = err.response?.data?.message || "Server Error 500";
      setNameError(serverMessage);
      addToast(serverMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLabel(projectId, id);
      addToast("Label removed", 'info');
      fetchLabels();
    } catch {
      addToast("Error deleting label", 'error');
    } finally {
      setDeletingId(null);
    }
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

  const handleEditSave = async (id) => {
    const trimmed = editName.trim();
    if (!trimmed) { setEditNameError('Name cannot be empty'); return; }
    if (isDuplicateName(trimmed, id)) { setEditNameError('This name is already taken'); return; }
    if (!isValidHex(editHex)) { setEditNameError('Invalid hex color'); return; }

    try {

      await updateLabel(projectId, id, {
        name: trimmed,
        color_hex: editHex
      });

      addToast(`Label updated to "${trimmed}"`, 'success');


      if (typeof fetchLabels === 'function') {
        fetchLabels();
      } else {

        setLabels((prev) =>
          prev.map((l) =>
            l.id === id
              ? { ...l, name: trimmed, hex: editHex.toUpperCase() }
              : l
          )
        );
      }

      cancelEdit();
    } catch (err) {
      console.error("❌ Lỗi cập nhật nhãn:", err);
      const serverMsg = err.response?.data?.message || "Could not update label";
      setEditNameError(serverMsg);
      addToast(serverMsg, 'error');
    }
  };

  const filteredLabels = labels.filter((label) =>
    !searchQuery.trim() || label.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userName = user?.fullName || user?.email || 'Manager';
  const userRole = user?.role === 'MANAGER' ? 'Lead Curator' : user?.role || 'MANAGER';

  return (
    <div className="manager-layout">
      <ManagerSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="manager-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          searchPlaceholder="Search labels..."
          searchValue={searchQuery}
          onSearch={setSearchQuery}
          showCenterLinks
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="manager-content">
          <div className="label-taxonomy-page">

            {/* ── Page Header ── */}
            <header className="label-taxonomy-header">
              <div className="label-taxonomy-header__brand" aria-hidden="true">
                <BrandLogo size={32} />
                <span className="label-taxonomy-header__brand-name">DataLabel Pro</span>
              </div>
              <div className="label-taxonomy-header__row">
                <div>
                  <h1 className="label-taxonomy-title">Label Taxonomy</h1>
                  <p className="label-taxonomy-subtitle">
                    Define and manage classification labels for your annotators.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <select
                    className="form-field__input"
                    value={projectId || ''}
                    onChange={(e) => navigate(e.target.value ? `/manager/taxonomy/${e.target.value}` : '/manager/taxonomy')}
                    style={{ minWidth: '250px', margin: 0, padding: '8px 12px' }}
                    aria-label="Select Project"
                  >
                    <option value="">-- Select a project --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="label-taxonomy-add-btn"
                    onClick={() => nameInputRef.current?.focus()}
                    disabled={!projectId}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Add New Label
                  </button>
                </div>
              </div>
            </header>

            {/* ── Back Navigation ── */}
            <button
              type="button"
              className="label-taxonomy-back"
              onClick={() => navigate('/manager/projects')}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Back to Projects
            </button>

            {/* ── Asymmetric Grid ── */}
            {projectId ? (
              <div className="label-taxonomy-grid">

                {/* Left — Creation Studio */}
                <aside className="label-taxonomy-studio-card" aria-label="Add new label">
                  <div className="label-taxonomy-studio-card__header">
                    <div className="label-taxonomy-studio-card__icon-wrap">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h2 className="label-taxonomy-studio-card__title">Creation Studio</h2>
                      <p className="label-taxonomy-studio-card__subtitle">
                        Define a new taxonomy entry
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleCreate} noValidate className="label-taxonomy-form">
                    {submitSuccess && (
                      <div className="label-taxonomy-success-banner" role="status" aria-live="polite">
                        <Check size={16} />
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
                        onChange={(e) => {
                          setFormName(e.target.value);
                          if (nameError) setNameError('');
                        }}
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
                        Label Color
                      </span>
                      <AdvancedColorPicker
                        id="label-hex"
                        value={formHex}
                        onChange={(h) => {
                          setFormHex(h);
                          if (nameError) setNameError('');
                        }}
                        aria-label="Label fill color"
                      />
                    </div>

                    {/* Live Preview */}
                    <div className="label-taxonomy-preview">
                      <p className="label-taxonomy-preview__label">Live Preview</p>
                      <div className="label-taxonomy-preview__card">
                        <div
                          className="label-taxonomy-preview__swatch"
                          style={{
                            backgroundColor: isValidHex(formHex) ? formHex : '#e5e7eb',
                          }}
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

                    <button
                      type="submit"
                      className="label-taxonomy-submit-btn"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="label-taxonomy-submit-btn__spinner" aria-hidden="true" />
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

                {/* Right — Label Catalog */}
                <section className="label-taxonomy-catalog" aria-label="Label taxonomy list">
                  <div className="label-taxonomy-catalog-card">
                    <div className="label-taxonomy-catalog-card__header">
                      <div className="label-taxonomy-catalog-card__header-left">
                        <h2 className="label-taxonomy-catalog-card__title">Label Catalog</h2>
                        <p className="label-taxonomy-catalog-card__subtitle">
                          Manage classification categories for this project
                        </p>
                      </div>
                      <div className="label-taxonomy-catalog__stats">
                        <div className="label-taxonomy-stat-pill">
                          <span className="label-taxonomy-stat-pill__num">{filteredLabels.length}</span>
                          <span className="label-taxonomy-stat-pill__text">Labels</span>
                        </div>
                      </div>
                    </div>

                    {filteredLabels.length === 0 ? (
                      <div className="label-taxonomy-empty">
                        <div className="label-taxonomy-empty__icon" aria-hidden="true">
                          <Tag size={40} strokeWidth={1.25} className="label-taxonomy-empty__svg" />
                        </div>
                        <h3 className="label-taxonomy-empty__title">No labels defined yet</h3>
                        <p className="label-taxonomy-empty__desc">
                          Add your first label using the Creation Studio on the left.
                        </p>
                      </div>
                    ) : (
                      <div className="label-taxonomy-table-container">
                        <table className="label-taxonomy-table" role="table">
                           <thead>
                             <tr>
                               <th scope="col" className="label-taxonomy-table__th--label">Label</th>
                               <th scope="col" className="label-taxonomy-table__th--color">Color</th>
                               <th scope="col" className="label-taxonomy-table__th--usage">Usage</th>
                               <th scope="col" className="label-taxonomy-table__th--actions">Actions</th>
                             </tr>
                           </thead>
                           <tbody>
                             {filteredLabels.map((label) =>
                              editingId === label.id ? (
                                <tr key={label.id} className="label-taxonomy-table__edit-row">
                                  <td colSpan={4}>
                                    <div className="label-taxonomy-edit-form">
                                      <div className="label-taxonomy-edit-form__row">
                                        <AdvancedColorPicker
                                          value={editHex}
                                          onChange={(h) => {
                                            setEditHex(h);
                                            setEditNameError('');
                                          }}
                                          aria-label={`Color for ${label.name}`}
                                        />
                                      </div>
                                      <div className="label-taxonomy-edit-form__row">
                                        <input
                                          type="text"
                                          className={`form-field__input label-taxonomy-edit-form__name ${editNameError ? 'form-field__input--error' : ''
                                            }`}
                                          value={editName}
                                          onChange={(e) => {
                                            setEditName(e.target.value);
                                            setEditNameError('');
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleEditSave(label.id);
                                            if (e.key === 'Escape') cancelEdit();
                                          }}
                                          autoFocus
                                          aria-label="Edit label name"
                                        />
                                        {editNameError && (
                                          <p className="form-field__error" role="alert">
                                            <AlertCircle size={14} />
                                            {editNameError}
                                          </p>
                                        )}
                                      </div>
                                      <div className="label-taxonomy-edit-form__actions">
                                        <button
                                          type="button"
                                          className="label-taxonomy-edit-form__save-btn"
                                          onClick={() => handleEditSave(label.id)}
                                        >
                                          <Check size={15} />
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          className="label-taxonomy-edit-form__cancel-btn"
                                          onClick={cancelEdit}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                <tr key={label.id} className="label-taxonomy-table__row">
                                  <td className="label-taxonomy-table__td--label">
                                    <div className="label-taxonomy-label-item">
                                      <div
                                        className="label-taxonomy-label-item__swatch"
                                        style={{ backgroundColor: label.hex }}
                                        aria-hidden="true"
                                      >
                                        <Tag size={13} color={getContrastColor(label.hex)} />
                                      </div>
                                      <div className="label-taxonomy-label-item__info">
                                        <p className="label-taxonomy-label-item__name">{label.name}</p>
                                        <span
                                          className="label-taxonomy-label-item__pill"
                                          style={{
                                            backgroundColor: `${label.hex}18`,
                                            color: label.hex,
                                            borderColor: `${label.hex}30`,
                                          }}
                                        >
                                          {label.hex}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="label-taxonomy-table__td--color">
                                    <div className="label-taxonomy-color-chip">
                                      <div
                                        className="label-taxonomy-color-chip__dot"
                                        style={{ backgroundColor: label.hex }}
                                      />
                                      <code className="label-taxonomy-color-chip__hex">{label.hex}</code>
                                    </div>
                                  </td>
                                  <td className="label-taxonomy-table__td--usage">
                                    <span className="label-taxonomy-usage">—</span>
                                  </td>
                                  <td className="label-taxonomy-table__td--actions">
                                    {deletingId === label.id ? (
                                      <div className="label-taxonomy-table__delete-confirm">
                                        <button
                                          type="button"
                                          className="label-taxonomy-table__inline-cancel-btn"
                                          onClick={() => setDeletingId(null)}
                                        >
                                          <X size={14} />
                                          Cancel
                                        </button>
                                        <button
                                          type="button"
                                          className="label-taxonomy-table__inline-delete-btn"
                                          onClick={() => handleDelete(label.id)}
                                        >
                                          <Trash2 size={14} />
                                          Delete
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="label-taxonomy-table__actions">
                                        <button
                                          type="button"
                                          className="label-taxonomy-table__action-btn label-taxonomy-table__action-btn--edit"
                                          onClick={() => startEdit(label)}
                                          aria-label={`Edit ${label.name}`}
                                        >
                                          <Pencil size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          className="label-taxonomy-table__action-btn label-taxonomy-table__action-btn--delete"
                                          onClick={() => setDeletingId(label.id)}
                                          aria-label={`Delete ${label.name}`}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {filteredLabels.length > 0 && (
                      <div className="label-taxonomy-catalog__footer">
                        <ChevronRight size={14} aria-hidden="true" />
                        <span>
                          Labels are scoped to the current project and can be edited at any time
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="label-taxonomy-empty" style={{ marginTop: '24px', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f0fdf4', marginBottom: '24px' }} aria-hidden="true">
                  <Tag size={40} strokeWidth={1.5} style={{ color: '#16a34a' }} />
                </div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>Select a project to begin</h2>
                <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto' }}>
                  Label Taxonomy is managed on a per-project basis. Please select a project from the dropdown above to view or edit its labels.
                </p>
              </div>
            )}
          </div>

          {/* Toasts */}
          <div className="label-taxonomy-toasts" aria-live="polite">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`label-taxonomy-toast label-taxonomy-toast--${toast.type}`}
              >
                {toast.type === 'success' ? (
                  <Check size={15} />
                ) : (
                  <AlertCircle size={15} />
                )}
                {toast.message}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
