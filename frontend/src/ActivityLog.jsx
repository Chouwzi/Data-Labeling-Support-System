import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import './ActivityLog.css';

const ActivityLog = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        
        const response = await axios.get('http://localhost:8080/api/logs');
        
        if (Array.isArray(response.data)) {
          setLogs(response.data);
        } else {
          console.error("API did not return an array:", response.data);
          setLogs([]); 
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-layout">
      {/* Sidebar và Topbar để đồng bộ giao diện với Dashboard */}
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
              aria-label="Quay lại Dashboard"
            >
              <ArrowLeft size={16} aria-hidden />
              <span>Dashboard</span>
            </button>
            <h1 className="admin-page-title">System Activity Logs</h1>
            <p className="admin-page-subtitle">Monitor and audit all user actions and system changes across the platform.</p>
          </div>

          <div className="log-table-wrapper">
            {loading ? (
              <div className="loading">
                Fetching system logs...
              </div>
            ) : (
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
                      <td className="log-table__cell--first">
                        {new Date(log.timestamp).toLocaleString('en-US')}
                      </td>
                      <td><strong>{log.userEmail || log.username || 'System'}</strong></td>
                      <td>
                        <span className="action-tag">
                          {log.action}
                        </span>
                      </td>
                      <td className="log-table__cell--muted">{log.targetName || log.target || 'N/A'}</td>
                      <td className="log-table__cell--last">
                        <span className={`log-status log-status--${(log.status || 'info').toLowerCase()}`}>
                          {log.status || 'INFO'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="log-table__empty">
                        <div className="log-table__empty-icon">No logs found.</div>
                        <p>The activity history is currently empty.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ActivityLog;