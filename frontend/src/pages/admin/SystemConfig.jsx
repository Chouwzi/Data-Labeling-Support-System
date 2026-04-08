import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import SystemConfigPanel from '@/components/system/SystemConfigPanel';
import BrandLogo from '@/components/common/BrandLogo';
import { getSystemConfig, updateSystemConfig } from '@/services/api';
import '@/styles/SystemConfig.css';

export default function SystemConfig() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configData, setConfigData] = useState({ maxImageSize: 10, aiEnabled: true });
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
        const res = await getSystemConfig();
        const data = res.data?.result || res.data;
        setConfigData({
          maxImageSize: data.maxImageSize ?? 10,
          aiEnabled: data.aiEnabled ?? true,
        });
      } catch (err) {
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
