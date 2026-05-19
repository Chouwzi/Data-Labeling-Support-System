import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import SystemConfigPanel from '@/components/system/SystemConfigPanel';
import BrandLogo from '@/components/common/BrandLogo';
import {
  createDefectCategory,
  deleteDefectCategory,
  getDefectCategories,
  getSystemConfig,
  updateDefectCategory,
  updateSystemConfig,
} from '@/services/api';
import '@/styles/SystemConfig.css';

export default function SystemConfig() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configData, setConfigData] = useState({ maxImageSize: 10, aiEnabled: true });
  const [defectCategories, setDefectCategories] = useState([]);
  const [defectForm, setDefectForm] = useState({ name: '', description: '' });
  const [editingDefectId, setEditingDefectId] = useState(null);
  const [defectError, setDefectError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    async function loadConfig() {
      try {
        const [res, defectRes] = await Promise.all([
          getSystemConfig(),
          getDefectCategories().catch(() => ({ data: { result: [] } })),
        ]);
        const data = res.data?.result || res.data;
        setConfigData({
          maxImageSize: data.maxImageSize ?? 10,
          aiEnabled: data.aiEnabled ?? true,
        });
        const defects = defectRes.data?.result || defectRes.data || [];
        setDefectCategories(Array.isArray(defects) ? defects : []);
      } catch {
        setError('Không thể tải cấu hình. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }

    loadConfig();
  }, []);

  const handleSave = async (config) => {
    await updateSystemConfig(config);
  };

  const resetDefectForm = () => {
    setDefectForm({ name: '', description: '' });
    setEditingDefectId(null);
    setDefectError('');
  };

  const reloadDefects = async () => {
    const res = await getDefectCategories();
    const defects = res.data?.result || res.data || [];
    setDefectCategories(Array.isArray(defects) ? defects : []);
  };

  const handleSubmitDefect = async (event) => {
    event.preventDefault();
    const payload = {
      name: defectForm.name.trim(),
      description: defectForm.description.trim(),
    };
    if (!payload.name) {
      setDefectError('Defect category name is required.');
      return;
    }
    try {
      if (editingDefectId) {
        await updateDefectCategory(editingDefectId, payload);
      } else {
        await createDefectCategory(payload);
      }
      resetDefectForm();
      await reloadDefects();
    } catch (error) {
      setDefectError(error.response?.data?.message || 'Could not save defect category.');
    }
  };

  const handleEditDefect = (category) => {
    setEditingDefectId(category.id);
    setDefectForm({
      name: category.name || '',
      description: category.description || '',
    });
    setDefectError('');
  };

  const handleDeleteDefect = async (categoryId) => {
    try {
      await deleteDefectCategory(categoryId);
      if (editingDefectId === categoryId) resetDefectForm();
      await reloadDefects();
    } catch (error) {
      setDefectError(error.response?.data?.message || 'Could not delete defect category.');
    }
  };

  const userName = user?.fullName || user?.email || 'Admin';
  const userRole = user?.role ? user.role.replace('_', ' ') : 'USER';

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />

      <div className="admin-main">
        <Topbar
          userName={userName}
          userRole={userRole}
          onMenuClick={toggleSidebar}
          onLogout={handleLogout}
        />

        <main className="admin-content">
          <header className="admin-page-header">
            <div className="admin-page-header__brand" aria-hidden="true">
              <BrandLogo size={32} />
              <span className="admin-page-header__brand-name">DataLabel Pro</span>
            </div>
            <h1 className="admin-page-title">System Configuration</h1>
            <p className="admin-page-subtitle">
              Manage global system settings and policies. Changes apply to all active instances.
            </p>
          </header>

          {loading ? (
            <div className="config-page-loading">
              <div className="loading-spinner" />
              <p>Đang tải cấu hình...</p>
            </div>
          ) : error ? (
            <div className="config-page-error" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          ) : (
            <div className="config-page-grid">
              <div className="config-page-panel">
                <SystemConfigPanel
                  initialMaxImageSize={configData.maxImageSize}
                  initialAiEnabled={configData.aiEnabled}
                  onSave={handleSave}
                />
              </div>
              <section className="config-page-panel defect-config-panel" aria-labelledby="defect-config-heading">
                <div className="config-panel__header">
                  <h2 className="config-panel__title" id="defect-config-heading">Defect Categories</h2>
                  <p className="config-panel__subtitle">Review rejection taxonomy</p>
                </div>
                <form className="defect-config-form" onSubmit={handleSubmitDefect}>
                  <label className="form-field">
                    <span className="form-field__label">Category name</span>
                    <input
                      className="form-field__input"
                      value={defectForm.name}
                      onChange={(event) => setDefectForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="e.g. Boundary mismatch"
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Description</span>
                    <textarea
                      className="form-field__textarea"
                      value={defectForm.description}
                      onChange={(event) => setDefectForm((prev) => ({ ...prev, description: event.target.value }))}
                      placeholder="When reviewers should use this category"
                      rows={3}
                    />
                  </label>
                  {defectError && <p className="form-field__error" role="alert">{defectError}</p>}
                  <div className="defect-config-actions">
                    <button type="submit" className="config-save-btn" disabled={!defectForm.name.trim()}>
                      {editingDefectId ? 'Save category' : 'Add category'}
                    </button>
                    {editingDefectId && (
                      <button type="button" className="defect-config-secondary" onClick={resetDefectForm}>
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>

                <div className="defect-category-list">
                  {defectCategories.length === 0 ? (
                    <p className="defect-category-empty">No defect categories configured yet.</p>
                  ) : defectCategories.map((category) => (
                    <article key={category.id} className="defect-category-row">
                      <div>
                        <strong>{category.name}</strong>
                        <span>{category.description || 'No description'}</span>
                      </div>
                      <div className="defect-category-row__actions">
                        <button type="button" onClick={() => handleEditDefect(category)}>Edit</button>
                        <button type="button" onClick={() => handleDeleteDefect(category.id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
