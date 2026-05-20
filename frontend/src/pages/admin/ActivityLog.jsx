import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
    
  
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
      setError('Failed to load activity logs. Please try again later.');
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
      const date = Array.isArray(createdAt)
        ? new Date(
            createdAt[0],
            (createdAt[1] || 1) - 1,
            createdAt[2] || 1,
            createdAt[3] || 0,
            createdAt[4] || 0,
            createdAt[5] || 0
          )
        : new Date(createdAt);
      if (isNaN(date.getTime())) return 'N/A';

      return date.toLocaleString('en-US', {
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

  const normalizedLogs = useMemo(() => logs.map((log, index) => {
    const userId = log.userId || log.user_id;
    const userEmail = log.userEmail || log.user_email;
    const userFullName = log.userFullName || log.user_full_name;
    const userRole = log.userRole || log.user_role || 'SYSTEM';
    const currentUserId = localStorage.getItem('userId');
    const currentEmail = localStorage.getItem('email');
    const actor = resolveActor({ userId, userEmail, currentUserId, currentEmail });
    const action = log.action || 'UNKNOWN';
    const endpoint = log.endpoint || '';
    const target = log.entityType || log.entity_type || endpoint.replace('/api/v1/', '') || 'N/A';
    const status = log.status || log.statusCode || log.status_code;
    const createdAt = log.createdAt || log.created_at;
    return {
      id: log.id || `${createdAt || ''}-${index}`,
      actor,
      actorTitle: userFullName ? `${userFullName} (${actor})` : actor,
      userRole,
      action,
      endpoint,
      target,
      status,
      createdAt,
    };
  }), [logs]);

  const availableActions = useMemo(
    () => Array.from(new Set(normalizedLogs.map((log) => log.action).filter(Boolean))).sort(),
    [normalizedLogs]
  );

  const availableRoles = useMemo(
    () => Array.from(new Set(normalizedLogs.map((log) => log.userRole).filter(Boolean))).sort(),
    [normalizedLogs]
  );

  const filteredLogs = useMemo(() => normalizedLogs.filter((log) => {
    const statusText = getStatusText(log.status);
    const haystack = `${log.actor} ${log.userRole} ${log.action} ${log.target} ${log.endpoint}`.toLowerCase();
    const matchesSearch = !searchQuery || haystack.includes(searchQuery.toLowerCase());
    const matchesAction = !actionFilter || log.action === actionFilter;
    const matchesRole = !roleFilter || log.userRole === roleFilter;
    const matchesStatus = !statusFilter || statusText === statusFilter;
    return matchesSearch && matchesAction && matchesRole && matchesStatus;
  }), [normalizedLogs, searchQuery, actionFilter, roleFilter, statusFilter]);

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
              aria-label="Back to Dashboard"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">System Activity Logs</h1>
            <p className="admin-page-subtitle">Monitor and audit all user actions and system changes across the platform.</p>
          </div>

          {loading && <div className="log-loading">Loading activity logs...</div>}
          {error && <div className="log-error">{error}</div>}

          {!loading && !error && (
            <div className="log-table-wrapper">
              <div className="log-toolbar" aria-label="Audit log filters">
                <label className="log-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search logs by actor, action, target..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </label>
                <label className="log-filter">
                  <span>Action</span>
                  <select
                    aria-label="Action filter"
                    value={actionFilter}
                    onChange={(event) => setActionFilter(event.target.value)}
                  >
                    <option value="">All actions</option>
                    {availableActions.map((action) => (
                      <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </label>
                <label className="log-filter">
                  <span>Status</span>
                  <select
                    aria-label="Status filter"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="INFO">Info</option>
                  </select>
                </label>
                <label className="log-filter">
                  <span>Role</span>
                  <select
                    aria-label="Role filter"
                    value={roleFilter}
                    onChange={(event) => setRoleFilter(event.target.value)}
                  >
                    <option value="">All roles</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>{role.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </label>
                {(searchQuery || actionFilter || roleFilter || statusFilter) && (
                  <button
                    type="button"
                    className="log-clear-btn"
                    onClick={() => {
                      setSearchQuery('');
                      setActionFilter('');
                      setRoleFilter('');
                      setStatusFilter('');
                    }}
                  >
                    Reset filters
                  </button>
                )}
              </div>
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
                  {filteredLogs.length > 0 ? filteredLogs.map((log) => {
                    return (
                      <tr key={log.id}>
                        <td className="log-table__cell--timestamp">{formatTimestamp(log.createdAt)}</td>
                        <td><span className="log-user" title={log.actorTitle}>{log.actor}</span></td>
                        <td><span className="action-tag">{log.action.replace(/_/g, ' ')}</span></td>
                        <td className="log-table__cell--muted" title={log.endpoint}>{log.target}</td>
                        <td><span className={`log-status ${getStatusClass(log.status)}`}>{getStatusText(log.status)}</span></td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="5" className="log-table__empty">No activity logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="log-pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page === 0 || loading}
                  aria-label="Previous Page"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>
                <div className="pagination-info">
                  Page <span className="pagination-current">{page + 1}</span>
                </div>
                <button 
                  className="pagination-btn"
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={logs.length < size || loading}
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ActivityLog;

function resolveActor({ userId, userEmail, currentUserId, currentEmail }) {
  if (userEmail) return userEmail;
  if (!userId) return 'System';
  if (userId === currentUserId && currentEmail) return currentEmail;
  return `User ${userId.toString().substring(0, 8)}...`;
}
