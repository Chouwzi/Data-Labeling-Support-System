import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '@/components/common/Sidebar';
import Topbar from '@/components/common/Topbar';
import { useAuth } from '@/contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import { getLogs } from '@/services/api';
import '@/styles/AdminDashboard.css';
import '@/styles/ActivityLog.css';

const ActivityLog = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
    
  
const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const fetchLogs = useCallback(async (currentPage = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLogs(currentPage, size);
      const logData = response.data?.result || response.data || [];
      setLogs(logData);
      setPage(currentPage);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      setError('Không thể tải nhật ký hoạt động. Vui lòng thử lại sau.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [size]);

  useEffect(() => {
    if (user?.accessToken) {
      fetchLogs(0);
    } else {
      navigate('/login', { replace: true });
    }
  }, [user, navigate, fetchLogs]);

  const getStatusClass = (statusCode) => {
    if (!statusCode) return 'log-status--info';
    const code = Number(statusCode);
    if (code >= 200 && code < 300) return 'log-status--success';
    if (code >= 400) return 'log-status--error';
    return 'log-status--info';
  };

  const getStatusText = (statusCode) => {
    if (!statusCode) return 'INFO';
    const code = Number(statusCode);
    if (code >= 200 && code < 300) return 'SUCCESS';
    if (code >= 400) return 'FAILED';
    return 'INFO';
  };


  const formatTimestamp = (createdAt) => {
    if (!createdAt) return 'N/A';
    try {
      const date = new Date(createdAt);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };
const handlePageChange = (newPage) => {
    if (newPage >= 0) {
      fetchLogs(newPage);
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

          {loading && <div className="log-loading">Đang tải nhật ký hoạt động...</div>}
          {error && <div className="log-error">{error}</div>}

          {!loading && !error && (
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
                  {logs.length > 0 ? logs.map((log, index) => {
                    let userDisplay = 'System';

                    if (log.user_id) {
                      const currentUserId = localStorage.getItem('userId');
                      
                      if (log.user_id === currentUserId && localStorage.getItem('email')) {
                       
                        userDisplay = localStorage.getItem('email');
                      } else {
                        
                        userDisplay = `User ${log.user_id.toString().substring(0, 8)}...`;
                      }
                    }

                  
                    let targetDisplay = log.endpoint ? log.endpoint.replace('/api/v1/', '') : 'N/A';

                    return (
                      <tr key={`${log.created_at || ''}-${index}`}>
                        <td className="log-table__cell--timestamp">{formatTimestamp(log.created_at)}</td>
                        <td><span className="log-user">{userDisplay}</span></td>
                        <td><span className="action-tag">{log.action ? log.action.replace(/_/g, ' ') : 'UNKNOWN'}</span></td>
                        <td className="log-table__cell--muted">{targetDisplay}</td>
                        <td><span className={`log-status ${getStatusClass(log.status)}`}>{getStatusText(log.status)}</span></td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="log-table__empty">Không có nhật ký hoạt động nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="log-pagination">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 0 || loading}>Trước</button>
                <span>Trang {page + 1}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={logs.length < size || loading}>Sau</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ActivityLog;
