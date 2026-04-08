import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '@/styles/AdminDashboard.css';
import '@/styles/ActivityLog.css';

export default function ActivityLog() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [logs] = useState([
    {
      id: 1,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userEmail: 'admin@gmail.com',
      action: 'USER_LOGIN',
      targetName: 'System',
      status: 'SUCCESS',
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      userEmail: 'admin@gmail.com',
      action: 'CONFIG_UPDATE',
      targetName: 'AI Labeling Settings',
      status: 'SUCCESS',
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      userEmail: 'staff@gmail.com',
      action: 'DATA_UPLOAD',
      targetName: 'Dataset Batch #23',
      status: 'SUCCESS',
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 14400000).toISOString(),
      userEmail: 'system',
      action: 'BACKUP_COMPLETE',
      targetName: 'Nightly Backup',
      status: 'INFO',
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 18000000).toISOString(),
      userEmail: 'admin@gmail.com',
      action: 'USER_LOGOUT',
      targetName: 'System',
      status: 'INFO',
    },
  ]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getStatusClass = (status) => {
    const s = (status || 'INFO').toLowerCase();
    if (s === 'success' || s === 'completed') return 'log-status--success';
    if (s === 'error' || s === 'failed') return 'log-status--error';
    if (s === 'pending' || s === 'processing') return 'log-status--pending';
    return 'log-status--info';
  };

  return (
    <div className="admin-layout">
      <Sidebar isOpen={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />

      <div className="admin-main">
        <Topbar
          userName={user?.email || 'Administrator'}
          userRole="SENIOR ADMINISTRATOR"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        <main className="admin-content">
          <div className="log-header">
            <button
              type="button"
              className="log-back-btn"
              onClick={() => navigate('/admin', { replace: true })}
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">System Activity Logs</h1>
            <p className="admin-page-subtitle">
              Monitor and audit all user actions and system changes across the platform.
            </p>
          </div>

          <div className="log-table-wrapper">
            <table className="log-table">
              <thead>
                <tr>
                  <th>TIMESTAMP</th>
                  <th>USER</th>
                  <th>ACTION</th>
                  <th>TARGET OBJECT</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="log-table__cell--timestamp">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <span className="log-user">{log.userEmail}</span>
                    </td>
                    <td>
                      <span className="action-tag">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="log-table__cell--muted">{log.targetName}</td>
                    <td>
                      <span className={`log-status ${getStatusClass(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
