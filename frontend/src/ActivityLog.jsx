import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

        <main className="admin-content" style={{ padding: '30px' }}>
          <div className="log-header">
            <h1 className="admin-page-title">System Activity Logs</h1>
            <p className="admin-page-subtitle">Monitor and audit all user actions and system changes across the platform.</p>
          </div>

          <div className="log-table-wrapper" style={{ marginTop: '24px', background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(23, 29, 26, 0.05)' }}>
            {loading ? (
              <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#006c51', fontWeight: '600' }}>
                Fetching system logs...
              </div>
            ) : (
              <table className="log-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7a72', fontSize: '0.875rem', fontWeight: '600' }}>
                    <th style={{ padding: '12px 16px' }}>TIMESTAMP</th>
                    <th>USER</th>
                    <th>ACTION</th>
                    <th>TARGET OBJECT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? logs.map((log) => (
                    <tr key={log.id} style={{ backgroundColor: '#fdfdfd', transition: 'transform 0.2s' }}>
                      <td style={{ padding: '16px', borderRadius: '8px 0 0 8px', fontSize: '0.875rem' }}>
                        {new Date(log.timestamp).toLocaleString('en-US')}
                      </td>
                      <td><strong>{log.userEmail || log.username || 'System'}</strong></td>
                      <td>
                        <span className="action-tag" style={{ background: '#e8f5e9', color: '#006c51', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ color: '#3d4a43' }}>{log.targetName || log.target || 'N/A'}</td>
                      <td style={{ borderRadius: '0 8px 8px 0' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          backgroundColor: log.status?.toLowerCase() === 'success' ? '#ecfdf5' : '#fef2f2',
                          color: log.status?.toLowerCase() === 'success' ? '#059669' : '#dc2626'
                        }}>
                          {log.status || 'INFO'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '60px', color: '#6b7a72' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '8px' }}>📭 No logs found.</div>
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