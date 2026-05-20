import React, { useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import '@/styles/AnnotatorSettings.css';

const DEFAULT_SETTINGS = {
  activeTool: 'select',
  autoSave: true
};

export default function AnnotatorSettings() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('annotator_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Could not parse annotator_settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('annotator_settings', JSON.stringify(updated));
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'AN';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'AN';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="dashboard-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      
      <div className="dashboard-main">
        <Topbar
          userName={user?.fullName || 'Unknown User'}
          userRole={user?.role || 'ANNOTATOR'}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#111827' }}>
            Settings & Profile
          </h1>
          
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Account Profile
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#006c51', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                {getInitials(user?.fullName)}
              </div>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', margin: 0, color: '#111827' }}>
                  {user?.fullName || 'Unknown User'}
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', letterSpacing: '0.05em' }}>
                  {user?.role || 'ANNOTATOR'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>Email Address</span>
                <span style={{ fontSize: '1rem', fontWeight: '500', color: '#111827' }}>{user?.email || 'No email provided'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block' }}>Account Status</span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#059669', background: '#d1fae5', padding: '0.125rem 0.5rem', borderRadius: '9999px', display: 'inline-block', marginTop: '0.25rem' }}>Active</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#374151', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
              Workspace Preferences
            </h2>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '500', color: '#111827', margin: 0 }}>Auto-save Annotations</h3>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Enable local session state preservation.</p>
              </div>
              <button 
                onClick={() => handleToggle('autoSave')}
                style={{ 
                  background: settings.autoSave ? '#006c51' : '#e5e7eb', 
                  color: settings.autoSave ? '#fff' : '#374151',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                {settings.autoSave ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
