import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  MoreVertical,
  LayoutGrid,
  List as ListIcon
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import Topbar from '@/components/common/Topbar';
import AnnotatorSidebar from '@/components/annotator/AnnotatorSidebar';
import '@/styles/Dashboard.css';

const TASK_STATUSES = [
  { id: 'all', label: 'All Tasks', color: 'var(--color-text-secondary)' },
  { id: 'PENDING', label: 'Pending', color: '#f59e0b', icon: Clock },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#3b82f6', icon: Clock },
  { id: 'COMPLETED', label: 'Completed', color: '#10b981', icon: CheckCircle2 },
  { id: 'REJECTED', label: 'Rejected', color: '#ef4444', icon: AlertCircle },
];

const MOCK_TASKS = [
  { id: 'TASK-101', name: 'satellite_urban_001.jpg', status: 'COMPLETED', lastModified: '2024-05-14', size: '2.4 MB' },
  { id: 'TASK-102', name: 'satellite_urban_002.jpg', status: 'PENDING', lastModified: '2024-05-14', size: '3.1 MB' },
  { id: 'TASK-103', name: 'satellite_urban_003.jpg', status: 'IN_PROGRESS', lastModified: '2024-05-13', size: '1.8 MB' },
  { id: 'TASK-104', name: 'satellite_urban_004.jpg', status: 'REJECTED', lastModified: '2024-05-12', size: '2.9 MB' },
  { id: 'TASK-105', name: 'satellite_urban_005.jpg', status: 'PENDING', lastModified: '2024-05-14', size: '2.7 MB' },
  { id: 'TASK-106', name: 'satellite_urban_006.jpg', status: 'COMPLETED', lastModified: '2024-05-11', size: '3.5 MB' },
  { id: 'TASK-107', name: 'satellite_urban_007.jpg', status: 'PENDING', lastModified: '2024-05-14', size: '2.2 MB' },
  { id: 'TASK-108', name: 'satellite_urban_008.jpg', status: 'IN_PROGRESS', lastModified: '2024-05-14', size: '2.1 MB' },
];

export default function AnnotatorTasks() {
  const { projectId } = useParams();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  // Core Logic for Search and Filter (Task LTJ-87)
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status) => {
    const s = TASK_STATUSES.find(st => st.id === status);
    return {
      backgroundColor: `${s?.color}15`,
      color: s?.color,
      borderColor: `${s?.color}30`
    };
  };

  return (
    <div className="manager-layout">
      <AnnotatorSidebar isOpen={sidebarOpen} onNavigate={closeSidebar} />
      
      <div className="manager-main">
        <Topbar 
          onMenuClick={toggleSidebar}
          userName={user?.fullName || 'Annotator'}
          userRole="Annotator"
          onLogout={logout}
        />

        <main className="manager-content">
          <div className="tasks-page-container fade-in-up">
            <div className="tasks-header">
              <button className="back-btn" onClick={() => navigate('/annotator')}>
                <ChevronLeft size={20} />
                <span>Back to Projects</span>
              </button>
              <div className="project-title-area">
                <h2 className="project-name">Project Tasks</h2>
                <span className="project-id">Project ID: {projectId}</span>
              </div>
            </div>

            <div className="tasks-filter-bar">
              <div className="search-box">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search by image name or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-actions">
                <div className="status-filters">
                  {TASK_STATUSES.map(status => (
                    <button
                      key={status.id}
                      className={`filter-tab ${statusFilter === status.id ? 'active' : ''}`}
                      onClick={() => setStatusFilter(status.id)}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>

                <div className="view-switch">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                  >
                    <ListIcon size={18} />
                  </button>
                </div>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <p>No images found matching your filters.</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'tasks-grid' : 'tasks-list'}>
                {filteredTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-preview">
                      <div className="placeholder-img">
                        <LayoutGrid size={24} opacity={0.2} />
                      </div>
                      <span className="task-id-badge">{task.id}</span>
                    </div>
                    
                    <div className="task-content">
                      <div className="task-main-info">
                        <h4 className="task-name">{task.name}</h4>
                        <div 
                          className="status-badge"
                          style={getStatusStyle(task.status)}
                        >
                          {task.status}
                        </div>
                      </div>
                      
                      <div className="task-meta">
                        <span><Clock size={12} /> {task.lastModified}</span>
                        <span>{task.size}</span>
                      </div>

                      <div className="task-actions">
                        <button className="action-btn action-btn--primary">
                          <span>Label Now</span>
                          <ExternalLink size={14} />
                        </button>
                        <button className="action-btn action-btn--icon">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .tasks-page-container {
          padding: 1rem 0;
        }

        .tasks-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: #64748b;
          font-weight: 500;
          transition: all 0.2s;
        }

        .back-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .project-title-area .project-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .project-title-area .project-id {
          font-size: 0.85rem;
          color: #64748b;
          font-family: monospace;
        }

        .tasks-filter-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 1rem;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-box input {
          width: 100%;
          padding: 0.65rem 1rem 0.65rem 2.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s;
        }

        .search-box input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .filter-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .status-filters {
          display: flex;
          background: #f1f5f9;
          padding: 0.25rem;
          border-radius: 8px;
        }

        .filter-tab {
          padding: 0.4rem 1rem;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s;
        }

        .filter-tab.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .view-switch {
          display: flex;
          gap: 0.25rem;
        }

        .view-btn {
          padding: 0.5rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          color: #64748b;
        }

        .view-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .tasks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .task-item {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #e2e8f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .task-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .task-preview {
          height: 140px;
          background: #f8fafc;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .task-id-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: rgba(15, 23, 42, 0.7);
          color: white;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-family: monospace;
        }

        .task-content {
          padding: 1.25rem;
        }

        .task-main-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .task-name {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 160px;
        }

        .status-badge {
          padding: 0.15rem 0.65rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid;
        }

        .task-meta {
          display: flex;
          gap: 1rem;
          color: #94a3b8;
          font-size: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .task-meta span {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .task-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .action-btn--primary {
          flex: 1;
          background: #10b981;
          color: white;
          border: none;
          font-weight: 500;
        }

        .action-btn--primary:hover {
          background: #059669;
        }

        .action-btn--icon {
          background: white;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }

        .action-btn--icon:hover {
          background: #f1f5f9;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4rem;
          background: white;
          border-radius: 12px;
          color: #94a3b8;
        }

        .empty-state p {
          margin-top: 1rem;
          font-size: 1.1rem;
        }
      `}} />
    </div>
  );
}
