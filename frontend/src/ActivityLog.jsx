import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { useAuth } from './contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import './ActivityLog.css';

const MOCK_LOGS = [
  {
    id: 1,
    timestamp: '2026-05-12T08:00:00.000Z',
    userEmail: 'admin@gmail.com',
    action: 'USER_LOGIN',
    targetName: 'System',
    status: 'SUCCESS'
  },
  {
    id: 2,
    timestamp: '2026-05-12T07:00:00.000Z',
    userEmail: 'admin@gmail.com',
    action: 'CONFIG_UPDATE',
    targetName: 'AI Labeling Settings',
    status: 'SUCCESS'
  },
  {
    id: 3,
    timestamp: '2026-05-12T06:00:00.000Z',
    userEmail: 'staff@gmail.com',
    action: 'DATA_UPLOAD',
    targetName: 'Dataset Batch #23',
    status: 'SUCCESS'
  },
  {
    id: 4,
    timestamp: '2026-05-12T05:00:00.000Z',
    userEmail: 'system',
    action: 'BACKUP_COMPLETE',
    targetName: 'Nightly Backup',
    status: 'INFO'
  },
  {
    id: 5,
    timestamp: '2026-05-12T04:00:00.000Z',
    userEmail: 'admin@gmail.com',
    action: 'USER_LOGOUT',
    targetName: 'System',
    status: 'INFO'
  }
];

const ActivityLog = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Mock data - Replace with actual API when available
  const [logs] = useState(MOCK_LOGS);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const getStatusClass = (status) => {
    const statusLower = (status || 'INFO').toLowerCase();
    switch (statusLower) {
      case 'success':
      case 'completed':
        return 'log-status--success';
      case 'error':
      case 'failed':
        return 'log-status--error';
      case 'pending':
      case 'processing':
        return 'log-status--pending';
      default:
        return 'log-status--info';
    }
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
              onClick={() => navigate('/admin/dashboard', { replace: true })}
              aria-label="Quay lại Dashboard"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">System Activity Logs</h1>
            <p className="admin-page-subtitle">Monitor and audit all user actions and system changes across the platform.</p>
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
                {logs.length > 0 ? logs.map((log) => (
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
                )) : (
                  <tr>
                    <td colSpan="5" className="log-table__empty">
                      No activity logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityLog;
